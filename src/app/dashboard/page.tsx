import Link from "next/link";
import { redirect } from "next/navigation";
import { getAccountContext } from "@/lib/account-context";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatEuro } from "@/lib/format";
import { hasPro } from "@/lib/plan-features";
import { getDevisCountThisMonth } from "@/lib/plan-limits";
import { getDevisStatusEmoji, getDevisStatusLabel } from "@/lib/services/devis";
import { getFactureStatusLabel } from "@/lib/services/facture";

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect("/connexion");

  const account = await getAccountContext(user.id);
  const wsId = account.workspaceUserId;
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [devis, factures, devisThisMonth, accepted, pending, caMois] = await Promise.all([
    prisma.devis.findMany({
      where: { userId: wsId, deletedAt: null },
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.facture.findMany({
      where: { userId: wsId, deletedAt: null },
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    getDevisCountThisMonth(wsId),
    prisma.devis.count({ where: { userId: wsId, status: "ACCEPTE", deletedAt: null } }),
    prisma.devis.count({ where: { userId: wsId, status: "ENVOYE", deletedAt: null } }),
    prisma.facture.aggregate({
      where: {
        userId: wsId,
        status: { in: ["EMISE", "PAYEE"] },
        issuedAt: { gte: startOfMonth },
        deletedAt: null,
      },
      _sum: { totalTTC: true },
    }),
  ]);

  const sentTotal = await prisma.devis.count({
    where: { userId: wsId, status: { in: ["ENVOYE", "ACCEPTE", "REFUSE", "FACTURE"] }, deletedAt: null },
  });
  const acceptRate = sentTotal > 0 ? Math.round((accepted / sentTotal) * 100) : 0;
  const isPro = hasPro(account.plan);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
      {devis.length === 0 && (
        <div className="ui-card-padded mb-8 text-center">
          <p className="heading text-xl">Votre premier devis en 2 minutes</p>
          <p className="text-body mt-2 text-sm">Client → prestation → prix. C&apos;est tout.</p>
          <Link href="/dashboard/devis/nouveau" className="ui-btn-primary mt-6 inline-flex px-8 py-4 text-base">
            Commencer maintenant
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="heading-section text-2xl sm:text-3xl">Bonjour, {user.name}</h1>
          <p className="text-body mt-2 font-light">
            {account.plan === "FREE" ? `${devisThisMonth}/3 devis ce mois` : `Plan ${account.plan}`}
            {account.isTeamMember && " · Équipe Pro"}
          </p>
        </div>
        <Link href="/dashboard/devis/nouveau" className="ui-btn-primary hidden py-3 px-6 text-base sm:inline-flex">
          + Nouveau devis
        </Link>
      </div>

      {account.plan === "FREE" && devis.length > 0 && (
        <p className="ui-alert-error mt-6 text-sm">
          WhatsApp et factures : plan Starter.{" "}
          <Link href="/tarifs" className="link-underline font-medium">
            Voir les tarifs
          </Link>
        </p>
      )}

      {isPro && (
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/dashboard/stats" className="ui-btn-outline py-2 text-sm">
            Statistiques
          </Link>
          <Link href="/dashboard/audit" className="ui-btn-outline py-2 text-sm">
            Journal audit
          </Link>
          <Link href="/dashboard/support" className="ui-btn-outline py-2 text-sm">
            Support Pro
          </Link>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="ui-stat">
          <p className="text-subtle text-sm">CA du mois</p>
          <p className="heading mt-1 text-xl">{formatEuro(caMois._sum.totalTTC ?? 0)}</p>
        </div>
        <div className="ui-stat">
          <p className="text-subtle text-sm">En attente</p>
          <p className="heading mt-1 text-xl">{pending}</p>
        </div>
        <div className="ui-stat">
          <p className="text-subtle text-sm">Acceptés</p>
          <p className="heading mt-1 text-xl">{accepted}</p>
        </div>
        <div className="ui-stat">
          <p className="text-subtle text-sm">Taux acceptation</p>
          <p className="heading mt-1 text-xl">{acceptRate}%</p>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="heading-card">Devis récents</h2>
        {devis.length === 0 ? (
          <p className="text-subtle mt-4">Aucun devis — créez-en un en 2 minutes.</p>
        ) : (
          <ul className="ui-list mt-4">
            {devis.map((d) => (
              <li key={d.id}>
                <Link href={`/dashboard/devis/${d.id}`} className="ui-list-row">
                  <div>
                    <span className="heading font-medium">{d.numero}</span>
                    <span className="text-subtle ml-2 text-sm">{d.client.nom}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-body text-sm">
                      {getDevisStatusEmoji(d.status)} {getDevisStatusLabel(d.status)}
                    </span>
                    <p className="heading font-medium">{formatEuro(d.totalTTC)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="heading-card">Factures</h2>
        {factures.length === 0 ? (
          <p className="text-subtle mt-4">Les factures apparaissent après acceptation d&apos;un devis (plan Starter).</p>
        ) : (
          <ul className="ui-list mt-4">
            {factures.map((f) => (
              <li key={f.id}>
                <Link href={`/dashboard/factures/${f.id}`} className="ui-list-row">
                  <div>
                    <span className="heading font-medium">{f.numero}</span>
                    <span className="text-subtle ml-2 text-sm">{f.client.nom}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-body text-sm">{getFactureStatusLabel(f.status)}</span>
                    <p className="heading font-medium">{formatEuro(f.totalTTC)}</p>
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
