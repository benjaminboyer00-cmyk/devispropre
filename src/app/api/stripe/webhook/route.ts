import { NextRequest } from "next/server";
import type Stripe from "stripe";
import { ensureProTeam } from "@/lib/account-context";
import { getStripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { Plan } from "@/generated/prisma/client";

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
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan as Plan | undefined;

    if (userId && plan && (plan === Plan.STARTER || plan === Plan.PRO)) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan,
          ...(typeof session.customer === "string" && { stripeCustomerId: session.customer }),
        },
      });
      if (plan === Plan.PRO) {
        await ensureProTeam(userId);
      }
    }
  }

  return Response.json({ received: true });
}
