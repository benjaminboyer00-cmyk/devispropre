import { FRANCHISE_MENTION } from "./tva";

/** Données émetteur affichées sur devis (web + PDF). */
export type DevisLegalCompany = {
  raisonSociale: string;
  siret: string;
  adresse: string;
  codePostal: string;
  ville: string;
  tvaApplicable: boolean;
  tvaIntracom?: string | null;
  rcs?: string | null;
  capitalSocial?: string | null;
  telephone?: string | null;
  email?: string | null;
  assurances?: string | null;
  assuranceDecennaleAssureur?: string | null;
  assuranceDecennaleContrat?: string | null;
  assuranceDecennaleCouverture?: string | null;
  activiteBtp?: boolean;
};

export const DEVIS_PAYMENT_TERMS =
  "Conditions de paiement : Paiement à réception de facture. Acompte de 30 % à la commande, solde à la fin des travaux.";

export const DEVIS_LATE_PAYMENT_PENALTY =
  "En cas de retard de paiement, application d'une pénalité égale à 3 fois le taux d'intérêt légal en vigueur (Art. L 441-6 du Code de commerce).";

export const DEVIS_RECOVERY_FEE =
  "Indemnité forfaitaire pour frais de recouvrement due au créancier en cas de retard de paiement : 40 € (Art. D 441-5 du Code de commerce).";

export function formatAssuranceDecennale(company: DevisLegalCompany | null | undefined): string | null {
  if (!company || !company.activiteBtp) return null;

  const assureur = company.assuranceDecennaleAssureur?.trim();
  const contrat = company.assuranceDecennaleContrat?.trim();
  const couverture = company.assuranceDecennaleCouverture?.trim() || "France";

  if (assureur && contrat) {
    return `Assurance décennale souscrite auprès de ${assureur}, contrat n° ${contrat}, couverture géographique : ${couverture}.`;
  }

  const legacy = company.assurances?.trim();
  if (legacy && /d[ée]cennale/i.test(legacy)) return legacy;

  return null;
}

/** Affiche le bloc décennale uniquement pour les artisans BTP avec infos renseignées. */
export function shouldShowAssuranceDecennale(company: DevisLegalCompany | null | undefined): boolean {
  return Boolean(company?.activiteBtp && formatAssuranceDecennale(company));
}

export function companyIssuerLines(company: DevisLegalCompany): string[] {
  const lines = [
    company.raisonSociale,
    `${company.adresse}, ${company.codePostal} ${company.ville}`,
    `SIRET : ${company.siret}`,
  ];
  if (company.rcs?.trim()) lines.push(company.rcs.trim());
  if (company.tvaApplicable && company.tvaIntracom?.trim()) {
    lines.push(`N° TVA intracommunautaire : ${company.tvaIntracom.trim()}`);
  }
  if (company.telephone?.trim()) lines.push(`Tél : ${company.telephone.trim()}`);
  if (company.email?.trim()) lines.push(company.email.trim());
  if (company.capitalSocial?.trim()) lines.push(`Capital social : ${company.capitalSocial.trim()}`);
  return lines;
}

export function devisLegalFooterLines(
  company: Pick<DevisLegalCompany, "tvaApplicable" | "assurances"> | null | undefined
): string[] {
  const lines = [DEVIS_PAYMENT_TERMS, DEVIS_LATE_PAYMENT_PENALTY, DEVIS_RECOVERY_FEE];
  if (company && !company.tvaApplicable) {
    lines.push(FRANCHISE_MENTION);
  }
  const rcPro = company?.assurances?.trim();
  if (rcPro && !/d[ée]cennale/i.test(rcPro)) {
    lines.push(`Assurances : ${rcPro}`);
  }
  return lines;
}

