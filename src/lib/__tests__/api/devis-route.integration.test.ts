import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  TEST_ACCOUNT,
  TEST_SESSION_USER,
  buildApiRequest,
  buildCrossSiteRequest,
  readJson,
} from "./test-request";

const getSession = vi.fn();
const getAccountContext = vi.fn();
const userNeedsSubscriptionSetup = vi.fn();
const checkRateLimit = vi.fn();
const createDevis = vi.fn();
const devisFindMany = vi.fn();
const devisCount = vi.fn();

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
    devisCreateKey: (id: string) => `devis:create:${id}`,
  };
});

vi.mock("@/lib/services/devis", () => ({
  createDevis: (...args: unknown[]) => createDevis(...args),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    devis: {
      findMany: (...args: unknown[]) => devisFindMany(...args),
      count: (...args: unknown[]) => devisCount(...args),
    },
  },
}));

import { GET, POST } from "@/app/api/devis/route";

describe("API /api/devis (intégration route handler)", () => {
  beforeEach(() => {
    getSession.mockReset();
    getAccountContext.mockReset();
    userNeedsSubscriptionSetup.mockReset();
    checkRateLimit.mockReset();
    createDevis.mockReset();
    devisFindMany.mockReset();
    devisCount.mockReset();

    getSession.mockResolvedValue(TEST_SESSION_USER);
    getAccountContext.mockResolvedValue(TEST_ACCOUNT);
    userNeedsSubscriptionSetup.mockResolvedValue(false);
    checkRateLimit.mockResolvedValue(undefined);
  });

  it("POST crée un devis pour une session authentifiée", async () => {
    const created = {
      id: "devis_new",
      numero: "DEV-2026-042",
      totalTTC: 120,
    };
    createDevis.mockResolvedValue(created);

    const request = buildApiRequest("/api/devis", {
      method: "POST",
      body: JSON.stringify({
        clientId: "client_1",
        lignes: [{ description: "Pose", quantite: 1, prixUnitaireHT: 100, tva: 20 }],
      }),
    });

    const response = await POST(request);
    const body = await readJson<{ id: string; numero: string }>(response);

    expect(response.status).toBe(201);
    expect(body.id).toBe("devis_new");
    expect(createDevis).toHaveBeenCalledWith(
      expect.objectContaining({ userId: TEST_ACCOUNT.workspaceUserId }),
      expect.objectContaining({ clientId: "client_1" })
    );
  });

  it("POST renvoie 401 sans session", async () => {
    getSession.mockResolvedValue(null);

    const request = buildApiRequest("/api/devis", {
      method: "POST",
      body: JSON.stringify({
        clientId: "client_1",
        lignes: [{ description: "Pose", quantite: 1, prixUnitaireHT: 100, tva: 20 }],
      }),
    });

    const response = await POST(request);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(401);
    expect(body.error).toMatch(/authentifié/i);
    expect(createDevis).not.toHaveBeenCalled();
  });

  it("POST renvoie 400 sur payload Zod invalide", async () => {
    const request = buildApiRequest("/api/devis", {
      method: "POST",
      body: JSON.stringify({ clientId: "client_1", lignes: [] }),
    });

    const response = await POST(request);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/ligne/i);
    expect(createDevis).not.toHaveBeenCalled();
  });

  it("POST renvoie 403 sur requête cross-site", async () => {
    const request = buildCrossSiteRequest("/api/devis", {
      method: "POST",
      body: JSON.stringify({
        clientId: "client_1",
        lignes: [{ description: "Pose", quantite: 1, prixUnitaireHT: 100, tva: 20 }],
      }),
    });

    const response = await POST(request);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(403);
    expect(body.error).toMatch(/origine/i);
    expect(createDevis).not.toHaveBeenCalled();
  });

  it("GET liste paginée des devis", async () => {
    devisFindMany.mockResolvedValue([{ id: "d1", numero: "DEV-1" }]);
    devisCount.mockResolvedValue(25);

    const request = buildApiRequest("/api/devis?page=2");
    const response = await GET(request);
    const body = await readJson<{
      data: { id: string }[];
      pagination: { page: number; total: number; totalPages: number };
    }>(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.pagination.page).toBe(2);
    expect(body.pagination.total).toBe(25);
    expect(body.pagination.totalPages).toBe(2);
    expect(devisFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 20 })
    );
  });

  it("GET renvoie 401 sans session", async () => {
    getSession.mockResolvedValue(null);

    const response = await GET(buildApiRequest("/api/devis"));
    expect(response.status).toBe(401);
  });
});
