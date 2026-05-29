import { redirect, notFound } from "next/navigation";
import { getAccountContext } from "@/lib/account-context";
import { getSession } from "@/lib/auth";
import { dashboardMetadata } from "@/lib/dashboard-metadata";
import { prisma } from "@/lib/db";
import { resolveShareTokenRaw } from "@/lib/share-token-storage";
import { FacturePageWrapper } from "@/components/facture/FactureActions";

export const metadata = dashboardMetadata("Facture");

type PageProps = { params: Promise<{ id: string }> };

export default async function FactureDetailPage({ params }: PageProps) {
  const user = await getSession();
  if (!user) redirect("/connexion");

  const account = await getAccountContext(user.id);
  const { id } = await params;
  const facture = await prisma.facture.findFirst({
    where: { id, userId: account.workspaceUserId, deletedAt: null },
    include: {
      client: true,
      lignes: { orderBy: { ordre: "asc" } },
      attestation: true,
    },
  });

  if (!facture) notFound();

  const shareToken = resolveShareTokenRaw(facture);

  return (
    <FacturePageWrapper
      facture={{ ...JSON.parse(JSON.stringify(facture)), shareToken }}
      plan={account.plan}
    />
  );
}
