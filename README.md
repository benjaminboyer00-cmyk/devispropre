# DevisPropre

**L'anti-usine à gaz de l'artisanat** — Devis et factures simples, conformes loi anti-fraude TVA 2018.

Contact : Benjamin Boyer — 06 60 61 48 39

## Secure by Design

- Verrouillage à l'envoi (devis) et à l'émission (facture)
- Empreinte SHA-256 + chaînage cryptographique
- Journal d'audit complet
- Soft delete — conservation légale
- Attestation individuelle à chaque émission

## Démarrage

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

## Variables d'environnement

Voir `.env.example` (dev) et `.env.production.example` (Hetzner).

**Obligatoires en production** (l'app refuse de démarrer sans) :
- `JWT_SECRET` — min 32 caractères, unique
- `DATABASE_URL` — PostgreSQL recommandé
- `NEXT_PUBLIC_APP_URL` / `ALLOWED_ORIGINS`

## Sécurité

- JWT sans fallback en prod (`instrumentation.ts`)
- Rate limiting sur `/api/auth` (10 req / 15 min)
- CSRF : vérification Origin/Referer sur mutations
- Cookie `__Secure-` + `SameSite=strict` en production

## Plan gratuit

3 devis/mois — vérifié dans `assertCanCreateDevis()`.

## Relances J+3

```bash
curl -X POST https://devispropre.fr/api/cron/reminders \
  -H "Authorization: Bearer $CRON_SECRET"
```

Configurer un cron systemd ou crontab quotidien.

## Stripe

Routes `/api/stripe/checkout` et `/api/stripe/webhook` — configurer les clés dans `.env`.

## Tests

```bash
npm run test
```

## Production (Hetzner VPS)

```bash
# 1. PostgreSQL
DATABASE_URL="postgresql://..."

# 2. Build
npm run build

# 3. PM2
pm2 start npm --name devispropre -- start

# 4. Nginx reverse proxy → port 3000, HTTPS obligatoire

# 5. Backup PostgreSQL quotidien
pg_dump devispropre > backup-$(date +%F).sql
```

Docker : `docker build -t devispropre .`

## Licence

Propriétaire — DevisPropre © 2026 — Benjamin Boyer
