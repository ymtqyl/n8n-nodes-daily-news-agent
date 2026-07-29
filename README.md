# 📰 Daily News Agent — n8n Community Node

[![n8n](https://img.shields.io/badge/n8n-community%20node-blue?logo=n8n)](https://n8n.io)
[![license](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

一个 **n8n 社区节点**，每日自动抓取热点新闻和科技新闻，可选 AI 摘要，并推送到飞书多维表格 + 机器人消息。

---

## ✨ 功能

- 🔥 **热点新闻** — 从 36氪 / 少数派 RSS 源抓取
- 💻 **科技新闻** — 从 Hacker News / 36氪 / 少数派抓取
- 🤖 **AI 摘要**（可选）— 通过 OpenAI 或 Anthropic 生成新闻概览
- 📊 **飞书多维表格** — 自动写入结构化新闻数据
- 💬 **飞书机器人** — 推送每日新闻卡片消息
- ⏰ **定时触发** — 支持 cron 定时自动执行

---

## 🚀 快速开始

### 前置条件

- **Node.js** >= 18
- **n8n** >= 1.0（自托管 / Docker）

### 安装

```bash
# 在 n8n 的 custom 目录下安装
cd ~/.n8n/custom/node_modules
git clone https://github.com/ymtqyl/n8n-nodes-daily-news-agent.git
cd n8n-nodes-daily-news-agent
npm install
npm run build
```

**Docker 部署**（推荐）：

```yaml
services:
  n8n:
    image: n8nio/n8n
    volumes:
      - /path/to/n8n-nodes-daily-news-agent:/home/node/.n8n/custom/node_modules/n8n-nodes-daily-news-agent
```

### 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 填入你的飞书应用凭证：

| 变量 | 说明 |
|------|------|
| `FEISHU_APP_ID` | 飞书应用 App ID |
| `FEISHU_APP_SECRET` | 飞书应用 App Secret |
| `FEISHU_APP_TOKEN` | 飞书多维表格 App Token |
| `FEISHU_TABLE_ID` | 飞书多维表格 ID |
| `FEISHU_USER_OPEN_ID` | 飞书用户 Open ID |

> 📖 详细飞书配置指南见 [FEISHU_SETUP.md](./FEISHU_SETUP.md)

---

## 📦 使用方式

### 方式一：n8n 节点（推荐）

1. 重启 n8n 后，在节点面板搜索 **"Daily News Agent"**
2. 拖入工作流，选择新闻源和数量
3. 可选：开启 AI 摘要并配置 LLM 凭证（OpenAI / Anthropic）
4. 连接飞书节点完成数据写入与消息推送
5. 导入 [`workflow-template.json`](./workflow-template.json) 可快速上手

**节点参数：**

| 参数 | 说明 | 默认值 |
|------|------|--------|
| Hot News Source | 热点新闻来源 | 36氪 |
| Hot News Count | 热点新闻数量 | 5 |
| Tech News Source | 科技新闻来源 | Hacker News |
| Tech News Count | 科技新闻数量 | 5 |
| Enable AI Summary | 开启 AI 摘要 | 关闭 |
| Output Language | 摘要语言 | 中文 |

### 方式二：独立脚本

也可以脱离 n8n 独立运行：

```bash
node run-news.js
```

脚本会：
1. 抓取 36氪和 Hacker News 新闻
2. 写入飞书多维表格
3. 发送飞书机器人消息

---

## 🗂️ 项目结构

```
├── nodes/
│   └── DailyNewsAgent/          # n8n 节点源码
│       ├── DailyNewsAgent.node.ts
│       └── DailyNewsAgent.node.json
├── credentials/                 # 凭证定义
├── icons/                       # 节点图标
├── dist/                        # 编译输出
├── run-news.js                  # 独立运行脚本
├── run-news.sh                  # Linux 运行脚本
├── run-task.bat                 # Windows 定时任务
├── setup-task.bat               # Windows 任务计划程序配置
├── workflow-template.json       # n8n 工作流模板
├── feishu-card-template.json    # 飞书消息卡片模板
├── FEISHU_SETUP.md              # 飞书集成详细指南
├── RECOVERY.md                  # 故障恢复指南
├── .env.example                 # 环境变量模板
└── package.json
```

---

## 🛠️ 开发

```bash
# 安装依赖
npm install

# 开发模式（热重载）
npm run dev

# 编译
npm run build

# 监听编译
npm run build:watch
```

---

## 📄 License

MIT © [ymtqyl](https://github.com/ymtqyl)
