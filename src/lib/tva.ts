/** Mention légale franchise en base — art. 293 B du CGI. */
export const FRANCHISE_MENTION = "TVA non applicable, art. 293 B du CGI";

/** Taux TVA autorisés sur un devis BTP (assujetti). Le 0 % couvre exonérations ponctuelles. */
export const TVA_RATES = [
  { value: 0, label: "0 %", shortLabel: "0 %", legalHint: "Exonéré ou non soumis" },
  { value: 5.5, label: "5,5 %", shortLabel: "5,5 %", legalHint: "Taux réduit (ex. énergie)" },
  { value: 10, label: "10 %", shortLabel: "10 %", legalHint: "Rénovation logement (+2 ans)" },
  { value: 20, label: "20 %", shortLabel: "20 %", legalHint: "Taux normal" },
] as const;

export type TvaRateValue = (typeof TVA_RATES)[number]["value"];

/** TVA appliquée à une ligne selon le statut entreprise. */
export function resolveLineTva(lineTva: number | undefined, tvaApplicable: boolean): number {
  if (!tvaApplicable) return 0;
  const rate = lineTva ?? 20;
  return TVA_RATES.some((r) => r.value === rate) ? rate : 20;
}

export function computeLineTtc(
  quantite: number,
  prixUnitaireHT: number,
  tva: number,
  tvaApplicable: boolean
): number {
  const ht = quantite * prixUnitaireHT;
  if (!tvaApplicable) return ht;
  return ht * (1 + resolveLineTva(tva, true) / 100);
}

export function computeDraftTotals(
  lignes: { quantite: number; prixUnitaireHT: number; tva?: number }[],
  tvaApplicable: boolean
): { totalHT: number; totalTVA: number; totalTTC: number } {
  let totalHT = 0;
  let totalTVA = 0;

  for (const l of lignes) {
    const ht = Math.round(l.quantite * l.prixUnitaireHT * 100) / 100;
    totalHT += ht;
    if (tvaApplicable) {
      const rate = resolveLineTva(l.tva, true);
      totalTVA += Math.round(ht * (rate / 100) * 100) / 100;
    }
  }

  totalHT = Math.round(totalHT * 100) / 100;
  totalTVA = Math.round(totalTVA * 100) / 100;

  return { totalHT, totalTVA, totalTTC: Math.round((totalHT + totalTVA) * 100) / 100 };
}

/** Notes complémentaires si franchise en base (PDF + mentions légales). */
export function ensureFranchiseNotes(notes: string | undefined, tvaApplicable: boolean): string | undefined {
  if (tvaApplicable) return notes?.trim() || undefined;
  const base = notes?.trim() ?? "";
  if (base.includes("293 B")) return base || undefined;
  return base ? `${base}\n${FRANCHISE_MENTION}.` : FRANCHISE_MENTION;
}
