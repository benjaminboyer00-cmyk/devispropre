import { NextRequest } from "next/server";
import { assertMutationSecurity, getTrustedClientIpOrUnknown, handleServiceError } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requestDevisSignatureOtp, resolveSignerEmail } from "@/lib/devis-signature-otp";
import { checkRateLimit } from "@/lib/rate-limit";
import { PUBLIC_DEVIS_LIMITS } from "@/lib/public-api-limits";
import { publicJsonResponse } from "@/lib/public-api-response";
import { isShareLinkExpired } from "@/lib/share-token";
import { isValidPublicShareRef, publicShareLookupWhere } from "@/lib/share-slug";

type RouteParams = { params: Promise<{ token: string }> };

const otpRequestSchema = z.object({ email: z.string().max(254).optional() });

/**
 * Demande un code OTP — envoyé à l'e-mail de la fiche client, ou à défaut
 * à l'e-mail déclaré par le signataire (qui recevra aussi la copie signée).
 */
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

    const body = otpRequestSchema.safeParse(await request.json().catch(() => ({})));
    const signer = resolveSignerEmail(devis.client.email, body.success ? body.data.email : null);
    if (!signer) {
      return publicJsonResponse(
        { error: "Indiquez une adresse e-mail valide pour recevoir votre code de signature." },
        { status: 400 }
      );
    }

    await checkRateLimit(`public-devis-otp:devis:${devis.id}`, PUBLIC_DEVIS_LIMITS.otpRequestPerDevis);

    const result = await requestDevisSignatureOtp({
      devisId: devis.id,
      shareToken: token,
      clientEmail: signer.email,
      clientNom: devis.client.nom,
      devisNumero: devis.numero,
      companyName: devis.user.company?.raisonSociale ?? "Votre artisan",
      sentAt: devis.sentAt,
      validUntil: devis.validUntil,
    });

    return publicJsonResponse({ ok: true, emailHint: result.emailHint, emailSource: signer.source });
  } catch (e) {
    return handleServiceError(e);
  }
}
