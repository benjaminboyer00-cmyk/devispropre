import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Suspense } from "react";
import { DevisStatusBanner } from "@/components/devis/DevisStatusBanner";
import { getAccountContext } from "@/lib/account-context";
import { getSession } from "@/lib/auth";
import { billingUserId, userNeedsSubscriptionSetup } from "@/lib/billing";
import { dashboardMetadata } from "@/lib/dashboard-metadata";
import { prisma } from "@/lib/db";
import { DevisActions } from "@/components/devis/DevisActions";
import { DevisDocumentPreview } from "@/components/devis/DevisDocumentPreview";
import { ROUTES } from "@/lib/routes";

export const metadata = dashboardMetadata("Devis");

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

  const needsActivation = await userNeedsSubscriptionSetup(
    billingUserId(user.id, account.workspaceUserId, account.isTeamMember)
  );

  const company = await prisma.company.findUnique({
    where: { userId: account.workspaceUserId },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href={ROUTES.dashboardDevisList} className="link-blue text-sm">
        ← Devis
      </Link>
      <Suspense fallback={null}>
        <DevisStatusBanner />
      </Suspense>
      <h1 className="heading mt-4 text-2xl">Devis {devis.numero}</h1>
      <p className="text-body">Client : {devis.client.nom}</p>
      {devis.validUntil && (
        <p className="text-subtle mt-1 text-sm">
          Valable jusqu&apos;au{" "}
          {devis.validUntil.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      )}
      {devis.notes && (
        <p className="text-body mt-3 rounded-lg bg-[var(--surface-muted)] px-4 py-3 text-sm">{devis.notes}</p>
      )}
      <div className="mt-8">
        <DevisActions
          devis={JSON.parse(JSON.stringify(devis))}
          plan={account.plan}
          subscriptionActive={!needsActivation}
        />
      </div>

      <DevisDocumentPreview devis={devis} company={company} />
    </div>
  );
}
