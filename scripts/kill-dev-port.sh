#!/usr/bin/env bash
# Libère le port du serveur Next.js local avant un redémarrage propre.
set -euo pipefail

PORT="${PORT:-3000}"

if command -v fuser >/dev/null 2>&1; then
  fuser -k "${PORT}/tcp" 2>/dev/null || true
elif command -v lsof >/dev/null 2>&1; then
  PIDS="$(lsof -ti :"${PORT}" 2>/dev/null || true)"
  if [ -n "${PIDS}" ]; then
    kill ${PIDS} 2>/dev/null || true
  fi
fi

sleep 0.3
