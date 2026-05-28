import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dashboardMetadata } from "@/lib/dashboard-metadata";
import { prisma } from "@/lib/db";
import { DevisForm } from "@/components/devis/DevisForm";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = dashboardMetadata("Nouveau devis");

export default async function NouveauDevisPage() {
  const user = await getSession();
  if (!user) redirect("/connexion");

  const clients = await prisma.client.findMany({
    where: { userId: user.id, deletedAt: null },
    select: { id: true, nom: true },
    orderBy: { nom: "asc" },
  });

  const company = await prisma.company.findUnique({
    where: { userId: user.id },
    select: { tvaApplicable: true },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="heading text-2xl">Nouveau devis</h1>
      <p className="text-body mt-1">2 minutes chrono — depuis le chantier</p>
      {clients.length === 0 && (
        <EmptyState
          title="Aucun client enregistré"
          description="Pas de problème : saisissez le nom du client dans le formulaire ci-dessous. Il sera créé automatiquement avec votre devis."
        />
      )}
      <div className="ui-card-padded mt-8">
        <DevisForm clients={clients} tvaApplicable={company?.tvaApplicable ?? true} />
      </div>
    </div>
  );
}
