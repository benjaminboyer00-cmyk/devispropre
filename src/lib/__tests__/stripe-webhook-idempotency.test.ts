import { describe, expect, it, vi, beforeEach } from "vitest";
import { Prisma } from "@/generated/prisma/client";

const createMock = vi.fn();
const findUniqueMock = vi.fn();
const updateMock = vi.fn();
const executeRawMock = vi.fn();

vi.mock("../db", () => ({
  prisma: {
    stripeWebhookEvent: {
      create: (...args: unknown[]) => createMock(...args),
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
    },
    $transaction: (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        stripeWebhookEvent: {
          create: (...args: unknown[]) => createMock(...args),
          findUnique: (...args: unknown[]) => findUniqueMock(...args),
        },
        $executeRaw: (...args: unknown[]) => executeRawMock(...args),
      }),
  },
}));

import {
  claimStripeWebhookEvent,
  isPrismaUniqueViolation,
  markStripeWebhookEventProcessed,
} from "../stripe-webhook-idempotency";

describe("stripe-webhook-idempotency", () => {
  beforeEach(() => {
    createMock.mockReset();
    findUniqueMock.mockReset();
    updateMock.mockReset();
    executeRawMock.mockReset();
    executeRawMock.mockResolvedValue(undefined);
  });

  it("claim un nouvel événement Stripe", async () => {
    findUniqueMock.mockResolvedValue(null);
    createMock.mockResolvedValue({ id: "1", eventId: "evt_1", type: "invoice.paid" });
    const claimed = await claimStripeWebhookEvent("evt_1", "invoice.paid");
    expect(claimed).toBe(true);
    expect(createMock).toHaveBeenCalled();
  });

  it("refuse un événement déjà traité avec succès", async () => {
    findUniqueMock.mockResolvedValue({ processedAt: new Date() });
    const claimed = await claimStripeWebhookEvent("evt_dup", "invoice.paid");
    expect(claimed).toBe(false);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("autorise le retry si traitement précédent en échec (processedAt null)", async () => {
    findUniqueMock.mockResolvedValue({ processedAt: null });
    const claimed = await claimStripeWebhookEvent("evt_retry", "invoice.paid");
    expect(claimed).toBe(true);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("marque un événement comme traité", async () => {
    updateMock.mockResolvedValue({});
    await markStripeWebhookEventProcessed("evt_1");
    expect(updateMock).toHaveBeenCalledWith({
      where: { eventId: "evt_1" },
      data: { processedAt: expect.any(Date) },
    });
  });

  it("détecte une violation d'unicité Prisma", () => {
    const err = new Prisma.PrismaClientKnownRequestError("dup", {
      code: "P2002",
      clientVersion: "test",
    });
    expect(isPrismaUniqueViolation(err)).toBe(true);
    expect(isPrismaUniqueViolation(new Error("other"))).toBe(false);
  });
});
