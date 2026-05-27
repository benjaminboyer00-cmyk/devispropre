#!/usr/bin/env bash
# Restauration backup PostgreSQL
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 backups/devispropre-YYYY-MM-DD_HHMMSS.sql.gz" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FILE="$1"

if [ -f "$ROOT/.env.production" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env.production"
  set +a
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL manquant" >&2
  exit 1
fi

echo "⚠ Restauration depuis $FILE — Ctrl+C pour annuler (5s)"
sleep 5

if [[ "$FILE" == *.gz ]]; then
  gunzip -c "$FILE" | psql "$DATABASE_URL"
else
  psql "$DATABASE_URL" < "$FILE"
fi

echo "✓ Restauration terminée"
