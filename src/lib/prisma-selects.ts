/** Champs légers pour les listes dashboard / API (évite pdfUrl, snapshots, hash complets en masse). */

export const devisListSelect = {
  id: true,
  numero: true,
  status: true,
  totalTTC: true,
  lockedAt: true,
  createdAt: true,
  client: { select: { nom: true } },
} as const;

export const factureListSelect = {
  id: true,
  numero: true,
  status: true,
  totalTTC: true,
  lockedAt: true,
  issuedAt: true,
  createdAt: true,
  contentHash: true,
  client: { select: { nom: true } },
  attestation: { select: { numero: true } },
} as const;

export const factureApiListSelect = {
  id: true,
  numero: true,
  status: true,
  totalHT: true,
  totalTVA: true,
  totalTTC: true,
  issuedAt: true,
  paidAt: true,
  lockedAt: true,
  createdAt: true,
  client: { select: { id: true, nom: true } },
  attestation: { select: { id: true, numero: true } },
} as const;

export const devisApiListSelect = {
  id: true,
  numero: true,
  status: true,
  totalHT: true,
  totalTVA: true,
  totalTTC: true,
  lockedAt: true,
  sentAt: true,
  createdAt: true,
  client: { select: { id: true, nom: true } },
  lignes: {
    select: {
      id: true,
      ordre: true,
      description: true,
      quantite: true,
      prixUnitaireHT: true,
      tva: true,
      totalHT: true,
    },
  },
} as const;
