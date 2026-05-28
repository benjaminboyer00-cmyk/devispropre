import { Prisma } from "@/generated/prisma/client";
import { prisma } from "./db";

export function isPrismaUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

/**
 * Réserve un événement Stripe (verrou advisory transactionnel anti double-traitement).
 * - true : traiter maintenant (nouveau ou échec précédent sans processedAt)
 * - false : déjà traité avec succès (processedAt renseigné)
 */
export async function claimStripeWebhookEvent(eventId: string, type: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`stripe:webhook:${eventId}`}))`;

    const existing = await tx.stripeWebhookEvent.findUnique({
      where: { eventId },
      select: { processedAt: true },
    });

    if (existing?.processedAt) return false;
    if (existing) return true;

    await tx.stripeWebhookEvent.create({ data: { eventId, type } });
    return true;
  });
}

export async function markStripeWebhookEventProcessed(eventId: string): Promise<void> {
  await prisma.stripeWebhookEvent.update({
    where: { eventId },
    data: { processedAt: new Date() },
  });
}
