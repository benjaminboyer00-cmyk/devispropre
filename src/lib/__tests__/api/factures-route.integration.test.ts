import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/lib/errors";
import {
  TEST_ACCOUNT,
  TEST_SESSION_USER,
  buildApiRequest,
  readJson,
} from "./test-request";

const getSession = vi.fn();
const getAccountContext = vi.fn();
const userNeedsSubscriptionSetup = vi.fn();
const checkRateLimit = vi.fn();
const createFactureFromDevisMock = vi.fn();
const factureFindMany = vi.fn();
const factureCount = vi.fn();

vi.mock("@/lib/auth", () => ({
  getSession: (...args: unknown[]) => getSession(...args),
}));

vi.mock("@/lib/account-context", () => ({
  getAccountContext: (...args: unknown[]) => getAccountContext(...args),
}));

vi.mock("@/lib/billing", () => ({
  billingUserId: (_uid: string, wsId: string) => wsId,
  userNeedsSubscriptionSetup: (...args: unknown[]) => userNeedsSubscriptionSetup(...args),
}));

vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...actual,
    checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
    factureCreateKey: (id: string) => `facture:create:${id}`,
  };
});

vi.mock("@/lib/idempotency", () => ({
  readIdempotencyKey: () => null,
  withIdempotency: async (
    _userId: string,
    _key: string | null,
    handler: () => Promise<{ status: number; body: unknown }>
  ) => {
    try {
      const { status, body } = await handler();
      return Response.json(body, { status });
    } catch (e) {
      const { handleServiceError } = await import("@/lib/api-helpers");
      return handleServiceError(e);
    }
  },
}));

vi.mock("@/lib/services/facture", () => ({
  createFactureFromDevis: (...args: unknown[]) => createFactureFromDevisMock(...args),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    facture: {
      findMany: (...args: unknown[]) => factureFindMany(...args),
      count: (...args: unknown[]) => factureCount(...args),
    },
  },
}));

import { GET, POST } from "@/app/api/factures/route";

describe("API /api/factures (intégration route handler)", () => {
  beforeEach(() => {
    getSession.mockReset();
    getAccountContext.mockReset();
    userNeedsSubscriptionSetup.mockReset();
    checkRateLimit.mockReset();
    createFactureFromDevisMock.mockReset();
    factureFindMany.mockReset();
    factureCount.mockReset();

    getSession.mockResolvedValue(TEST_SESSION_USER);
    getAccountContext.mockResolvedValue(TEST_ACCOUNT);
    userNeedsSubscriptionSetup.mockResolvedValue(false);
    checkRateLimit.mockResolvedValue(undefined);
  });

  it("POST convertit un devis accepté en facture", async () => {
    const facture = { id: "fac_1", numero: "FAC-2026-001", totalTTC: 600 };
    createFactureFromDevisMock.mockResolvedValue(facture);

    const request = buildApiRequest("/api/factures", {
      method: "POST",
      body: JSON.stringify({ devisId: "devis_1" }),
    });

    const response = await POST(request);
    const body = await readJson<{ id: string; numero: string }>(response);

    expect(response.status).toBe(201);
    expect(body.numero).toBe("FAC-2026-001");
    expect(createFactureFromDevisMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: TEST_ACCOUNT.workspaceUserId }),
      "devis_1"
    );
  });

  it("POST renvoie 400 sans devisId", async () => {
    const request = buildApiRequest("/api/factures", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/devisId/i);
  });

  it("POST propage une erreur métier (devis non accepté)", async () => {
    createFactureFromDevisMock.mockRejectedValue(new Error("Seul un devis accepté peut être converti en facture."));

    const request = buildApiRequest("/api/factures", {
      method: "POST",
      body: JSON.stringify({ devisId: "devis_1" }),
    });

    const response = await POST(request);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/accepté/i);
  });

  it("POST renvoie 403 sur IDOR (ForbiddenError)", async () => {
    createFactureFromDevisMock.mockRejectedValue(new ForbiddenError("Devis introuvable ou non autorisé."));

    const request = buildApiRequest("/api/factures", {
      method: "POST",
      body: JSON.stringify({ devisId: "devis_other" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  it("GET liste paginée des factures", async () => {
    factureFindMany.mockResolvedValue([]);
    factureCount.mockResolvedValue(0);

    const response = await GET(buildApiRequest("/api/factures"));
    const body = await readJson<{ data: unknown[]; pagination: { page: number } }>(response);

    expect(response.status).toBe(200);
    expect(body.pagination.page).toBe(1);
    expect(factureFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 })
    );
  });
});
