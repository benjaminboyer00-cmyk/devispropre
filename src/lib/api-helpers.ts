import { NextRequest } from "next/server";
import type { Plan } from "@/generated/prisma/client";
import { getAccountContext } from "./account-context";
import { getSession, type SessionUser } from "./auth";
import { assertSameOrigin, CsrfError } from "./csrf";
import { PlanFeatureError } from "./plan-features";
import { PlanLimitError } from "./plan-limits";
import { RateLimitError } from "./rate-limit";
import { ImmutabilityError } from "./immutability";
import { ForbiddenError } from "./errors";
import { ObjectStorageError } from "./object-storage";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function getRequestMeta(request: NextRequest) {
  // IP enregistrée à titre indicatif uniquement — ne pas utiliser pour rate limit / geo
  const ipAddress =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null;

  return {
    ipAddress,
    userAgent: request.headers.get("user-agent"),
  };
}

export function assertMutationSecurity(request: Request): void {
  if (MUTATION_METHODS.has(request.method)) {
    assertSameOrigin(request);
  }
}

export async function requireAuth(): Promise<
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
  if (error instanceof PlanFeatureError) return apiError(error.message, 402);
  if (error instanceof ForbiddenError) return apiError(error.message, 403);
  if (error instanceof ImmutabilityError) return apiError(error.message, 403);
  if (error instanceof ObjectStorageError) return apiError(error.message, 503);
  if (error instanceof Error) {
    if (error.name === "ImmutabilityError") {
      return apiError(error.message, 403);
    }
    return apiError(error.message, 400);
  }
  return apiError("Erreur serveur", 500);
}
