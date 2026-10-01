import { createHash } from "crypto";
import { canonicalize, sha256 } from "./crypto";

/** Version du format de preuve — à incrémenter si les champs changent. */
export const SIGNATURE_EVIDENCE_VERSION = 1;

/**
 * Dossier de preuve d'une signature électronique simple (eIDAS art. 25, C. civ. art. 1366-1367).
 * Lie l'identité vérifiée (OTP e-mail) au contenu exact du devis (contentHash) et à l'image signée.
 */
export interface SignatureEvidence {
  version: number;
  devisId: string;
  devisNumero: string;
  /** Empreinte du contenu du devis figée à l'envoi (cf. docs/HASH-SPEC.md). */
  contentHash: string;
  signerName: string;
  signerEmail: string;
  /** "client_record" = e-mail saisi par l'artisan ; "declared_by_signer" = saisi par le signataire. */
  signerEmailSource: "client_record" | "declared_by_signer";
  acceptanceText: string;
  /** SHA-256 des octets PNG de la signature manuscrite. */
  signatureImageSha256: string;
  signedAt: string;
  otpSentAt: string;
  otpVerifiedAt: string;
  retractationInfoAcknowledged: boolean;
  earlyExecutionRequested: boolean;
  ipAddress: string | null;
  userAgent: string | null;
}

export function sha256Buffer(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

export function signatureImageSha256(dataUri: string): string {
  const b64 = dataUri.slice(dataUri.indexOf(",") + 1);
  return sha256Buffer(Buffer.from(b64, "base64"));
}

export function computeSignatureEvidenceHash(evidence: SignatureEvidence): string {
  return sha256(canonicalize(evidence));
}

export function verifySignatureEvidence(evidence: SignatureEvidence, storedHash: string): boolean {
  return computeSignatureEvidenceHash(evidence) === storedHash;
}

export function isSignatureEvidence(value: unknown): value is SignatureEvidence {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.version === "number" &&
    typeof v.devisId === "string" &&
    typeof v.contentHash === "string" &&
    typeof v.signerName === "string" &&
    typeof v.signerEmail === "string" &&
    typeof v.signatureImageSha256 === "string" &&
    typeof v.signedAt === "string"
  );
}
