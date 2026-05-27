# DevisPropre

Devis et factures pour artisans — conforme loi anti-fraude TVA 2018.

Contact : **Benjamin Boyer** — 06 60 61 48 39

## Démarrage

```bash
cp .env.example .env
npm install
npm run db:up          # PostgreSQL Docker (port 5433)
npx prisma migrate dev
npm run dev
```

## Base de données — PostgreSQL uniquement

- `schema.prisma` → `provider = "postgresql"`
- Adapter `@prisma/adapter-pg` + pool `pg`
- **Plus de SQLite** en dev ni prod

Port **5433** en local (5432 souvent déjà pris par un Postgres système).

## PDF légaux (pdfkit)

- `src/lib/pdf-document.ts` — génération PDF binaire (`application/pdf`)
- `src/lib/pdf.ts` (HTML) **supprimé**
- Mention **« TVA non applicable, art. 293 B du CGI »** si `Company.tvaApplicable = false`

## Sécurité IDOR

- `createDevis` → `assertClientOwnership(userId, clientId)` → `ForbiddenError` 403
- `createFactureFromDevis` → double vérif devis + client appartenant à l'artisan

## Production (Hetzner)

Voir `.env.production.example`. Backup quotidien :

```bash
pg_dump $DATABASE_URL > backup-$(date +%F).sql
```

## Tests

```bash
npm run test
```
