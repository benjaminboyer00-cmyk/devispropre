#!/usr/bin/env bash
# Restauration backup PostgreSQL
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 backups/devispropre-YYYY-MM-DD_HHMMSS.sql.gz" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FILE="$1"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT/docker-compose.prod.yml}"

if [ -f "$ROOT/.env.production" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env.production"
  set +a
fi

echo "⚠ Restauration depuis $FILE — Ctrl+C pour annuler (5s)"
sleep 5

if [ -f "$COMPOSE_FILE" ] && docker compose -f "$COMPOSE_FILE" ps postgres -q 2>/dev/null | grep -q .; then
  PGUSER="${POSTGRES_USER:-devispropre}"
  PGDB="${POSTGRES_DB:-devispropre}"
  if [[ "$FILE" == *.gz ]]; then
    gunzip -c "$FILE" | docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$PGUSER" "$PGDB"
  else
    docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$PGUSER" "$PGDB" < "$FILE"
  fi
elif command -v psql >/dev/null 2>&1 && [ -n "${DATABASE_URL:-}" ]; then
  if [[ "$FILE" == *.gz ]]; then
    gunzip -c "$FILE" | psql "$DATABASE_URL"
  else
    psql "$DATABASE_URL" < "$FILE"
  fi
else
  echo "Impossible de restaurer : postgres Docker indisponible et psql/DATABASE_URL absents" >&2
  exit 1
fi

echo "✓ Restauration terminée"
