import { NextRequest } from "next/server";
import { assertMutationSecurity, handleServiceError } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import {
  clientRequiresSignatureOtp,
  requestDevisSignatureOtp,
} from "@/lib/devis-signature-otp";
import { checkRateLimit } from "@/lib/rate-limit";
import { publicJsonResponse } from "@/lib/public-api-response";
import { isShareLinkExpired, isValidShareTokenFormat } from "@/lib/share-token";

type RouteParams = { params: Promise<{ token: string }> };

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/** Demande un code OTP envoyé à l'email client enregistré sur le devis. */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    assertMutationSecurity(request);

    const ip = clientIp(request);
    await checkRateLimit(`public-devis-otp:${ip}`, { maxAttempts: 10, windowMs: 60 * 60 * 1000 });

    const { token } = await params;
    if (!isValidShareTokenFormat(token)) {
      return publicJsonResponse({ error: "Devis introuvable" }, { status: 404 });
    }

    const devis = await prisma.devis.findFirst({
      where: { shareToken: token, deletedAt: null, status: "ENVOYE" },
      include: {
        client: true,
        user: { include: { company: true } },
      },
    });

    if (!devis) {
      return publicJsonResponse({ error: "Devis introuvable ou déjà traité" }, { status: 404 });
    }

    if (
      isShareLinkExpired({
        sentAt: devis.sentAt,
        validUntil: devis.validUntil,
      })
    ) {
      return publicJsonResponse({ error: "Ce lien de signature a expiré." }, { status: 410 });
    }

    const clientEmail = devis.client.email?.trim();
    if (!clientRequiresSignatureOtp(clientEmail)) {
      return publicJsonResponse(
        { error: "Aucun email client enregistré — la signature ne nécessite pas de code." },
        { status: 400 }
      );
    }

    await checkRateLimit(`public-devis-otp:devis:${devis.id}`, {
      maxAttempts: 5,
      windowMs: 60 * 60 * 1000,
    });

    const result = await requestDevisSignatureOtp({
      devisId: devis.id,
      shareToken: token,
      clientEmail: clientEmail!,
      clientNom: devis.client.nom,
      devisNumero: devis.numero,
      companyName: devis.user.company?.raisonSociale ?? "Votre artisan",
      sentAt: devis.sentAt,
      validUntil: devis.validUntil,
    });

    return publicJsonResponse({ ok: true, emailHint: result.emailHint });
  } catch (e) {
    return handleServiceError(e);
  }
}
