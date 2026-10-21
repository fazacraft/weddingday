#!/bin/sh
# keep-awake.sh ni macOS launchd'ga o'rnatadi: har 10 daqiqada, Mac yoqilganda
# avtomatik ishlaydi. O'chirish: sh scripts/keep-awake-install.sh uninstall
set -e

LABEL="uz.beluga.fozilovlar.keepawake"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
SCRIPT="$(cd "$(dirname "$0")" && pwd)/keep-awake.sh"
DOMAIN="gui/$(id -u)"

launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true

if [ "$1" = "uninstall" ]; then
  rm -f "$PLIST"
  echo "O'chirildi: $LABEL"
  exit 0
fi

chmod +x "$SCRIPT"
mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"
cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/sh</string>
    <string>$SCRIPT</string>
  </array>
  <key>StartInterval</key>
  <integer>600</integer>
  <key>RunAtLoad</key>
  <true/>
</dict>
</plist>
EOF

launchctl bootstrap "$DOMAIN" "$PLIST"
echo "O'rnatildi: $LABEL (har 10 daqiqada). Log: ~/Library/Logs/fozilovlar-keepawake.log"
