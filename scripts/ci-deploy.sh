#!/usr/bin/env bash
# Point d'entrée du déploiement automatique (GitHub Actions → SSH).
# À utiliser comme commande forcée dans ~/.ssh/authorized_keys du VPS : la clé de CI
# ne peut exécuter QUE ce script (pas de shell, pas de tunnel).
#   command="/opt/devispropre/scripts/ci-deploy.sh",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty ssh-ed25519 AAAA... github-actions-deploy
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Un seul déploiement à la fois.
exec 9>"$ROOT/.deploy.lock"
flock -n 9 || { echo "✗ Déploiement déjà en cours" >&2; exit 1; }

BRANCH="main"
echo "→ Récupération de origin/$BRANCH…"
git fetch --quiet origin "$BRANCH"

# Jamais d'écrasement silencieux : refuse si le serveur a des modifications locales suivies.
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "✗ Modifications locales sur le serveur — déploiement annulé (git status)." >&2
  exit 1
fi

git merge --ff-only "origin/$BRANCH"
echo "→ Version : $(git rev-parse --short HEAD)"

exec "$ROOT/scripts/deploy.sh"
