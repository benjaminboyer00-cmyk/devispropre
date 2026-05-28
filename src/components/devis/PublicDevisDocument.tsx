import { formatEuro } from "@/lib/format";
import { companyToLegal, type DevisLegalCompany } from "@/lib/devis-legal";
import {
  DevisAssuranceDecennale,
  DevisBonPourAccord,
  DevisIssuerHeader,
  DevisLegalFooter,
} from "@/components/devis/DevisLegalBlocks";
import { DevisPaperShell } from "@/components/devis/DevisPaperShell";

export interface PublicDevisData {
  numero: string;
  status: string;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  validUntil: string | null;
  shareLinkExpiresAt?: string | null;
  linkExpired?: boolean;
  canAccept?: boolean;
  signatureOtpRequired?: boolean;
  clientEmailHint?: string | null;
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

/** Rendu document devis client — feuille blanche WYSIWYG (identique au PDF). */
export function PublicDevisDocument({ devis, children }: PublicDevisDocumentProps) {
  const company = devis.company;
  const tvaApplicable = company?.tvaApplicable ?? true;
  const issueDate = new Date(devis.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <DevisPaperShell>
        <header className="border-b border-[#14304e] bg-[#1a3a5c] px-6 py-5 text-white sm:px-8">
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

        <article className="p-6 text-gray-900 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <DevisIssuerHeader company={company} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Client</p>
              <p className="mt-2 font-medium text-gray-900">{devis.client.nom}</p>
              {devis.client.adresse && (
                <p className="text-sm text-gray-700">{devis.client.adresse}</p>
              )}
              {devis.client.telephone && (
                <p className="text-sm text-gray-700">Tél : {devis.client.telephone}</p>
              )}
              {devis.client.email && (
                <p className="text-sm text-gray-700">{devis.client.email}</p>
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
                {devis.lignes.map((l, i) => (
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
                  <p>Total HT : {formatEuro(devis.totalHT)}</p>
                  <p>TVA : {formatEuro(devis.totalTVA)}</p>
                </div>
              )}
              <p className="text-right text-lg font-bold text-gray-900">
                Total {tvaApplicable ? "TTC" : "HT"} : {formatEuro(devis.totalTTC)}
              </p>
            </div>

            {devis.notes && (
              <p className="border-t border-gray-200 pt-4 text-sm text-gray-700">
                <span className="font-medium text-gray-900">Conditions particulières : </span>
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
          </div>
        </article>
      </DevisPaperShell>

      {children ? <div className="mt-6">{children}</div> : null}
    </>
  );
}

export function publicCompanyFromDb(
  company: Parameters<typeof companyToLegal>[0] | null | undefined
): DevisLegalCompany | null {
  if (!company) return null;
  return companyToLegal(company);
}
