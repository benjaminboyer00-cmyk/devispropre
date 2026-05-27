import { NextRequest } from "next/server";
import { requireAuth, handleServiceError } from "@/lib/api-helpers";
import { getAdvancedStats, statsToCsv } from "@/lib/services/stats";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const stats = await getAdvancedStats(auth.workspaceUserId, auth.plan);
    const format = new URL(request.url).searchParams.get("format");

    if (format === "csv") {
      const csv = statsToCsv(stats);
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="devispropre-stats.csv"',
        },
      });
    }

    return Response.json(stats);
  } catch (e) {
    return handleServiceError(e);
  }
}
