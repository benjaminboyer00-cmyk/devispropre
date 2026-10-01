import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildApiRequest, buildCrossSiteRequest, readJson } from "./test-request";

const VALID_TOKEN = "b".repeat(64);
const INVALID_TOKEN = "not-a-token";

const checkRateLimit = vi.fn();
const devisFindFirst = vi.fn();
const transitionDevisStatusFromPublic = vi.fn();
const consumeDevisSignatureOtp = vi.fn();
const verifyDevisSignatureOtp = vi.fn();

vi.mock("@/lib/devis-signature-otp", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/devis-signature-otp")>();
  return {
    ...actual,
    consumeDevisSignatureOtp: (...args: unknown[]) => consumeDevisSignatureOtp(...args),
    verifyDevisSignatureOtp: (...args: unknown[]) => verifyDevisSignatureOtp(...args),
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

const PNG_SIGNATURE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function mockEnvoieDevis(overrides: Record<string, unknown> = {}) {
  // Dates relatives : le lien doit rester valide quel que soit le jour d'exécution des tests.
  const sentAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
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
    verifyDevisSignatureOtp.mockReset();
    checkRateLimit.mockResolvedValue(undefined);
    verifyDevisSignatureOtp.mockResolvedValue({
      status: "ok",
      email: "client@example.com",
      sentAt: new Date("2026-05-02T10:00:00Z"),
    });
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

  const SIGN_BODY = {
    status: "ACCEPTE",
    acceptanceText: "Bon pour accord",
    signatureData: PNG_SIGNATURE,
    signerName: "Client Test",
    otpCode: "123456",
    retractationInfoAcknowledged: true,
  };

  function signRequest(body: Record<string, unknown>) {
    return POST(
      buildApiRequest(`/api/public/devis/${VALID_TOKEN}`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ token: VALID_TOKEN }) }
    );
  }

  it("POST refuse une signature sans code OTP", async () => {
    devisFindFirst.mockResolvedValue(mockEnvoieDevis());
    const { otpCode: _omit, ...withoutOtp } = SIGN_BODY;

    const res = await signRequest(withoutOtp);

    expect(res.status).toBe(400);
    expect(verifyDevisSignatureOtp).not.toHaveBeenCalled();
    expect(transitionDevisStatusFromPublic).not.toHaveBeenCalled();
  });

  it("POST refuse une signature sans nom du signataire ni accusé rétractation", async () => {
    devisFindFirst.mockResolvedValue(mockEnvoieDevis());

    expect((await signRequest({ ...SIGN_BODY, signerName: "" })).status).toBe(400);
    expect((await signRequest({ ...SIGN_BODY, retractationInfoAcknowledged: false })).status).toBe(400);
    expect(transitionDevisStatusFromPublic).not.toHaveBeenCalled();
  });

  it("POST refuse un code OTP incorrect", async () => {
    devisFindFirst.mockResolvedValue(mockEnvoieDevis());
    verifyDevisSignatureOtp.mockResolvedValue({ status: "invalid", email: null, sentAt: null });

    const res = await signRequest(SIGN_BODY);
    const body = await readJson<{ error: string }>(res);

    expect(res.status).toBe(400);
    expect(body.error).toContain("incorrect");
    expect(transitionDevisStatusFromPublic).not.toHaveBeenCalled();
  });

  it("POST bloque après trop de tentatives OTP (429)", async () => {
    devisFindFirst.mockResolvedValue(mockEnvoieDevis());
    verifyDevisSignatureOtp.mockResolvedValue({ status: "locked", email: null, sentAt: null });

    const res = await signRequest(SIGN_BODY);

    expect(res.status).toBe(429);
    expect(transitionDevisStatusFromPublic).not.toHaveBeenCalled();
  });

  it("POST signe avec OTP valide et transmet la preuve d'identité", async () => {
    devisFindFirst.mockResolvedValue(mockEnvoieDevis());
    transitionDevisStatusFromPublic.mockResolvedValue({ status: "ACCEPTE" });

    const res = await signRequest({ ...SIGN_BODY, earlyExecutionRequested: true });

    expect(res.status).toBe(200);
    expect(verifyDevisSignatureOtp).toHaveBeenCalledWith("devis_1", "123456");
    const acceptance = transitionDevisStatusFromPublic.mock.calls[0][4];
    expect(acceptance).toMatchObject({
      signerName: "Client Test",
      signerEmail: "client@example.com",
      signerEmailSource: "client_record",
      retractationInfoAcknowledged: true,
      earlyExecutionRequested: true,
    });
  });

  it("POST marque l'email comme déclaré si la fiche client n'en a pas", async () => {
    devisFindFirst.mockResolvedValue(mockEnvoieDevis({ client: { nom: "Client", email: null } }));
    verifyDevisSignatureOtp.mockResolvedValue({
      status: "ok",
      email: "declare@example.com",
      sentAt: new Date(),
    });
    transitionDevisStatusFromPublic.mockResolvedValue({ status: "ACCEPTE" });

    const res = await signRequest(SIGN_BODY);

    expect(res.status).toBe(200);
    expect(transitionDevisStatusFromPublic.mock.calls[0][4]).toMatchObject({
      signerEmail: "declare@example.com",
      signerEmailSource: "declared_by_signer",
    });
  });

  it("POST refus du devis sans OTP", async () => {
    devisFindFirst.mockResolvedValue(mockEnvoieDevis());
    transitionDevisStatusFromPublic.mockResolvedValue({ status: "REFUSE" });

    const res = await signRequest({ status: "REFUSE" });

    expect(res.status).toBe(200);
    expect(verifyDevisSignatureOtp).not.toHaveBeenCalled();
    expect(transitionDevisStatusFromPublic.mock.calls[0][4]).toBeUndefined();
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
