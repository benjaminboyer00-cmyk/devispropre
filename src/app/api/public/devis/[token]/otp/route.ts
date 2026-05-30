import { NextRequest } from "next/server";
import { assertMutationSecurity, getTrustedClientIpOrUnknown, handleServiceError } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { clientCanSignOnline, requestDevisSignatureOtp } from "@/lib/devis-signature-otp";
import { checkRateLimit } from "@/lib/rate-limit";
import { PUBLIC_DEVIS_LIMITS } from "@/lib/public-api-limits";
import { publicJsonResponse } from "@/lib/public-api-response";
import { isShareLinkExpired } from "@/lib/share-token";
import { isValidPublicShareRef, publicShareLookupWhere } from "@/lib/share-slug";

type RouteParams = { params: Promise<{ token: string }> };

/** Demande un code OTP envoyé à l'email client enregistré sur le devis. */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    assertMutationSecurity(request);

    const ip = getTrustedClientIpOrUnknown(request);
    await checkRateLimit(`public-devis-otp:${ip}`, PUBLIC_DEVIS_LIMITS.otpRequestPerIp);

    const { token } = await params;
    if (!isValidPublicShareRef(token)) {
      return publicJsonResponse({ error: "Devis introuvable" }, { status: 404 });
    }

    const devis = await prisma.devis.findFirst({
      where: { ...publicShareLookupWhere(token), deletedAt: null, status: "ENVOYE" },
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
    if (!clientCanSignOnline(clientEmail)) {
      return publicJsonResponse(
        { error: "Aucun email client enregistré — signature impossible en ligne." },
        { status: 400 }
      );
    }

    await checkRateLimit(`public-devis-otp:devis:${devis.id}`, PUBLIC_DEVIS_LIMITS.otpRequestPerDevis);

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
