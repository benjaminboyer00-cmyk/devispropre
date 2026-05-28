import { formatEuro } from "@/lib/format";
import { companyToLegal, type DevisLegalCompany } from "@/lib/devis-legal";
import {
  DevisAssuranceDecennale,
  DevisBonPourAccord,
  DevisIssuerHeader,
  DevisLegalFooter,
} from "@/components/devis/DevisLegalBlocks";

export interface PublicDevisData {
  numero: string;
  status: string;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  validUntil: string | null;
  notes: string | null;
  createdAt: string;
  integrityOk: boolean;
  acceptedAt: string | null;
  clientAcceptanceText: string | null;
  clientSignatureData: string | null;
  client: { nom: string; adresse?: string | null; telephone?: string | null; email?: string | null };
  company: DevisLegalCompany | null;
  lignes: {
    description: string;
    quantite: number;
    prixUnitaireHT: number;
    totalHT: number;
    tva: number;
  }[];
}

interface PublicDevisDocumentProps {
  devis: PublicDevisData;
  children?: React.ReactNode;
}

/** Rendu document devis client (lien public) — conforme mentions légales BTP. */
export function PublicDevisDocument({ devis, children }: PublicDevisDocumentProps) {
  const company = devis.company;
  const tvaApplicable = company?.tvaApplicable ?? true;
  const issueDate = new Date(devis.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article className="overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm">
      <header className="border-b border-[var(--border)] bg-[var(--blue)] px-6 py-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium opacity-90">DevisPropre</p>
            <h2 className="mt-1 text-xl font-bold">DEVIS N° {devis.numero}</h2>
          </div>
          <div className="text-right text-sm opacity-90">
            <p>Date : {issueDate}</p>
            {devis.validUntil && (
              <p className="mt-1">
                Valable jusqu&apos;au{" "}
                {new Date(`${devis.validUntil}T12:00:00`).toLocaleDateString("fr-FR")}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="grid gap-6 px-6 py-5 sm:grid-cols-2">
        <DevisIssuerHeader company={company} />
        <div>
          <p className="text-subtle text-xs font-semibold uppercase tracking-wide">Client</p>
          <p className="heading mt-2 font-medium">{devis.client.nom}</p>
          {devis.client.adresse && <p className="text-body text-sm">{devis.client.adresse}</p>}
          {devis.client.telephone && <p className="text-body text-sm">Tél : {devis.client.telephone}</p>}
          {devis.client.email && <p className="text-body text-sm">{devis.client.email}</p>}
        </div>
      </div>

      <div className="overflow-x-auto px-6 pb-4">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--text-subtle)]">
              <th className="pb-2 pr-3">Description</th>
              <th className="pb-2 pr-3 text-right">Qté</th>
              <th className="pb-2 pr-3 text-right">P.U. HT</th>
              {tvaApplicable && <th className="pb-2 pr-3 text-right">TVA</th>}
              <th className="pb-2 text-right">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {devis.lignes.map((l, i) => (
              <tr key={i} className="border-b border-[var(--border)]">
                <td className="py-3 pr-3">{l.description}</td>
                <td className="py-3 pr-3 text-right">{l.quantite}</td>
                <td className="py-3 pr-3 text-right">{formatEuro(l.prixUnitaireHT)}</td>
                {tvaApplicable && <td className="py-3 pr-3 text-right">{l.tva} %</td>}
                <td className="py-3 text-right font-medium">{formatEuro(l.totalHT)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-6 px-6 pb-6">
        <div className="border-t border-[var(--border)] pt-4">
          {tvaApplicable && (
            <div className="text-body mb-2 space-y-1 text-right text-sm">
              <p>Total HT : {formatEuro(devis.totalHT)}</p>
              <p>TVA : {formatEuro(devis.totalTVA)}</p>
            </div>
          )}
          <p className="heading text-right text-lg font-bold">
            Total {tvaApplicable ? "TTC" : "HT"} : {formatEuro(devis.totalTTC)}
          </p>
        </div>

        {devis.notes && (
          <p className="text-body border-t border-[var(--border)] pt-4 text-sm">
            <span className="font-medium">Conditions particulières : </span>
            {devis.notes}
          </p>
        )}

        <DevisAssuranceDecennale company={company} />

        <DevisBonPourAccord
          signed={
            devis.status === "ACCEPTE" && devis.clientAcceptanceText && devis.clientSignatureData
              ? {
                  acceptanceText: devis.clientAcceptanceText,
                  signatureData: devis.clientSignatureData,
                  acceptedAt: devis.acceptedAt ?? devis.createdAt,
                }
              : null
          }
        />

        <DevisLegalFooter company={company} />

        {children}
      </div>
    </article>
  );
}

export function publicCompanyFromDb(
  company: Parameters<typeof companyToLegal>[0] | null | undefined
): DevisLegalCompany | null {
  if (!company) return null;
  return companyToLegal(company);
}
