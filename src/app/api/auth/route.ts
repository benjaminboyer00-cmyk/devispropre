import { NextRequest } from "next/server";
import { z } from "zod";
import {
  apiError,
  getRequestMeta,
  handleServiceError,
  requireAuth,
} from "@/lib/api-helpers";
import {
  createSession,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  phone: z.string().optional(),
  raisonSociale: z.string().min(2),
  siret: z.string().min(9),
  adresse: z.string().min(2),
  codePostal: z.string().min(4),
  ville: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const action = body.action as string;

  if (action === "register") {
    try {
      const data = registerSchema.parse(body);
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) return apiError("Cet email est déjà utilisé", 409);

      const passwordHash = await hashPassword(data.password);
      const user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          phone: data.phone,
          company: {
            create: {
              raisonSociale: data.raisonSociale,
              siret: data.siret,
              adresse: data.adresse,
              codePostal: data.codePostal,
              ville: data.ville,
            },
          },
        },
      });

      const ctx = { userId: user.id, ...getRequestMeta(request) };
      await logAudit(ctx, {
        action: "CREATE",
        entityType: "user",
        entityId: user.id,
        metadata: { email: user.email },
      });

      const token = await createSession(user);
      await setSessionCookie(token);

      return Response.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } }, { status: 201 });
    } catch (e) {
      if (e instanceof z.ZodError) return apiError(e.message);
      return handleServiceError(e);
    }
  }

  if (action === "login") {
    try {
      const data = loginSchema.parse(body);
      const user = await prisma.user.findFirst({
        where: { email: data.email, deletedAt: null },
      });

      if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
        return apiError("Email ou mot de passe incorrect", 401);
      }

      const token = await createSession(user);
      await setSessionCookie(token);

      return Response.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
    } catch (e) {
      if (e instanceof z.ZodError) return apiError(e.message);
      return handleServiceError(e);
    }
  }

  return apiError("Action invalide");
}