export function companyToLegal(company: {
  raisonSociale: string;
  siret: string;
  adresse: string;
  codePostal: string;
  ville: string;
  tvaApplicable: boolean;
  tvaIntracom?: string | null;
  rcs?: string | null;
  capitalSocial?: string | null;
  telephone?: string | null;
  email?: string | null;
  assurances?: string | null;
  assuranceDecennaleAssureur?: string | null;
  assuranceDecennaleContrat?: string | null;
  assuranceDecennaleCouverture?: string | null;
  activiteBtp?: boolean;
}): DevisLegalCompany {
  return {
    raisonSociale: company.raisonSociale,
    siret: company.siret,
    adresse: company.adresse,
    codePostal: company.codePostal,
    ville: company.ville,
    tvaApplicable: company.tvaApplicable,
    tvaIntracom: company.tvaIntracom,
    rcs: company.rcs,
    capitalSocial: company.capitalSocial,
    telephone: company.telephone,
    email: company.email,
    assurances: company.assurances,
    assuranceDecennaleAssureur: company.assuranceDecennaleAssureur,
    assuranceDecennaleContrat: company.assuranceDecennaleContrat,
    assuranceDecennaleCouverture: company.assuranceDecennaleCouverture,
    activiteBtp: company.activiteBtp ?? false,
  };
}

/**
 * Information précontractuelle — droit de rétractation (art. L221-5, L221-18, L221-25 C. conso.).
 * Applicable aux clients consommateurs pour un contrat conclu à distance (signature en ligne)
 * ou hors établissement. Sans cette information, le délai est prolongé de 12 mois (L221-20).
 */
export const DEVIS_RETRACTATION_TITLE = "Droit de rétractation (clients particuliers)";

export function devisRetractationLines(companyName?: string | null): string[] {
  const artisan = companyName?.trim() || "l'entreprise";
  return [
    "Si vous êtes un consommateur et que ce devis est signé à distance (en ligne) ou hors établissement, vous disposez d'un délai de 14 jours à compter de sa signature pour exercer votre droit de rétractation, sans avoir à motiver votre décision ni à supporter d'autres coûts (art. L221-18 du Code de la consommation).",
    `Pour l'exercer, adressez à ${artisan}, avant l'expiration du délai, le formulaire de rétractation ci-dessous ou toute autre déclaration dénuée d'ambiguïté (courrier ou e-mail aux coordonnées figurant sur le devis).`,
    "Les travaux ne peuvent commencer avant la fin de ce délai, sauf demande expresse de votre part. Si vous avez demandé un commencement anticipé puis vous rétractez, vous devrez un montant proportionnel aux travaux déjà réalisés (art. L221-25).",
    "Le droit de rétractation ne s'applique pas aux travaux d'entretien ou de réparation à réaliser en urgence à votre domicile et expressément sollicités par vous, dans la limite des pièces et travaux strictement nécessaires (art. L221-28, 8°).",
  ];
}

/** Modèle de formulaire de rétractation (annexe à l'art. R221-1 C. conso.). */
export function devisRetractationFormLines(params: {
  companyName?: string | null;
  companyAddress?: string | null;
  companyEmail?: string | null;
  devisNumero: string;
}): string[] {
  const dest = [params.companyName, params.companyAddress, params.companyEmail]
    .map((v) => v?.trim())
    .filter(Boolean)
    .join(", ");
  return [
    "FORMULAIRE DE RÉTRACTATION",
    "(Veuillez compléter et renvoyer le présent formulaire uniquement si vous souhaitez vous rétracter du contrat.)",
    `À l'attention de : ${dest || "l'entreprise émettrice du devis"}`,
    `Je vous notifie par la présente ma rétractation du contrat portant sur la prestation de services ci-dessous : devis n° ${params.devisNumero}`,
    "Signé le : ____________________",
    "Nom du consommateur : ____________________",
    "Adresse du consommateur : ____________________",
    "Signature du consommateur (uniquement en cas de notification sur papier) : ____________________",
    "Date : ____________________",
  ];
}
