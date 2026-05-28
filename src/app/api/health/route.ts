import { prisma } from "@/lib/db";
import { getR2DeadLetterCount, pendingR2UploadCount } from "@/lib/object-storage";

export const dynamic = "force-dynamic";

const DEAD_LETTER_WARN_THRESHOLD = 10;

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const [pendingR2, deadLetterR2] = await Promise.all([
      pendingR2UploadCount(),
      getR2DeadLetterCount(),
    ]);

    const storage =
      deadLetterR2 >= DEAD_LETTER_WARN_THRESHOLD
        ? { pendingR2, deadLetterR2, status: "degraded" as const }
        : { pendingR2, deadLetterR2, status: "ok" as const };

    return Response.json({
      status: storage.status === "degraded" ? "degraded" : "ok",
      db: "connected",
      storage,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      { status: "error", db: "disconnected", timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
