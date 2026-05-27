import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  const user = await getSession();
  if (!user) redirect("/connexion");

  return (
    <div className="page-shell max-w-2xl">
      <h1 className="page-title text-2xl">Paramètres</h1>
      <p className="mt-1 text-muted-foreground">Profil, entreprise et logo</p>
      <div className="mt-8">
        <SettingsForm />
      </div>
    </div>
  );
}
