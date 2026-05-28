#!/usr/bin/env bash
# Backup PostgreSQL DevisPropre — à planifier via cron (deploy/cron/devispropre-backup)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT/docker-compose.prod.yml}"

if [ -f "$ROOT/.env.production" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env.production"
  set +a
elif [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%F_%H%M%S)"
FILE="$BACKUP_DIR/devispropre-$STAMP.sql.gz"

echo "→ Backup vers $FILE"

if [ -f "$COMPOSE_FILE" ] && docker compose -f "$COMPOSE_FILE" ps postgres -q 2>/dev/null | grep -q .; then
  PGUSER="${POSTGRES_USER:-devispropre}"
  PGDB="${POSTGRES_DB:-devispropre}"
  docker compose -f "$COMPOSE_FILE" exec -T postgres \
    pg_dump -U "$PGUSER" "$PGDB" | gzip > "$FILE"
elif command -v pg_dump >/dev/null 2>&1 && [ -n "${DATABASE_URL:-}" ]; then
  pg_dump "$DATABASE_URL" | gzip > "$FILE"
else
  echo "Impossible de sauvegarder : postgres Docker indisponible et pg_dump/DATABASE_URL absents" >&2
  exit 1
fi

echo "✓ $(du -h "$FILE" | cut -f1)"
find "$BACKUP_DIR" -name "devispropre-*.sql.gz" -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true
echo "→ Rétention ${RETENTION_DAYS}j appliquée"
