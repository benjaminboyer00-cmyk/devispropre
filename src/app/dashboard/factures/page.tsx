import Link from "next/link";
import { redirect } from "next/navigation";
import { getAccountContext } from "@/lib/account-context";
import { getSession } from "@/lib/auth";
import { dashboardMetadata } from "@/lib/dashboard-metadata";
import { prisma } from "@/lib/db";
import { formatEuro } from "@/lib/format";
import { hasStarter } from "@/lib/plan-features";
import { getFactureStatusLabel } from "@/lib/services/facture";
import { isFactureLocked } from "@/lib/immutability";
import { ROUTES } from "@/lib/routes";
import type { FactureStatus } from "@/generated/prisma/client";

type PageProps = {
  searchParams: Promise<{ vue?: string }>;
};

const VIEWS = {
  all: { label: "Toutes", filter: null },
  brouillons: { label: "Brouillons", filter: ["BROUILLON"] as FactureStatus[] },
  definitives: {
    label: "Définitives",
    filter: ["EMISE", "PAYEE"] as FactureStatus[],
  },
} as const;

type ViewKey = keyof typeof VIEWS;

function resolveView(vue?: string): ViewKey {
  if (vue === "brouillons" || vue === "definitives") return vue;
  return "all";
}

export const metadata = dashboardMetadata("Factures");

export default async function FacturesListPage({ searchParams }: PageProps) {
  const user = await getSession();
  if (!user) redirect("/connexion");

  const account = await getAccountContext(user.id);
  const wsId = account.workspaceUserId;
  const starterPlus = hasStarter(account.plan);
  const { vue } = await searchParams;
  const activeView = resolveView(vue);

  const factures = await prisma.facture.findMany({
    where: {
      userId: wsId,
      deletedAt: null,
      ...(VIEWS[activeView].filter ? { status: { in: VIEWS[activeView].filter } } : {}),
    },
    include: { client: true, attestation: { select: { numero: true } } },
    orderBy: [{ issuedAt: "desc" }, { createdAt: "desc" }],
  });

  const definitiveCount = await prisma.facture.count({
    where: {
      userId: wsId,
      deletedAt: null,
      status: { in: ["EMISE", "PAYEE"] },
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
      <div>
        <h1 className="heading-section text-2xl sm:text-3xl">Factures</h1>
        <p className="text-body mt-2 font-light">
          Facturation conforme loi anti-fraude TVA 2018 — documents définitifs inaltérables.
        </p>
      </div>

      {!starterPlus && (
        <p className="ui-alert-error mt-6 text-sm">
          La facturation nécessite le plan Starter.{" "}
          <Link href="/tarifs" className="link-underline font-medium">
            Voir les tarifs
          </Link>
        </p>
      )}

      <div className="ui-card-padded mt-8 border-l-4 border-l-green-600">
        <h2 className="heading text-base font-semibold">Archives légales ({definitiveCount})</h2>
        <p className="text-body mt-2 text-sm">
          Une facture <strong>émise</strong> ou <strong>payée</strong> est verrouillée définitivement :
          montants, lignes et mentions ne peuvent plus être modifiés ni supprimés (art. 286 I-3 bis CGI).
          Chaque document possède une empreinte SHA-256 vérifiable à tout moment.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {(Object.keys(VIEWS) as ViewKey[]).map((key) => (
          <Link
            key={key}
            href={key === "all" ? ROUTES.dashboardFactures : `${ROUTES.dashboardFactures}?vue=${key}`}
            className={
              activeView === key
                ? "rounded-lg bg-[var(--blue-soft)] px-4 py-2 text-sm font-medium text-[var(--blue)]"
                : "ui-btn-outline py-2 text-sm"
            }
          >
            {VIEWS[key].label}
          </Link>
        ))}
      </div>

      {factures.length === 0 ? (
        <div className="ui-card-padded mt-8 text-center">
          <p className="heading text-lg">
            {activeView === "definitives"
              ? "Aucune facture définitive"
              : activeView === "brouillons"
                ? "Aucun brouillon"
                : "Aucune facture"}
          </p>
          <p className="text-body mt-2 text-sm">
            Les factures sont créées depuis un devis accepté, puis émises pour devenir définitives.
          </p>
          <Link href={ROUTES.dashboardDevisList} className="ui-btn-outline mt-6 inline-flex px-6 py-3">
            Voir mes devis
          </Link>
        </div>
      ) : (
        <ul className="ui-list mt-6">
          {factures.map((f) => {
            const locked = isFactureLocked(f.status, f.lockedAt);
            return (
              <li key={f.id}>
                <Link href={ROUTES.dashboardFacture(f.id)} className="ui-list-row">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="heading font-medium">{f.numero}</span>
                      {locked && (
                        <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-800">
                          🔒 Définitive
                        </span>
                      )}
                    </div>
                    <span className="text-subtle text-sm">{f.client.nom}</span>
                    {f.contentHash && (
                      <p className="mt-1 truncate font-mono text-xs text-slate-400">
                        SHA-256 : {f.contentHash.slice(0, 20)}…
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-body text-sm">{getFactureStatusLabel(f.status)}</span>
                    <p className="heading font-medium">{formatEuro(f.totalTTC)}</p>
                    {f.attestation && (
                      <p className="text-subtle text-xs">Attestation {f.attestation.numero}</p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
