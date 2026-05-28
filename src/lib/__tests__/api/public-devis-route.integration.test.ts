import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildApiRequest, buildCrossSiteRequest, readJson } from "./test-request";

const VALID_TOKEN = "b".repeat(64);
const INVALID_TOKEN = "not-a-token";

const checkRateLimit = vi.fn();
const devisFindFirst = vi.fn();
const transitionDevisStatusFromPublic = vi.fn();
const consumeDevisSignatureOtp = vi.fn();

vi.mock("@/lib/devis-signature-otp", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/devis-signature-otp")>();
  return {
    ...actual,
    consumeDevisSignatureOtp: (...args: unknown[]) => consumeDevisSignatureOtp(...args),
  };
});

vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...actual,
    checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
  };
});

vi.mock("@/lib/idempotency", () => ({
  readIdempotencyKey: () => "idem-1",
  withIdempotency: async (
    _userId: string,
    _key: string | null,
    handler: () => Promise<{ status: number; body: unknown }>
  ) => {
    const { status, body } = await handler();
    return Response.json(body, { status });
  },
}));

vi.mock("@/lib/services/devis", () => ({
  transitionDevisStatusFromPublic: (...args: unknown[]) =>
    transitionDevisStatusFromPublic(...args),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    devis: {
      findFirst: (...args: unknown[]) => devisFindFirst(...args),
    },
  },
}));

import { GET, POST } from "@/app/api/public/devis/[token]/route";

const PNG_SIGNATURE = "data:image/png;base64,iVBORw0KGgo=";

function mockEnvoieDevis(overrides: Record<string, unknown> = {}) {
  const sentAt = new Date("2026-05-01T10:00:00Z");
  const validUntil = new Date("2026-06-15T23:59:59.999Z");
  return {
    id: "devis_1",
    userId: "user_1",
    numero: "DEV-2026-001",
    status: "ENVOYE",
    totalHT: 100,
    totalTVA: 20,
    totalTTC: 120,
    sentAt,
    validUntil,
    notes: null,
    createdAt: sentAt,
    contentHash: null,
    lockedAt: sentAt,
    acceptedAt: null,
    clientAcceptanceText: null,
    clientSignatureData: null,
    lignes: [],
    client: {
      nom: "Client Test",
      adresse: null,
      telephone: null,
      email: "client@example.com",
    },
    user: { company: null },
    ...overrides,
  };
}

