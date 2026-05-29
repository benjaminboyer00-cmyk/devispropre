import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sha256 } from "@/lib/crypto";
import {
  OTP_MAX_VERIFY_ATTEMPTS,
  verifyDevisSignatureOtp,
} from "@/lib/devis-signature-otp";
import {
  createIntegrationUser,
  deleteIntegrationUser,
  disconnectTestPrisma,
  getTestPrisma,
  isTestDatabaseAvailable,
} from "./test-db";

const dbReady = await isTestDatabaseAvailable();

describe.skipIf(!dbReady)("Prisma — OTP signature devis (base réelle)", () => {
  let userId = "";
  let devisId = "";
  let clientId = "";
  const validCode = "482910";

  beforeAll(async () => {
    const prisma = await getTestPrisma();
    const user = await createIntegrationUser(prisma);
    userId = user.id;

    const client = await prisma.client.create({
      data: {
        userId,
        nom: "Client OTP Test",
        email: "otp-client@devispropre.test",
      },
    });
    clientId = client.id;

    const devis = await prisma.devis.create({
      data: {
        userId,
        clientId,
        numero: `DEV-OTP-${Date.now()}`,
        status: "ENVOYE",
        totalHT: 100,
        totalTVA: 20,
        totalTTC: 120,
        tauxTVA: 20,
        shareTokenHash: "c".repeat(64),
        sentAt: new Date(),
      },
    });
    devisId = devis.id;

    await prisma.devisSignatureOtp.create({
      data: {
        devisId,
        codeHash: sha256(validCode),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
      },
    });
  });

  afterAll(async () => {
    const prisma = await getTestPrisma();
    if (devisId) {
      await prisma.devisSignatureOtp.deleteMany({ where: { devisId } });
      await prisma.devis.deleteMany({ where: { id: devisId } });
    }
    if (clientId) await prisma.client.deleteMany({ where: { id: clientId } });
    if (userId) await deleteIntegrationUser(prisma, userId);
    await disconnectTestPrisma();
  });

  it("accepte un code valide une seule fois", async () => {
    expect(await verifyDevisSignatureOtp(devisId, validCode)).toBe("ok");
    expect(await verifyDevisSignatureOtp(devisId, validCode)).toBe("expired");
  });

  it("verrouille après le nombre max de tentatives", async () => {
    const prisma = await getTestPrisma();
    const lockedDevis = await prisma.devis.create({
      data: {
        userId,
        clientId,
        numero: `DEV-OTP-LOCK-${Date.now()}`,
        status: "ENVOYE",
        totalHT: 50,
        totalTVA: 10,
        totalTTC: 60,
        tauxTVA: 20,
        shareTokenHash: "d".repeat(64),
        sentAt: new Date(),
      },
    });

    await prisma.devisSignatureOtp.create({
      data: {
        devisId: lockedDevis.id,
        codeHash: sha256("111111"),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
      },
    });

    for (let i = 0; i < OTP_MAX_VERIFY_ATTEMPTS - 1; i++) {
      expect(await verifyDevisSignatureOtp(lockedDevis.id, "000000")).toBe("invalid");
    }
    expect(await verifyDevisSignatureOtp(lockedDevis.id, "000000")).toBe("locked");

    await prisma.devisSignatureOtp.deleteMany({ where: { devisId: lockedDevis.id } });
    await prisma.devis.delete({ where: { id: lockedDevis.id } });
  });
});
