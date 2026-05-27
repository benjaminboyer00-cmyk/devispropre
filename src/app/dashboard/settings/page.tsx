import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  const user = await getSession();
  if (!user) redirect("/connexion");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Paramètres</h1>
      <p className="mt-1 text-slate-600">Profil, entreprise et logo</p>
      <div className="mt-8">
        <SettingsForm />
      </div>
    </div>
  );
}
