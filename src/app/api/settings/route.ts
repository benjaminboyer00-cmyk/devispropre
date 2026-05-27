import { NextRequest } from "next/server";
import { z } from "zod";
import {
  apiError,
  assertMutationSecurity,
  getRequestMeta,
  handleServiceError,
  requireAuth,
} from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";

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
});

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional(),
});

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const [profile, company] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true, phone: true, plan: true },
    }),
    prisma.company.findUnique({ where: { userId: user.id } }),
  ]);

  return Response.json({ profile, company });
}

export async function PATCH(request: NextRequest) {
  assertMutationSecurity(request);

  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const ctx = { userId: user.id, ...getRequestMeta(request) };

    if (body.section === "profile") {
      const data = profileSchema.parse(body);
      if (data.email && data.email !== user.email) {
        const taken = await prisma.user.findUnique({ where: { email: data.email } });
        if (taken) return apiError("Cet email est déjà utilisé", 409);
      }

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.email && { email: data.email }),
        },
        select: { id: true, email: true, name: true, phone: true, plan: true },
      });

      await logAudit(ctx, { action: "UPDATE", entityType: "user", entityId: user.id });
      return Response.json({ profile: updated });
    }

    if (body.section === "company") {
      const data = companySchema.parse(body);
      const company = await prisma.company.update({
        where: { userId: user.id },
        data,
      });

      await logAudit(ctx, { action: "UPDATE", entityType: "company", entityId: company.id });
      return Response.json({ company });
    }

    return apiError("Section invalide (profile | company)");
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(e.message);
    return handleServiceError(e);
  }
}
