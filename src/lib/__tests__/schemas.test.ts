import { describe, expect, it } from "vitest";
import {
  loginSchema,
  magicLinkSchema,
  registerSchema,
  createDevisSchema,
  guestDevisDraftSchema,
  formatZodError,
} from "../schemas/forms";
import { planFromStripePrice, shouldDowngradeToFree } from "../stripe-subscription";

describe("schemas partagés", () => {
  it("rejette un login sans mot de passe", () => {
    const result = loginSchema.safeParse({ email: "a@b.fr", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatZodError(result.error)).toMatch(/mot de passe/i);
    }
  });

  it("valide une inscription sans mot de passe", () => {
    const result = registerSchema.safeParse({
      email: "artisan@example.fr",
      name: "Jean Dupont",
      raisonSociale: "Dupont BTP",
      siret: "12345678901234",
      adresse: "1 rue Test",
      codePostal: "75001",
      ville: "Paris",
    });
    expect(result.success).toBe(true);
  });

  it("rejette un devis sans ligne valide", () => {
    const result = createDevisSchema.safeParse({
      clientId: "c1",
      lignes: [{ description: "", quantite: 0, prixUnitaireHT: -1 }],
    });
    expect(result.success).toBe(false);
  });

  it("valide magic link email", () => {
    expect(magicLinkSchema.safeParse({ email: "test@devispropre.fr" }).success).toBe(true);
  });

  it("valide un brouillon invité", () => {
    const result = guestDevisDraftSchema.safeParse({
      clientNom: "Martin",
      clientAdresse: "12 rue du Chantier, Paris",
      clientEmail: "client@example.fr",
      lignes: [{ description: "Plomberie", quantite: 1, prixUnitaireHT: 500, tva: 10 }],
      validUntil: "2026-06-30",
      notes: "Acompte 30 % à la commande",
    });
    expect(result.success).toBe(true);
  });
});

describe("stripe-subscription", () => {
  it("identifie les statuts à rétrograder", () => {
    expect(shouldDowngradeToFree("canceled")).toBe(true);
    expect(shouldDowngradeToFree("unpaid")).toBe(true);
    expect(shouldDowngradeToFree("active")).toBe(false);
  });

  it("retourne null pour un price ID inconnu", () => {
    expect(planFromStripePrice("price_inconnu_xyz")).toBeNull();
  });
});
