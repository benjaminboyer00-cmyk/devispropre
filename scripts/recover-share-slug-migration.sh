#!/usr/bin/env bash
# Reprise après échec de la migration 20260528100000_share_slug (P3009 / P3018)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE="docker compose --env-file .env.production -f docker-compose.prod.yml"
MIGRATION="20260528100000_share_slug"
PRISMA='cd /app/prisma-cli && node ./node_modules/prisma/build/index.js'

if [ ! -f ".env.production" ]; then
  echo "Créez .env.production avant de continuer." >&2
  exit 1
fi

# Ne pas `source .env.production` (valeurs multilignes / <> cassent bash)
PGUSER="$(grep -E '^POSTGRES_USER=' .env.production | cut -d= -f2- | tr -d '"' | tr -d "'")"
PGDB="$(grep -E '^POSTGRES_DB=' .env.production | cut -d= -f2- | tr -d '"' | tr -d "'")"
PGUSER="${PGUSER:-devispropre}"
PGDB="${PGDB:-devispropre}"

prisma_cmd() {
  # Contourne docker-entrypoint.sh (sinon migrate deploy échoue avant resolve)
  $COMPOSE run --rm --no-deps --entrypoint sh app -c "$PRISMA $*"
}

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
if ! prisma_cmd "migrate resolve --rolled-back ${MIGRATION}"; then
  echo "→ Fallback SQL sur _prisma_migrations…"
  $COMPOSE exec -T postgres psql -U "$PGUSER" -d "$PGDB" <<SQL
DELETE FROM "_prisma_migrations"
WHERE migration_name = '${MIGRATION}' AND finished_at IS NULL;
SQL
fi

echo "→ Relance des migrations…"
prisma_cmd "migrate deploy"

echo "→ Redémarrage de l'application…"
$COMPOSE up -d --force-recreate app

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
