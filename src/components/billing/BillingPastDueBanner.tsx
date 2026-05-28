import Link from "next/link";
import { getAccountContext } from "@/lib/account-context";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950">
      <strong>Paiement en échec.</strong> Mettez à jour votre moyen de paiement pour créer de
      nouveaux devis et factures.{" "}
      <Link href="/dashboard/settings#abonnement" className="link-underline font-medium">
        Gérer mon abonnement
      </Link>
    </div>
  );
}
