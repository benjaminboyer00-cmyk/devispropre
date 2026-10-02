import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  decryptShareToken,
  encryptShareToken,
  reencryptLegacyShareTokens,
} from "@/lib/share-token-storage";
import {
  createIntegrationUser,
  deleteIntegrationUser,
  disconnectTestPrisma,
  getTestPrisma,
  isTestDatabaseAvailable,
} from "./test-db";

const dbReady = await isTestDatabaseAvailable();
const RAW = "c".repeat(64);

describe.skipIf(!dbReady)("Prisma — re-chiffrement des jetons de partage (base réelle)", () => {
  let userId = "";
  let devisId = "";

  beforeAll(async () => {
    const prisma = await getTestPrisma();
    userId = (await createIntegrationUser(prisma)).id;
    const client = await prisma.client.create({ data: { userId, nom: "Client Clé" } });
    vi.stubEnv("DATA_ENCRYPTION_KEY", "");
    const devis = await prisma.devis.create({
      data: {
        userId,
        clientId: client.id,
        numero: `DEV-KEY-${Date.now()}`,
        totalHT: 10,
        totalTVA: 2,
        totalTTC: 12,
        shareTokenEnc: encryptShareToken(RAW),
      },
    });
    devisId = devis.id;
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    const prisma = await getTestPrisma();
    if (devisId) await prisma.devis.delete({ where: { id: devisId } });
    if (userId) {
      await prisma.client.deleteMany({ where: { userId } });
      await deleteIntegrationUser(prisma, userId);
    }
    await disconnectTestPrisma();
  });

  it("migre les chiffrés legacy vers la clé dédiée sans toucher updatedAt", async () => {
    const prisma = await getTestPrisma();
    const before = await prisma.devis.findUniqueOrThrow({ where: { id: devisId } });

    vi.stubEnv("DATA_ENCRYPTION_KEY", "3d".repeat(32));
    expect(await reencryptLegacyShareTokens()).toBeGreaterThanOrEqual(1);

    const after = await prisma.devis.findUniqueOrThrow({ where: { id: devisId } });
    expect(after.shareTokenEnc?.startsWith("k2.")).toBe(true);
    expect(decryptShareToken(after.shareTokenEnc)).toBe(RAW);
    expect(after.updatedAt.getTime()).toBe(before.updatedAt.getTime());

    // Idempotent : plus rien à migrer pour ce devis.
    await reencryptLegacyShareTokens();
    const again = await prisma.devis.findUniqueOrThrow({ where: { id: devisId } });
    expect(again.shareTokenEnc).toBe(after.shareTokenEnc);
  });
});
