"use client";

import { useEffect, useState } from "react";
import { SignaturePad } from "@/components/devis/SignaturePad";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DEVIS_RETRACTATION_TITLE, devisRetractationLines } from "@/lib/devis-legal";

export interface DevisAcceptPayload {
  acceptanceText: string;
  signatureData: string;
  signerName: string;
  otpCode: string;
  retractationInfoAcknowledged: boolean;
  earlyExecutionRequested: boolean;
}

interface DevisClientAcceptPanelProps {
  loading: boolean;
  /** E-mail client masqué (fiche artisan) — null : le signataire saisit le sien. */
  clientEmailHint: string | null;
  defaultSignerName: string;
  companyName: string | null;
  onRequestOtp: (email: string | null) => Promise<{ emailHint: string } | { error: string }>;
  onAccept: (payload: DevisAcceptPayload) => void;
  onRefuse: () => void;
}

const DEFAULT_TEXT = "Bon pour accord";
const RESEND_COOLDOWN_S = 60;

/**
 * Acceptation client en ligne — signature électronique simple :
 * identité vérifiée par code e-mail, signature manuscrite, mention, information rétractation.
 */
export function DevisClientAcceptPanel({
  loading,
  clientEmailHint,
  defaultSignerName,
  companyName,
  onRequestOtp,
  onAccept,
  onRefuse,
}: DevisClientAcceptPanelProps) {
  const [signerName, setSignerName] = useState(defaultSignerName);
  const [acceptanceText, setAcceptanceText] = useState(DEFAULT_TEXT);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [retractationAck, setRetractationAck] = useState(false);
  const [earlyExecution, setEarlyExecution] = useState(false);
  const [declaredEmail, setDeclaredEmail] = useState("");
  const [otpSentTo, setOtpSentTo] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const [signConfirmOpen, setSignConfirmOpen] = useState(false);
  const [refuseConfirmOpen, setRefuseConfirmOpen] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function requestOtp() {
    setError("");
    if (!clientEmailHint && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(declaredEmail.trim())) {
      setError("Indiquez une adresse e-mail valide pour recevoir votre code.");
      return;
    }
    setOtpLoading(true);
    try {
      const result = await onRequestOtp(clientEmailHint ? null : declaredEmail.trim());
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setOtpSentTo(result.emailHint);
      setCooldown(RESEND_COOLDOWN_S);
    } finally {
      setOtpLoading(false);
    }
  }

  function validateAccept(): boolean {
    setError("");
    if (signerName.trim().length < 2) {
      setError("Indiquez vos nom et prénom.");
      return false;
    }
    if (!signatureData) {
      setError("Signez dans la zone prévue avant de valider.");
      return false;
    }
    if (!acceptanceText.trim()) {
      setError("Indiquez « Bon pour accord » ou votre mention d'acceptation.");
      return false;
    }
    if (!retractationAck) {
      setError("Confirmez avoir pris connaissance des informations sur le droit de rétractation.");
      return false;
    }
    if (!otpSentTo) {
      setError("Demandez votre code de vérification par e-mail.");
      return false;
    }
    if (!/^\d{6}$/.test(otpCode.replace(/\s/g, ""))) {
      setError("Saisissez le code à 6 chiffres reçu par e-mail.");
      return false;
    }
    return true;
  }

  function openSignConfirm() {
    if (!validateAccept()) return;
    setSignConfirmOpen(true);
  }

  function handleConfirmSign() {
    if (!signatureData) return;
    setSignConfirmOpen(false);
    onAccept({
      acceptanceText: acceptanceText.trim(),
      signatureData,
      signerName: signerName.trim(),
      otpCode: otpCode.replace(/\s/g, ""),
      retractationInfoAcknowledged: retractationAck,
      earlyExecutionRequested: earlyExecution,
    });
  }

  function handleConfirmRefuse() {
    setRefuseConfirmOpen(false);
    onRefuse();
  }

  return (
    <>
      <div className="mt-6 space-y-5 border-t border-[var(--border)] pt-6">
        <div>
          <h2 className="heading text-lg font-semibold">Signer ce devis</h2>
          <p className="text-body mt-1 text-sm">
            Signature électronique avec vérification de votre identité par un code envoyé par e-mail.
            Vous recevrez une copie du devis signé.
          </p>
        </div>

        {error && <p className="ui-alert-error text-sm">{error}</p>}

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-5">
          <p className="text-subtle text-xs">Date : {today}</p>

          <label className="ui-label mt-4 block" htmlFor="signer-name">
            Nom et prénom du signataire
          </label>
          <input
            id="signer-name"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            className="ui-input mt-1"
            autoComplete="name"
            maxLength={120}
          />

          <label className="ui-label mt-4 block">Votre signature</label>
          <SignaturePad onChange={setSignatureData} className="mt-2" />

          <label className="ui-label mt-4 block" htmlFor="acceptance-text">
            Mention manuscrite
          </label>
          <input
            id="acceptance-text"
            value={acceptanceText}
            onChange={(e) => setAcceptanceText(e.target.value)}
            className="ui-input mt-1 text-base font-medium"
            placeholder="Bon pour accord"
            maxLength={200}
          />
        </div>

        <div className="rounded-xl border border-[var(--border)] p-5 text-sm">
          <details>
            <summary className="cursor-pointer font-medium">{DEVIS_RETRACTATION_TITLE}</summary>
            <div className="text-body mt-3 space-y-2 text-xs leading-relaxed">
              {devisRetractationLines(companyName).map((line, i) => (
                <p key={i}>{line}</p>
              ))}
              <p>Le formulaire de rétractation figure dans le PDF du devis et dans l&apos;e-mail de confirmation.</p>
            </div>
          </details>
          <label className="mt-4 flex items-start gap-2">
            <input
              type="checkbox"
              checked={retractationAck}
              onChange={(e) => setRetractationAck(e.target.checked)}
              className="mt-1"
            />
            <span>J&apos;ai pris connaissance du devis et des informations relatives au droit de rétractation.</span>
          </label>
          <label className="mt-3 flex items-start gap-2">
            <input
              type="checkbox"
              checked={earlyExecution}
              onChange={(e) => setEarlyExecution(e.target.checked)}
              className="mt-1"
            />
            <span>
              (Facultatif) Je demande expressément que les travaux commencent avant la fin du délai de
              rétractation de 14 jours.
            </span>
          </label>
        </div>

        <div className="rounded-xl border border-[var(--border)] p-5 text-sm">
          <p className="font-medium">Vérification par e-mail</p>
          {clientEmailHint ? (
            <p className="text-body mt-1 text-xs">
              Le code sera envoyé à l&apos;adresse enregistrée par votre artisan : {clientEmailHint}
            </p>
          ) : (
            <>
              <label className="ui-label mt-3 block" htmlFor="signer-email">
                Votre adresse e-mail
              </label>
              <input
                id="signer-email"
                type="email"
                value={declaredEmail}
                onChange={(e) => setDeclaredEmail(e.target.value)}
                disabled={!!otpSentTo}
                className="ui-input mt-1"
                autoComplete="email"
              />
            </>
          )}

          <button
            type="button"
            onClick={requestOtp}
            disabled={otpLoading || loading || cooldown > 0}
            className="ui-btn-outline mt-3 py-2 text-sm"
          >
            {otpLoading
              ? "Envoi…"
              : otpSentTo
                ? cooldown > 0
                  ? `Renvoyer le code (${cooldown} s)`
                  : "Renvoyer le code"
                : "Recevoir mon code"}
          </button>

          {otpSentTo && (
            <>
              <p className="text-body mt-3 text-xs">Code envoyé à {otpSentTo} — valable 10 minutes.</p>
              <label className="ui-label mt-3 block" htmlFor="otp-code">
                Code à 6 chiffres
              </label>
              <input
                id="otp-code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={7}
                className="ui-input mt-1 w-40 text-center font-mono text-lg tracking-widest"
              />
            </>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={openSignConfirm}
            disabled={loading}
            className="ui-btn-primary flex-1 py-3"
          >
            {loading ? "Signature…" : "Signer et accepter le devis"}
          </button>
          <button
            type="button"
            onClick={() => setRefuseConfirmOpen(true)}
            disabled={loading}
            className="ui-btn-outline flex-1 border-red-600 py-3 text-red-700 dark:border-red-400 dark:text-red-300"
          >
            Je refuse
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={signConfirmOpen}
        title="Confirmer la signature"
        message="En confirmant, vous signez électroniquement ce devis, ce qui vaut acceptation. Cette action est définitive."
        confirmLabel="Oui, signer le devis"
        cancelLabel="Annuler"
        loading={loading}
        onConfirm={handleConfirmSign}
        onCancel={() => setSignConfirmOpen(false)}
      />

      <ConfirmDialog
        open={refuseConfirmOpen}
        title="Confirmer le refus"
        message="Êtes-vous sûr de vouloir refuser ce devis ?"
        confirmLabel="Oui, refuser le devis"
        cancelLabel="Annuler"
        variant="danger"
        loading={loading}
        onConfirm={handleConfirmRefuse}
        onCancel={() => setRefuseConfirmOpen(false)}
      />
    </>
  );
}
