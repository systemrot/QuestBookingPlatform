#!/usr/bin/env bash
# Pull the checked-out branch, apply migrations, rebuild and restart the site.
set -euo pipefail
cd "$(dirname "$0")/.."

branch="$(git rev-parse --abbrev-ref HEAD)"
git fetch --prune origin "$branch"
git reset --hard "origin/$branch"

docker compose up -d --wait postgres
docker compose --profile tools build tools
docker compose --profile tools run --rm tools npx prisma migrate deploy
docker compose --profile app up -d --build
docker image prune -f >/dev/null

echo "Deployed $(git rev-parse --short HEAD) from $branch"
