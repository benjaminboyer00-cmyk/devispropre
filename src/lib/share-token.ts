/** Token opaque 32 octets → 64 hex (crypto.randomBytes). */
export const SHARE_TOKEN_HEX_LENGTH = 64;

/** Plafond absolu de validité d'un lien de partage (même si validUntil est lointain). */
export const SHARE_LINK_MAX_AGE_DAYS = 90;

const SHARE_TOKEN_PATTERN = /^[a-f0-9]{64}$/;

export function isValidShareTokenFormat(token: string): boolean {
  return SHARE_TOKEN_PATTERN.test(token);
}

/** Date limite du lien : min(validUntil, sentAt + plafond). */
export function computeShareLinkExpiresAt(devis: {
  sentAt: Date | null;
  validUntil: Date | null;
}): Date | null {
  const caps: Date[] = [];

  if (devis.validUntil) {
    caps.push(devis.validUntil);
  }

  if (devis.sentAt) {
    const maxAge = new Date(devis.sentAt);
    maxAge.setDate(maxAge.getDate() + SHARE_LINK_MAX_AGE_DAYS);
    caps.push(maxAge);
  }

  if (caps.length === 0) return null;

  return caps.reduce((earliest, d) => (d.getTime() < earliest.getTime() ? d : earliest));
}

export function isShareLinkExpired(devis: {
  sentAt: Date | null;
  validUntil: Date | null;
  now?: Date;
}): boolean {
  const expiresAt = computeShareLinkExpiresAt(devis);
  if (!expiresAt) return false;
  const now = devis.now ?? new Date();
  return now.getTime() > expiresAt.getTime();
}
