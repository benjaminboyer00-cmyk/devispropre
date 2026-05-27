import type Stripe from "stripe";
import { Plan } from "@/generated/prisma/client";
import { ensureProTeam } from "./account-context";
import { prisma } from "./db";
import { env } from "./env";

export function planFromStripePrice(priceId: string): Plan | null {
  if (priceId === env.stripePricePro) return Plan.PRO;
  if (priceId === env.stripePriceStarter) return Plan.STARTER;
  return null;
}

export function shouldDowngradeToFree(status: Stripe.Subscription.Status): boolean {
  return status === "canceled" || status === "unpaid" || status === "incomplete_expired";
}

function customerIdFromSubscription(subscription: Stripe.Subscription): string {
  return typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;
}

export async function downgradeCustomerToFree(customerId: string): Promise<void> {
  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: { plan: Plan.FREE },
  });
}

export async function syncUserPlanFromSubscription(
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId = customerIdFromSubscription(subscription);

  if (shouldDowngradeToFree(subscription.status)) {
    await downgradeCustomerToFree(customerId);
    return;
  }

  if (subscription.status !== "active" && subscription.status !== "trialing") {
    return;
  }

  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) return;

  const plan = planFromStripePrice(priceId);
  if (!plan) return;

  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: { plan },
  });

  if (plan === Plan.PRO) {
    const users = await prisma.user.findMany({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });
    for (const u of users) {
      await ensureProTeam(u.id);
    }
  }
}
