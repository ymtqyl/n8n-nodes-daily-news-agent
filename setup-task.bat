@chcp 65001 >nul
@echo off
echo === Daily News Agent - 创建定时任务 ===
echo.
echo 任务将在每天早上 8:00 运行
echo.
schtasks /Create /TN "DailyNewsAgent" /TR "cmd /c E:\n8n-nodes-daily-news-agent\run-task.bat" /SC DAILY /ST 08:00 /F
echo.
echo === 完成 ===
echo 查看任务: schtasks /Query /TN "DailyNewsAgent"
echo 删除任务: schtasks /Delete /TN "DailyNewsAgent" /F
pause
