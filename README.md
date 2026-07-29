# Daily News Agent

一个 n8n 社区节点，每日自动抓取热点新闻和科技资讯，可选 AI 摘要，推送到飞书多维表格和机器人消息，免费易用<br>
- 支持 36氪、少数派、Hacker News 等多个新闻源<br>
- 支持 OpenAI 和 Anthropic 生成 AI 新闻摘要<br>
- 支持飞书多维表格写入 + 机器人消息推送<br>
- 既可作 n8n 节点使用，也可独立脚本运行<br>


## 使用方式


### 环境配置

复制环境变量模板：<br>

```bash
cp .env.example .env
```

编辑 `.env` 填入飞书凭证：

| 变量 | 说明 |
|------|------|
| `FEISHU_APP_ID` | 飞书应用 App ID |
| `FEISHU_APP_SECRET` | 飞书应用 App Secret |
| `FEISHU_APP_TOKEN` | 多维表格 App Token |
| `FEISHU_TABLE_ID` | 多维表格 ID |
| `FEISHU_USER_OPEN_ID` | 接收消息的 Open ID |

> 飞书配置详见 [FEISHU_SETUP.md](./FEISHU_SETUP.md)<br>


### 安装到 n8n

```bash
# 进入 n8n 的 custom 目录
cd ~/.n8n/custom/node_modules

# 克隆项目
git clone https://github.com/ymtqyl/n8n-nodes-daily-news-agent.git
cd n8n-nodes-daily-news-agent

# 安装依赖并编译
npm install
npm run build
```

Docker 部署，在 docker-compose.yml 中添加挂载：

```yaml
services:
  n8n:
    volumes:
      - /path/to/n8n-nodes-daily-news-agent:/home/node/.n8n/custom/node_modules/n8n-nodes-daily-news-agent
```

重启 n8n 后，节点面板搜索 **Daily News Agent** 即可使用。<br>
![](doc/n8n-node.png)


### 导入工作流

导入 [`workflow-template.json`](./workflow-template.json) 可快速搭建完整流水线：<br>

1. 工作流页面 → **Import from File** → 选择 `workflow-template.json`
2. 配置飞书节点的凭证（App ID / App Secret）
3. 填写多维表格的 **App Token** 和 **Table ID**
4. 填写机器人消息的 **Receive ID**
5. 点击 **Execute Workflow** 测试

![](doc/workflow.png)


### 节点参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| Hot News Source | 热点新闻来源（36氪 / 少数派） | 36氪 |
| Hot News Count | 热点新闻数量 | 5 |
| Tech News Source | 科技新闻来源 | Hacker News |
| Tech News Count | 科技新闻数量 | 5 |
| Enable AI Summary | 开启 AI 摘要 | 关闭 |
| Output Language | 摘要输出语言 | 中文 |


### AI 摘要（可选）

开启 AI 摘要后需配置 LLM 凭证：<br>

在 n8n 中新建 **Daily News Agent API** 凭证，选择模型供应商：<br>
- **OpenAI** — 填写 API Key，可选自定义 Base URL<br>
- **Anthropic** — 填写 API Key，可选自定义 Base URL

AI 摘要失败不会阻断主流程，节点会继续正常输出新闻数据。<br>
![](doc/ai-credential.png)


### 独立脚本运行

也可以脱离 n8n 直接运行脚本：<br>

```bash
node run-news.js
```

脚本流程：抓取新闻 → 写入飞书多维表格 → 推送飞书机器人消息<br>

Windows 定时任务：

```bash
# 双击运行配置脚本
setup-task.bat
```

Linux / macOS 定时：

```bash
chmod +x run-news.sh
# 添加 cron，每天早 8 点执行
0 8 * * * /path/to/run-news.sh
```


### 定时执行

在 n8n 中使用 **Schedule Trigger** 节点设置 cron：<br>
默认 `0 8 * * *`（每天早上 8 点）<br>

修改 cron 即可调整频率，例如：<br>
- 每天早 7 点：`0 7 * * *`<br>
- 每天早晚各一次：`0 8,20 * * *`<br>
- 每小时：`0 * * * *`<br>

![](doc/schedule.png)


### 常见问题

**飞书节点报 "Access token expired"**<br>
→ 检查凭证中的 App ID / Secret 是否正确，应用是否已发布

**多维表格写入报 "Field not found"**<br>
→ 确保节点输出的字段名与表格列名完全一致

**机器人消息收不到**<br>
→ 确认开启 `im:message:send_as_bot` 权限，且 Receive ID 类型匹配

**国内访问 Hacker News 慢**<br>
→ 使用代理或改用 36氪/少数派作为科技新闻源


## 开发

```bash
npm install          # 安装依赖
npm run dev          # 开发模式（热重载）
npm run build        # 编译
npm run build:watch  # 监听编译
```

项目结构：

```
├── nodes/DailyNewsAgent/       # n8n 节点源码
├── credentials/                # 凭证定义
├── icons/                      # 节点图标
├── run-news.js                 # 独立运行脚本
├── workflow-template.json      # n8n 工作流模板
├── feishu-card-template.json   # 飞书消息卡片模板
├── FEISHU_SETUP.md             # 飞书集成详细指南
├── RECOVERY.md                 # 故障恢复指南
└── .env.example                # 环境变量模板
```
