import { prisma } from "./db";

export class BillingPastDueError extends Error {
  constructor(
    message = "Paiement en échec — mettez à jour votre moyen de paiement pour créer de nouveaux documents."
  ) {
    super(message);
    this.name = "BillingPastDueError";
  }
}

export async function assertBillingNotPastDue(userId: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { subscriptionPastDue: true },
  });
  if (user?.subscriptionPastDue) {
    throw new BillingPastDueError();
  }
}

export async function markCustomerPastDue(stripeCustomerId: string): Promise<void> {
  await prisma.user.updateMany({
    where: { stripeCustomerId },
    data: { subscriptionPastDue: true },
  });
}

export async function clearCustomerPastDue(stripeCustomerId: string): Promise<void> {
  await prisma.user.updateMany({
    where: { stripeCustomerId },
    data: { subscriptionPastDue: false },
  });
}
