# CLAUDE.md — n8n-nodes-daily-news-agent

## 项目概述
基于 n8n 的每日新闻推送工作流，从 36氪 RSS 和 Hacker News 抓取新闻，推送到飞书多维表格和机器人消息。

## 运行状态（2026-07-30）
✅ 工作流完全可用！已在 Docker n8n 1.111.1 上验证通过。

## 部署方式
- **Docker**: 阿里云 ACR 镜像 `crpi-gzn62xjybihu1hgl.cn-guangzhou.personal.cr.aliyuncs.com/aai-images/n8n:latest`
- **n8n 版本**: 1.111.1
- **端口**: 5678
- **数据卷**: `n8n_data` → `/home/node/.n8n`
- **时区**: Asia/Shanghai (TZ + N8N_DEFAULT_TIMEZONE)

## 关键踩坑记录

### 1. 工作流节点 name 和 id 必须一致
**这是最重要的发现！** n8n 的 `connectionsBySourceNode` 用 node 的 `name` 做索引，如果 `id` 和 `name` 不一致，连接会失效，导致下游节点不会执行。所有节点的 `id` 必须等于 `name`。

### 2. 飞书节点操作名格式
社区节点 `n8n-nodes-feishu-lite` v0.4.4 的操作名格式：
- 多维表格: `bitable:table:record:batchAdd`（不是 `batchCreateRecords`）
- 消息: `message:send`（不是 `send`）

### 3. 飞书多维表格字段类型
- Date 字段必须传 Unix 时间戳（毫秒），不能传 ISO 字符串

### 4. 飞书多维表格 body 格式
`type: 'json'` 的参数通过 `getNodeJsonData` 处理，内部做 `JSON.parse()`，所以表达式必须返回 JSON 字符串，不是对象。

### 5. Code 节点多输入问题
当 Code 节点有多个输入时，用 `$input.all()` 遍历所有输入的合并数据，按结构区分来源。不要依赖 `$('nodeName')` 跨节点引用。

### 6. 工作流导入格式
`n8n import:workflow --input=file.json` 导入时，JSON 必须包含 `"active": false` 字段。

## 常用命令
```bash
# Docker 操作（在 Git Bash 中必须加 MSYS_NO_PATHCONV=1）
MSYS_NO_PATHCONV=1 docker start N8nAgent
MSYS_NO_PATHCONV=1 docker stop N8nAgent
MSYS_NO_PATHCONV=1 docker exec N8nAgent n8n execute --id <workflow-id>
MSYS_NO_PATHCONV=1 docker run --rm -v n8n_data:/home/node/.n8n -e N8N_USER_FOLDER=/home/node --entrypoint n8n crpi-gzn62xjybihu1hgl.cn-guangzhou.personal.cr.aliyuncs.com/aai-images/n8n:latest execute --id <workflow-id>

# 备份数据库
MSYS_NO_PATHCONV=1 docker exec N8nAgent cp /home/node/.n8n/database.sqlite /home/node/.n8n/backup.sqlite
```

## 推送代码 (Watt Toolkit 加速)
```bash
git -c http.sslVerify=false push
```

## 注意事项
- 密钥通过 .env 管理，不要硬编码到代码中
- GitHub Push Protection 会拦截含密钥的提交
- 用户通过 Watt Toolkit 代理访问 GitHub
- 用户是中国人，README 和文档用中文
- 不要改动用户的密码或凭证
- Docker 操作在 Git Bash 中必须加 `MSYS_NO_PATHCONV=1`，防止路径被转译成 Windows 格式
