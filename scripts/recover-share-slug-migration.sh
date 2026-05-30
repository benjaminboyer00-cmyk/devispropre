#!/usr/bin/env bash
# Reprise après échec de la migration 20260528100000_share_slug (P3009 / P3018)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE="docker compose --env-file .env.production -f docker-compose.prod.yml"
MIGRATION="20260528100000_share_slug"

set -a
# shellcheck disable=SC1091
source .env.production
set +a

PGUSER="${POSTGRES_USER:-devispropre}"
PGDB="${POSTGRES_DB:-devispropre}"

if [ ! -f ".env.production" ]; then
  echo "Créez .env.production avant de continuer." >&2
  exit 1
fi

echo "→ État actuel des colonnes shareSlug…"
$COMPOSE exec -T postgres psql -U "$PGUSER" -d "$PGDB" <<'SQL'
SELECT column_name
FROM information_schema.columns
WHERE table_name IN ('Devis', 'Facture') AND column_name = 'shareSlug';
SQL

echo "→ Nettoyage partiel éventuel (colonnes/index ajoutés avant l'échec)…"
$COMPOSE exec -T postgres psql -U "$PGUSER" -d "$PGDB" <<'SQL'
DROP INDEX IF EXISTS "Devis_shareSlug_key";
DROP INDEX IF EXISTS "Facture_shareSlug_key";
ALTER TABLE "Devis" DROP COLUMN IF EXISTS "shareSlug";
ALTER TABLE "Facture" DROP COLUMN IF EXISTS "shareSlug";
SQL

echo "→ Marquage de la migration comme annulée (Prisma)…"
$COMPOSE run --rm --no-deps app sh -c "cd /app/prisma-cli && node ./node_modules/prisma/build/index.js migrate resolve --rolled-back ${MIGRATION}"

echo "→ Relance des migrations…"
$COMPOSE run --rm --no-deps app sh -c "cd /app/prisma-cli && node ./node_modules/prisma/build/index.js migrate deploy"

echo "→ Redémarrage de l'application…"
$COMPOSE up -d app

echo "→ Attente healthcheck…"
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
    echo "✓ Application OK"
    exit 0
  fi
  sleep 2
done

echo "✗ Healthcheck timeout — logs : $COMPOSE logs app" >&2
exit 1
