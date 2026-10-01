import { createHash } from "crypto";
import { describe, expect, it } from "vitest";
import {
  computeSignatureEvidenceHash,
  isSignatureEvidence,
  signatureImageSha256,
  SIGNATURE_EVIDENCE_VERSION,
  verifySignatureEvidence,
  type SignatureEvidence,
} from "../signature-evidence";

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function evidence(overrides: Partial<SignatureEvidence> = {}): SignatureEvidence {
  return {
    version: SIGNATURE_EVIDENCE_VERSION,
    devisId: "devis_1",
    devisNumero: "DEV-2026-001",
    contentHash: "a".repeat(64),
    signerName: "Jean Dupont",
    signerEmail: "jean@example.com",
    signerEmailSource: "client_record",
    acceptanceText: "Bon pour accord",
    signatureImageSha256: signatureImageSha256(PNG),
    signedAt: "2026-10-01T10:00:00.000Z",
    otpSentAt: "2026-10-01T09:58:00.000Z",
    otpVerifiedAt: "2026-10-01T10:00:00.000Z",
    retractationInfoAcknowledged: true,
    earlyExecutionRequested: false,
    ipAddress: "203.0.113.4",
    userAgent: "Vitest",
    ...overrides,
  };
}

describe("signature-evidence", () => {
  it("produit une empreinte stable indépendante de l'ordre des clés", () => {
    const e = evidence();
    const reordered = Object.fromEntries(Object.entries(e).reverse()) as unknown as SignatureEvidence;
    expect(computeSignatureEvidenceHash(e)).toMatch(/^[0-9a-f]{64}$/);
    expect(computeSignatureEvidenceHash(reordered)).toBe(computeSignatureEvidenceHash(e));
  });

  it("détecte toute altération de la preuve", () => {
    const hash = computeSignatureEvidenceHash(evidence());
    expect(verifySignatureEvidence(evidence(), hash)).toBe(true);
    expect(verifySignatureEvidence(evidence({ signerName: "Autre" }), hash)).toBe(false);
    expect(verifySignatureEvidence(evidence({ contentHash: "b".repeat(64) }), hash)).toBe(false);
  });

  it("hache les octets PNG de la signature, pas la data URI", () => {
    const bytes = Buffer.from(PNG.slice(PNG.indexOf(",") + 1), "base64");
    expect(signatureImageSha256(PNG)).toBe(createHash("sha256").update(bytes).digest("hex"));
  });

  it("reconnaît un objet de preuve stocké en JSON", () => {
    expect(isSignatureEvidence(JSON.parse(JSON.stringify(evidence())))).toBe(true);
    expect(isSignatureEvidence({ foo: 1 })).toBe(false);
    expect(isSignatureEvidence(null)).toBe(false);
  });
});
