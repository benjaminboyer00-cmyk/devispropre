import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatEuro } from "@/lib/format";
import { getDevisCountThisMonth } from "@/lib/plan-limits";
import { getDevisStatusEmoji, getDevisStatusLabel } from "@/lib/services/devis";
import { getFactureStatusLabel } from "@/lib/services/facture";

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect("/connexion");

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [devis, factures, devisThisMonth, accepted, pending, caMois] = await Promise.all([
    prisma.devis.findMany({
      where: { userId: user.id, deletedAt: null },
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.facture.findMany({
      where: { userId: user.id, deletedAt: null },
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    getDevisCountThisMonth(user.id),
    prisma.devis.count({ where: { userId: user.id, status: "ACCEPTE", deletedAt: null } }),
    prisma.devis.count({ where: { userId: user.id, status: "ENVOYE", deletedAt: null } }),
    prisma.facture.aggregate({
      where: {
        userId: user.id,
        status: { in: ["EMISE", "PAYEE"] },
        issuedAt: { gte: startOfMonth },
        deletedAt: null,
      },
      _sum: { totalTTC: true },
    }),
  ]);

  const sentTotal = await prisma.devis.count({
    where: { userId: user.id, status: { in: ["ENVOYE", "ACCEPTE", "REFUSE", "FACTURE"] }, deletedAt: null },
  });
  const acceptRate = sentTotal > 0 ? Math.round((accepted / sentTotal) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Bonjour, {user.name}</h1>
          <p className="text-slate-600">
            Plan {user.plan}
            {user.plan === "FREE" && ` · ${devisThisMonth}/3 devis ce mois`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/settings" className="rounded-lg border px-4 py-2.5 text-sm">
            Paramètres
          </Link>
          <Link href="/dashboard/devis/nouveau" className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700">
            + Nouveau devis
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-slate-500">CA du mois</p>
          <p className="text-xl font-bold">{formatEuro(caMois._sum.totalTTC ?? 0)}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-slate-500">En attente</p>
          <p className="text-xl font-bold">{pending}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-slate-500">Acceptés</p>
          <p className="text-xl font-bold">{accepted}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-slate-500">Taux acceptation</p>
          <p className="text-xl font-bold">{acceptRate}%</p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Devis récents</h2>
        {devis.length === 0 ? (
          <p className="mt-4 text-slate-500">Aucun devis — créez-en un en 2 minutes.</p>
        ) : (
          <ul className="mt-4 divide-y rounded-lg border border-slate-200 bg-white">
            {devis.map((d) => (
              <li key={d.id}>
                <Link href={`/dashboard/devis/${d.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
                  <div>
                    <span className="font-medium">{d.numero}</span>
                    <span className="ml-2 text-sm text-slate-500">{d.client.nom}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm">{getDevisStatusEmoji(d.status)} {getDevisStatusLabel(d.status)}</span>
                    <p className="font-medium">{formatEuro(d.totalTTC)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Factures</h2>
        {factures.length === 0 ? (
          <p className="mt-4 text-slate-500">Les factures apparaissent après acceptation d&apos;un devis.</p>
        ) : (
          <ul className="mt-4 divide-y rounded-lg border border-slate-200 bg-white">
            {factures.map((f) => (
              <li key={f.id}>
                <Link href={`/dashboard/factures/${f.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
                  <div>
                    <span className="font-medium">{f.numero}</span>
                    <span className="ml-2 text-sm text-slate-500">{f.client.nom}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm">{getFactureStatusLabel(f.status)}</span>
                    <p className="font-medium">{formatEuro(f.totalTTC)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
