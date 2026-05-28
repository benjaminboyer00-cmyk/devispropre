import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LIST_PAGE_SIZE, paginationBounds, totalPages } from "@/lib/pagination";
import {
  createIntegrationUser,
  deleteIntegrationUser,
  disconnectTestPrisma,
  getTestPrisma,
  isTestDatabaseAvailable,
} from "./test-db";

const dbReady = await isTestDatabaseAvailable();

describe.skipIf(!dbReady)("Prisma — pagination clients (base réelle)", () => {
  let userId = "";

  beforeAll(async () => {
    const prisma = await getTestPrisma();
    const user = await createIntegrationUser(prisma);
    userId = user.id;

    await prisma.client.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        userId,
        nom: `Client ${String(i).padStart(2, "0")}`,
      })),
    });
  });

  afterAll(async () => {
    if (!userId) return;
    const prisma = await getTestPrisma();
    await deleteIntegrationUser(prisma, userId);
    await disconnectTestPrisma();
  });

  it("retourne 20 clients sur la page 1 et 5 sur la page 2", async () => {
    const prisma = await getTestPrisma();
    const where = { userId, deletedAt: null };

    const page1 = paginationBounds(1);
    const page2 = paginationBounds(2);

    const [clientsP1, clientsP2, total] = await Promise.all([
      prisma.client.findMany({ where, orderBy: { nom: "asc" }, ...page1 }),
      prisma.client.findMany({ where, orderBy: { nom: "asc" }, ...page2 }),
      prisma.client.count({ where }),
    ]);

    expect(total).toBe(25);
    expect(clientsP1).toHaveLength(LIST_PAGE_SIZE);
    expect(clientsP2).toHaveLength(5);
    expect(totalPages(total)).toBe(2);
    expect(clientsP1[0]?.nom).toBe("Client 00");
    expect(clientsP2[0]?.nom).toBe("Client 20");
  });
});
