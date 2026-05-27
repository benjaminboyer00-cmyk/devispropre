import { NextRequest } from "next/server";
import {
  assertMutationSecurity,
  buildServiceContext,
  handleServiceError,
  requireAuth,
} from "@/lib/api-helpers";
import { cancelFacture, issueFacture, markFacturePaid } from "@/lib/services/facture";
import { prisma } from "@/lib/db";
import {
  checkRateLimit,
  factureCancelKey,
  factureIssueKey,
  facturePayKey,
} from "@/lib/rate-limit";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { id } = await params;
  const facture = await prisma.facture.findFirst({
    where: { id, userId: auth.workspaceUserId, deletedAt: null },
    include: {
      client: true,
      lignes: { orderBy: { ordre: "asc" } },
      attestation: true,
    },
  });

  if (!facture) return Response.json({ error: "Facture introuvable" }, { status: 404 });
  return Response.json(facture);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  assertMutationSecurity(request);

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { id } = await params;
  const ctx = buildServiceContext(auth.workspaceUserId, auth.user.id, request);
  const body = await request.json().catch(() => ({}));

  try {
    if (body.action === "pay") {
      await checkRateLimit(facturePayKey(auth.workspaceUserId), {
        maxAttempts: 30,
        windowMs: 60 * 60 * 1000,
      });
      const facture = await markFacturePaid(ctx, id);
      return Response.json(facture);
    }
    if (body.action === "cancel") {
      await checkRateLimit(factureCancelKey(auth.workspaceUserId), {
        maxAttempts: 10,
        windowMs: 60 * 60 * 1000,
      });
      const facture = await cancelFacture(ctx, id);
      return Response.json(facture);
    }

    await checkRateLimit(factureIssueKey(auth.workspaceUserId), {
      maxAttempts: 10,
      windowMs: 60 * 60 * 1000,
    });
    const facture = await issueFacture(ctx, id);
    return Response.json(facture);
  } catch (e) {
    return handleServiceError(e);
  }
}
