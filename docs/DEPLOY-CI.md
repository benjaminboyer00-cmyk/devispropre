# Déploiement automatique (GitHub Actions → VPS)

À chaque push sur `main`, le job `deploy` de `.github/workflows/ci.yml` se lance **après** les tests,
le build et le lint. Il se connecte en SSH au VPS, où une **commande forcée** exécute
`scripts/ci-deploy.sh` : `git fetch` puis `git merge --ff-only`, puis `scripts/deploy.sh`
(backup PostgreSQL, build, migrations, healthcheck).

Tant que les secrets ne sont pas configurés, le job s'arrête sans erreur.

## 1. Sur le VPS (une fois)

```bash
# Clé dédiée au déploiement — générée sur le VPS, ne quitte que vers GitHub
ssh-keygen -t ed25519 -N "" -C github-actions-deploy -f ~/devispropre-deploy

# N'autoriser que le script de déploiement pour cette clé (pas de shell, pas de tunnel)
echo "command=\"/opt/devispropre/scripts/ci-deploy.sh\",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty $(cat ~/devispropre-deploy.pub)" >> ~/.ssh/authorized_keys

# Clé de chiffrement des données (obligatoire en production — à sauvegarder hors du serveur)
cd /opt/devispropre
grep -q '^DATA_ENCRYPTION_KEY=' .env.production || echo "DATA_ENCRYPTION_KEY=$(openssl rand -hex 32)" >> .env.production

# Empreinte du serveur, à copier dans le secret VPS_KNOWN_HOSTS
ssh-keyscan -t ed25519 localhost 2>/dev/null | sed "s/^localhost/<IP_OU_DOMAINE_DU_VPS>/"
```

L'utilisateur SSH doit pouvoir lancer `docker compose` (groupe `docker`) et écrire dans `/opt/devispropre`.

## 2. Dans GitHub (Settings → Secrets and variables → Actions)

| Secret | Valeur |
|--------|--------|
| `VPS_HOST` | IP ou domaine du VPS |
| `VPS_USER` | Utilisateur SSH (propriétaire de `/opt/devispropre`) |
| `VPS_SSH_KEY` | Contenu de `~/devispropre-deploy` (clé **privée**), puis supprimer ce fichier du VPS |
| `VPS_KNOWN_HOSTS` | Ligne `ssh-keyscan` ci-dessus (l'empreinte du serveur est épinglée) |
| `VPS_PORT` | Optionnel, 22 par défaut |

Facultatif : dans Settings → Environments → `production`, ajouter une validation manuelle
(*Required reviewers*) pour approuver chaque mise en production.

## 3. Garde-fous

- Pas de déploiement si les tests échouent (`needs: test`).
- Un seul déploiement à la fois (`concurrency` côté GitHub, `flock` côté serveur).
- Avance rapide uniquement : le déploiement est refusé si le serveur a des modifications locales.
- `deploy.sh` s'arrête **avant** le build si `DATA_ENCRYPTION_KEY` manque, et sauvegarde la base avant de migrer.

Déploiement manuel inchangé : `cd /opt/devispropre && ./scripts/ci-deploy.sh` (ou `git pull && ./scripts/deploy.sh`).
