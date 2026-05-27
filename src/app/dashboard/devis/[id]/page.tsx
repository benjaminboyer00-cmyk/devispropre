import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getAccountContext } from "@/lib/account-context";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DevisActions } from "@/components/devis/DevisActions";
import { ROUTES } from "@/lib/routes";

type PageProps = { params: Promise<{ id: string }> };

export default async function DevisDetailPage({ params }: PageProps) {
  const user = await getSession();
  if (!user) redirect("/connexion");

  const account = await getAccountContext(user.id);
  const { id } = await params;
  const devis = await prisma.devis.findFirst({
    where: { id, userId: account.workspaceUserId, deletedAt: null },
    include: {
      client: true,
      lignes: { orderBy: { ordre: "asc" } },
    },
  });

  if (!devis) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href={ROUTES.dashboardDevisList} className="link-blue text-sm">
        ← Devis
      </Link>
      <h1 className="heading mt-4 text-2xl">Devis {devis.numero}</h1>
      <p className="text-body">Client : {devis.client.nom}</p>
      <div className="mt-8">
        <DevisActions devis={JSON.parse(JSON.stringify(devis))} plan={account.plan} />
      </div>
    </div>
  );
}
