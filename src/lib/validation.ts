/** Validation légère côté client — complète le Zod serveur. */

export function validateFrenchPhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(/[\s.-]/g, "");
  if (/^(?:\+33|0033|0)[1-9]\d{8}$/.test(normalized)) return null;
  return "Numéro de téléphone invalide (ex. 06 12 34 56 78).";
}

export function validateSiret(siret: string): string | null {
  const digits = siret.replace(/\s/g, "");
  if (/^\d{14}$/.test(digits)) return null;
  return "SIRET invalide — 14 chiffres requis.";
}

export function validateFrenchPostcode(code: string): string | null {
  if (/^\d{5}$/.test(code.trim())) return null;
  return "Code postal invalide (5 chiffres).";
}

export function validateEmail(email: string): string | null {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return null;
  return "Adresse email invalide.";
}

export function validatePassword(password: string): string | null {
  if (password.length >= 8) return null;
  return "Mot de passe : 8 caractères minimum.";
}
