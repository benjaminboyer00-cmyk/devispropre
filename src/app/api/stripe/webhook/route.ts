import { NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import {
  claimStripeWebhookEvent,
  markStripeWebhookEventProcessed,
} from "@/lib/stripe-webhook-idempotency";
import { processStripeWebhookEvent } from "@/lib/stripe-webhook-handler";
import { env } from "@/lib/env";

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

  const claimed = await claimStripeWebhookEvent(event.id, event.type);
  if (!claimed) {
    return Response.json({ received: true, duplicate: true });
  }

  try {
    await processStripeWebhookEvent(event, stripe);
    await markStripeWebhookEventProcessed(event.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur webhook";
    if (message === "Référence client incohérente") {
      return Response.json({ error: message }, { status: 400 });
    }
    console.error("[stripe-webhook]", err);
    return Response.json({ error: "Échec traitement webhook" }, { status: 500 });
  }

  return Response.json({ received: true });
}
