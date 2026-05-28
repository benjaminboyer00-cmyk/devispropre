import { NextRequest } from "next/server";
import { z } from "zod";
import {
  apiError,
  assertMutationSecurity,
  getRequestMeta,
  handleServiceError,
  requireAuth,
} from "@/lib/api-helpers";
import { getAccountContext } from "@/lib/account-context";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { ForbiddenError } from "@/lib/errors";
import { logoApiPath, parseLogoDataUri, saveLogoFile } from "@/lib/logo-storage";

const companySchema = z.object({
  raisonSociale: z.string().min(2).optional(),
  siret: z.string().min(9).optional(),
  adresse: z.string().min(2).optional(),
  codePostal: z.string().min(4).optional(),
  ville: z.string().min(2).optional(),
  tvaIntracom: z.string().optional().nullable(),
  telephone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  capitalSocial: z.string().optional().nullable(),
  rcs: z.string().optional().nullable(),
  assurances: z.string().optional().nullable(),
  tvaApplicable: z.boolean().optional(),
  logoUrl: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.logoUrl && !data.logoUrl.startsWith("data:image")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "logoUrl doit être un data URI image ou null.",
      path: ["logoUrl"],
    });
  }
});

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional(),
});

export async function GET() {
  const auth = await requireAuth({ skipSubscriptionCheck: true });
  if (auth.error) return auth.error;

  const [profile, company, billingOwner] = await Promise.all([
    prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { id: true, email: true, name: true, phone: true, plan: true },
    }),
    prisma.company.findUnique({
      where: { userId: auth.workspaceUserId },
      select: {
        id: true,
        raisonSociale: true,
        siret: true,
        adresse: true,
        codePostal: true,
        ville: true,
        tvaIntracom: true,
        telephone: true,
        email: true,
        capitalSocial: true,
        rcs: true,
        assurances: true,
        tvaApplicable: true,
        updatedAt: true,
        logoUrl: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: auth.workspaceUserId },
      select: { stripeCustomerId: true },
    }),
  ]);

  return Response.json({
    profile: profile ? { ...profile, plan: auth.plan } : null,
    company: company
      ? {
          ...company,
          logoUrl: company.logoUrl?.startsWith("data:image")
            ? logoApiPath(auth.workspaceUserId)
            : company.logoUrl,
        }
      : null,
    isTeamMember: auth.isTeamMember,
    hasStripeCustomer: !!billingOwner?.stripeCustomerId,
  });
}

export async function PATCH(request: NextRequest) {
  assertMutationSecurity(request);

  const auth = await requireAuth({ skipSubscriptionCheck: true });
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const meta = getRequestMeta(request);

    if (body.section === "profile") {
      const data = profileSchema.parse(body);
      if (data.email && data.email !== auth.user.email) {
        return apiError("Le changement d'email n'est pas autorisé depuis les paramètres.", 403);
      }

      const updated = await prisma.user.update({
        where: { id: auth.user.id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.phone !== undefined && { phone: data.phone }),
        },
        select: { id: true, email: true, name: true, phone: true, plan: true },
      });

      await logAudit(
        { userId: auth.workspaceUserId, actorUserId: auth.user.id, ...meta },
        { action: "UPDATE", entityType: "user", entityId: auth.user.id }
      );
      return Response.json({ profile: { ...updated, plan: auth.plan } });
    }

    if (body.section === "company") {
      if (auth.isTeamMember) {
        throw new ForbiddenError("Seul le propriétaire peut modifier l'entreprise.");
      }

      const data = companySchema.parse(body);

      let logoPath: string | null | undefined;
      if (data.logoUrl !== undefined) {
        if (data.logoUrl === null) {
          logoPath = null;
        } else {
          const { buffer, ext } = await parseLogoDataUri(data.logoUrl);
          logoPath = await saveLogoFile(auth.workspaceUserId, buffer, ext);
        }
      }

      const company = await prisma.company.upsert({
        where: { userId: auth.workspaceUserId },
        create: {
          userId: auth.workspaceUserId,
          raisonSociale: data.raisonSociale ?? "À compléter",
          siret: data.siret ?? "00000000000000",
          adresse: data.adresse ?? "À compléter",
          codePostal: data.codePostal ?? "00000",
          ville: data.ville ?? "À compléter",
          ...(data.tvaIntracom !== undefined && { tvaIntracom: data.tvaIntracom }),
          ...(data.telephone !== undefined && { telephone: data.telephone }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.capitalSocial !== undefined && { capitalSocial: data.capitalSocial }),
          ...(data.rcs !== undefined && { rcs: data.rcs }),
          ...(data.assurances !== undefined && { assurances: data.assurances }),
          ...(data.tvaApplicable !== undefined && { tvaApplicable: data.tvaApplicable }),
          ...(logoPath !== undefined && { logoUrl: logoPath }),
        },
        update: {
          ...(data.raisonSociale !== undefined && { raisonSociale: data.raisonSociale }),
          ...(data.siret !== undefined && { siret: data.siret }),
          ...(data.adresse !== undefined && { adresse: data.adresse }),
          ...(data.codePostal !== undefined && { codePostal: data.codePostal }),
          ...(data.ville !== undefined && { ville: data.ville }),
          ...(data.tvaIntracom !== undefined && { tvaIntracom: data.tvaIntracom }),
          ...(data.telephone !== undefined && { telephone: data.telephone }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.capitalSocial !== undefined && { capitalSocial: data.capitalSocial }),
          ...(data.rcs !== undefined && { rcs: data.rcs }),
          ...(data.assurances !== undefined && { assurances: data.assurances }),
          ...(data.tvaApplicable !== undefined && { tvaApplicable: data.tvaApplicable }),
          ...(logoPath !== undefined && { logoUrl: logoPath }),
        },
      });

      await logAudit(
        { userId: auth.workspaceUserId, actorUserId: auth.user.id, ...meta },
        { action: "UPDATE", entityType: "company", entityId: company.id }
      );
      return Response.json({
        company: {
          ...company,
          logoUrl: company.logoUrl?.startsWith("data:image")
            ? logoApiPath(auth.workspaceUserId)
            : company.logoUrl,
        },
      });
    }

    return apiError("Section invalide (profile | company)");
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(e.message);
    return handleServiceError(e);
  }
}
