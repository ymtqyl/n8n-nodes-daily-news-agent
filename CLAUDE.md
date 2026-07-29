# CLAUDE.md — n8n-nodes-daily-news-agent

## 项目概述
n8n 社区节点，每日自动抓取热点新闻和科技资讯，推送到飞书多维表格和机器人消息。

## 技术栈
- TypeScript (n8n 节点)
- Node.js (独立脚本 run-news.js)
- 飞书开放平台 API (Bitable + IM)
- LLM: OpenAI / Anthropic (可选 AI 摘要)

## 常用命令
```bash
npm install          # 安装依赖
npm run dev          # 开发模式
npm run build        # 编译
npm run build:watch  # 监听编译
node run-news.js     # 独立运行
```

## 推送代码 (Watt Toolkit 加速)
```bash
git -c http.sslVerify=false push
```

## 注意事项
- 密钥通过 .env 管理，不要硬编码到代码中
- .env.* 被 gitignore 但 !.env.example 例外
- GitHub Push Protection 会拦截含密钥的提交
- 用户通过 Watt Toolkit 代理访问 GitHub
- README 风格参考 docker_image_pusher 仓库：简洁步骤化、截图占位、中文说明
- 用户是中国人，README 和文档用中文

## 飞书凭证
需要配置以下环境变量：
- FEISHU_APP_ID
- FEISHU_APP_SECRET
- FEISHU_APP_TOKEN
- FEISHU_TABLE_ID
- FEISHU_USER_OPEN_ID
