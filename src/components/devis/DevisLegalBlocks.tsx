import {
  companyIssuerLines,
  devisLegalFooterLines,
  formatAssuranceDecennale,
  shouldShowAssuranceDecennale,
  type DevisLegalCompany,
} from "@/lib/devis-legal";
import { FRANCHISE_MENTION } from "@/lib/tva";

interface DevisIssuerHeaderProps {
  company: DevisLegalCompany | null;
  guestPlaceholder?: boolean;
}

export function DevisIssuerHeader({ company, guestPlaceholder }: DevisIssuerHeaderProps) {
  if (guestPlaceholder || !company) {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Émetteur</p>
        <p className="mt-2 font-semibold text-gray-900">Votre raison sociale</p>
        <p className="mt-1 text-sm text-gray-700">Adresse complète · SIRET · RCS ou RM</p>
        <p className="mt-2 text-xs italic text-gray-500">
          Complété automatiquement à l&apos;inscription — visible sur le PDF final.
        </p>
      </div>
    );
  }

  const lines = companyIssuerLines(company);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Émetteur</p>
      <div className="mt-2 space-y-0.5 text-sm">
        {lines.map((line, i) => (
          <p key={i} className={i === 0 ? "font-semibold text-gray-900" : "text-gray-700"}>
            {line}
          </p>
        ))}
        {!company.tvaApplicable && (
          <p className="mt-1 text-xs font-medium text-gray-800">{FRANCHISE_MENTION}</p>
        )}
      </div>
    </div>
  );
}

interface DevisAssuranceDecennaleProps {
  company: DevisLegalCompany | null;
}

/** Uniquement si l'artisan a activé le profil BTP et renseigné son assurance. */
export function DevisAssuranceDecennale({ company }: DevisAssuranceDecennaleProps) {
  if (!shouldShowAssuranceDecennale(company)) return null;

  const text = formatAssuranceDecennale(company);
  if (!text) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-800">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        Assurance décennale (BTP)
      </p>
      <p>{text}</p>
    </div>
  );
}

interface DevisBonPourAccordProps {
  signed?: {
    acceptanceText: string;
    signatureData: string;
    acceptedAt: string;
  } | null;
}

/** Zone signature papier — couleurs fixes (hors thème app). */
export function DevisBonPourAccord({ signed }: DevisBonPourAccordProps) {
  if (signed) {
    const date = new Date(signed.acceptedAt).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return (
      <div className="flex justify-end">
        <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-gray-50 p-5 sm:w-80">
          <p className="text-xs text-gray-500">Date : {date}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={signed.signatureData}
            alt="Signature du client"
            className="mt-4 h-28 w-full rounded border border-gray-200 bg-white object-contain"
          />
          <p className="mt-4 text-center text-sm font-semibold text-gray-900">
            {signed.acceptanceText}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-gray-50 p-5 sm:w-80">
        <p className="text-xs text-gray-500">
          Date : <span className="inline-block min-w-[8rem] border-b border-gray-400" />
        </p>
        <p className="mt-4 text-xs text-gray-500">Signature du client :</p>
        <div
          className="mt-2 h-28 rounded border border-dashed border-gray-400 bg-white"
          aria-hidden
        />
        <p className="mt-5 text-center text-sm font-semibold tracking-wide text-gray-900">
          Bon pour accord
        </p>
        <div
          className="mx-auto mt-3 h-10 max-w-[12rem] border-b border-dashed border-gray-400"
          aria-hidden
        />
      </div>
    </div>
  );
}

interface DevisLegalFooterProps {
  company: DevisLegalCompany | null;
  franchiseTva?: boolean;
}

export function DevisLegalFooter({ company, franchiseTva }: DevisLegalFooterProps) {
  const legalCompany =
    company ??
    (franchiseTva === false
      ? {
          tvaApplicable: false,
          assurances: null,
        }
      : null);

  const lines = devisLegalFooterLines(legalCompany);

  return (
    <div className="mt-8 border-t border-gray-200 pt-4 text-[10px] leading-tight text-gray-500">
      {lines.map((line, i) => (
        <p
          key={i}
          className={
            i === lines.length - 1 && legalCompany && !legalCompany.tvaApplicable
              ? "mt-1 font-semibold text-gray-800"
              : undefined
          }
        >
          {line}
        </p>
      ))}
    </div>
  );
}
