#!/usr/bin/env bash
set -euo pipefail

KEY="112491b4829c81ed5a51779b3ab4ba85"
VERIFY="yandex_4b786bd2b169fcd0.html"
APP_DIR="/opt/questbooking"
CONT="questbooking-app-1"

mkdir -p "$APP_DIR/public"

cat > "$APP_DIR/public/$VERIFY" <<'EOF'
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    </head>
    <body>Verification: 4b786bd2b169fcd0</body>
</html>
EOF

printf '%s' "$KEY" > "$APP_DIR/public/$KEY.txt"
printf '%s' "$KEY" > "$APP_DIR/public/indexnow-key.txt"

docker cp "$APP_DIR/public/$VERIFY" "$CONT:/app/public/$VERIFY"
docker cp "$APP_DIR/public/$KEY.txt" "$CONT:/app/public/$KEY.txt"
# standalone Next also serves from .next/standalone/public in some setups
if docker exec "$CONT" test -d /app/.next/standalone/public 2>/dev/null; then
  docker cp "$APP_DIR/public/$VERIFY" "$CONT:/app/.next/standalone/public/$VERIFY" || true
  docker cp "$APP_DIR/public/$KEY.txt" "$CONT:/app/.next/standalone/public/$KEY.txt" || true
fi

echo "--- verify html ---"
curl -sI "https://nekvest.ru/$VERIFY" | head -8
echo "--- indexnow key ---"
curl -sI "https://nekvest.ru/$KEY.txt" | head -8
echo "--- body ---"
curl -s "https://nekvest.ru/$VERIFY"
echo
curl -s "https://nekvest.ru/$KEY.txt"
echo
