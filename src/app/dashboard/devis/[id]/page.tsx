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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
        ← Retour
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Devis {devis.numero}</h1>
      <p className="text-slate-600">Client : {devis.client.nom}</p>
      <div className="mt-8">
        <DevisActions devis={JSON.parse(JSON.stringify(devis))} />
      </div>
    </div>
  );
}
