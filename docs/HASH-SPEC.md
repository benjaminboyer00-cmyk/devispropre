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

## Preuve de signature électronique (`signatureEvidenceHash`)

Signature électronique simple (eIDAS art. 25, C. civ. art. 1366-1367). Le signataire est identifié par un
code à usage unique (6 chiffres, 10 min, 3 essais) envoyé à l'e-mail de la fiche client, ou à défaut à
l'e-mail qu'il déclare (`signerEmailSource`).

```
signatureEvidenceHash = SHA256( canonicalize(signatureEvidence) )
signedPdfHash         = SHA256( octets du PDF signé archivé )
```

| Champ de `signatureEvidence` | Notes |
|------------------------------|-------|
| `version`, `devisId`, `devisNumero` | Format v1 |
| `contentHash` | Empreinte du devis figée à l'envoi — lie la signature au contenu exact |
| `signerName`, `signerEmail`, `signerEmailSource` | Identité vérifiée par OTP e-mail |
| `acceptanceText` | Mention « Bon pour accord » |
| `signatureImageSha256` | SHA-256 des octets PNG de la signature manuscrite |
| `signedAt`, `otpSentAt`, `otpVerifiedAt` | ISO 8601 UTC |
| `retractationInfoAcknowledged`, `earlyExecutionRequested` | Information rétractation (C. conso. L221-5, L221-25) |
| `ipAddress`, `userAgent` | Contexte technique de la signature |

Stockage : `Devis.signatureEvidence` (JSON), `Devis.signatureEvidenceHash`, `Devis.signedPdfHash`.
PDF signé (devis + page rétractation + certificat) : clé `devis/{userId}/{devisId}-signe.pdf`.
Dossier de preuve avec vérifications recalculées : `GET /api/devis/[id]/signature-proof`.

## Tests automatisés

- `src/lib/__tests__/document-hash.test.ts` — stabilité, altération, chaînage
- `src/lib/__tests__/prisma/facture-chain.integration.test.ts` — chaîne multi-factures en base réelle
- `src/lib/__tests__/signature-evidence.test.ts` — empreinte de preuve de signature
- `src/lib/__tests__/prisma/devis-signature-flow.integration.test.ts` — parcours de signature complet en base réelle

## Journal d'audit chaîné (`AuditLog.entryHash`)

Chaque entrée du journal d'un espace de travail porte un numéro `seq` (1, 2, 3…, unique par `userId`)
et l'empreinte de l'entrée précédente :

```
entryHash = SHA256( canonicalize({ v: 1, seq, prevHash, userId, action, entityType, entityId,
                                   metadata, contentHash, ipAddress, userAgent, createdAt }) )
```

- `prevHash` = `entryHash` de l'entrée `seq - 1` (`null` pour `seq = 1`) ; `createdAt` en ISO 8601.
- `devisId` / `factureId` sont exclus (clés étrangères pouvant être remises à `null`).
- Les ajouts sont sérialisés par un verrou consultatif PostgreSQL par espace de travail.
- Un déclencheur PostgreSQL interdit toute suppression et toute modification des champs hachés.
- Les entrées antérieures au chaînage ont `seq = null` et ne sont pas vérifiées.

Vérification : `verifyAuditChain` dans `src/lib/audit.ts`. Le dossier de preuve de signature
(`GET /api/devis/[id]/signature-proof`) inclut le résultat (`auditChain`). Chaque téléchargement
d'un élément de preuve (PDF signé, dossier JSON) ajoute une entrée `EXPORT_PROOF`.
