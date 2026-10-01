import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { buildDevisPayload, verifyDocumentIntegrity } from "@/lib/document-hash";
import { deleteArchivedPdf, readArchivedPdf, signedDevisPdfKey } from "@/lib/object-storage";
import {
  isSignatureEvidence,
  sha256Buffer,
  signatureImageSha256,
  verifySignatureEvidence,
} from "@/lib/signature-evidence";
import { sendDevis } from "@/lib/services/devis";
import { buildApiRequest } from "../api/test-request";
import {
  createIntegrationUser,
  deleteIntegrationUser,
  disconnectTestPrisma,
  getTestPrisma,
  isTestDatabaseAvailable,
} from "./test-db";

const dbReady = await isTestDatabaseAvailable();

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

/** Parcours complet : envoi → code e-mail → signature → preuve vérifiable + PDF signé archivé. */
describe.skipIf(!dbReady)("Prisma — parcours de signature électronique (base réelle)", () => {
  let userId = "";
  let devisId = "";
  let shareToken = "";

  beforeAll(async () => {
    const prisma = await getTestPrisma();
    const user = await createIntegrationUser(prisma);
    userId = user.id;
    await prisma.company.create({
      data: {
        userId,
        raisonSociale: "Plomberie Test SARL",
        siret: "12345678901234",
        adresse: "2 rue Artisan",
        codePostal: "75001",
        ville: "Paris",
        email: "contact@plomberie.test",
      },
    });
    const client = await prisma.client.create({
      data: { userId, nom: "Jean Dupont", email: null },
    });
    const devis = await prisma.devis.create({
      data: {
        userId,
        clientId: client.id,
        numero: `DEV-SIG-${Date.now()}`,
        totalHT: 100,
        totalTVA: 20,
        totalTTC: 120,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lignes: {
          create: [{ ordre: 1, description: "Réparation fuite", quantite: 1, prixUnitaireHT: 100, tva: 20, totalHT: 100 }],
        },
      },
    });
    devisId = devis.id;
    const sent = await sendDevis({ userId }, devisId);
    shareToken = sent.shareTokenRaw;
  });

  afterAll(async () => {
    const prisma = await getTestPrisma();
    if (userId) {
      await deleteArchivedPdf(signedDevisPdfKey(userId, devisId)).catch(() => undefined);
      await deleteArchivedPdf(`devis/${userId}/${devisId}.pdf`).catch(() => undefined);
      await prisma.idempotencyRecord.deleteMany({ where: { userId } });
      await prisma.devis.deleteMany({ where: { userId } });
      await deleteIntegrationUser(prisma, userId);
    }
    await disconnectTestPrisma();
  });

  it("signe le devis avec code e-mail et produit une preuve vérifiable", async () => {
    const { POST: requestOtp } = await import("@/app/api/public/devis/[token]/otp/route");
    const { POST: sign, GET } = await import("@/app/api/public/devis/[token]/route");
    const params = { params: Promise.resolve({ token: shareToken }) };

    // Sans RESEND_API_KEY (hors prod), le code est journalisé au lieu d'être envoyé.
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const otpRes = await requestOtp(
      buildApiRequest(`/api/public/devis/${shareToken}/otp`, {
        method: "POST",
        body: JSON.stringify({ email: "Jean.Dupont@Example.com" }),
      }),
      params
    );
    expect(otpRes.status).toBe(200);
    const logged = info.mock.calls.map((c) => String(c[0])).find((l) => l.includes("Code de signature"));
    info.mockRestore();
    const code = logged?.match(/(\d{6})$/)?.[1];
    expect(code).toBeDefined();

    const body = {
      status: "ACCEPTE",
      acceptanceText: "Bon pour accord",
      signatureData: PNG,
      signerName: "Jean Dupont",
      retractationInfoAcknowledged: true,
      earlyExecutionRequested: false,
    };

    const wrong = await sign(
      buildApiRequest(`/api/public/devis/${shareToken}`, {
        method: "POST",
        body: JSON.stringify({ ...body, otpCode: code === "000000" ? "111111" : "000000" }),
      }),
      params
    );
    expect(wrong.status).toBe(400);

    const ok = await sign(
      buildApiRequest(`/api/public/devis/${shareToken}`, {
        method: "POST",
        headers: { "x-real-ip": "203.0.113.7", "user-agent": "Vitest E2E", "Idempotency-Key": "sig-e2e-1" },
        body: JSON.stringify({ ...body, otpCode: code }),
      }),
      params
    );
    expect(ok.status).toBe(200);

    // Seconde soumission après signature : refusée, pas de double signature.
    const replay = await sign(
      buildApiRequest(`/api/public/devis/${shareToken}`, {
        method: "POST",
        headers: { "Idempotency-Key": "sig-e2e-1" },
        body: JSON.stringify({ ...body, otpCode: code }),
      }),
      params
    );
    expect(replay.status).toBe(404);

    const prisma = await getTestPrisma();
    const devis = await prisma.devis.findUniqueOrThrow({
      where: { id: devisId },
      include: { lignes: true, client: true, auditLogs: true },
    });
    expect(devis.status).toBe("ACCEPTE");
    expect(devis.signerName).toBe("Jean Dupont");
    expect(devis.signerEmail).toBe("jean.dupont@example.com");

    expect(isSignatureEvidence(devis.signatureEvidence)).toBe(true);
    if (!isSignatureEvidence(devis.signatureEvidence)) return;
    const evidence = devis.signatureEvidence;
    expect(evidence.signerEmailSource).toBe("declared_by_signer");
    expect(evidence.ipAddress).toBe("203.0.113.7");
    expect(evidence.contentHash).toBe(devis.contentHash);
    expect(verifySignatureEvidence(evidence, devis.signatureEvidenceHash!)).toBe(true);
    expect(evidence.signatureImageSha256).toBe(signatureImageSha256(devis.clientSignatureData!));

    const company = await prisma.company.findUnique({ where: { userId } });
    expect(verifyDocumentIntegrity(devis.contentHash!, buildDevisPayload(devis, company))).toBe(true);

    const pdf = await readArchivedPdf(signedDevisPdfKey(userId, devisId));
    expect(pdf).not.toBeNull();
    expect(sha256Buffer(pdf!)).toBe(devis.signedPdfHash);
    expect(pdf!.toString("latin1").match(/\/Type \/Page\b/g)?.length).toBe(3);

    const accept = devis.auditLogs.find((l) => l.action === "ACCEPT");
    expect(accept?.ipAddress).toBe("203.0.113.7");
    expect(JSON.parse(accept!.metadata)).toMatchObject({
      method: "otp_email",
      signatureEvidenceHash: devis.signatureEvidenceHash,
    });

    const view = await (await GET(buildApiRequest(`/api/public/devis/${shareToken}`), params)).json();
    expect(view).toMatchObject({ status: "ACCEPTE", signerName: "Jean Dupont", hasSignedPdf: true });
  });
});
