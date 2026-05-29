import { Prisma } from "@/generated/prisma/client";
import { prisma } from "./db";

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

export function readIdempotencyKey(request: Request): string | null {
  const raw = request.headers.get("idempotency-key")?.trim();
  if (!raw || raw.length > 128) return null;
  return raw;
}

/** Exécute une mutation une seule fois par (userId, Idempotency-Key). */
export async function withIdempotency<T>(
  userId: string,
  key: string | null,
  handler: () => Promise<{ status: number; body: T }>,
  ttlMs = DEFAULT_TTL_MS
): Promise<Response> {
  if (!key) {
    const { status, body } = await handler();
    return Response.json(body, { status });
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${userId}:idem:${key}`}))`;

    const expiresAt = new Date(Date.now() + ttlMs);
    const existing = await tx.idempotencyRecord.findUnique({
      where: { userId_key: { userId, key } },
    });

    if (existing && existing.expiresAt > new Date()) {
      return Response.json(existing.body, { status: existing.status });
    }

    const { status, body } = await handler();

    try {
      await tx.idempotencyRecord.upsert({
        where: { userId_key: { userId, key } },
        create: { userId, key, status, body: body as Prisma.InputJsonValue, expiresAt },
        update: { status, body: body as Prisma.InputJsonValue, expiresAt },
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        const cached = await tx.idempotencyRecord.findUnique({
          where: { userId_key: { userId, key } },
        });
        if (cached) {
          return Response.json(cached.body, { status: cached.status });
        }
      }
      throw err;
    }

    return Response.json(body, { status });
  });
}
