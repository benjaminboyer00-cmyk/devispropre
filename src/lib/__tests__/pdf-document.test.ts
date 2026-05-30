import { describe, expect, it } from "vitest";
import { generateDevisPdf } from "../pdf-document";

describe("generateDevisPdf", () => {
  it("génère un PDF brouillon avec franchise TVA", async () => {
    const devis = {
      id: "d1",
      userId: "u1",
      clientId: "c1",
      numero: "DEV-2026-001",
      status: "BROUILLON" as const,
      totalHT: 100,
      totalTVA: 0,
      totalTTC: 100,
      tauxTVA: 0,
      lockedAt: null,
      contentHash: null,
      chainHash: null,
      shareTokenHash: null,
      shareTokenEnc: null,
      sentAt: null,
      acceptedAt: null,
      refusedAt: null,
      clientAcceptanceText: null,
      clientSignatureData: null,
      reminderSentAt: null,
      pdfUrl: null,
      pdfArchivedAt: null,
      issuerSnapshot: null,
      notes: "Acompte 30 %",
      validUntil: new Date("2026-06-30"),
      createdAt: new Date("2026-05-27"),
      updatedAt: new Date("2026-05-27"),
      deletedAt: null,
      client: {
        id: "c1",
        userId: "u1",
        nom: "Dupont",
        email: null,
        telephone: "0612345678",
        adresse: "1 rue Test",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      lignes: [
        {
          id: "l1",
          devisId: "d1",
          ordre: 1,
          description: "Plomberie",
          quantite: 1,
          prixUnitaireHT: 100,
          tva: 0,
          totalHT: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    const company = {
      id: "co1",
      userId: "u1",
      raisonSociale: "Test SARL",
      siret: "12345678901234",
      adresse: "2 rue Artisan",
      codePostal: "75001",
      ville: "Paris",
      tvaApplicable: false,
      tvaIntracom: null,
      rcs: null,
      capitalSocial: null,
      telephone: null,
      email: null,
      assurances: null,
      assuranceDecennaleAssureur: null,
      assuranceDecennaleContrat: null,
      assuranceDecennaleCouverture: null,
      activiteBtp: false,
      logoUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const pdf = await generateDevisPdf(devis, company);
    expect(pdf.length).toBeGreaterThan(500);
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
  });
});
