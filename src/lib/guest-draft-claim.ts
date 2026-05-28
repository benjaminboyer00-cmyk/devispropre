import { createHmac, randomUUID } from "crypto";
import type { GuestDevisDraft } from "./schemas/forms";
import { canonicalize } from "./crypto";
import { env } from "./env";
import { timingSafeEqualStrings } from "./timing-safe";

const CLAIM_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface SignedGuestDraftPayload extends GuestDevisDraft {
  draftId: string;
  claimSignature: string;
  signedAt?: string;
}

function claimPayload(draftId: string, draft: GuestDevisDraft): string {
  return `${draftId}:${canonicalize(draft)}`;
}

export function createGuestDraftId(): string {
  return randomUUID();
}

export function signGuestDraftClaim(draftId: string, draft: GuestDevisDraft): string {
  return createHmac("sha256", env.jwtSecret).update(claimPayload(draftId, draft)).digest("hex");
}

export function verifyGuestDraftClaim(
  draftId: string,
  draft: GuestDevisDraft,
  claimSignature: string
): boolean {
  if (!draftId || !claimSignature) return false;
  const expected = signGuestDraftClaim(draftId, draft);
  return timingSafeEqualStrings(expected, claimSignature);
}

export function isGuestDraftSignatureFresh(signedAt?: string): boolean {
  if (!signedAt) return true;
  const ts = Date.parse(signedAt);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts <= CLAIM_TTL_MS;
}
