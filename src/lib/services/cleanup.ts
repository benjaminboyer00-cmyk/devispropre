import { prisma } from "../db";

const IDEMPOTENCY_RETENTION_DAYS = 30;

/** Purge les clés d'idempotence expirées ou trop anciennes. */
export async function purgeExpiredIdempotencyRecords(): Promise<{ deleted: number }> {
  const cutoff = new Date(Date.now() - IDEMPOTENCY_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const result = await prisma.idempotencyRecord.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { createdAt: { lt: cutoff } }],
    },
  });
  return { deleted: result.count };
}
