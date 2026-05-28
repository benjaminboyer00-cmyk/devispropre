import type { AuditContext } from "../audit";
import { logAudit } from "../audit";
import { hashPassword } from "../auth";
import { generateShareToken } from "../crypto";
import { prisma } from "../db";
import { bumpUserSessionVersion } from "../user-session";

/**
 * Suppression de compte conforme L.123-22 : soft delete + anonymisation.
 * Les factures émises et attestations restent en base (conservation 10 ans).
 */
export async function softDeleteAccount(ctx: AuditContext): Promise<{ ok: true }> {
  const user = await prisma.user.findFirst({
    where: { id: ctx.userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      factures: {
        where: { status: { in: ["EMISE", "PAYEE"] }, deletedAt: null },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!user) throw new Error("Utilisateur introuvable");

  const anonymizedEmail = `deleted-${user.id}@anonymized.local`;
  const passwordHash = await hashPassword(generateShareToken());

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        deletedAt: new Date(),
        email: anonymizedEmail,
        name: "Compte supprimé",
        phone: null,
        passwordHash,
        stripeCustomerId: null,
        subscriptionPastDue: false,
      },
    });

    await tx.magicLinkToken.deleteMany({ where: { userId: user.id } });
  });

  await bumpUserSessionVersion(user.id);

  await logAudit(ctx, {
    action: "SOFT_DELETE",
    entityType: "user",
    entityId: user.id,
    metadata: {
      hadIssuedFactures: user.factures.length > 0,
    },
  });

  return { ok: true };
}
