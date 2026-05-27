import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Adresse email invalide."),
  password: z.string().min(1, "Mot de passe requis."),
});

export const magicLinkSchema = z.object({
  email: z.string().email("Adresse email invalide."),
});

export const registerSchema = z.object({
  email: z.string().email("Adresse email invalide."),
  password: z.string().min(8, "Mot de passe : 8 caractères minimum."),
  name: z.string().min(2, "Nom : 2 caractères minimum."),
  phone: z.string().optional(),
  raisonSociale: z.string().min(2, "Raison sociale : 2 caractères minimum."),
  siret: z.string().min(9, "SIRET invalide."),
  adresse: z.string().min(2, "Adresse : 2 caractères minimum."),
  codePostal: z.string().min(4, "Code postal invalide."),
  ville: z.string().min(2, "Ville : 2 caractères minimum."),
});

export const devisLigneSchema = z.object({
  description: z.string().min(1, "Description requise."),
  quantite: z.number().positive("Quantité invalide."),
  prixUnitaireHT: z.number().min(0, "Prix unitaire invalide."),
  tva: z.number().min(0).max(100).optional(),
});

export const createDevisSchema = z.object({
  clientId: z.string().min(1, "Client requis."),
  lignes: z.array(devisLigneSchema).min(1, "Ajoutez au moins une ligne."),
  notes: z.string().optional(),
  validUntil: z.string().datetime().optional(),
});

/** Payload devis pour file d'attente hors-ligne. */
export const queuedDevisPayloadSchema = z.object({
  clientId: z.string().optional(),
  newClient: z.string().optional(),
  lignes: z.array(devisLigneSchema).min(1),
});

export type QueuedDevisPayload = z.infer<typeof queuedDevisPayloadSchema>;

export const profileUpdateSchema = z.object({
  name: z.string().min(2, "Nom : 2 caractères minimum.").optional(),
  email: z.string().email("Adresse email invalide.").optional(),
  phone: z.string().optional().nullable(),
});

export const companyUpdateSchema = z.object({
  raisonSociale: z.string().min(2).optional(),
  siret: z.string().min(9).optional(),
  adresse: z.string().min(2).optional(),
  codePostal: z.string().min(4).optional(),
  ville: z.string().min(2).optional(),
  tvaApplicable: z.boolean().optional(),
});

/** Premier message d'erreur Zod lisible pour l'UI. */
export function formatZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Données invalides.";
}
