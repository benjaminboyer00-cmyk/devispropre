import type { GuestDevisDraft } from "@/lib/schemas/forms";
import { computeDraftTotals, computeLineTtc } from "@/lib/tva";

export function draftSummary(draft: GuestDevisDraft) {
  const tvaApplicable = draft.tvaApplicable ?? true;
  const totals = computeDraftTotals(draft.lignes, tvaApplicable);
  return {
    clientNom: draft.clientNom,
    clientAdresse: draft.clientAdresse,
    clientTelephone: draft.clientTelephone,
    lignes: draft.lignes.length,
    totalHT: totals.totalHT,
    totalTVA: totals.totalTVA,
    totalTTC: totals.totalTTC,
    tvaApplicable,
    validUntil: draft.validUntil,
    notes: draft.notes,
  };
}

export function lineDisplayTotal(
  ligne: GuestDevisDraft["lignes"][number],
  tvaApplicable: boolean
): number {
  return computeLineTtc(ligne.quantite, ligne.prixUnitaireHT, ligne.tva ?? 20, tvaApplicable);
}
