import { Prisma } from "@/generated/prisma/client";
import { prisma } from "./db";

export function isPrismaUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

/** Retourne false si l'événement Stripe a déjà été traité (INSERT atomique, pas SELECT+INSERT). */
export async function claimStripeWebhookEvent(eventId: string, type: string): Promise<boolean> {
  try {
    await prisma.stripeWebhookEvent.create({
      data: { eventId, type },
    });
    return true;
  } catch (err) {
    if (isPrismaUniqueViolation(err)) return false;
    throw err;
  }
}
