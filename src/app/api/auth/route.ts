import { NextRequest } from "next/server";
import { z } from "zod";
import {
  apiError,
  assertMutationSecurity,
  getRequestMeta,
  handleServiceError,
} from "@/lib/api-helpers";
import { authIpRateLimitKey, authRateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import {
  createSession,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { acceptTeamInvites } from "@/lib/account-context";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import {
  formatZodError,
  loginSchema,
  registerSchema,
} from "@/lib/schemas/forms";

export async function POST(request: NextRequest) {
  assertMutationSecurity(request);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  try {
    const body = await request.json();
    const action = body.action as string;

    if (action === "register") {
      await checkRateLimit(authIpRateLimitKey(ip), { maxAttempts: 20, windowMs: 60 * 60 * 1000 });
      await checkRateLimit(authRateLimitKey(ip, body.email), { maxAttempts: 5, windowMs: 60 * 60 * 1000 });

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

      await acceptTeamInvites(user.email, user.id);

      const ctx = { userId: user.id, ...getRequestMeta(request) };
      await logAudit(ctx, {
        action: "CREATE",
        entityType: "user",
        entityId: user.id,
        metadata: { email: user.email },
      });

      const token = await createSession(user);
      await setSessionCookie(token);

      return Response.json(
        { ok: true, user: { id: user.id, email: user.email, name: user.name } },
        { status: 201 }
      );
    }

    if (action === "login") {
      await checkRateLimit(authIpRateLimitKey(ip), { maxAttempts: 30, windowMs: 15 * 60 * 1000 });
      await checkRateLimit(authRateLimitKey(ip, body.email), { maxAttempts: 10, windowMs: 15 * 60 * 1000 });

      const data = loginSchema.parse(body);
      const user = await prisma.user.findFirst({
        where: { email: data.email, deletedAt: null },
        select: { id: true, email: true, name: true, plan: true, passwordHash: true },
      });

      if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
        return apiError("Email ou mot de passe incorrect", 401);
      }

      const token = await createSession({
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
      });
      await acceptTeamInvites(user.email, user.id);
      await setSessionCookie(token);

      return Response.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
    }

    return apiError("Action invalide");
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(formatZodError(e));
    return handleServiceError(e);
  }
}
