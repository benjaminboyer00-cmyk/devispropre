#!/usr/bin/env bash
# Sync queue R2 (PDF en attente)
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

curl -sf -X POST "$URL/api/cron/r2-sync" \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json"

echo ""
echo "→ R2 sync OK $(date -Iseconds)"
