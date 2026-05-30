#!/usr/bin/env bash
# Déploiement VPS — build Docker + migrations + restart
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE="docker compose --env-file .env.production -f docker-compose.prod.yml"

if [ ! -f ".env.production" ]; then
  echo "Créez .env.production depuis .env.production.example" >&2
  exit 1
fi

echo "→ Build image (sans cache pour garantir le code à jour)…"
$COMPOSE build --pull --no-cache

echo "→ Démarrage services…"
$COMPOSE up -d

echo "→ Attente healthcheck…"
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
    echo "✓ Application OK"
    exit 0
  fi
  sleep 2
done

echo "✗ Healthcheck timeout — vérifiez : $COMPOSE logs app" >&2
exit 1
