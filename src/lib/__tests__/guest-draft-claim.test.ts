import { describe, expect, it } from "vitest";
import { signGuestDraftClaim, verifyGuestDraftClaim } from "../guest-draft-claim";

describe("guest-draft-claim", () => {
  const draft = {
    clientNom: "Martin",
    lignes: [{ description: "Plomberie", quantite: 1, prixUnitaireHT: 500, tva: 10 }],
  };

  it("signe et vérifie un brouillon invité", () => {
    const draftId = "550e8400-e29b-41d4-a716-446655440000";
    const sig = signGuestDraftClaim(draftId, draft);
    expect(sig).toHaveLength(64);
    expect(verifyGuestDraftClaim(draftId, draft, sig)).toBe(true);
  });

  it("rejette une signature ou un contenu altéré", () => {
    const draftId = "550e8400-e29b-41d4-a716-446655440000";
    const sig = signGuestDraftClaim(draftId, draft);
    expect(verifyGuestDraftClaim(draftId, { ...draft, clientNom: "Autre" }, sig)).toBe(false);
    expect(verifyGuestDraftClaim("00000000-0000-4000-8000-000000000001", draft, sig)).toBe(false);
  });
});
