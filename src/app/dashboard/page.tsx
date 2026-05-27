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
    <div className="page-shell">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title text-2xl sm:text-3xl">Bonjour, {user.name}</h1>
          <p className="mt-1 text-muted-foreground">
            Plan {user.plan}
            {user.plan === "FREE" && ` · ${devisThisMonth}/3 devis ce mois`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/settings" className="btn-secondary">
            Paramètres
          </Link>
          <Link href="/dashboard/devis/nouveau" className="btn-primary">
            + Nouveau devis
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">CA du mois</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{formatEuro(caMois._sum.totalTTC ?? 0)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">En attente</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{pending}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Acceptés</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{accepted}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Taux acceptation</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{acceptRate}%</p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="section-title text-lg">Devis récents</h2>
        {devis.length === 0 ? (
          <p className="mt-4 text-muted-foreground">Aucun devis — créez-en un en 2 minutes.</p>
        ) : (
          <ul className="list-panel mt-4">
            {devis.map((d) => (
              <li key={d.id}>
                <Link href={`/dashboard/devis/${d.id}`} className="list-row">
                  <div>
                    <span className="font-medium text-foreground">{d.numero}</span>
                    <span className="ml-2 text-sm text-muted-foreground">{d.client.nom}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground">
                      {getDevisStatusEmoji(d.status)} {getDevisStatusLabel(d.status)}
                    </span>
                    <p className="font-semibold text-foreground">{formatEuro(d.totalTTC)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="section-title text-lg">Factures</h2>
        {factures.length === 0 ? (
          <p className="mt-4 text-muted-foreground">Les factures apparaissent après acceptation d&apos;un devis.</p>
        ) : (
          <ul className="list-panel mt-4">
            {factures.map((f) => (
              <li key={f.id}>
                <Link href={`/dashboard/factures/${f.id}`} className="list-row">
                  <div>
                    <span className="font-medium text-foreground">{f.numero}</span>
                    <span className="ml-2 text-sm text-muted-foreground">{f.client.nom}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground">{getFactureStatusLabel(f.status)}</span>
                    <p className="font-semibold text-foreground">{formatEuro(f.totalTTC)}</p>
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
