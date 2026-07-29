# 飞书集成配置指南

本文档指导你完成飞书侧的配置，使 Daily News Agent 能够将新闻写入多维表格并发送机器人消息。

---

## 1. 安装飞书社区节点

首先在 n8n Docker 容器中安装飞书节点：

```bash
docker exec -it <你的n8n容器名> npm install @snae/n8n-nodes-feishu
```

重启 n8n 容器后，在节点面板中搜索 "feishu" 或 "lark" 即可看到飞书相关节点。

**如果使用 docker-compose**，建议将节点持久化：

```yaml
services:
  n8n:
    volumes:
      - /path/to/n8n-nodes-daily-news-agent:/home/node/.n8n/custom/node_modules/n8n-nodes-daily-news-agent
      - /path/to/feishu-node:/home/node/.n8n/custom/node_modules/@snae/n8n-nodes-feishu
```

---

## 2. 创建飞书应用

### 2.1 进入飞书开放平台

访问 [https://open.feishu.cn](https://open.feishu.cn)，登录你的飞书账号。

### 2.2 创建企业自建应用

1. 点击 **「开发者后台」** → **「创建应用」**
2. 选择 **「企业自建应用」**
3. 填写应用名称（如 "每日新闻助手"）
4. 上传图标（可选）

### 2.3 获取凭证

创建后进入应用详情页：

- **App ID**：在「凭证与基础信息」页面
- **App Secret**：点击「显示」获取

> ⚠️ **妥善保管 App Secret，不要泄露或提交到代码仓库！**

---

## 3. 配置权限

在应用详情页 → **「权限管理」** → 开启以下权限：

### 多维表格权限
| 权限 | 用途 |
|------|------|
| `bitable:app` | 读写多维表格 |

### 消息权限
| 权限 | 用途 |
|------|------|
| `im:message:send_as_bot` | 以机器人身份发消息 |
| `im:resource` | 获取消息资源（图片/文件） |

> 📌 开启权限后需要**发布应用**并让管理员审批通过（企业自建应用通常自动通过）。

---

## 4. 创建多维表格

### 4.1 新建多维表格

1. 打开飞书桌面端或网页版
2. 进入任意群组或从「云文档」中新建
3. 选择 **「新建」→「多维表格」**

### 4.2 设置字段（列）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| 标题 | 文本 | 新闻标题 |
| 链接 | 链接/URL | 新闻原文链接 |
| 来源 | 文本 | 新闻来源（Google News / Hacker News 等） |
| 分类 | 单选 | 选项：「热点新闻」「科技新闻」 |
| 日期 | 日期 | 新闻获取日期 |

### 4.3 获取 Bitable Token

打开多维表格，浏览器地址栏：

```
https://xxx.feishu.cn/base/BITABLE_APP_TOKEN?table=TABLE_ID
```

- `app_token`：URL 中 `/base/` 后面的字符串
- `table_id`：URL 参数 `?table=` 后面的字符串

> 💡 或者通过飞书 API `GET /open-apis/bitable/v1/apps` 列出所有多维表格来获取 token。

---

## 5. 获取消息接收 ID

机器人需要知道往哪里发消息。有几种方式：

### 方式 A：发到个人（推荐）

1. 在飞书中搜索你的应用名称
2. 给应用机器人发一条消息
3. 调用 API 获取会话列表：

```bash
curl -X POST https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal \
  -H "Content-Type: application/json" \
  -d '{"app_id":"你的App ID","app_secret":"你的App Secret"}'
```

拿到 `tenant_access_token` 后：

```bash
curl -X GET "https://open.feishu.cn/open-apis/im/v1/conversations?user_id_type=open_id" \
  -H "Authorization: Bearer {tenant_access_token}"
```

从返回结果中找到与你的 `open_id` 对应的 `chat_id`。

### 方式 B：发到群组

1. 将应用机器人拉到目标群组
2. 同样用上述 conversation API 获取群组 chat_id

### 方式 C：获取自己的 open_id

```bash
curl -X POST "https://open.feishu.cn/open-apis/contact/v3/users/batch_get_id" \
  -H "Authorization: Bearer {tenant_access_token}" \
  -d '{"emails":["你的飞书邮箱"]}'
```

---

## 6. 在 n8n 中配置

### 6.1 添加凭证

1. 在 n8n 左侧菜单 → **「Credentials」** → **「Add Credential」**
2. 搜索 **「Lark Token API」**（或 `larkApi`）
3. 填写：
   - **App ID**：你的飞书 App ID
   - **App Secret**：你的飞书 App Secret
   - **Base URL**：选择 `https://open.feishu.cn`（国内版）

### 6.2 导入工作流

1. 在 n8n 左侧菜单 → **「Workflows」** → **「Import from File」**
2. 选择 `workflow-template.json`
3. 导入后需要手动配置以下节点：

#### 「写入飞书多维表格」节点
- 在 Credential 中选择刚刚添加的飞书凭证
- 填写 **App Token** 和 **Table ID**
- 确认 Resource 选的是 "Bitable"，Operation 选的是 "Batch Create Records"
- 确保上游 Code Node 的 `fields` 字段名与你表格的列名**完全一致**

#### 「飞书机器人推送」节点
- 在 Credential 中选择飞书凭证
- 填写 **Receive ID**（chat_id 或 open_id）
- 选择 **Receive ID Type**（chat_id / open_id）
- 确认 Resource 选的是 "Message"，Operation 选的是 "Send"
- **Msg Type** 选 "interactive"

### 6.3 测试

1. 点击 **「Execute Workflow」** 手动执行一次
2. 检查：
   - 飞书多维表格是否新增了 10 条记录
   - 飞书是否收到了机器人消息卡片

### 6.4 激活

测试无误后，点击右上角 **「Active」** 开关激活工作流。

---

## 7. 常见问题

### Q: 飞书节点报 "Access token expired"？
→ 检查凭证中的 App ID 和 Secret 是否正确，确保应用已发布且权限已审批。

### Q: Bitable 写入报 "Field not found"？
→ 确保 Code Node 中的字段名与你表格的列名**完全一致**（包括中英文、空格）。

### Q: 机器人消息收不到？
→ 确认应用有 `im:message:send_as_bot` 权限，且 receive_id 填写正确。如果用 open_id，确保 `receive_id_type` 也选了 `open_id`。

### Q: 想修改每天推送时间？
→ 在 Schedule Trigger 节点中修改 cron 表达式。当前是 `0 8 * * *`（早8点）。例如改到早7点是 `0 7 * * *`。

---

## 相关链接

- [飞书开放平台](https://open.feishu.cn)
- [多维表格 API 文档](https://open.feishu.cn/document/server-docs/docs/bitable-v1/)
- [消息 API 文档](https://open.feishu.cn/document/server-docs/docs/im-v1/message/create)
- [消息卡片搭建工具](https://open.feishu.cn/document/uAjLw4CM/ukzMukzMukzM/feishu-cards/card-components)
