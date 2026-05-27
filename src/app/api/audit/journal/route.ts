import { NextRequest } from "next/server";
import { requireAuth, handleServiceError } from "@/lib/api-helpers";
import {
  auditJournalToCsv,
  getWorkspaceAuditJournal,
} from "@/lib/services/audit-journal";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const format = new URL(request.url).searchParams.get("format");
    const journal = await getWorkspaceAuditJournal(auth.workspaceUserId, auth.plan);

    if (format === "csv") {
      return new Response(auditJournalToCsv(journal), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="devispropre-audit.csv"',
        },
      });
    }

    return Response.json({ entries: journal });
  } catch (e) {
    return handleServiceError(e);
  }
}
