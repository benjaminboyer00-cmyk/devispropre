import { NextRequest } from "next/server";
import type Stripe from "stripe";
import { ensureProTeam } from "@/lib/account-context";
import { getStripe } from "@/lib/stripe";
import {
  downgradeCustomerToFree,
  syncUserPlanFromSubscription,
} from "@/lib/stripe-subscription";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { Plan } from "@/generated/prisma/client";
import { planFromStripePrice } from "@/lib/stripe-subscription";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe || !env.stripeWebhookSecret) {
    return Response.json({ error: "Stripe non configuré" }, { status: 503 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) return Response.json({ error: "Signature manquante" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, env.stripeWebhookSecret);
  } catch {
    return Response.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id ?? session.metadata?.userId ?? null;

    if (
      userId &&
      session.client_reference_id &&
      session.metadata?.userId &&
      session.client_reference_id !== session.metadata.userId
    ) {
      return Response.json({ error: "Référence client incohérente" }, { status: 400 });
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
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    await downgradeCustomerToFree(
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id
    );
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    await syncUserPlanFromSubscription(subscription);
  }

  return Response.json({ received: true });
}
