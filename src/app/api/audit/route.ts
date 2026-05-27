import { NextRequest } from "next/server";
import { handleServiceError, requireAuth } from "@/lib/api-helpers";
import { getEntityAuditTrail } from "@/lib/audit";
import { assertEntityOwnedByUser } from "@/lib/entity-access";

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");

  if (!entityType || !entityId) {
    return Response.json({ error: "entityType et entityId requis" }, { status: 400 });
  }

  try {
    await assertEntityOwnedByUser(user.id, entityType, entityId);
    const trail = await getEntityAuditTrail(user.id, entityType, entityId);
    return Response.json(trail);
  } catch (e) {
    return handleServiceError(e);
  }
}
