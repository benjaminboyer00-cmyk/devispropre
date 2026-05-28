import type Stripe from "stripe";
import { ensureProTeam } from "./account-context";
import { prisma } from "./db";
import { Plan } from "@/generated/prisma/client";
import {
  downgradeCustomerToFree,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  planFromStripePrice,
  syncUserPlanFromSubscription,
} from "./stripe-subscription";

/** Traite un événement Stripe déjà vérifié (signature OK) et dédupliqué. */
export async function processStripeWebhookEvent(
  event: Stripe.Event,
  stripe: Stripe
): Promise<void> {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id ?? session.metadata?.userId ?? null;

    if (
      userId &&
      session.client_reference_id &&
      session.metadata?.userId &&
      session.client_reference_id !== session.metadata.userId
    ) {
      throw new Error("Référence client incohérente");
    }

    if (userId && typeof session.customer === "string") {
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: session.customer },
      });
    }

    if (session.subscription && typeof session.subscription === "string") {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      await syncUserPlanFromSubscription(subscription);
      const priceId = subscription.items.data[0]?.price?.id;
      const customerId = typeof session.customer === "string" ? session.customer : null;
      if (userId && priceId && customerId) {
        const plan = planFromStripePrice(priceId);
        if (plan === Plan.PRO) {
          await ensureProTeam(userId);
        }
      }
    }
    return;
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    await downgradeCustomerToFree(
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id
    );
    return;
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    await syncUserPlanFromSubscription(subscription);
    return;
  }

  if (event.type === "invoice.payment_failed") {
    await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
    return;
  }

  if (event.type === "invoice.paid") {
    await handleInvoicePaid(event.data.object as Stripe.Invoice);
  }
}
