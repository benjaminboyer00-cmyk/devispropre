import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, assertMutationSecurity, getRequestMeta, handleServiceError } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { verifyDocumentIntegrity, buildDevisPayload } from "@/lib/document-hash";
import { checkRateLimit } from "@/lib/rate-limit";
import { transitionDevisStatusFromPublic } from "@/lib/services/devis";
import { publicJsonResponse } from "@/lib/public-api-response";

const statusSchema = z.object({
  status: z.enum(["ACCEPTE", "REFUSE"]),
});

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { token } = await params;

  const devis = await prisma.devis.findFirst({
    where: { shareToken: token, deletedAt: null },
    include: {
      lignes: { orderBy: { ordre: "asc" } },
      client: true,
      user: { include: { company: true } },
    },
  });

  if (!devis || devis.status === "BROUILLON") {
    return publicJsonResponse({ error: "Devis introuvable" }, { status: 404 });
  }

  const company = devis.user.company;
  const payload = buildDevisPayload(devis, company);
  const integrityOk = devis.contentHash
    ? verifyDocumentIntegrity(devis.contentHash, payload)
    : false;

  return publicJsonResponse({
    numero: devis.numero,
    status: devis.status,
    totalTTC: devis.totalTTC,
    client: { nom: devis.client.nom },
    company: company ? { raisonSociale: company.raisonSociale } : null,
    integrityOk,
    lockedAt: devis.lockedAt,
    lignes: devis.lignes.map((l) => ({
      description: l.description,
      quantite: l.quantite,
      prixUnitaireHT: l.prixUnitaireHT,
      totalHT: l.totalHT,
    })),
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  assertMutationSecurity(request);

  const ip =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  try {
    await checkRateLimit(`public-devis:${ip}`, { maxAttempts: 20, windowMs: 60 * 60 * 1000 });
  } catch {
    return publicJsonResponse({ error: "Trop de tentatives." }, { status: 429 });
  }

  const { token } = await params;

  const devis = await prisma.devis.findFirst({
    where: { shareToken: token, deletedAt: null, status: "ENVOYE" },
  });

  if (!devis) {
    return publicJsonResponse({ error: "Devis introuvable ou déjà traité" }, { status: 404 });
  }

  try {
    const { status } = statusSchema.parse(await request.json());
    const ctx = {
      userId: devis.userId,
      ...getRequestMeta(request),
    };

    const updated = await transitionDevisStatusFromPublic(ctx, devis.id, token, status);
    return publicJsonResponse({ ok: true, status: updated.status });
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(e.message);
    return handleServiceError(e);
  }
}
