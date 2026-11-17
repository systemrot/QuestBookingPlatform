#!/usr/bin/env bash
set -euo pipefail

KEY=112491b4829c81ed5a51779b3ab4ba85
VERIFY=yandex_4b786bd2b169fcd0.html
DIR=/opt/questbooking/static-verify
mkdir -p "$DIR"

cat > "$DIR/$VERIFY" <<'EOF'
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    </head>
    <body>Verification: 4b786bd2b169fcd0</body>
</html>
EOF
printf '%s' "$KEY" > "$DIR/$KEY.txt"

# Keep a copy in repo public for future deploys
cp -f "$DIR/$VERIFY" /opt/questbooking/public/"$VERIFY" 2>/dev/null || true
cp -f "$DIR/$KEY.txt" /opt/questbooking/public/"$KEY.txt" 2>/dev/null || true

# Patch running Caddyfile to serve verify files before reverse_proxy
CADDY_FILE=/opt/questbooking/deploy/Caddyfile
if ! grep -q 'static-verify' "$CADDY_FILE"; then
  cat > "$CADDY_FILE" <<EOF
{\$SITE_DOMAIN} {
	encode zstd gzip

	@verify path /$VERIFY /$KEY.txt
	handle @verify {
		root * /srv/static-verify
		file_server
	}

	reverse_proxy app:3000
}

www.{\$SITE_DOMAIN} {
	redir https://{\$SITE_DOMAIN}{uri} permanent
}
EOF
fi

# Ensure compose mounts the static-verify dir into caddy
COMPOSE=/opt/questbooking/docker-compose.yml
if ! grep -q 'static-verify' "$COMPOSE"; then
  python3 - <<'PY'
from pathlib import Path
p = Path("/opt/questbooking/docker-compose.yml")
text = p.read_text()
needle = "caddy:\n"
# insert volume under caddy service volumes list if present
if "static-verify:/srv/static-verify" not in text:
    text = text.replace(
        "./deploy/Caddyfile:/etc/caddy/Caddyfile:ro",
        "./deploy/Caddyfile:/etc/caddy/Caddyfile:ro\n      - ./static-verify:/srv/static-verify:ro",
    )
    p.write_text(text)
    print("compose patched")
else:
    print("compose already patched")
PY
fi

cd /opt/questbooking
docker compose up -d caddy
sleep 2
echo "--- verify ---"
curl -sI "https://nekvest.ru/$VERIFY" | head -10
echo "--- body ---"
curl -s "https://nekvest.ru/$VERIFY"
echo
echo "--- key ---"
curl -sI "https://nekvest.ru/$KEY.txt" | head -8
curl -s "https://nekvest.ru/$KEY.txt"; echo
