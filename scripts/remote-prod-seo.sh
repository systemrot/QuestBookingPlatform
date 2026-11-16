#!/usr/bin/env bash
set -euo pipefail

cd /opt/questbooking

KEY=112491b4829c81ed5a51779b3ab4ba85
VERIFY=yandex_4b786bd2b169fcd0.html

mkdir -p static-verify public deploy

cat > "static-verify/$VERIFY" <<'EOF'
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    </head>
    <body>Verification: 4b786bd2b169fcd0</body>
</html>
EOF
printf '%s' "$KEY" > "static-verify/$KEY.txt"
cp -f "static-verify/$VERIFY" "public/$VERIFY"
cp -f "static-verify/$KEY.txt" "public/$KEY.txt"
printf '%s' "$KEY" > public/indexnow-key.txt

# Caddy: serve verify files before Next
cat > deploy/Caddyfile <<'EOF'
{$SITE_DOMAIN} {
	encode zstd gzip

	@shareAssets path /brand/og-share.jpg /favicon.png /apple-touch-icon.png /brand/nekvest-icon-512.png
	header @shareAssets Cache-Control "public, max-age=604800, immutable"

	@verify path /yandex_4b786bd2b169fcd0.html /112491b4829c81ed5a51779b3ab4ba85.txt
	handle @verify {
		root * /srv/static-verify
		file_server
	}

	reverse_proxy app:3000
}

www.{$SITE_DOMAIN} {
	redir https://{$SITE_DOMAIN}{uri} permanent
}
EOF

# compose mount for static-verify
if ! grep -q 'static-verify:/srv/static-verify' docker-compose.yml; then
  sed -i 's#./deploy/Caddyfile:/etc/caddy/Caddyfile:ro#./deploy/Caddyfile:/etc/caddy/Caddyfile:ro\n      - ./static-verify:/srv/static-verify:ro#' docker-compose.yml
fi

# Yandex meta verification in env (survives rebuilds)
if grep -q '^YANDEX_VERIFICATION=' .env; then
  sed -i 's/^YANDEX_VERIFICATION=.*/YANDEX_VERIFICATION="4b786bd2b169fcd0"/' .env
else
  printf '\nYANDEX_VERIFICATION="4b786bd2b169fcd0"\n' >> .env
fi

docker compose --profile app up -d caddy
sleep 2

echo "VERIFY_HEADERS"
curl -sI "https://nekvest.ru/$VERIFY" | head -12
echo "VERIFY_BODY"
curl -s "https://nekvest.ru/$VERIFY"
echo
echo "KEY_HEADERS"
curl -sI "https://nekvest.ru/$KEY.txt" | head -8
echo "KEY_BODY"
curl -s "https://nekvest.ru/$KEY.txt"
echo
echo "BRANCH=$(git branch --show-current) HEAD=$(git rev-parse --short HEAD)"
