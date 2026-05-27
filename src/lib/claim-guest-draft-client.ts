import {
  clearGuestDraft,
  loadGuestDraft,
  saveClaimError,
  savePendingDevisId,
} from "@/lib/guest-devis-draft";
import type { GuestDevisDraft } from "@/lib/schemas/forms";
import { guestDevisDraftSchema } from "@/lib/schemas/forms";
import { computeDraftTotals, computeLineTtc } from "@/lib/tva";

export type ClaimGuestDraftResult = {
  id: string | null;
  error?: string;
};

/** Rattache le brouillon invité au compte connecté. */
export async function claimGuestDraftIfPresent(): Promise<ClaimGuestDraftResult> {
  const raw = loadGuestDraft();
  if (!raw) return { id: null };

  const parsed = guestDevisDraftSchema.safeParse(raw);
  if (!parsed.success) {
    clearGuestDraft();
    return { id: null, error: "Brouillon de devis invalide — recréez votre devis." };
  }

  const res = await fetch("/api/devis/claim-draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    const message = data.error ?? "Impossible d'enregistrer votre devis. Réessayez depuis l'aperçu.";
    saveClaimError(message);
    return { id: null, error: message };
  }

  const data = (await res.json()) as { id: string };
  clearGuestDraft();
  savePendingDevisId(data.id);
  return { id: data.id };
}

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
