import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DevisForm } from "@/components/devis/DevisForm";

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
    <div className="page-shell max-w-2xl">
      <h1 className="page-title text-2xl">Nouveau devis</h1>
      <p className="mt-1 text-muted-foreground">2 minutes chrono — depuis le chantier</p>
      <div className="card-padded mt-8">
        <DevisForm clients={clients} tvaApplicable={company?.tvaApplicable ?? true} />
      </div>
    </div>
  );
}
