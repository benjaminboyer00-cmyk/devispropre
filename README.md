# DevisPropre

**L'anti-usine à gaz de l'artisanat** — Devis et factures simples, conformes loi anti-fraude TVA 2018.

## Priorité : Secure by Design

Ce projet place l'**inaltérabilité des données** au centre de l'architecture :

- **Verrouillage** à l'envoi (devis) et à l'émission (facture)
- **Empreinte SHA-256** du contenu canonicalisé
- **Chaînage cryptographique** entre factures émises
- **Journal d'audit** complet (CREATE, UPDATE, LOCK, SEND, ISSUE, VERIFY_HASH…)
- **Soft delete** — aucune suppression définitive des documents fiscaux
- **Attestation individuelle** générée à chaque émission de facture

## Stack

- Next.js 16 (App Router) — SEO natif
- TypeScript + Tailwind CSS
- Prisma + SQLite (dev) / PostgreSQL (prod)
- Auth JWT (cookies httpOnly)

## Démarrage

```bash
npm install
cp .env.example .env   # ou utiliser .env existant
npx prisma migrate dev --name init
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## Variables d'environnement

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="changez-moi-en-production-min-32-caracteres"
```

## Flow utilisateur

1. **Inscription** → entreprise (SIRET, adresse…) enregistrée
2. **Nouveau devis** → brouillon modifiable
3. **Envoyer** → verrouillage + hash + token partage WhatsApp
4. **Client accepte** → conversion facture en 1 clic
5. **Émettre facture** → verrouillage définitif + chaînage + attestation

## API principales

| Route | Description |
|-------|-------------|
| `POST /api/devis` | Créer un devis (brouillon) |
| `POST /api/devis/[id]/send` | Envoyer & verrouiller |
| `GET /api/devis/[id]/verify` | Vérifier l'intégrité |
| `POST /api/factures` | Créer depuis devis accepté |
| `POST /api/factures/[id]` | Émettre (verrouiller) |
| `GET /api/factures/[id]/verify` | Vérifier chaîne d'intégrité |
| `GET /api/audit?entityType=&entityId=` | Trail d'audit |

## SEO

- Metadata Open Graph sur toutes les pages publiques
- JSON-LD SoftwareApplication + Organization
- `sitemap.xml` et `robots.txt` automatiques
- Pages `/tarifs` et `/conformite` optimisées mots-clés

## Production (Hetzner VPS)

```bash
# PostgreSQL recommandé
DATABASE_URL="postgresql://..."
npm run build
npm start
```

## Licence

Propriétaire — DevisPropre © 2026
