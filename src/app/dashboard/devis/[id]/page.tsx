import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DevisActions } from "@/components/devis/DevisActions";

type PageProps = { params: Promise<{ id: string }> };

export default async function DevisDetailPage({ params }: PageProps) {
  const user = await getSession();
  if (!user) redirect("/connexion");

  const { id } = await params;
  const devis = await prisma.devis.findFirst({
    where: { id, userId: user.id, deletedAt: null },
    include: {
      client: true,
      lignes: { orderBy: { ordre: "asc" } },
    },
  });

  if (!devis) notFound();

  return (
    <div className="page-shell max-w-3xl">
      <Link href="/dashboard" className="link-primary text-sm">
        ← Retour
      </Link>
      <h1 className="page-title mt-4 text-2xl">Devis {devis.numero}</h1>
      <p className="text-muted-foreground">Client : {devis.client.nom}</p>
      <div className="mt-8">
        <DevisActions devis={JSON.parse(JSON.stringify(devis))} />
      </div>
    </div>
  );
}
