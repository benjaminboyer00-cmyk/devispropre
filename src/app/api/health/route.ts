import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { isHealthMonitorAuthorized } from "@/lib/health-auth";
import { getR2DeadLetterCount, pendingR2UploadCount } from "@/lib/object-storage";

export const dynamic = "force-dynamic";

const DEAD_LETTER_WARN_THRESHOLD = 10;

export async function GET(request: NextRequest) {
  const monitor = isHealthMonitorAuthorized(request);

  try {
    await prisma.$queryRaw`SELECT 1`;

    if (!monitor) {
      return Response.json({ status: "ok", timestamp: new Date().toISOString() });
    }

    const [pendingR2, deadLetterR2] = await Promise.all([
      pendingR2UploadCount(),
      getR2DeadLetterCount(),
    ]);

    const degraded = deadLetterR2 >= DEAD_LETTER_WARN_THRESHOLD;
    const storage = {
      pendingR2,
      deadLetterR2,
      status: degraded ? ("degraded" as const) : ("ok" as const),
    };

    return Response.json(
      {
        status: degraded ? "degraded" : "ok",
        db: "connected",
        storage,
        timestamp: new Date().toISOString(),
      },
      { status: degraded ? 503 : 200 }
    );
  } catch {
    return Response.json(
      { status: "error", db: "disconnected", timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
