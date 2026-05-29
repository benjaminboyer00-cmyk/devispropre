import { NextRequest } from "next/server";
import { z } from "zod";
import {
  apiError,
  assertMutationSecurity,
  getRequestMeta,
  getTrustedClientIpOrUnknown,
  handleServiceError,
  requireAuth,
} from "@/lib/api-helpers";
import {
  authIpRateLimitKey,
  authPasswordLoginIpKey,
  authPasswordChangeIpKey,
  authRateLimitKey,
  checkRateLimit,
} from "@/lib/rate-limit";
import {
  createSession,
  hashPassword,
  sessionMetaFromRequest,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { acceptTeamInvites } from "@/lib/account-context";
import { logAudit } from "@/lib/audit";
import { generateShareToken } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { sendEmailVerification } from "@/lib/email-verification";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { bumpUserSessionVersion } from "@/lib/user-session";
import {
  formatZodError,
  loginSchema,
  registerSchema,
} from "@/lib/schemas/forms";

export async function POST(request: NextRequest) {
  assertMutationSecurity(request);

  const ip = getTrustedClientIpOrUnknown(request);

  try {
    const body = await request.json();
    const action = body.action as string;

    if (action === "register") {
      await checkRateLimit(authIpRateLimitKey(ip), { maxAttempts: 20, windowMs: 60 * 60 * 1000 });
      await checkRateLimit(authRateLimitKey(ip, body.email), { maxAttempts: 5, windowMs: 60 * 60 * 1000 });

      await verifyTurnstileToken(body.turnstileToken, ip);

      const data = registerSchema.parse(body);
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) return apiError("Impossible de créer le compte avec cet email.", 409);

      const passwordHash = await hashPassword(
        data.password?.trim() || generateShareToken()
      );
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

      await sendEmailVerification(user.id, user.email, user.name);

      return Response.json(
        { ok: true, needsEmailVerification: true, user: { id: user.id, email: user.email, name: user.name } },
        { status: 201 }
      );
    }

    if (action === "login") {
      await checkRateLimit(authPasswordLoginIpKey(ip), { maxAttempts: 5, windowMs: 60 * 1000 });
      await checkRateLimit(authRateLimitKey(ip, body.email), { maxAttempts: 5, windowMs: 60 * 1000 });

      await verifyTurnstileToken(body.turnstileToken, ip);

      const data = loginSchema.parse(body);
      const user = await prisma.user.findFirst({
        where: { email: data.email, deletedAt: null },
        select: { id: true, email: true, name: true, plan: true, passwordHash: true, emailVerifiedAt: true },
      });

      if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
        return apiError("Email ou mot de passe incorrect", 401);
      }

      if (!user.emailVerifiedAt) {
        await sendEmailVerification(user.id, user.email, user.name);
        return apiError("Confirmez votre email — un nouveau lien vient d'être envoyé.", 403);
      }

      const token = await createSession(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
        },
        sessionMetaFromRequest(request)
      );
      await acceptTeamInvites(user.email, user.id);
      await setSessionCookie(token);

      return Response.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
    }

    if (action === "change-password") {
      const auth = await requireAuth({ skipSubscriptionCheck: true });
      if (auth.error) return auth.error;

      await checkRateLimit(authPasswordChangeIpKey(ip), { maxAttempts: 5, windowMs: 15 * 60 * 1000 });

      const parsed = z
        .object({
          currentPassword: z.string().min(1),
          newPassword: z.string().min(8),
        })
        .parse(body);

      const authUser = await prisma.user.findFirst({
        where: { id: auth.user.id, deletedAt: null },
        select: { id: true, email: true, name: true, plan: true, passwordHash: true },
      });
      if (!authUser) return apiError("Session invalide", 401);

      if (!(await verifyPassword(parsed.currentPassword, authUser.passwordHash))) {
        return apiError("Mot de passe actuel incorrect", 401);
      }

      await bumpUserSessionVersion(authUser.id);
      await prisma.user.update({
        where: { id: authUser.id },
        data: { passwordHash: await hashPassword(parsed.newPassword) },
      });

      const token = await createSession(
        {
          id: authUser.id,
          email: authUser.email,
          name: authUser.name,
          plan: authUser.plan,
        },
        sessionMetaFromRequest(request)
      );
      await setSessionCookie(token);

      return Response.json({ ok: true });
    }

    return apiError("Action invalide");
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(formatZodError(e));
    if (e instanceof Error && e.message.includes("sessionVersion")) {
      return apiError(
        "Mise à jour base de données requise. Arrêtez le serveur et lancez : npm run dev:clean",
        503
      );
    }
    return handleServiceError(e);
  }
}
