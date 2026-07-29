#!/bin/sh
# Daily News Agent — runs every day at 8:00 AM via cron
exec node /home/node/.n8n/custom/n8n-nodes-daily-news-agent/run-news.js
