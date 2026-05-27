#!/usr/bin/env bash
# Backup PostgreSQL DevisPropre — à planifier via cron (deploy/cron/devispropre-backup)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

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

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL manquant" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%F_%H%M%S)"
FILE="$BACKUP_DIR/devispropre-$STAMP.sql.gz"

echo "→ Backup vers $FILE"
pg_dump "$DATABASE_URL" | gzip > "$FILE"
echo "✓ $(du -h "$FILE" | cut -f1)"

find "$BACKUP_DIR" -name "devispropre-*.sql.gz" -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true
echo "→ Rétention ${RETENTION_DAYS}j appliquée"
