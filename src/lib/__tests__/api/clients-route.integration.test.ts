import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  TEST_ACCOUNT,
  TEST_SESSION_USER,
  buildApiRequest,
  readJson,
} from "./test-request";

const getSession = vi.fn();
const getAccountContext = vi.fn();
const clientFindMany = vi.fn();
const clientCount = vi.fn();

vi.mock("@/lib/auth", () => ({
  getSession: (...args: unknown[]) => getSession(...args),
}));

vi.mock("@/lib/account-context", () => ({
  getAccountContext: (...args: unknown[]) => getAccountContext(...args),
}));

vi.mock("@/lib/billing", () => ({
  billingUserId: (_uid: string, wsId: string) => wsId,
  userNeedsSubscriptionSetup: vi.fn().mockResolvedValue(false),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    client: {
      findMany: (...args: unknown[]) => clientFindMany(...args),
      count: (...args: unknown[]) => clientCount(...args),
    },
  },
}));

import { GET } from "@/app/api/clients/route";

describe("API /api/clients (intégration route handler)", () => {
  beforeEach(() => {
    getSession.mockReset();
    getAccountContext.mockReset();
    clientFindMany.mockReset();
    clientCount.mockReset();

    getSession.mockResolvedValue(TEST_SESSION_USER);
    getAccountContext.mockResolvedValue(TEST_ACCOUNT);
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
});
