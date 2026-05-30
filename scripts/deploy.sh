#!/usr/bin/env bash
# Déploiement VPS — backup, build Docker, migrations, restart (sans perte de données)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE="docker compose --env-file .env.production -f docker-compose.prod.yml"
USER_COUNT_FILE="$ROOT/storage/.deploy-user-count"

if [ ! -f ".env.production" ]; then
  echo "Créez .env.production depuis .env.production.example" >&2
  exit 1
fi

if [ -f "src/app/icon.tsx" ]; then
  echo "✗ Supprimez src/app/icon.tsx — il écrase icon.png et casse la favicon." >&2
  exit 1
fi

PRE_USERS=0
if $COMPOSE ps postgres -q 2>/dev/null | grep -q .; then
  PRE_USERS="$(bash "$ROOT/scripts/db-user-count.sh" "$ROOT/.env.production")"
  echo "→ Utilisateurs actifs avant déploiement : $PRE_USERS"
  if [ "$PRE_USERS" -gt 0 ]; then
    echo "→ Backup PostgreSQL avant déploiement…"
    COMPOSE_FILE="$ROOT/docker-compose.prod.yml" bash "$ROOT/scripts/backup-db.sh" || {
      echo "✗ Backup échoué — déploiement annulé pour protéger vos données." >&2
      exit 1
    }
  fi
elif [ -f "$USER_COUNT_FILE" ] && [ "$(cat "$USER_COUNT_FILE")" -gt 0 ] 2>/dev/null; then
  echo "⚠ Postgres arrêté alors que des comptes existaient — ne jamais utiliser « docker compose down -v »." >&2
fi

echo "→ Build image (sans cache pour garantir le code à jour)…"
$COMPOSE build --pull --no-cache

echo "→ Démarrage services…"
$COMPOSE up -d

echo "→ Attente healthcheck…"
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
    POST_USERS="$(bash "$ROOT/scripts/db-user-count.sh" "$ROOT/.env.production")"
    echo "→ Utilisateurs actifs après déploiement : $POST_USERS"

    if [ "$PRE_USERS" -gt 0 ] && [ "$POST_USERS" -eq 0 ]; then
      echo "✗ ALERTE : tous les comptes ont disparu — restaurez le dernier backup dans backups/" >&2
      ls -1t "$ROOT/backups"/devispropre-*.sql.gz 2>/dev/null | head -3 >&2 || true
      exit 1
    fi

    mkdir -p "$ROOT/storage"
    echo "$POST_USERS" > "$USER_COUNT_FILE"

    echo "✓ Application OK"
    exit 0
  fi
  sleep 2
done

echo "✗ Healthcheck timeout — vérifiez : $COMPOSE logs app" >&2
exit 1
