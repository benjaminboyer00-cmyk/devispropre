import { z } from "zod";
import { TVA_RATES } from "../tva";

const ALLOWED_TVA_VALUES = TVA_RATES.map((r) => r.value);

export const loginSchema = z.object({
  email: z.string().email("Adresse email invalide."),
  password: z.string().min(1, "Mot de passe requis."),
});

export const magicLinkSchema = z.object({
  email: z.string().email("Adresse email invalide."),
});

export const registerSchema = z
  .object({
    email: z.string().email("Adresse email invalide."),
    password: z.string().optional(),
    name: z.string().min(2, "Nom : 2 caractères minimum.").max(120),
    phone: z.string().max(30).optional(),
    raisonSociale: z.string().min(2, "Raison sociale : 2 caractères minimum.").max(200),
    siret: z.string().min(9, "SIRET invalide.").max(20),
    adresse: z.string().min(2, "Adresse : 2 caractères minimum.").max(300),
    codePostal: z.string().min(4, "Code postal invalide.").max(10),
    ville: z.string().min(2, "Ville : 2 caractères minimum.").max(100),
  })
  .superRefine((data, ctx) => {
    if (data.password && data.password.length > 0 && data.password.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mot de passe : 8 caractères minimum.",
        path: ["password"],
      });
    }
  });

export const devisLigneSchema = z.object({
  description: z.string().min(1, "Description requise.").max(500, "Description trop longue (500 car. max)."),
  quantite: z.number().positive("Quantité invalide."),
  prixUnitaireHT: z.number().min(0, "Prix unitaire invalide."),
  tva: z
    .number()
    .refine((v) => ALLOWED_TVA_VALUES.includes(v as (typeof ALLOWED_TVA_VALUES)[number]), {
      message: "Taux TVA non autorisé (0 %, 5,5 %, 10 % ou 20 %).",
    })
    .optional(),
});

export const createDevisSchema = z.object({
  clientId: z.string().min(1, "Client requis."),
  lignes: z
    .array(devisLigneSchema)
    .min(1, "Ajoutez au moins une ligne.")
    .max(50, "Maximum 50 lignes par devis."),
  notes: z.string().max(2000, "Notes trop longues (2000 car. max).").optional(),
  validUntil: z.string().datetime().optional(),
});

/** Payload brouillon invité (localStorage) avant inscription. */
export const guestDevisDraftSchema = z.object({
  clientNom: z.string().min(1, "Nom du client requis.").max(200),
  clientTelephone: z.string().optional(),
  clientEmail: z.string().email("Email client invalide.").optional().or(z.literal("")),
  clientAdresse: z.string().max(500).optional(),
  lignes: z.array(devisLigneSchema).min(1).max(50),
  tvaApplicable: z.boolean().optional(),
  validUntil: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export type GuestDevisDraft = z.infer<typeof guestDevisDraftSchema>;

/** Payload devis pour file d'attente hors-ligne. */
export const queuedDevisPayloadSchema = z.object({
  clientId: z.string().optional(),
  newClient: z.string().max(200).optional(),
  lignes: z.array(devisLigneSchema).min(1).max(50),
});

export type QueuedDevisPayload = z.infer<typeof queuedDevisPayloadSchema>;

export const claimGuestDraftSchema = guestDevisDraftSchema.extend({
  draftId: z.string().uuid("Identifiant brouillon invalide."),
  claimSignature: z.string().min(64, "Jeton de réclamation manquant."),
  signedAt: z.string().datetime().optional(),
});

export type ClaimGuestDraftInput = z.infer<typeof claimGuestDraftSchema>;

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
