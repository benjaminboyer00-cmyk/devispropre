#!/usr/bin/env bash
# Vérifie .env.production sans le sourcer (évite les erreurs bash avec <> dans les emails)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${1:-$ROOT/.env.production}"

if [ ! -f "$ENV_FILE" ]; then
  echo "✗ Fichier introuvable : $ENV_FILE" >&2
  exit 1
fi

echo "→ Vérification de $ENV_FILE"

missing=0
for key in JWT_SECRET POSTGRES_PASSWORD DATABASE_URL RESEND_API_KEY RESEND_FROM_EMAIL NEXT_PUBLIC_APP_URL ALLOWED_ORIGINS; do
  if ! grep -qE "^${key}=" "$ENV_FILE"; then
    echo "✗ Variable manquante : $key"
    missing=1
  fi
done

if grep -qE '^[^#=]+=<[^>]+>$' "$ENV_FILE"; then
  echo "⚠ Valeur avec <> sans guillemets — entourez-la de \"...\" (ex. RESEND_FROM_EMAIL)"
fi

if grep -qE '^JWT_SECRET=dev-only' "$ENV_FILE"; then
  echo "✗ JWT_SECRET de développement détecté"
  missing=1
fi

if [ "$missing" -eq 1 ]; then
  exit 1
fi

echo "✓ Variables essentielles présentes"

COMPOSE="docker compose --env-file $ENV_FILE -f docker-compose.prod.yml"
if $COMPOSE ps app 2>/dev/null | grep -q "Up"; then
  echo "→ Test Resend dans le conteneur…"
  resend=$($COMPOSE exec -T app printenv RESEND_API_KEY 2>/dev/null | head -c 8 || true)
  if [ -z "$resend" ]; then
    echo "✗ RESEND_API_KEY vide dans le conteneur app"
    exit 1
  fi
  echo "✓ RESEND_API_KEY chargée (${resend}…)"
fi
