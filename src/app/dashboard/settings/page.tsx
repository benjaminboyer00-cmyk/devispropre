import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { TeamPanel } from "@/components/settings/TeamPanel";

export default async function SettingsPage() {
  const user = await getSession();
  if (!user) redirect("/connexion");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="heading text-2xl">Paramètres</h1>
      <p className="text-body mt-1">Profil, entreprise et logo</p>
      <div className="mt-8 space-y-8">
        <SettingsForm />
        <TeamPanel />
      </div>
    </div>
  );
}
