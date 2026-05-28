#!/usr/bin/env bash
# Purge IdempotencyRecord expirées (> 30 jours)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ -f "$ROOT/.env.production" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env.production"
  set +a
fi

URL="${NEXT_PUBLIC_APP_URL:-http://127.0.0.1:3000}"
SECRET="${CRON_SECRET:?CRON_SECRET requis}"

curl -sf -X POST "$URL/api/cron/cleanup" \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json"

echo ""
echo "→ Cleanup OK $(date -Iseconds)"
