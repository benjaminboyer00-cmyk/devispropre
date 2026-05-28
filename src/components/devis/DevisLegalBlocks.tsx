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
        <p className="text-subtle text-xs font-semibold uppercase tracking-wide">Émetteur</p>
        <p className="heading mt-2 font-semibold">Votre raison sociale</p>
        <p className="text-body mt-1 text-sm">Adresse complète · SIRET · RCS ou RM</p>
        <p className="text-subtle mt-2 text-xs italic">
          Complété automatiquement à l&apos;inscription — visible sur le PDF final.
        </p>
      </div>
    );
  }

  const lines = companyIssuerLines(company);

  return (
    <div>
      <p className="text-subtle text-xs font-semibold uppercase tracking-wide">Émetteur</p>
      <div className="mt-2 space-y-0.5 text-sm">
        {lines.map((line, i) => (
          <p key={i} className={i === 0 ? "heading font-semibold" : "text-body"}>
            {line}
          </p>
        ))}
        {!company.tvaApplicable && (
          <p className="text-body mt-1 text-xs font-medium">{FRANCHISE_MENTION}</p>
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
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-xs leading-relaxed text-[var(--text-body)]">
      <p className="text-subtle mb-1 text-[10px] font-semibold uppercase tracking-wide">
        Assurance décennale (BTP)
      </p>
      <p>{text}</p>
    </div>
  );
}

interface DevisBonPourAccordProps {
  /** Affiche la signature client enregistrée (lien public accepté). */
  signed?: {
    acceptanceText: string;
    signatureData: string;
    acceptedAt: string;
  } | null;
}

/** Zone signature papier — date, signature, mention « Bon pour accord ». */
export function DevisBonPourAccord({ signed }: DevisBonPourAccordProps) {
  if (signed) {
    const date = new Date(signed.acceptedAt).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return (
      <div className="flex justify-end">
        <div className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-5 sm:w-80">
          <p className="text-subtle text-xs">Date : {date}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={signed.signatureData}
            alt="Signature du client"
            className="mt-4 h-28 w-full rounded border border-[var(--border)] bg-white object-contain"
          />
          <p className="heading mt-4 text-center text-sm font-semibold">{signed.acceptanceText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-5 sm:w-80">
        <p className="text-subtle text-xs">
          Date : <span className="inline-block min-w-[8rem] border-b border-[var(--border-strong)]" />
        </p>
        <p className="text-subtle mt-4 text-xs">Signature du client :</p>
        <div className="mt-2 h-28 rounded border border-dashed border-[var(--border-strong)] bg-white" aria-hidden />
        <p className="heading mt-5 text-center text-sm font-semibold tracking-wide">Bon pour accord</p>
        <div className="mx-auto mt-3 h-10 max-w-[12rem] border-b border-dashed border-[var(--border-strong)]" aria-hidden />
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
    <div className="mt-8 border-t border-[var(--border)] pt-4 text-[10px] leading-tight text-[var(--text-subtle)]">
      {lines.map((line, i) => (
        <p
          key={i}
          className={
            i === lines.length - 1 && legalCompany && !legalCompany.tvaApplicable
              ? "mt-1 font-semibold text-[var(--text-body)]"
              : undefined
          }
        >
          {line}
        </p>
      ))}
    </div>
  );
}
