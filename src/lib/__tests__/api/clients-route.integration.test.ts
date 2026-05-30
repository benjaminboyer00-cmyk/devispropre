import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  TEST_ACCOUNT,
  TEST_SESSION_USER,
  buildApiRequest,
  readJson,
} from "./test-request";

const getSession = vi.fn();
const getAccountContext = vi.fn();
const userNeedsSubscriptionSetup = vi.fn();
const clientFindMany = vi.fn();
const clientCount = vi.fn();
const clientCreate = vi.fn();
const logAudit = vi.fn();

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

vi.mock("@/lib/audit", () => ({
  logAudit: (...args: unknown[]) => logAudit(...args),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    client: {
      findMany: (...args: unknown[]) => clientFindMany(...args),
      count: (...args: unknown[]) => clientCount(...args),
      create: (...args: unknown[]) => clientCreate(...args),
    },
  },
}));

import { GET, POST } from "@/app/api/clients/route";

describe("API /api/clients (intégration route handler)", () => {
  beforeEach(() => {
    getSession.mockReset();
    getAccountContext.mockReset();
    userNeedsSubscriptionSetup.mockReset();
    clientFindMany.mockReset();
    clientCount.mockReset();
    clientCreate.mockReset();
    logAudit.mockReset();

    getSession.mockResolvedValue(TEST_SESSION_USER);
    getAccountContext.mockResolvedValue(TEST_ACCOUNT);
    userNeedsSubscriptionSetup.mockResolvedValue(true);
  });

  it("GET pagine les clients (page 1)", async () => {
    const clients = Array.from({ length: 20 }, (_, i) => ({
      id: `client_${i}`,
      nom: `Client ${String.fromCharCode(65 + i)}`,
    }));
    clientFindMany.mockResolvedValue(clients);
    clientCount.mockResolvedValue(45);

    const response = await GET(buildApiRequest("/api/clients?page=1"));
    const body = await readJson<{
      data: { id: string }[];
      pagination: { page: number; pageSize: number; total: number; totalPages: number };
    }>(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(20);
    expect(body.pagination).toEqual({
      page: 1,
      pageSize: 20,
      total: 45,
      totalPages: 3,
    });
    expect(clientFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: TEST_ACCOUNT.workspaceUserId, deletedAt: null },
        orderBy: { nom: "asc" },
        skip: 0,
        take: 20,
      })
    );
  });

  it("GET page 2 avec skip correct", async () => {
    clientFindMany.mockResolvedValue([{ id: "client_21", nom: "Client Z" }]);
    clientCount.mockResolvedValue(21);

    const response = await GET(buildApiRequest("/api/clients?page=2"));
    const body = await readJson<{
      pagination: { page: number; totalPages: number };
    }>(response);

    expect(response.status).toBe(200);
    expect(body.pagination.page).toBe(2);
    expect(body.pagination.totalPages).toBe(2);
    expect(clientFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 20 })
    );
  });

  it("POST crée un client même sans essai Stripe activé", async () => {
    clientCreate.mockResolvedValue({
      id: "client_new",
      nom: "Dupont",
      email: null,
      telephone: null,
      adresse: null,
    });

    const response = await POST(
      buildApiRequest("/api/clients", {
        method: "POST",
        body: JSON.stringify({ nom: "Dupont" }),
      })
    );
    const body = await readJson<{ id: string; nom: string }>(response);

    expect(response.status).toBe(201);
    expect(body).toEqual(
      expect.objectContaining({ id: "client_new", nom: "Dupont" })
    );
    expect(clientCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: TEST_ACCOUNT.workspaceUserId,
          nom: "Dupont",
        }),
      })
    );
  });
});
