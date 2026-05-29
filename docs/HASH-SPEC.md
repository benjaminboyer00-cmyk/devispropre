# Spécification empreintes SHA-256 — DevisPropre

Document reproductible pour audit externe (loi anti-fraude TVA 2018).

## Algorithme

- **Fonction de hachage** : SHA-256, sortie encodée en **hexadécimal minuscule** (64 caractères).
- **Sérialisation** : JSON canonique — clés triées récursivement, sans espaces (`JSON.stringify` sur objet trié).
- **Implémentation** : `src/lib/crypto.ts` (`canonicalize`, `sha256`).

## Empreinte de contenu (`contentHash`)

Calculée à l’envoi d’un devis ou à l’émission d’une facture.

```
contentHash = SHA256( canonicalize(payload) )
```

### Champs inclus — devis (`type: "devis"`)

| Champ | Notes |
|-------|--------|
| `type` | Toujours `"devis"` |
| `numero` | Ex. `DEV-2026-0001` |
| `totalHT`, `totalTVA`, `totalTTC`, `tauxTVA` | Nombres |
| `notes` | Texte ou `null` |
| `validUntil` | ISO 8601 ou `null` |
| `client` | `{ nom, email, telephone, adresse }` |
| `company` | Mentions émetteur (raison sociale, SIRET, adresse, TVA…) ou `null` |
| `lignes[]` | Triées par `ordre` : `{ ordre, description, quantite, prixUnitaireHT, tva, totalHT }` |

**Exclus volontairement** : `status`, dates workflow (`sentAt`, `acceptedAt`), signatures client, tokens de partage.

### Champs inclus — facture (`type: "facture"`)

Même principe avec `dateEcheance` à la place de `validUntil`. Statuts `EMISE` / `PAYEE` exclus du hash.

Source : `buildDevisPayload` / `buildFacturePayload` dans `src/lib/document-hash.ts`.

## Chaînage factures (`chainHash`)

Appliqué uniquement aux **factures émises**, dans l’ordre chronologique `issuedAt` par artisan (`userId`).

```
chainHash = SHA256( "{previous}:{contentHash}" )
```

| Cas | Valeur de `previous` |
|-----|----------------------|
| Première facture émise de l’artisan | `GENESIS` |
| Factures suivantes | `contentHash` de la dernière facture émise (EMISE ou PAYEE) |

Exemple :

```
chainHash₁ = SHA256("GENESIS:" + contentHash₁)
chainHash₂ = SHA256(contentHash₁ + ":" + contentHash₂)
```

Stockage : `Facture.contentHash`, `Facture.chainHash`, `Facture.previousHash`.

Verrou advisory PostgreSQL : `pg_advisory_xact_lock(hashtext('facture-chain:{userId}'))` lors de l’émission.

## Vérification d’intégrité

1. Reconstruire le payload depuis la base (lignes + client + snapshot émetteur).
2. Recalculer `contentHash` et comparer à la valeur stockée.
3. Si `previousHash` présent : recalculer `computeChainHash(contentHash, previousHash)` et comparer à `chainHash`.

API : `GET /api/devis/[id]/verify`, `GET /api/factures/[id]/verify`.

## Tests automatisés

- `src/lib/__tests__/document-hash.test.ts` — stabilité, altération, chaînage
- `src/lib/__tests__/prisma/facture-chain.integration.test.ts` — chaîne multi-factures en base réelle
