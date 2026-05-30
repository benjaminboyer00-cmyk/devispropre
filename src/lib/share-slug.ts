import type { PrismaClient } from "@/generated/prisma/client";
import { isValidShareTokenFormat } from "./share-token";
import { resolveShareTokenRaw, shareTokenLookupWhere } from "./share-token-storage";

const SLUG_PATTERN = /^(devis|facture)-[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/;

export function slugifyDocumentNumero(numero: string): string {
  return numero
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function buildDevisShareSlug(numero: string): string {
  const clean = slugifyDocumentNumero(numero);
  return clean ? `devis-${clean}` : "devis-document";
}

export function buildFactureShareSlug(numero: string): string {
  const clean = slugifyDocumentNumero(numero);
  return clean ? `facture-${clean}` : "facture-document";
}

export function isValidShareSlugFormat(ref: string): boolean {
  return SLUG_PATTERN.test(ref.trim().toLowerCase());
}

export function isValidPublicShareRef(ref: string): boolean {
  const trimmed = ref.trim();
  return isValidShareTokenFormat(trimmed) || isValidShareSlugFormat(trimmed);
}

/** Résolution URL publique : slug lisible ou token legacy (64 hex). */
export function publicShareLookupWhere(ref: string) {
  const trimmed = decodeURIComponent(ref.trim());
  if (isValidShareTokenFormat(trimmed)) {
    return shareTokenLookupWhere(trimmed);
  }
  if (isValidShareSlugFormat(trimmed)) {
    return { shareSlug: trimmed.toLowerCase() };
  }
  return { id: "__invalid_public_share_ref__" };
}

type DbLike = Pick<PrismaClient, "devis" | "facture">;

async function shareSlugExists(db: DbLike, slug: string): Promise<boolean> {
  const [devis, facture] = await Promise.all([
    db.devis.findFirst({ where: { shareSlug: slug }, select: { id: true } }),
    db.facture.findFirst({ where: { shareSlug: slug }, select: { id: true } }),
  ]);
  return Boolean(devis || facture);
}

/** Slug global unique — suffixe court du token en cas de collision. */
export async function ensureUniqueShareSlug(
  db: DbLike,
  kind: "devis" | "facture",
  numero: string,
  tokenRaw: string
): Promise<string> {
  const base = kind === "devis" ? buildDevisShareSlug(numero) : buildFactureShareSlug(numero);
  let candidate = base;
  let attempt = 0;

  while (await shareSlugExists(db, candidate)) {
    attempt += 1;
    const suffix = tokenRaw.replace(/[^a-f0-9]/gi, "").slice(0, 4 + attempt * 2);
    candidate = suffix ? `${base}-${suffix}` : `${base}-${attempt}`;
  }

  return candidate;
}

/** Référence publique pour construire l’URL (slug prioritaire, token legacy sinon). */
export function resolvePublicShareRef(record: {
  shareSlug?: string | null;
  shareTokenHash: string | null;
  shareTokenEnc?: string | null;
}): string | null {
  if (record.shareSlug) return record.shareSlug;
  return resolveShareTokenRaw(record);
}
