#!/bin/sh
# Daily News Agent — 独立运行脚本
# 配合 cron 使用: 0 8 * * * /path/to/run-news.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec node "$SCRIPT_DIR/run-news.js"
