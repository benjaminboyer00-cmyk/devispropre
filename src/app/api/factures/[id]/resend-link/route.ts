import { NextRequest } from "next/server";
import { logAudit } from "@/lib/audit";
import {
  assertMutationSecurity,
  buildServiceContext,
  handleServiceError,
  requireAuth,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { sendFactureLinkEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { checkRateLimit, factureResendLinkKey } from "@/lib/rate-limit";
import { ROUTES } from "@/lib/routes";
import { resolveShareTokenRaw } from "@/lib/share-token-storage";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  assertMutationSecurity(request);

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    await checkRateLimit(factureResendLinkKey(auth.workspaceUserId), {
      maxAttempts: 20,
      windowMs: 60 * 60 * 1000,
    });

    const facture = await prisma.facture.findFirst({
      where: { id, userId: auth.workspaceUserId, deletedAt: null },
      include: { client: true },
    });

    if (!facture) {
      return Response.json({ error: "Facture introuvable" }, { status: 404 });
    }

    if (facture.status !== "EMISE" && facture.status !== "PAYEE") {
      return Response.json(
        { error: "Seule une facture émise ou payée peut être renvoyée au client." },
        { status: 400 }
      );
    }

    const clientEmail = facture.client.email?.trim();
    if (!clientEmail) {
      return Response.json(
        { error: "Le client n'a pas d'adresse email — ajoutez-la dans la fiche client." },
        { status: 400 }
      );
    }

    const shareTokenRaw = resolveShareTokenRaw(facture);
    if (!shareTokenRaw) {
      return Response.json({ error: "Lien de partage indisponible." }, { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: { userId: auth.workspaceUserId },
      select: { raisonSociale: true },
    });
    const companyName = company?.raisonSociale?.trim() || "Votre artisan";
    const shareUrl = `${env.appUrl}${ROUTES.publicFacture(shareTokenRaw)}`;

    const emailResult = await sendFactureLinkEmail({
      to: clientEmail,
      clientNom: facture.client.nom,
      companyName,
      factureNumero: facture.numero,
      shareUrl,
      resend: true,
    });

    if (!emailResult.sent) {
      return Response.json(
        { error: emailResult.reason ?? "Envoi email impossible" },
        { status: 502 }
      );
    }

    const ctx = buildServiceContext(auth.workspaceUserId, auth.user.id, request);
    await logAudit(ctx, {
      action: "SEND",
      entityType: "facture",
      entityId: id,
      factureId: id,
      contentHash: facture.contentHash,
      metadata: { resend: true, to: clientEmail },
    });

    return Response.json({ sent: true });
  } catch (e) {
    return handleServiceError(e);
  }
}
