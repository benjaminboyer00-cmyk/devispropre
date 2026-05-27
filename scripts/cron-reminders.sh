#!/usr/bin/env bash
# Appel cron relances J+3
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

curl -sf -X POST "$URL/api/cron/reminders" \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json"

echo ""
echo "→ Relances OK $(date -Iseconds)"
