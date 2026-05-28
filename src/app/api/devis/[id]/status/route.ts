import { NextRequest } from "next/server";
import { z } from "zod";
import {
  apiError,
  assertMutationSecurity,
  getRequestMeta,
  handleServiceError,
  requireAuth,
} from "@/lib/api-helpers";
import { readIdempotencyKey, withIdempotency } from "@/lib/idempotency";
import { transitionDevisStatus } from "@/lib/services/devis";

const schema = z.object({
  status: z.enum(["ACCEPTE", "REFUSE"]),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    assertMutationSecurity(request);

    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { id } = await params;
    const { status } = schema.parse(await request.json());
    const ctx = { userId: auth.workspaceUserId, ...getRequestMeta(request) };
    const idempotencyKey = readIdempotencyKey(request);

    return withIdempotency(auth.workspaceUserId, idempotencyKey, async () => {
      const devis = await transitionDevisStatus(ctx, id, status);
      return { status: 200, body: devis };
    });
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(e.message);
    return handleServiceError(e);
  }
}
