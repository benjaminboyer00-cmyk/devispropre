import { describe, expect, it, vi, beforeEach } from "vitest";
import { Prisma } from "@/generated/prisma/client";

const createMock = vi.fn();

vi.mock("../db", () => ({
  prisma: {
    stripeWebhookEvent: {
      create: (...args: unknown[]) => createMock(...args),
    },
  },
}));

import { claimStripeWebhookEvent, isPrismaUniqueViolation } from "../stripe-webhook-idempotency";

describe("stripe-webhook-idempotency", () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it("claim un nouvel événement Stripe", async () => {
    createMock.mockResolvedValue({ id: "1", eventId: "evt_1", type: "invoice.paid" });
    const claimed = await claimStripeWebhookEvent("evt_1", "invoice.paid");
    expect(claimed).toBe(true);
    expect(createMock).toHaveBeenCalledWith({
      data: { eventId: "evt_1", type: "invoice.paid" },
    });
  });

  it("refuse un événement déjà traité (P2002)", async () => {
    createMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "test",
      })
    );
    const claimed = await claimStripeWebhookEvent("evt_dup", "invoice.paid");
    expect(claimed).toBe(false);
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
