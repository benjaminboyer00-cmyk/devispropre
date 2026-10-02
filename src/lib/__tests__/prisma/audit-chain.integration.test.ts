import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { logAudit, verifyWorkspaceAuditChain } from "@/lib/audit";
import {
  createIntegrationUser,
  deleteIntegrationUser,
  disconnectTestPrisma,
  getTestPrisma,
  isTestDatabaseAvailable,
} from "./test-db";

const dbReady = await isTestDatabaseAvailable();

describe.skipIf(!dbReady)("Prisma — journal d'audit chaîné (base réelle)", () => {
  let userId = "";

  beforeAll(async () => {
    const prisma = await getTestPrisma();
    userId = (await createIntegrationUser(prisma)).id;
  });

  afterAll(async () => {
    const prisma = await getTestPrisma();
    if (userId) await deleteIntegrationUser(prisma, userId);
    await disconnectTestPrisma();
  });

  it("sérialise les ajouts concurrents en une chaîne continue et valide", async () => {
    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        logAudit(
          { userId, ipAddress: "203.0.113.7", userAgent: "vitest" },
          { action: "UPDATE", entityType: "Devis", entityId: `devis_${i}`, metadata: { i } }
        )
      )
    );

    const prisma = await getTestPrisma();
    const seqs = (
      await prisma.auditLog.findMany({ where: { userId }, orderBy: { seq: "asc" }, select: { seq: true } })
    ).map((e) => e.seq);
    expect(seqs).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(await verifyWorkspaceAuditChain(userId)).toEqual({ valid: true, checked: 10 });
  });

  it("refuse la suppression et la modification d'une entrée (déclencheur DB)", async () => {
    const prisma = await getTestPrisma();
    const entry = await prisma.auditLog.findFirstOrThrow({ where: { userId, seq: 3 } });

    await expect(prisma.auditLog.delete({ where: { id: entry.id } })).rejects.toThrow(/ajout seul/);
    await expect(
      prisma.auditLog.update({ where: { id: entry.id }, data: { metadata: "{}" } })
    ).rejects.toThrow(/ajout seul/);
    expect(await verifyWorkspaceAuditChain(userId)).toMatchObject({ valid: true });
  });

  it("détecte une altération faite en contournant le déclencheur", async () => {
    const prisma = await getTestPrisma();
    await prisma.$transaction([
      prisma.$executeRaw`SET LOCAL app.audit_maintenance = 'on'`,
      prisma.auditLog.updateMany({ where: { userId, seq: 5 }, data: { metadata: '{"i":42}' } }),
    ]);
    expect(await verifyWorkspaceAuditChain(userId)).toMatchObject({
      valid: false,
      brokenAtSeq: 5,
      reason: "hash",
    });
  });
});
