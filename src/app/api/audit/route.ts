import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { getEntityAuditTrail } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");

  if (!entityType || !entityId) {
    return Response.json({ error: "entityType et entityId requis" }, { status: 400 });
  }

  const trail = await getEntityAuditTrail(user.id, entityType, entityId);
  return Response.json(trail);
}
