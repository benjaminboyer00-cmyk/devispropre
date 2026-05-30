#!/usr/bin/env bash
# Compte les utilisateurs actifs (non supprimés) — retourne 0 si Postgres indisponible.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${1:-$ROOT/.env.production}"
COMPOSE="docker compose --env-file $ENV_FILE -f $ROOT/docker-compose.prod.yml"

PGUSER="$(grep -E '^POSTGRES_USER=' "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'" || true)"
PGDB="$(grep -E '^POSTGRES_DB=' "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'" || true)"
PGUSER="${PGUSER:-devispropre}"
PGDB="${PGDB:-devispropre}"

if ! $COMPOSE ps postgres -q 2>/dev/null | grep -q .; then
  echo 0
  exit 0
fi

$COMPOSE exec -T postgres psql -U "$PGUSER" -d "$PGDB" -tAc \
  'SELECT COUNT(*)::int FROM "User" WHERE "deletedAt" IS NULL;' 2>/dev/null | tr -d '[:space:]' || echo 0
