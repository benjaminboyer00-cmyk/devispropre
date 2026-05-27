import { NextRequest } from "next/server";
import { assertMutationSecurity, requireAuth, apiError, handleServiceError } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  assertMutationSecurity(request);

  const { user, error } = await requireAuth();
  if (error) return error;

  const stripe = getStripe();
  if (!stripe) {
    return apiError("Paiement non configuré. Contactez le support.", 503);
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { stripeCustomerId: true },
    });

    if (!dbUser?.stripeCustomerId) {
      return apiError("Aucun abonnement Stripe associé à ce compte.", 400);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripeCustomerId,
      return_url: `${env.appUrl}/dashboard/settings#abonnement`,
    });

    if (!session.url) {
      return apiError("Impossible d'ouvrir le portail de facturation.", 500);
    }

    return Response.json({ url: session.url });
  } catch (e) {
    return handleServiceError(e);
  }
}
