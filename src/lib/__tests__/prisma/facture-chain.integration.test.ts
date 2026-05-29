import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  buildFacturePayload,
  computeChainHash,
  computeContentHash,
} from "@/lib/document-hash";
import { verifyFactureIntegrity } from "@/lib/services/facture";
import {
  createIntegrationUser,
  deleteIntegrationUser,
  disconnectTestPrisma,
  getTestPrisma,
  isTestDatabaseAvailable,
} from "./test-db";

const dbReady = await isTestDatabaseAvailable();

describe.skipIf(!dbReady)("Prisma — chaîne SHA-256 factures (base réelle)", () => {
  let userId = "";
  let clientId = "";
  let facture1Id = "";
  let facture2Id = "";

  beforeAll(async () => {
    const prisma = await getTestPrisma();
    const user = await createIntegrationUser(prisma);
    userId = user.id;

    await prisma.company.create({
      data: {
        userId,
        raisonSociale: "Test SARL",
        siret: "12345678901234",
        adresse: "1 rue Test",
        codePostal: "75001",
        ville: "Paris",
      },
    });

    const client = await prisma.client.create({
      data: { userId, nom: "Client Chain Test" },
    });
    clientId = client.id;

    const base = {
      userId,
      clientId,
      status: "EMISE" as const,
      totalHT: 100,
      totalTVA: 20,
      totalTTC: 120,
      tauxTVA: 20,
      issuedAt: new Date("2026-05-01T10:00:00Z"),
      lockedAt: new Date("2026-05-01T10:00:00Z"),
    };

    const f1 = await prisma.facture.create({
      data: {
        ...base,
        numero: `FAC-CHAIN-${Date.now()}-1`,
        lignes: {
          create: [
            {
              ordre: 1,
              description: "Prestation A",
              quantite: 1,
              prixUnitaireHT: 100,
              tva: 20,
              totalHT: 100,
            },
          ],
        },
      },
      include: { lignes: true, client: true },
    });

    const company = await prisma.company.findUnique({ where: { userId } });
    const payload1 = buildFacturePayload(f1, company);
    const contentHash1 = computeContentHash(payload1);
    const chainHash1 = computeChainHash(contentHash1, null);

    await prisma.facture.update({
      where: { id: f1.id },
      data: { contentHash: contentHash1, chainHash: chainHash1, previousHash: null },
    });
    facture1Id = f1.id;

    const f2 = await prisma.facture.create({
      data: {
        ...base,
        numero: `FAC-CHAIN-${Date.now()}-2`,
        issuedAt: new Date("2026-05-02T10:00:00Z"),
        lockedAt: new Date("2026-05-02T10:00:00Z"),
        lignes: {
          create: [
            {
              ordre: 1,
              description: "Prestation B",
              quantite: 1,
              prixUnitaireHT: 200,
              tva: 20,
              totalHT: 200,
            },
          ],
        },
      },
      include: { lignes: true, client: true },
    });

    const payload2 = buildFacturePayload(f2, company);
    const contentHash2 = computeContentHash(payload2);
    const chainHash2 = computeChainHash(contentHash2, contentHash1);

    await prisma.facture.update({
      where: { id: f2.id },
      data: {
        contentHash: contentHash2,
        chainHash: chainHash2,
        previousHash: contentHash1,
      },
    });
    facture2Id = f2.id;
  });

  afterAll(async () => {
    const prisma = await getTestPrisma();
    if (facture1Id || facture2Id) {
      await prisma.factureLigne.deleteMany({
        where: { factureId: { in: [facture1Id, facture2Id].filter(Boolean) } },
      });
      await prisma.facture.deleteMany({
        where: { id: { in: [facture1Id, facture2Id].filter(Boolean) } },
      });
    }
    if (clientId) await prisma.client.deleteMany({ where: { id: clientId } });
    if (userId) await deleteIntegrationUser(prisma, userId);
    await disconnectTestPrisma();
  });

  it("valide la première facture (GENESIS)", async () => {
    const result = await verifyFactureIntegrity(
      { userId, ipAddress: null, userAgent: "test" },
      facture1Id
    );
    expect(result.valid).toBe(true);
  });

  it("valide la chaîne sur la deuxième facture", async () => {
    const result = await verifyFactureIntegrity(
      { userId, ipAddress: null, userAgent: "test" },
      facture2Id
    );
    expect(result.valid).toBe(true);
    expect(result.previousHash).toHaveLength(64);
  });

  it("détecte une rupture de chaîne", async () => {
    const prisma = await getTestPrisma();
    const f1 = await prisma.facture.findUnique({
      where: { id: facture1Id },
      select: { contentHash: true },
    });
    const f2Row = await prisma.facture.findUnique({
      where: { id: facture2Id },
      include: { lignes: true, client: true },
    });
    const company = await prisma.company.findUnique({ where: { userId } });
    const contentHash2 = computeContentHash(buildFacturePayload(f2Row!, company));
    const validChain = computeChainHash(contentHash2, f1!.contentHash);

    await prisma.facture.update({
      where: { id: facture2Id },
      data: { chainHash: "0".repeat(64) },
    });

    const result = await verifyFactureIntegrity(
      { userId, ipAddress: null, userAgent: "test" },
      facture2Id
    );
    expect(result.valid).toBe(false);

    await prisma.facture.update({
      where: { id: facture2Id },
      data: { chainHash: validChain },
    });
  });
});
