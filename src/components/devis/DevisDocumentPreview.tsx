import { PublicDevisDocument, publicCompanyFromDb } from "@/components/devis/PublicDevisDocument";
import type { PublicDevisData } from "@/components/devis/PublicDevisDocument";
import type { Client, Company, Devis, DevisLigne } from "@/generated/prisma/client";

type DevisWithRelations = Devis & { lignes: DevisLigne[]; client: Client };

interface DevisDocumentPreviewProps {
  devis: DevisWithRelations;
  company: Company | null;
}

function toPublicDevisData(devis: DevisWithRelations, company: Company | null): PublicDevisData {
  return {
    numero: devis.numero,
    status: devis.status,
    totalHT: devis.totalHT,
    totalTVA: devis.totalTVA,
    totalTTC: devis.totalTTC,
    validUntil: devis.validUntil?.toISOString().slice(0, 10) ?? null,
    notes: devis.notes,
    createdAt: devis.createdAt.toISOString(),
    integrityOk: Boolean(devis.contentHash),
    acceptedAt: devis.acceptedAt?.toISOString() ?? null,
    clientAcceptanceText: devis.clientAcceptanceText,
    clientSignatureData: devis.clientSignatureData,
    client: {
      nom: devis.client.nom,
      adresse: devis.client.adresse,
      telephone: devis.client.telephone,
      email: devis.client.email,
    },
    company: publicCompanyFromDb(
      company
        ? {
            ...company,
            activiteBtp: company.activiteBtp,
          }
        : null
    ),
    lignes: devis.lignes.map((l) => ({
      description: l.description,
      quantite: l.quantite,
      prixUnitaireHT: l.prixUnitaireHT,
      totalHT: l.totalHT,
      tva: l.tva,
    })),
  };
}

/** Aperçu document conforme sur la fiche devis (dashboard). */
export function DevisDocumentPreview({ devis, company }: DevisDocumentPreviewProps) {
  return (
    <section className="mt-10">
      <h2 className="heading-card mb-4">Aperçu du document client</h2>
      <p className="text-body mb-4 text-sm">
        Rendu identique au PDF et au lien client — mentions légales, assurance décennale et zone
        &quot;Bon pour accord&quot; inclus.
      </p>
      <PublicDevisDocument devis={toPublicDevisData(devis, company)} />
    </section>
  );
}