describe("API /api/public/devis/[token]", () => {
  beforeEach(() => {
    checkRateLimit.mockReset();
    devisFindFirst.mockReset();
    transitionDevisStatusFromPublic.mockReset();
    consumeDevisSignatureOtp.mockReset();
    checkRateLimit.mockResolvedValue(undefined);
    consumeDevisSignatureOtp.mockResolvedValue(true);
  });

  it("GET rejette un token mal formé sans requête DB", async () => {
    const res = await GET(
      buildApiRequest(`/api/public/devis/${INVALID_TOKEN}`),
      { params: Promise.resolve({ token: INVALID_TOKEN }) }
    );
    expect(res.status).toBe(404);
    expect(devisFindFirst).not.toHaveBeenCalled();
  });

  it("GET expose canAccept=false si le lien est expiré", async () => {
    devisFindFirst.mockResolvedValue(
      mockEnvoieDevis({
        sentAt: new Date("2020-01-01T10:00:00Z"),
        validUntil: new Date("2030-01-01T23:59:59.999Z"),
      })
    );

    const res = await GET(
      buildApiRequest(`/api/public/devis/${VALID_TOKEN}`),
      { params: Promise.resolve({ token: VALID_TOKEN }) }
    );
    const body = await readJson<{ canAccept: boolean; linkExpired: boolean }>(res);

    expect(res.status).toBe(200);
    expect(body.linkExpired).toBe(true);
    expect(body.canAccept).toBe(false);
  });

  it("POST refuse un lien expiré (410)", async () => {
    devisFindFirst.mockResolvedValue(
      mockEnvoieDevis({
        sentAt: new Date("2020-01-01T10:00:00Z"),
        validUntil: new Date("2030-01-01T23:59:59.999Z"),
      })
    );

    const res = await POST(
      buildApiRequest(`/api/public/devis/${VALID_TOKEN}`, {
        method: "POST",
        body: JSON.stringify({
          status: "ACCEPTE",
          acceptanceText: "Bon pour accord",
          signatureData: PNG_SIGNATURE,
        }),
      }),
      { params: Promise.resolve({ token: VALID_TOKEN }) }
    );

    expect(res.status).toBe(410);
    expect(transitionDevisStatusFromPublic).not.toHaveBeenCalled();
  });

  it("POST refuse une double acceptation (devis déjà traité)", async () => {
    devisFindFirst.mockResolvedValue(null);

    const res = await POST(
      buildApiRequest(`/api/public/devis/${VALID_TOKEN}`, {
        method: "POST",
        body: JSON.stringify({
          status: "ACCEPTE",
          acceptanceText: "Bon pour accord",
          signatureData: PNG_SIGNATURE,
        }),
      }),
      { params: Promise.resolve({ token: VALID_TOKEN }) }
    );

    expect(res.status).toBe(404);
    expect(transitionDevisStatusFromPublic).not.toHaveBeenCalled();
  });

  it("POST refuse l'acceptation sans OTP quand email client présent", async () => {
    devisFindFirst.mockResolvedValue(mockEnvoieDevis());

    const res = await POST(
      buildApiRequest(`/api/public/devis/${VALID_TOKEN}`, {
        method: "POST",
        body: JSON.stringify({
          status: "ACCEPTE",
          acceptanceText: "Bon pour accord",
          signatureData: PNG_SIGNATURE,
        }),
      }),
      { params: Promise.resolve({ token: VALID_TOKEN }) }
    );

    expect(res.status).toBe(401);
    expect(consumeDevisSignatureOtp).not.toHaveBeenCalled();
    expect(transitionDevisStatusFromPublic).not.toHaveBeenCalled();
  });

  it("POST accepte avec signature et OTP valides", async () => {
    devisFindFirst.mockResolvedValue(mockEnvoieDevis());
    transitionDevisStatusFromPublic.mockResolvedValue({ status: "ACCEPTE" });

    const res = await POST(
      buildApiRequest(`/api/public/devis/${VALID_TOKEN}`, {
        method: "POST",
        body: JSON.stringify({
          status: "ACCEPTE",
          acceptanceText: "Bon pour accord",
          signatureData: PNG_SIGNATURE,
          otpCode: "123456",
        }),
      }),
      { params: Promise.resolve({ token: VALID_TOKEN }) }
    );

    expect(res.status).toBe(200);
    expect(consumeDevisSignatureOtp).toHaveBeenCalledWith("devis_1", "123456");
    expect(transitionDevisStatusFromPublic).toHaveBeenCalled();
  });

  it("POST accepte sans OTP si le client n'a pas d'email", async () => {
    devisFindFirst.mockResolvedValue(mockEnvoieDevis({ client: { nom: "Client", email: null } }));
    transitionDevisStatusFromPublic.mockResolvedValue({ status: "ACCEPTE" });

    const res = await POST(
      buildApiRequest(`/api/public/devis/${VALID_TOKEN}`, {
        method: "POST",
        body: JSON.stringify({
          status: "ACCEPTE",
          acceptanceText: "Bon pour accord",
          signatureData: PNG_SIGNATURE,
        }),
      }),
      { params: Promise.resolve({ token: VALID_TOKEN }) }
    );

    expect(res.status).toBe(200);
    expect(consumeDevisSignatureOtp).not.toHaveBeenCalled();
  });

  it("POST rejette une requête cross-site (CSRF)", async () => {
    devisFindFirst.mockResolvedValue(mockEnvoieDevis());

    const res = await POST(
      buildCrossSiteRequest(`/api/public/devis/${VALID_TOKEN}`, {
        method: "POST",
        body: JSON.stringify({ status: "REFUSE" }),
      }),
      { params: Promise.resolve({ token: VALID_TOKEN }) }
    );

    expect(res.status).toBe(403);
    expect(transitionDevisStatusFromPublic).not.toHaveBeenCalled();
  });
});
