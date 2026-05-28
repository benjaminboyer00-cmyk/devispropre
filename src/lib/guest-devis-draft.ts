import type { GuestDevisDraft } from "@/lib/schemas/forms";
import { createGuestDraftId } from "@/lib/guest-draft-claim";

export const GUEST_DRAFT_KEY = "devispropre_guest_draft";
export const PENDING_DEVIS_ID_KEY = "devispropre_pending_devis_id";
export const CLAIM_ERROR_KEY = "devispropre_claim_error";

export type StoredGuestDraft = GuestDevisDraft & {
  savedAt?: string;
  draftId?: string;
  claimSignature?: string;
  signedAt?: string;
};

export function saveGuestDraft(draft: GuestDevisDraft): string {
  if (typeof window === "undefined") return new Date().toISOString();
  const savedAt = new Date().toISOString();
  const stored: StoredGuestDraft = { ...draft, savedAt };
  localStorage.setItem(GUEST_DRAFT_KEY, JSON.stringify(stored));
  return savedAt;
}

export function loadGuestDraft(): StoredGuestDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GUEST_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredGuestDraft;
  } catch {
    return null;
  }
}

export function formatDraftSavedAt(iso: string | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return null;
  }
}

export function clearGuestDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_DRAFT_KEY);
}

export function savePendingDevisId(id: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_DEVIS_ID_KEY, id);
  localStorage.setItem(PENDING_DEVIS_ID_KEY, id);
}

export function loadPendingDevisId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(PENDING_DEVIS_ID_KEY) ?? localStorage.getItem(PENDING_DEVIS_ID_KEY);
}

export function clearPendingDevisId(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_DEVIS_ID_KEY);
  localStorage.removeItem(PENDING_DEVIS_ID_KEY);
}

export function saveClaimError(message: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CLAIM_ERROR_KEY, message);
}

export function loadClaimError(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(CLAIM_ERROR_KEY);
}

export function clearClaimError(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CLAIM_ERROR_KEY);
}

function draftWithoutMeta(stored: StoredGuestDraft): GuestDevisDraft {
  const { savedAt: _s, draftId: _d, claimSignature: _c, signedAt: _t, ...draft } = stored;
  return draft;
}

/** Demande une signature HMAC serveur pour sécuriser la réclamation du brouillon. */
export async function refreshGuestDraftSignature(): Promise<StoredGuestDraft | null> {
  if (typeof window === "undefined") return null;
  const stored = loadGuestDraft();
  if (!stored) return null;

  const draft = draftWithoutMeta(stored);
  const draftId = stored.draftId ?? createGuestDraftId();

  const res = await fetch("/api/devis/guest-draft/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ draftId, draft }),
  });

  if (!res.ok) return stored;

  const data = (await res.json()) as { draftId: string; claimSignature: string; signedAt: string };
  const next: StoredGuestDraft = {
    ...stored,
    draftId: data.draftId,
    claimSignature: data.claimSignature,
    signedAt: data.signedAt,
  };
  localStorage.setItem(GUEST_DRAFT_KEY, JSON.stringify(next));
  return next;
}
