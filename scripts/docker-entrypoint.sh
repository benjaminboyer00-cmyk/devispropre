#!/bin/sh
set -e

mkdir -p /app/storage/logos /app/storage/pdfs

if [ -n "$DATABASE_URL" ]; then
  echo "→ Migration PostgreSQL…"
  (cd /app/prisma-cli && node ./node_modules/prisma/build/index.js migrate deploy)
fi

echo "→ Démarrage DevisPropre…"
exec node server.js
