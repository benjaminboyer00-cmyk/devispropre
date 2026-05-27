import { NextRequest } from "next/server";
import { getSession, type SessionUser } from "./auth";

export function getRequestMeta(request: NextRequest) {
  return {
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: request.headers.get("user-agent"),
  };
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
  if (error instanceof Error) {
    if (error.name === "ImmutabilityError") {
      return apiError(error.message, 403);
    }
    return apiError(error.message, 400);
  }
  return apiError("Erreur serveur", 500);
}
