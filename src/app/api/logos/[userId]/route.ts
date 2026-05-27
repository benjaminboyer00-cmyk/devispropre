import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { loadLogoBuffer, parseLegacyLogoDataUri } from "@/lib/logo-storage";
import { prisma } from "@/lib/db";

type RouteParams = { params: Promise<{ userId: string }> };

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { userId } = await params;
  if (userId !== auth.workspaceUserId) {
    return new Response("Forbidden", { status: 403 });
  }

  const buffer = await loadLogoBuffer(userId);
  if (buffer) {
    const ext = buffer[0] === 0x89 ? "png" : buffer[0] === 0xff ? "jpg" : "webp";
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": MIME_BY_EXT[ext] ?? "image/png",
        "Cache-Control": "private, max-age=3600",
      },
    });
  }

  const company = await prisma.company.findUnique({
    where: { userId },
    select: { logoUrl: true, updatedAt: true },
  });
  const legacy = parseLegacyLogoDataUri(company?.logoUrl);
  if (!legacy) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(legacy), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
