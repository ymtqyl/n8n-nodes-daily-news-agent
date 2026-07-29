@echo off
echo Daily News Agent: %date% %time% > E:\n8n-nodes-daily-news-agent\task-log.txt
docker exec N8nAgent node /home/node/.n8n/custom/n8n-nodes-daily-news-agent/run-news.js >> E:\n8n-nodes-daily-news-agent\task-log.txt 2>&1
echo Exit code: %ERRORLEVEL% >> E:\n8n-nodes-daily-news-agent\task-log.txt
