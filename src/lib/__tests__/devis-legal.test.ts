import { describe, expect, it } from "vitest";
import { formatAssuranceDecennale, companyIssuerLines } from "../devis-legal";

describe("devis-legal", () => {
  const base = {
    raisonSociale: "Dupont Plomberie",
    siret: "12345678901234",
    adresse: "12 rue des Artisans",
    codePostal: "75001",
    ville: "Paris",
    tvaApplicable: true,
  };

  it("formate l'assurance décennale structurée", () => {
    expect(
      formatAssuranceDecennale({
        ...base,
        activiteBtp: true,
        assuranceDecennaleAssureur: "AXA France IARD",
        assuranceDecennaleContrat: "DEC-2026-001",
        assuranceDecennaleCouverture: "France métropolitaine",
      })
    ).toContain("AXA France IARD");
  });

  it("masque la décennale si profil non BTP", () => {
    expect(
      formatAssuranceDecennale({
        ...base,
        activiteBtp: false,
        assuranceDecennaleAssureur: "AXA",
        assuranceDecennaleContrat: "123",
      })
    ).toBeNull();
  });

  it("inclut SIRET et RCS dans l'en-tête émetteur", () => {
    const lines = companyIssuerLines({ ...base, rcs: "RM Lyon 123 456 789" });
    expect(lines.some((l) => l.includes("SIRET"))).toBe(true);
    expect(lines.some((l) => l.includes("RM Lyon"))).toBe(true);
  });
});
