#!/bin/bash
# Render Keep-Alive Script
# Usage: ./keep-alive.sh
# Add to crontab: */10 * * * * /path/to/keep-alive.sh

HEALTH_URL="https://your-app-name.onrender.com/api/health"
LOG_FILE="/var/log/render-keep-alive.log"

response=$(curl -fsS -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null)
timestamp=$(date '+%Y-%m-%d %H:%M:%S')

if [ "$response" = "200" ]; then
  echo "[$timestamp] OK - Health check passed (HTTP $response)" >> "$LOG_FILE"
else
  echo "[$timestamp] FAIL - Health check failed (HTTP $response)" >> "$LOG_FILE"
fi