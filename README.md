# DevisPropre

Devis et factures pour artisans — conforme loi anti-fraude TVA 2018.

Contact : **Benjamin Boyer** — 06 60 61 48 39

## Démarrage local

```bash
cp .env.example .env
npm install
npm run db:up          # PostgreSQL Docker (port 5433)
npm run db:migrate:deploy
npm run dev
```

## Stack

- Next.js 16 (App Router) · PostgreSQL + Prisma 7 · JWT · pdfkit · Stripe · Vitest
- PDF binaires (`application/pdf`) — pas de HTML
- Rate limit PostgreSQL · CSRF Origin/Referer · headers sécurité + CSP nonces

## Tests

```bash
npm run test
npm run lint
```

## Déploiement VPS (Hetzner / Docker)

### 1. Prérequis serveur

- Docker + Docker Compose
- Nginx + Certbot (HTTPS)
- Domaine pointé vers le VPS

### 2. Installation

```bash
git clone https://github.com/benjaminboyer00-cmyk/devispropre.git /opt/devispropre
cd /opt/devispropre
cp .env.production.example .env.production
# Éditer .env.production (secrets, Stripe, Resend…)
chmod +x scripts/*.sh
./scripts/deploy.sh
```

L'app écoute sur `127.0.0.1:3000`. Healthcheck : `GET /api/health`.

### 3. Nginx + HTTPS

```bash
sudo cp deploy/nginx/devispropre.conf /etc/nginx/sites-available/devispropre
sudo ln -s /etc/nginx/sites-available/devispropre /etc/nginx/sites-enabled/
sudo certbot --nginx -d devispropre.fr -d www.devispropre.fr
sudo nginx -t && sudo systemctl reload nginx
```

### 4. Systemd (optionnel)

```bash
sudo cp deploy/systemd/devispropre.service /etc/systemd/system/
sudo systemctl enable --now devispropre
```

### 5. Cron (relances J+3 + backup)

Voir `deploy/cron/crontab.example` :

```bash
0 8 * * * /opt/devispropre/scripts/cron-reminders.sh
0 3 * * * /opt/devispropre/scripts/backup-db.sh
```

Relances : email artisan via Resend si `RESEND_API_KEY` configurée.

### 6. Backup / restauration

```bash
./scripts/backup-db.sh                    # → backups/devispropre-YYYY-MM-DD.sql.gz
./scripts/restore-db.sh backups/....gz  # ⚠ écrase la base
```

Rétention par défaut : 14 jours.

## Volumes Docker prod

| Volume | Contenu |
|--------|---------|
| `pgdata` | Base PostgreSQL |
| `logos` | Logos artisans (`storage/logos/`) |

## Variables d'environnement prod

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `JWT_SECRET` | ✅ | Min 32 caractères, unique |
| `DATABASE_URL` | ✅ | PostgreSQL uniquement |
| `NEXT_PUBLIC_APP_URL` | ✅ | URL publique HTTPS |
| `ALLOWED_ORIGINS` | ✅ | Origines CSRF (souvent = APP_URL) |
| `CRON_SECRET` | ✅ | Bearer pour `/api/cron/reminders` |
| `RESEND_API_KEY` | Recommandé | Emails relances J+3 |
| `STRIPE_*` | Optionnel | Paiements abonnements |

## Sécurité

- IDOR : filtres `userId` systématiques
- Inaltérabilité : SHA-256 + chaînage factures
- Attestations : `ON DELETE RESTRICT`
- Dashboard : `noindex`

## Mise à jour

```bash
cd /opt/devispropre
git pull
./scripts/deploy.sh
```
