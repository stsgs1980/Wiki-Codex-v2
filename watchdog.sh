#!/bin/bash
# Dev server watchdog - keeps Next.js alive
# Checks every 10 seconds, restarts if down

while true; do
  STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000 2>/dev/null || echo "000")
  if [ "$STATUS" = "000" ]; then
    echo "[$(date)] Server down, restarting..."
    pkill -f 'next dev' 2>/dev/null
    sleep 2
    cd /home/z/my-project && nohup npx next dev -p 3000 </dev/null >/tmp/zdev.log 2>&1 & disown
    sleep 8
    NEW_STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000 2>/dev/null || echo "000")
    echo "[$(date)] Restart result: HTTP $NEW_STATUS"
  elif [ "$STATUS" = "502" ] || [ "$STATUS" = "503" ]; then
    echo "[$(date)] Server error ($STATUS), restarting..."
    pkill -f 'next dev' 2>/dev/null
    sleep 2
    cd /home/z/my-project && nohup npx next dev -p 3000 </dev/null >/tmp/zdev.log 2>&1 & disown
    sleep 8
  fi
  sleep 10
done
