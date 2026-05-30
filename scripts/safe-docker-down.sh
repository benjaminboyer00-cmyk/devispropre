#!/usr/bin/env bash
# Arrêt Docker SANS supprimer les volumes (données PostgreSQL / storage).
set -euo pipefail

for arg in "$@"; do
  if [ "$arg" = "-v" ] || [ "$arg" = "--volumes" ]; then
    echo "✗ INTERDIT : docker compose down -v efface la base PostgreSQL (comptes, devis, factures)." >&2
    echo "  Utilisez : ./scripts/safe-docker-down.sh" >&2
    echo "  Restauration uniquement depuis backups/ si déjà fait." >&2
    exit 1
  fi
done

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

docker compose --env-file .env.production -f docker-compose.prod.yml down "$@"
echo "✓ Conteneurs arrêtés — volumes pgdata et storage conservés."
