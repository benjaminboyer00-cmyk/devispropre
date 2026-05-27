import { NextRequest } from "next/server";
import { handleServiceError, requireAuth } from "@/lib/api-helpers";
import { getEntityAuditTrail } from "@/lib/audit";
import { assertEntityOwnedByUser } from "@/lib/entity-access";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");

  if (!entityType || !entityId) {
    return Response.json({ error: "entityType et entityId requis" }, { status: 400 });
  }

  try {
    await assertEntityOwnedByUser(auth.workspaceUserId, entityType, entityId);
    const trail = await getEntityAuditTrail(auth.workspaceUserId, entityType, entityId);
    return Response.json(trail);
  } catch (e) {
    return handleServiceError(e);
  }
}
