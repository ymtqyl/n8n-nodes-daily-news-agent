@echo off
schtasks /Create /TN "DailyNewsAgent" /TR "docker exec N8nAgent node /home/node/.n8n/custom/n8n-nodes-daily-news-agent/run-news.js" /SC DAILY /ST 08:00 /F
echo Done.
pause
