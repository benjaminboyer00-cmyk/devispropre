#!/usr/bin/env bash
# Backup PostgreSQL DevisPropre — à planifier via cron (deploy/cron/devispropre-backup)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT/docker-compose.prod.yml}"

notify_failure() {
  local msg="$1"
  echo "✗ $msg" >&2
  if command -v node >/dev/null 2>&1; then
    node "$ROOT/scripts/notify-alert.mjs" "Échec backup PostgreSQL" "{\"error\":\"$msg\"}" || true
  fi
  exit 1
}

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
  notify_failure "postgres Docker indisponible et pg_dump/DATABASE_URL absents"
fi

echo "✓ $(du -h "$FILE" | cut -f1)"
find "$BACKUP_DIR" -name "devispropre-*.sql.gz" -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true
echo "→ Rétention locale ${RETENTION_DAYS}j appliquée"

if command -v node >/dev/null 2>&1; then
  if node "$ROOT/scripts/upload-backup-r2.mjs" "$FILE"; then
    echo "→ Copie offsite R2 OK"
  else
    notify_failure "Upload R2 échoué — backup local dans $FILE"
  fi
else
  echo "⚠ node absent — backup offsite R2 ignoré" >&2
fi
