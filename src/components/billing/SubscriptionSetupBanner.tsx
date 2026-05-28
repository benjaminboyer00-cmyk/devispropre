import Link from "next/link";
import { getAccountContext } from "@/lib/account-context";
import { getSession } from "@/lib/auth";
import { billingUserId, userNeedsSubscriptionSetup } from "@/lib/billing";
import { TRIAL_PERIOD_DAYS } from "@/lib/billing-constants";
import { ROUTES } from "@/lib/routes";

/** Bandeau discret — essai non activé (carte Stripe requise). */
export async function SubscriptionSetupBanner() {
  const user = await getSession();
  if (!user) return null;

  const account = await getAccountContext(user.id);
  const billTo = billingUserId(user.id, account.workspaceUserId, account.isTeamMember);
  const needsSetup = await userNeedsSubscriptionSetup(billTo);
  if (!needsSetup || account.isTeamMember) return null;

  return (
    <div className="border-b border-[var(--border)] bg-[var(--accent-soft)] px-4 py-3">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <p className="text-body text-sm">
          <strong className="text-[var(--text-heading)]">Essai Starter {TRIAL_PERIOD_DAYS} jours</strong>
          {" — "}
          activez votre compte pour envoyer vos devis, générer les PDF et accéder aux factures.
        </p>
        <Link href={ROUTES.dashboardActiver} className="ui-btn-primary shrink-0 px-4 py-2 text-sm">
          Activer mon essai →
        </Link>
      </div>
    </div>
  );
}
