import { NextRequest } from "next/server";
import type { Plan } from "@/generated/prisma/client";
import { getAccountContext } from "./account-context";
import { billingUserId, userNeedsSubscriptionSetup } from "./billing";
import { getSession, type SessionUser } from "./auth";
import { assertSameOrigin, CsrfError } from "./csrf";
import { PlanFeatureError } from "./plan-features";
import { BillingPastDueError } from "./billing-status";
import { PlanLimitError } from "./plan-limits";
import { TurnstileError } from "./turnstile";
import { ClientArchiveError } from "./client-guard";
import { RateLimitError } from "./rate-limit";
import { ImmutabilityError } from "./immutability";
import { ForbiddenError } from "./errors";
import { ObjectStorageError } from "./object-storage";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Aligné avec proxy.ts : pages /dashboard/devis accessibles sans essai Stripe activé. */
export const AUTH_DEVIS_WORKFLOW = { skipSubscriptionCheck: true } as const;

export function getRequestMeta(request: NextRequest) {
  return {
    ipAddress: getTrustedClientIp(request),
    userAgent: request.headers.get("user-agent"),
  };
}

/** IP client — en prod, X-Real-IP (Nginx) puis X-Forwarded-For posé par Nginx ($remote_addr). */
export function getTrustedClientIp(request: NextRequest): string | null {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 45);

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded.slice(0, 45);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return null;
}

/** Alias pour rate limiting (jamais null en pratique). */
export function getTrustedClientIpOrUnknown(request: NextRequest): string {
  return getTrustedClientIp(request) ?? "unknown";
}

export function assertMutationSecurity(request: Request): void {
  if (MUTATION_METHODS.has(request.method)) {
    assertSameOrigin(request);
  }
}

export async function requireAuth(options?: { skipSubscriptionCheck?: boolean }): Promise<
  | {
      user: SessionUser;
      workspaceUserId: string;
      plan: Plan;
      isTeamMember: boolean;
      error: null;
    }
  | {
      user: null;
      workspaceUserId: null;
      plan: null;
      isTeamMember: false;
      error: Response;
    }
> {
  const user = await getSession();
  if (!user) {
    return {
      user: null,
      workspaceUserId: null,
      plan: null,
      isTeamMember: false,
      error: Response.json({ error: "Non authentifié" }, { status: 401 }),
    };
  }

  const account = await getAccountContext(user.id);

  if (!options?.skipSubscriptionCheck) {
    const billTo = billingUserId(user.id, account.workspaceUserId, account.isTeamMember);
    if (await userNeedsSubscriptionSetup(billTo)) {
      return {
        user: null,
        workspaceUserId: null,
        plan: null,
        isTeamMember: false,
        error: Response.json(
          { error: "Activez votre essai depuis le tableau de bord pour utiliser cette fonctionnalité." },
          { status: 402 }
        ),
      };
    }
  }

  return {
    user,
    workspaceUserId: account.workspaceUserId,
    plan: account.plan,
    isTeamMember: account.isTeamMember,
    error: null,
  };
}

export function buildServiceContext(
  workspaceUserId: string,
  actorUserId: string,
  request: NextRequest
) {
  return {
    userId: workspaceUserId,
    actorUserId,
    ...getRequestMeta(request),
  };
}

export function apiError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function handleServiceError(error: unknown) {
  if (error instanceof CsrfError) return apiError(error.message, 403);
  if (error instanceof RateLimitError) return apiError(error.message, 429);
  if (error instanceof PlanLimitError) return apiError(error.message, 402);
  if (error instanceof BillingPastDueError) return apiError(error.message, 402);
  if (error instanceof PlanFeatureError) return apiError(error.message, 402);
  if (error instanceof ForbiddenError) return apiError(error.message, 403);
  if (error instanceof ImmutabilityError) return apiError(error.message, 403);
  if (error instanceof ObjectStorageError) return apiError(error.message, 503);
  if (error instanceof TurnstileError) return apiError(error.message, 403);
  if (error instanceof ClientArchiveError) return apiError(error.message, 409);
  if (error instanceof Error) {
    if (error.name === "ImmutabilityError") {
      return apiError(error.message, 403);
    }
    if (process.env.NODE_ENV === "production") {
      const safeMessages = [
        "Devis introuvable",
        "Facture introuvable",
        "Seul un brouillon",
        "Seul un devis accepté",
        "Une facture existe déjà",
        "Ce devis a déjà été traité",
        "Ce lien de signature a expiré",
        "Utilisateur introuvable",
      ];
      if (safeMessages.some((prefix) => error.message.includes(prefix))) {
        return apiError(error.message, 400);
      }
      console.error("[api]", error);
      return apiError("Requête invalide", 400);
    }
    return apiError(error.message, 400);
  }
  return apiError("Erreur serveur", 500);
}
