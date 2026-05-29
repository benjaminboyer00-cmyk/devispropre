/** Limites rate-limit routes publiques devis (signature client). */
export const PUBLIC_DEVIS_LIMITS = {
  readPerIp: { maxAttempts: 60, windowMs: 60 * 60 * 1000 },
  /** Acceptation / refus — durci post-audit (8/h/IP). */
  signPerIp: { maxAttempts: 8, windowMs: 60 * 60 * 1000 },
  otpRequestPerIp: { maxAttempts: 5, windowMs: 60 * 60 * 1000 },
  otpRequestPerDevis: { maxAttempts: 5, windowMs: 60 * 60 * 1000 },
  otpVerifyPerDevis: { maxAttempts: 5, windowMs: 60 * 60 * 1000 },
} as const;
