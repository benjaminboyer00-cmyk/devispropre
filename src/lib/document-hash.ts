import type { Client, Company, Devis, DevisLigne, Facture, FactureLigne } from "@/generated/prisma/client";
import { canonicalize, sha256 } from "./crypto";

type DevisWithRelations = Devis & {
  lignes: DevisLigne[];
  client: Client;
};

type FactureWithRelations = Facture & {
  lignes: FactureLigne[];
  client: Client;
};

function buildCompanyPayload(company: Company | null) {
  if (!company) return null;
  return {
    raisonSociale: company.raisonSociale,
    siret: company.siret,
    adresse: company.adresse,
    codePostal: company.codePostal,
    ville: company.ville,
    tvaIntracom: company.tvaIntracom,
  };
}

export function buildDevisPayload(
  devis: DevisWithRelations,
  company: Company | null
) {
  return {
    type: "devis" as const,
    numero: devis.numero,
    status: devis.status,
    totalHT: devis.totalHT,
    totalTVA: devis.totalTVA,
    totalTTC: devis.totalTTC,
    tauxTVA: devis.tauxTVA,
    notes: devis.notes,
    validUntil: devis.validUntil?.toISOString() ?? null,
    client: {
      nom: devis.client.nom,
      email: devis.client.email,
      telephone: devis.client.telephone,
      adresse: devis.client.adresse,
    },
    company: buildCompanyPayload(company),
    lignes: devis.lignes
      .sort((a, b) => a.ordre - b.ordre)
      .map((l) => ({
        ordre: l.ordre,
        description: l.description,
        quantite: l.quantite,
        prixUnitaireHT: l.prixUnitaireHT,
        tva: l.tva,
        totalHT: l.totalHT,
      })),
  };
}

export function buildFacturePayload(
  facture: FactureWithRelations,
  company: Company | null
) {
  return {
    type: "facture" as const,
    numero: facture.numero,
    status: facture.status,
    totalHT: facture.totalHT,
    totalTVA: facture.totalTVA,
    totalTTC: facture.totalTTC,
    tauxTVA: facture.tauxTVA,
    notes: facture.notes,
    dateEcheance: facture.dateEcheance?.toISOString() ?? null,
    client: {
      nom: facture.client.nom,
      email: facture.client.email,
      telephone: facture.client.telephone,
      adresse: facture.client.adresse,
    },
    company: buildCompanyPayload(company),
    lignes: facture.lignes
      .sort((a, b) => a.ordre - b.ordre)
      .map((l) => ({
        ordre: l.ordre,
        description: l.description,
        quantite: l.quantite,
        prixUnitaireHT: l.prixUnitaireHT,
        tva: l.tva,
        totalHT: l.totalHT,
      })),
  };
}

export function computeContentHash(payload: Record<string, unknown>): string {
  return sha256(canonicalize(payload));
}

export function computeChainHash(
  contentHash: string,
  previousHash: string | null
): string {
  return sha256(`${previousHash ?? "GENESIS"}:${contentHash}`);
}

export function verifyDocumentIntegrity(
  storedHash: string | null,
  payload: Record<string, unknown>
): boolean {
  if (!storedHash) return false;
  return computeContentHash(payload) === storedHash;
}
