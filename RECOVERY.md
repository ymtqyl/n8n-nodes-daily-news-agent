# 项目恢复指南

## 位置
所有文件在: **E:\n8n-nodes-daily-news-agent**

## 重启后恢复 Claude Code 会话
```bash
cd E:\n8n-nodes-daily-news-agent
claude
```

## Docker 修好后，继续部署 n8n

### 1. 确认 Docker 正常
```bash
docker ps
```

### 2. 启动 n8n 容器（挂载自定义节点）
```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v E:\n8n-nodes-daily-news-agent:/home/node/.n8n/custom/node_modules/n8n-nodes-daily-news-agent \
  -v n8n_data:/home/node/.n8n \
  -e N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom \
  n8nio/n8n
```

### 3. 安装飞书节点
```bash
docker exec -it n8n npm install @snae/n8n-nodes-feishu
docker restart n8n
```

### 4. 打开 n8n
浏览器访问: http://localhost:5678

### 5. 导入工作流
n8n 界面 → Workflows → Import from File → 选 `E:\n8n-nodes-daily-news-agent\workflow-template.json`

### 6. 飞书配置
看 `E:\n8n-nodes-daily-news-agent\FEISHU_SETUP.md`

## 备选方案（如果 Docker 还是不行）
直接用 Node.js 跑，不需要 Docker：
```bash
npm install -g n8n
set N8N_CUSTOM_EXTENSIONS=E:\n8n-data\custom
n8n start
```

## 项目中还需要的操作
- [ ] 飞书开放平台创建应用，获取 App ID + Secret
- [ ] 创建飞书多维表格，获取 app_token + table_id
- [ ] n8n 中配置飞书凭证
- [ ] 测试工作流手动执行
- [ ] 激活工作流

## 对话中提到的技术要点
- 自定义 n8n 节点: n8n-nodes-daily-news-agent
- 新闻源: Google News RSS (热点) + Hacker News API (科技)
- 定时: 每天早上 8:00 (cron: 0 8 * * *)
- 飞书集成: @snae/n8n-nodes-feishu 社区节点
- 多维表格字段: 标题, 链接, 来源, 分类, 日期
