import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAccountContext } from "@/lib/account-context";
import { canStartTrial } from "@/lib/billing";
import { dashboardMetadata } from "@/lib/dashboard-metadata";
import { loadSettingsPayload } from "@/lib/settings-data";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { SubscriptionPanel } from "@/components/settings/SubscriptionPanel";
import { AccountSessionsPanel } from "@/components/settings/AccountSessionsPanel";
import { TeamPanel } from "@/components/settings/TeamPanel";

const SECTIONS = [
  { id: "abonnement", label: "Abonnement" },
  { id: "profil", label: "Profil" },
  { id: "entreprise", label: "Entreprise" },
  { id: "securite", label: "Sécurité" },
  { id: "equipe", label: "Équipe" },
] as const;

export const metadata = dashboardMetadata("Mon compte");

export default async function SettingsPage() {
  const user = await getSession();
  if (!user) redirect("/connexion");

  const account = await getAccountContext(user.id);
  const settingsData = await loadSettingsPayload(user.id, account);
  const trialEligible = await canStartTrial(account.workspaceUserId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="heading text-2xl">Mon compte</h1>
      <p className="text-body mt-1">
        Abonnement Stripe, profil, entreprise (PDF), sécurité et équipe Pro
      </p>

      <nav className="mt-6 flex flex-wrap gap-2 border-b border-[var(--border)] pb-4">
        {SECTIONS.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            className="ui-btn-outline py-1.5 text-xs sm:text-sm"
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="mt-8 space-y-8">
        <SubscriptionPanel
          plan={account.plan}
          hasStripeCustomer={settingsData.hasStripeCustomer}
          isTeamMember={account.isTeamMember}
          canStartTrial={trialEligible}
        />
        <SettingsForm initialData={settingsData} />
        <AccountSessionsPanel />
        <div id="equipe">
          <TeamPanel />
        </div>
      </div>
    </div>
  );
}
