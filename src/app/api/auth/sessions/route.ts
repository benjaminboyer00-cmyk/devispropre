import { NextRequest } from "next/server";
import { z } from "zod";
import {
  apiError,
  assertMutationSecurity,
  handleServiceError,
  requireAuth,
} from "@/lib/api-helpers";
import { getSessionIdFromCookie, logoutSession } from "@/lib/auth";
import {
  listActiveSessions,
  revokeAllUserSessions,
  revokeSession,
} from "@/lib/user-session";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const currentSessionId = await getSessionIdFromCookie();
  const sessions = await listActiveSessions(auth.user.id);

  return Response.json({
    sessions: sessions.map((session) => ({
      id: session.id,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt.toISOString(),
      lastSeenAt: session.lastSeenAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      current: session.id === currentSessionId,
    })),
  });
}

const revokeSchema = z.object({
  action: z.enum(["revoke", "revoke-all", "revoke-others"]),
  sessionId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  assertMutationSecurity(request);

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = revokeSchema.parse(await request.json());
    const currentSessionId = await getSessionIdFromCookie();

    if (body.action === "revoke") {
      if (!body.sessionId) return apiError("sessionId requis.");
      if (body.sessionId === currentSessionId) {
        await logoutSession();
        return Response.json({ ok: true, loggedOut: true });
      }
      await revokeSession(body.sessionId, auth.user.id);
      return Response.json({ ok: true });
    }

    if (body.action === "revoke-others") {
      const count = await revokeAllUserSessions(auth.user.id, currentSessionId ?? undefined);
      return Response.json({ ok: true, revoked: count });
    }

    const count = await revokeAllUserSessions(auth.user.id);
    await logoutSession();
    return Response.json({ ok: true, revoked: count, loggedOut: true });
  } catch (e) {
    if (e instanceof z.ZodError) return apiError("Requête invalide.");
    return handleServiceError(e);
  }
}
