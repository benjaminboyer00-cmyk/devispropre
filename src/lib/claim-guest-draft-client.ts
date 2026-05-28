import {
  clearGuestDraft,
  loadGuestDraft,
  refreshGuestDraftSignature,
  savePendingDevisId,
} from "@/lib/guest-devis-draft";
import { saveClaimError } from "@/lib/guest-draft-claim-error";
import { guestDevisDraftSchema } from "@/lib/schemas/forms";
import { draftSummary, lineDisplayTotal } from "@/lib/guest-devis-summary";

export { draftSummary, lineDisplayTotal };

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

  let stored = raw;
  if (!stored.draftId || !stored.claimSignature) {
    stored = (await refreshGuestDraftSignature()) ?? stored;
  }

  if (!stored.draftId || !stored.claimSignature) {
    return { id: null, error: "Impossible de sécuriser le brouillon — réessayez." };
  }

  const res = await fetch("/api/devis/claim-draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...parsed.data,
      draftId: stored.draftId,
      claimSignature: stored.claimSignature,
      signedAt: stored.signedAt,
    }),
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
