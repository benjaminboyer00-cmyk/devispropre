import { getAccountContext } from "@/lib/account-context";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StripePortalButton } from "@/components/billing/StripePortalButton";

/** Bannière non dismissible — CTA direct vers le portail Stripe. */
export async function BillingPastDueBanner() {
  const session = await getSession();
  if (!session) return null;

  const account = await getAccountContext(session.id);
  const billing = await prisma.user.findFirst({
    where: { id: account.workspaceUserId, deletedAt: null },
    select: { subscriptionPastDue: true },
  });

  if (!billing?.subscriptionPastDue) return null;

  return (
    <div
      role="alert"
      className="border-b-2 border-amber-400 bg-amber-50 px-4 py-4 text-center text-sm text-amber-950"
    >
      <p className="font-semibold">Paiement en échec — action requise</p>
      <p className="mt-1">
        Mettez à jour votre moyen de paiement pour créer de nouveaux devis et factures. La
        consultation de vos documents reste accessible.
      </p>
      <StripePortalButton />
    </div>
  );
}
