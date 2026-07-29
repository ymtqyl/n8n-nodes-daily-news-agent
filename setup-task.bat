@echo off
echo Daily News Agent - Create Scheduled Task
echo.
echo Task will run every day at 08:00
echo.
schtasks /Create /TN "DailyNewsAgent" /TR "cmd /c E:\n8n-nodes-daily-news-agent\run-task.bat" /SC DAILY /ST 08:00 /F
echo.
echo Done!
echo View task:  schtasks /Query /TN "DailyNewsAgent"
echo Delete task: schtasks /Delete /TN "DailyNewsAgent" /F
pause
