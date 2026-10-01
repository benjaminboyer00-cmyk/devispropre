import { describe, expect, it } from "vitest";
import { generateDevisPdf } from "../pdf-document";
import { computeSignatureEvidenceHash, signatureImageSha256, type SignatureEvidence } from "../signature-evidence";

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

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
      signerName: null,
      signerEmail: null,
      signatureEvidence: null,
      signatureEvidenceHash: null,
      signedPdfHash: null,
      signedPdfArchivedAt: null,
      shareSlug: null,
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
    // Page 1 : devis — page 2 : information rétractation + formulaire
    expect(pdf.toString("latin1").match(/\/Type \/Page\b/g)?.length).toBe(2);

    const evidence: SignatureEvidence = {
      version: 1,
      devisId: "d1",
      devisNumero: devis.numero,
      contentHash: "a".repeat(64),
      signerName: "Jean Dupont",
      signerEmail: "jean@example.com",
      signerEmailSource: "declared_by_signer",
      acceptanceText: "Bon pour accord",
      signatureImageSha256: signatureImageSha256(PNG),
      signedAt: "2026-10-01T10:00:00.000Z",
      otpSentAt: "2026-10-01T09:58:00.000Z",
      otpVerifiedAt: "2026-10-01T10:00:00.000Z",
      retractationInfoAcknowledged: true,
      earlyExecutionRequested: true,
      ipAddress: "203.0.113.4",
      userAgent: "Vitest",
    };
    const signed = await generateDevisPdf(
      { ...devis, status: "ACCEPTE" as const, clientSignatureData: PNG, clientAcceptanceText: "Bon pour accord" },
      company,
      { signature: { evidence, evidenceHash: computeSignatureEvidenceHash(evidence), signatureData: PNG } }
    );
    expect(signed.subarray(0, 4).toString()).toBe("%PDF");
    // + page 3 : certificat de signature électronique
    expect(signed.toString("latin1").match(/\/Type \/Page\b/g)?.length).toBe(3);
  });
});
