import { NextRequest } from "next/server";

const DEFAULT_ORIGIN = "http://localhost:3000";

/** Construit une NextRequest avec en-têtes CSRF valides pour les tests d'intégration. */
export function buildApiRequest(
  path: string,
  init: RequestInit & { method?: string } = {}
): NextRequest {
  const headers = new Headers(init.headers);
  if (!headers.has("origin")) headers.set("origin", DEFAULT_ORIGIN);
  if (!headers.has("sec-fetch-site")) headers.set("sec-fetch-site", "same-origin");
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  return new NextRequest(new URL(path, DEFAULT_ORIGIN), {
    ...init,
    headers,
  });
}

/** Requête cross-site (doit être rejetée par assertMutationSecurity). */
export function buildCrossSiteRequest(
  path: string,
  init: RequestInit & { method?: string } = {}
): NextRequest {
  const headers = new Headers(init.headers);
  headers.set("origin", "https://evil.example");
  headers.set("sec-fetch-site", "cross-site");
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  return new NextRequest(new URL(path, DEFAULT_ORIGIN), {
    ...init,
    headers,
  });
}

export async function readJson<T = unknown>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

export const TEST_SESSION_USER = {
  id: "user_test_1",
  email: "test@devispropre.fr",
  name: "Test Artisan",
  plan: "STARTER",
};

export const TEST_ACCOUNT = {
  workspaceUserId: "user_test_1",
  plan: "STARTER" as const,
  isTeamMember: false,
};
