import { NextRequest } from "next/server";
import { getTrustedClientIpOrUnknown, handleServiceError } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { readArchivedPdf, signedDevisPdfKey } from "@/lib/object-storage";
import { pdfResponse } from "@/lib/pdf-response";
import { PUBLIC_DEVIS_LIMITS } from "@/lib/public-api-limits";
import { publicJsonResponse } from "@/lib/public-api-response";
import { checkRateLimit } from "@/lib/rate-limit";
import { isValidPublicShareRef, publicShareLookupWhere } from "@/lib/share-slug";

type RouteParams = { params: Promise<{ token: string }> };

/** Copie du devis signé pour le client (détenteur du lien de partage). */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    if (!isValidPublicShareRef(token)) {
      return publicJsonResponse({ error: "Devis introuvable" }, { status: 404 });
    }

    await checkRateLimit(`public-devis-pdf:${getTrustedClientIpOrUnknown(request)}`, PUBLIC_DEVIS_LIMITS.readPerIp);

    const devis = await prisma.devis.findFirst({
      where: { ...publicShareLookupWhere(token), deletedAt: null, status: "ACCEPTE", signedPdfArchivedAt: { not: null } },
      select: { id: true, userId: true, numero: true },
    });
    if (!devis) {
      return publicJsonResponse({ error: "Devis signé introuvable" }, { status: 404 });
    }

    const archived = await readArchivedPdf(signedDevisPdfKey(devis.userId, devis.id));
    if (!archived) {
      return publicJsonResponse({ error: "PDF signé indisponible" }, { status: 404 });
    }
    return pdfResponse(archived, `devis-${devis.numero}-signe.pdf`);
  } catch (e) {
    return handleServiceError(e);
  }
}
