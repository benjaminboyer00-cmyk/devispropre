import type Stripe from "stripe";
import { Plan } from "@/generated/prisma/client";
import { ensureProTeam } from "./account-context";
import {
  clearCustomerPastDue,
  markCustomerPastDue,
} from "./billing-status";
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

function customerIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const customer = invoice.customer;
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

export async function downgradeCustomerToFree(customerId: string): Promise<void> {
  const users = await prisma.user.findMany({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });

  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: { plan: Plan.FREE, subscriptionPastDue: false },
  });

  for (const u of users) {
    await suspendProTeamMembers(u.id);
  }
}

/** Désactive les membres d'équipe quand le plan Pro n'est plus actif. */
async function suspendProTeamMembers(ownerId: string): Promise<void> {
  const team = await prisma.team.findUnique({ where: { ownerId } });
  if (!team) return;

  await prisma.teamMember.deleteMany({
    where: { teamId: team.id, userId: { not: null } },
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

  if (subscription.status === "past_due") {
    await markCustomerPastDue(customerId);
    return;
  }

  if (subscription.status !== "active" && subscription.status !== "trialing") {
    return;
  }

  await clearCustomerPastDue(customerId);

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
  } else {
    const users = await prisma.user.findMany({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });
    for (const u of users) {
      await suspendProTeamMembers(u.id);
    }
  }
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId = customerIdFromInvoice(invoice);
  if (customerId) await markCustomerPastDue(customerId);
}

export async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const customerId = customerIdFromInvoice(invoice);
  if (customerId) await clearCustomerPastDue(customerId);
}
