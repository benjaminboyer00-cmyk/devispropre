import { NextRequest } from "next/server";
import { getSession, type SessionUser } from "./auth";
import { assertSameOrigin, CsrfError } from "./csrf";
import { PlanLimitError } from "./plan-limits";
import { RateLimitError } from "./rate-limit";
import { ImmutabilityError } from "./immutability";

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

export function assertMutationSecurity(request: NextRequest): void {
  if (MUTATION_METHODS.has(request.method)) {
    assertSameOrigin(request);
  }
}

export async function requireAuth(): Promise<
  | { user: SessionUser; error: null }
  | { user: null; error: Response }
> {
  const user = await getSession();
  if (!user) {
    return {
      user: null,
      error: Response.json({ error: "Non authentifié" }, { status: 401 }),
    };
  }
  return { user, error: null };
}

export function apiError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function handleServiceError(error: unknown) {
  if (error instanceof CsrfError) return apiError(error.message, 403);
  if (error instanceof RateLimitError) return apiError(error.message, 429);
  if (error instanceof PlanLimitError) return apiError(error.message, 402);
  if (error instanceof ImmutabilityError) return apiError(error.message, 403);
  if (error instanceof Error) {
    if (error.name === "ImmutabilityError") {
      return apiError(error.message, 403);
    }
    return apiError(error.message, 400);
  }
  return apiError("Erreur serveur", 500);
}
