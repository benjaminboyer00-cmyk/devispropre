import type { Company } from "@/generated/prisma/client";

/** Données émetteur figées au verrouillage du document (conformité fiscale). */
export type IssuerSnapshot = {
  raisonSociale: string;
  siret: string;
  adresse: string;
  codePostal: string;
  ville: string;
  tvaIntracom: string | null;
  tvaApplicable: boolean;
  rcs: string | null;
  capitalSocial: string | null;
  assurances: string | null;
  assuranceDecennaleAssureur: string | null;
  assuranceDecennaleContrat: string | null;
  assuranceDecennaleCouverture: string | null;
  activiteBtp: boolean;
};

export function snapshotFromCompany(company: Company | null): IssuerSnapshot | null {
  if (!company) return null;
  return {
    raisonSociale: company.raisonSociale,
    siret: company.siret,
    adresse: company.adresse,
    codePostal: company.codePostal,
    ville: company.ville,
    tvaIntracom: company.tvaIntracom,
    tvaApplicable: company.tvaApplicable,
    rcs: company.rcs,
    capitalSocial: company.capitalSocial,
    assurances: company.assurances,
    assuranceDecennaleAssureur: company.assuranceDecennaleAssureur,
    assuranceDecennaleContrat: company.assuranceDecennaleContrat,
    assuranceDecennaleCouverture: company.assuranceDecennaleCouverture,
    activiteBtp: company.activiteBtp,
  };
}

/** Reconstitue un objet Company minimal pour PDF / hash à partir du snapshot. */
export function companyFromSnapshot(snapshot: unknown): Company | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const s = snapshot as Partial<IssuerSnapshot>;
  if (!s.raisonSociale || !s.siret) return null;

  return {
    id: "snapshot",
    userId: "snapshot",
    raisonSociale: s.raisonSociale,
    siret: s.siret,
    adresse: s.adresse ?? "",
    codePostal: s.codePostal ?? "",
    ville: s.ville ?? "",
    tvaIntracom: s.tvaIntracom ?? null,
    tvaApplicable: s.tvaApplicable ?? true,
    rcs: s.rcs ?? null,
    capitalSocial: s.capitalSocial ?? null,
    assurances: s.assurances ?? null,
    assuranceDecennaleAssureur: s.assuranceDecennaleAssureur ?? null,
    assuranceDecennaleContrat: s.assuranceDecennaleContrat ?? null,
    assuranceDecennaleCouverture: s.assuranceDecennaleCouverture ?? null,
    activiteBtp: s.activiteBtp ?? false,
    logoUrl: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  } as Company;
}

export function resolveIssuerCompany(
  issuerSnapshot: unknown,
  liveCompany: Company | null
): Company | null {
  return companyFromSnapshot(issuerSnapshot) ?? liveCompany;
}
