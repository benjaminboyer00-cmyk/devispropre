import { formatEuro } from "@/lib/format";
import {
  DevisAssuranceDecennale,
  DevisIssuerHeader,
  DevisLegalFooter,
} from "@/components/devis/DevisLegalBlocks";
import { DevisPaperShell } from "@/components/devis/DevisPaperShell";
import type { DevisLegalCompany } from "@/lib/devis-legal";

export interface PublicFactureData {
  numero: string;
  status: string;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  notes: string | null;
  issuedAt: string | null;
  paidAt: string | null;
  dateEcheance: string | null;
  integrityOk: boolean;
  client: {
    nom: string;
    adresse?: string | null;
    telephone?: string | null;
    email?: string | null;
  };
  company: DevisLegalCompany | null;
  lignes: {
    description: string;
    quantite: number;
    prixUnitaireHT: number;
    totalHT: number;
    tva: number;
  }[];
}

interface PublicFactureDocumentProps {
  facture: PublicFactureData;
  children?: React.ReactNode;
}

/** Rendu document facture client — feuille blanche WYSIWYG (identique au PDF). */
export function PublicFactureDocument({ facture, children }: PublicFactureDocumentProps) {
  const company = facture.company;
  const tvaApplicable = company?.tvaApplicable ?? true;
  const issueDate = facture.issuedAt
    ? new Date(facture.issuedAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <>
      <DevisPaperShell>
        <header className="border-b border-[#14304e] bg-[#1a3a5c] px-6 py-5 text-white sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium opacity-90">DevisPropre</p>
              <h2 className="mt-1 text-xl font-bold">FACTURE N° {facture.numero}</h2>
            </div>
            <div className="text-right text-sm opacity-90">
              {issueDate && <p>Date : {issueDate}</p>}
              {facture.dateEcheance && (
                <p className="mt-1">
                  Échéance :{" "}
                  {new Date(`${facture.dateEcheance}T12:00:00`).toLocaleDateString("fr-FR")}
                </p>
              )}
            </div>
          </div>
        </header>

        <article className="p-6 text-gray-900 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <DevisIssuerHeader company={company} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Client</p>
              <p className="mt-2 font-medium text-gray-900">{facture.client.nom}</p>
              {facture.client.adresse && (
                <p className="text-sm text-gray-700">{facture.client.adresse}</p>
              )}
              {facture.client.telephone && (
                <p className="text-sm text-gray-700">Tél : {facture.client.telephone}</p>
              )}
              {facture.client.email && (
                <p className="text-sm text-gray-700">{facture.client.email}</p>
              )}
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-gray-900 text-left text-xs uppercase text-gray-900">
                  <th className="pb-2 pr-3">Description</th>
                  <th className="pb-2 pr-3 text-right">Qté</th>
                  <th className="pb-2 pr-3 text-right">P.U. HT</th>
                  {tvaApplicable && <th className="pb-2 pr-3 text-right">TVA</th>}
                  <th className="pb-2 text-right">Total HT</th>
                </tr>
              </thead>
              <tbody className="text-gray-800">
                {facture.lignes.map((l, i) => (
                  <tr key={i} className="border-b border-gray-100">
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

          <div className="mt-6 space-y-6">
            <div className="border-t border-gray-200 pt-4">
              {tvaApplicable && (
                <div className="mb-2 space-y-1 text-right text-sm text-gray-700">
                  <p>Total HT : {formatEuro(facture.totalHT)}</p>
                  <p>TVA : {formatEuro(facture.totalTVA)}</p>
                </div>
              )}
              <p className="text-right text-lg font-bold text-gray-900">
                Net à payer {tvaApplicable ? "TTC" : "HT"} : {formatEuro(facture.totalTTC)}
              </p>
            </div>

            {facture.notes && (
              <p className="border-t border-gray-200 pt-4 text-sm text-gray-700">
                <span className="font-medium text-gray-900">Notes : </span>
                {facture.notes}
              </p>
            )}

            <DevisAssuranceDecennale company={company} />
            <DevisLegalFooter company={company} />
          </div>
        </article>
      </DevisPaperShell>

      {children ? <div className="mt-6">{children}</div> : null}
    </>
  );
}
