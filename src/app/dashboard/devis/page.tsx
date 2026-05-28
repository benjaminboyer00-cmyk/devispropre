import Link from "next/link";
import { redirect } from "next/navigation";
import { ListPagination } from "@/components/ui/ListPagination";
import { getAccountContext } from "@/lib/account-context";
import { getSession } from "@/lib/auth";
import { dashboardMetadata } from "@/lib/dashboard-metadata";
import { prisma } from "@/lib/db";
import { devisListSelect } from "@/lib/prisma-selects";
import { formatEuro } from "@/lib/format";
import { paginationBounds, parsePageParam, totalPages } from "@/lib/pagination";
import { getDevisCountThisMonth } from "@/lib/plan-limits";
import { getDevisStatusEmoji, getDevisStatusLabel } from "@/lib/services/devis";
import { ROUTES } from "@/lib/routes";

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export const metadata = dashboardMetadata("Devis");

export default async function DevisListPage({ searchParams }: PageProps) {
  const user = await getSession();
  if (!user) redirect("/connexion");

  const account = await getAccountContext(user.id);
  const wsId = account.workspaceUserId;
  const { page: pageRaw } = await searchParams;
  const page = parsePageParam(pageRaw);
  const { skip, take } = paginationBounds(page);
  const where = { userId: wsId, deletedAt: null };

  const [devis, total, devisThisMonth] = await Promise.all([
    prisma.devis.findMany({
      where,
      select: devisListSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.devis.count({ where }),
    getDevisCountThisMonth(wsId),
  ]);

  const pages = totalPages(total);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="heading-section text-2xl sm:text-3xl">Devis</h1>
          <p className="text-body mt-2 font-light">
            {account.plan === "FREE"
              ? `${devisThisMonth}/3 devis ce mois`
              : `Plan ${account.plan} — devis illimités`}
            {total > 0 && ` · ${total} au total`}
          </p>
        </div>
        <Link href={ROUTES.dashboardDevisNew} className="ui-btn-primary py-3 px-6">
          + Nouveau devis
        </Link>
      </div>

      {devis.length === 0 ? (
        <div className="ui-card-padded mt-10 text-center">
          <p className="heading text-lg">Aucun devis pour le moment</p>
          <p className="text-body mt-2 text-sm">Client → prestation → prix. C&apos;est tout.</p>
          <Link href={ROUTES.dashboardDevisNew} className="ui-btn-primary mt-6 inline-flex px-8 py-3">
            Créer mon premier devis
          </Link>
        </div>
      ) : (
        <ul className="ui-list mt-8">
          {devis.map((d) => (
            <li key={d.id}>
              <Link href={ROUTES.dashboardDevis(d.id)} className="ui-list-row">
                <div>
                  <span className="heading font-medium">{d.numero}</span>
                  <span className="text-subtle ml-2 text-sm">{d.client.nom}</span>
                  {d.lockedAt && (
                    <span className="text-subtle ml-2 text-xs">· verrouillé</span>
                  )}
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

      <ListPagination
        page={page}
        totalPages={pages}
        basePath={ROUTES.dashboardDevisList}
        label="devis"
      />
    </div>
  );
}
