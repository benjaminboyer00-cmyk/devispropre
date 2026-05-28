import { describe, expect, it, vi, beforeEach } from "vitest";

const deleteManyMock = vi.fn();

vi.mock("../db", () => ({
  prisma: {
    idempotencyRecord: {
      deleteMany: (...args: unknown[]) => deleteManyMock(...args),
    },
  },
}));

import { purgeExpiredIdempotencyRecords } from "../services/cleanup";

describe("purgeExpiredIdempotencyRecords", () => {
  beforeEach(() => {
    deleteManyMock.mockReset();
    deleteManyMock.mockResolvedValue({ count: 5 });
  });

  it("supprime les enregistrements expirés ou > 30 jours", async () => {
    const result = await purgeExpiredIdempotencyRecords();
    expect(result.deleted).toBe(5);
    expect(deleteManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { expiresAt: { lt: expect.any(Date) } },
            { createdAt: { lt: expect.any(Date) } },
          ]),
        }),
      })
    );
  });
});
