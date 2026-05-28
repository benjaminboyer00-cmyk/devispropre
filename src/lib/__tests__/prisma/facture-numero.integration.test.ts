import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { nextFactureNumeroInTransaction } from "@/lib/numbers";
import {
  createIntegrationUser,
  deleteIntegrationUser,
  disconnectTestPrisma,
  getTestPrisma,
  isTestDatabaseAvailable,
} from "./test-db";

const dbReady = await isTestDatabaseAvailable();
const year = new Date().getFullYear();

describe.skipIf(!dbReady)("Prisma — numérotation factures (base réelle)", () => {
  let userId = "";

  beforeAll(async () => {
    const prisma = await getTestPrisma();
    const user = await createIntegrationUser(prisma);
    userId = user.id;
  });

  afterAll(async () => {
    if (!userId) return;
    const prisma = await getTestPrisma();
    await deleteIntegrationUser(prisma, userId);
    await disconnectTestPrisma();
  });

  it("incrémente la séquence dans une transaction", async () => {
    const prisma = await getTestPrisma();

    const [first, second] = await prisma.$transaction(async (tx) => {
      const a = await nextFactureNumeroInTransaction(tx, userId);
      const b = await nextFactureNumeroInTransaction(tx, userId);
      return [a, b];
    });

    expect(first).toMatch(new RegExp(`^FAC-${year}-\\d{4}$`));
    expect(second).toMatch(new RegExp(`^FAC-${year}-\\d{4}$`));
    expect(first).not.toBe(second);

    const seqFirst = Number(first.split("-").pop());
    const seqSecond = Number(second.split("-").pop());
    expect(seqSecond).toBe(seqFirst + 1);
  });
});
