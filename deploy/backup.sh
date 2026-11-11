#!/usr/bin/env bash
# Daily Postgres dump (cron). Keeps 14 days locally.
set -euo pipefail
cd "$(dirname "$0")/.."

dir=/var/backups/questbooking
mkdir -p "$dir"
file="$dir/db-$(date +%F-%H%M).dump"

docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$file.tmp"
mv "$file.tmp" "$file"
find "$dir" -name 'db-*.dump' -mtime +14 -delete

echo "Backup: $file ($(du -h "$file" | cut -f1))"
