#!/bin/sh
# Render bepul servisi 15 daqiqa so'rovsiz qolsa uxlab qoladi va keyingi mehmon
# ~1 daqiqa "waking up" ekranini ko'radi. launchd bu skriptni har 10 daqiqada
# ishga tushiradi (scripts/keep-awake-install.sh) — /health ga bitta so'rov yetadi.
#
# Telegram: ~/.config/fozilovlar-keepawake.env da TG_BOT_TOKEN va TG_CHAT_ID
# bo'lsa, sayt ishlamay qolganda va qayta tiklanganda xabar yuboriladi
# (har tekshiruvda emas — faqat holat o'zgarganda).

URL="${KEEPAWAKE_URL:-https://beluga.uz/health}"
SITE="https://beluga.uz/"
LOG="$HOME/Library/Logs/fozilovlar-keepawake.log"
STATE="$HOME/Library/Logs/fozilovlar-keepawake.state"
CONFIG="$HOME/.config/fozilovlar-keepawake.env"

[ -f "$CONFIG" ] && . "$CONFIG"

notify() {
  [ -n "$TG_BOT_TOKEN" ] && [ -n "$TG_CHAT_ID" ] || return 0
  curl -s -m 20 -o /dev/null "https://api.telegram.org/bot$TG_BOT_TOKEN/sendMessage" \
    --data-urlencode "chat_id=$TG_CHAT_ID" \
    --data-urlencode "text=$1" \
    --data-urlencode "disable_web_page_preview=true"
}

# Uxlab qolgan servis uyg'onishi ~1 daqiqa oladi, shuning uchun timeout 90s
code=$(curl -s -o /dev/null -m 90 -w '%{http_code}' "$URL")
now=$(date '+%Y-%m-%d %H:%M:%S')
echo "$now $code" >> "$LOG"

# Log cheksiz o'smasin — oxirgi 500 qator (~3.5 kun) qoladi
tail -n 500 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"

prev=$(cat "$STATE" 2>/dev/null || echo up)
if [ "$code" = "200" ]; then
  if [ "$prev" = "down" ]; then
    notify "✅ Beluga sayti qayta ishlayapti ($now)
$SITE"
  fi
  echo up > "$STATE"
else
  # Bitta xato tarmoq uzilishi bo'lishi mumkin — ketma-ket ikkinchi xatoda xabar beramiz
  if [ "$prev" = "up" ]; then
    echo suspect > "$STATE"
  elif [ "$prev" = "suspect" ]; then
    notify "⚠️ Beluga sayti javob bermayapti (HTTP $code, $now)
$URL
Render: https://dashboard.render.com"
    echo down > "$STATE"
  fi
fi
