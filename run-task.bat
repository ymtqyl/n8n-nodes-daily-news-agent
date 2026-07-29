@echo off
echo [%date% %time%] Daily News Agent starting... > "E:\n8n-nodes-daily-news-agent\task-log.txt"
node "E:\n8n-nodes-daily-news-agent\run-news.js" >> "E:\n8n-nodes-daily-news-agent\task-log.txt" 2>&1
echo [%date% %time%] Exit code: %ERRORLEVEL% >> "E:\n8n-nodes-daily-news-agent\task-log.txt"
