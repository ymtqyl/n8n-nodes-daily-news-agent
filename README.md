# Daily News Agent

n8n 工作流 — 每日自动抓取 36氪 + Hacker News 新闻，推送飞书机器人消息、写入多维表格。

---

## 效果

**飞书机器人消息卡片**

![飞书机器人消息](doc/feishu-card.png)

**飞书多维表格**

![飞书多维表格](doc/bitable.png)

---

## 导入使用

1. n8n → **Import from File** → 导入 [`workflow-working.json`](./workflow-working.json)
2. 配置飞书凭证（App ID / App Secret）
3. 修改多维表格节点的 **App Token** + **Table ID**
4. 修改机器人推送节点的 **Receive ID**
5. 点击 **Execute Workflow**

> 飞书应用配置详见 [FEISHU_SETUP.md](./FEISHU_SETUP.md)

---

## 工作流结构

```
Schedule Trigger ──→ 36氪 RSS ──→ Merge Code ──→ 格式化 → 飞书表格
              ──→ Hacker News ──┘            └─→ 卡片 → 飞书机器人
```

---

## 多维表格字段

| 字段 | 类型 | 说明 |
|------|------|------|
| 文本 | 文本 | 新闻标题 |
| 原文链接 | URL | 新闻链接 |
| 来源 | 文本 | 36氪 / Hacker News |
| 分类 | 单选 | 热点新闻 / 科技新闻 |
| news_date | 日期 | 生成时间 |
| 新闻概要 | 文本 | 文章简介 |

---

## Docker 部署

```bash
docker run -d --name N8nAgent --restart unless-stopped \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  -e TZ=Asia/Shanghai -e N8N_DEFAULT_TIMEZONE=Asia/Shanghai \
  crpi-gzn62xjybihu1hgl.cn-guangzhou.personal.cr.aliyuncs.com/aai-images/n8n:latest
```

---

## 注意事项

- 工作流节点的 `id` 和 `name` 必须一致，否则下游不执行
- 飞书 Date 字段需传 Unix 时间戳（毫秒）
- 已安装 `n8n-nodes-feishu-lite` v0.4.4 社区节点

---

## 开发

```bash
npm install
npm run build
node run-news.js     # 独立脚本（可选）
```
