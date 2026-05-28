"use client";

import { useState } from "react";
import { SignaturePad } from "@/components/devis/SignaturePad";

interface DevisClientAcceptPanelProps {
  loading: boolean;
  signatureOtpRequired?: boolean;
  clientEmailHint?: string | null;
  onRequestOtp?: () => Promise<{ ok: boolean; error?: string; emailHint?: string }>;
  onAccept: (payload: { acceptanceText: string; signatureData: string; otpCode?: string }) => void;
  onRefuse: () => void;
}

const DEFAULT_TEXT = "Bon pour accord";

/** Acceptation client en ligne — OTP email (si client email) + signature + mention. */
export function DevisClientAcceptPanel({
  loading,
  signatureOtpRequired = false,
  clientEmailHint,
  onRequestOtp,
  onAccept,
  onRefuse,
}: DevisClientAcceptPanelProps) {
  const [acceptanceText, setAcceptanceText] = useState(DEFAULT_TEXT);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpHint, setOtpHint] = useState(clientEmailHint ?? "");
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function sendOtp() {
    if (!onRequestOtp) return;
    setError("");
    setOtpLoading(true);
    try {
      const result = await onRequestOtp();
      if (!result.ok) {
        setError(result.error ?? "Impossible d'envoyer le code.");
        return;
      }
      setOtpSent(true);
      if (result.emailHint) setOtpHint(result.emailHint);
    } finally {
      setOtpLoading(false);
    }
  }

  function submitAccept() {
    setError("");
    if (signatureOtpRequired && !otpSent) {
      setError("Demandez d'abord le code de vérification par email.");
      return;
    }
    if (signatureOtpRequired && !/^\d{6}$/.test(otpCode.trim())) {
      setError("Saisissez le code à 6 chiffres reçu par email.");
      return;
    }
    if (!signatureData) {
      setError("Signez dans la zone prévue avant de valider.");
      return;
    }
    if (!acceptanceText.trim()) {
      setError("Indiquez « Bon pour accord » ou votre mention d'acceptation.");
      return;
    }
    onAccept({
      acceptanceText: acceptanceText.trim(),
      signatureData,
      otpCode: signatureOtpRequired ? otpCode.trim() : undefined,
    });
  }

  return (
    <div className="mt-6 space-y-5 border-t border-[var(--border)] pt-6">
      <div>
        <h2 className="heading text-lg font-semibold">Valider ce devis</h2>
        <p className="text-body mt-1 text-sm">
          {signatureOtpRequired
            ? "Vérifiez votre identité par email, signez ci-dessous et confirmez votre accord."
            : "Signez ci-dessous et confirmez votre accord — équivalent à une signature manuscrite sur le PDF."}
        </p>
      </div>

      {error && <p className="ui-alert-error text-sm">{error}</p>}

      {signatureOtpRequired && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-5">
          <p className="text-subtle text-xs font-medium uppercase tracking-wide">
            Vérification par email
          </p>
          <p className="text-body mt-2 text-sm">
            Un code sera envoyé à{" "}
            <strong>{otpHint || "l'adresse enregistrée sur ce devis"}</strong>.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="ui-label block" htmlFor="otp-code">
                Code à 6 chiffres
              </label>
              <input
                id="otp-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="ui-input mt-1 font-mono text-lg tracking-widest"
                placeholder="000000"
                disabled={!otpSent || loading}
              />
            </div>
            <button
              type="button"
              onClick={sendOtp}
              disabled={otpLoading || loading}
              className="ui-btn-outline shrink-0 px-4 py-2.5"
            >
              {otpLoading ? "Envoi…" : otpSent ? "Renvoyer le code" : "Recevoir le code"}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-5">
        <p className="text-subtle text-xs">Date : {today}</p>

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
        />
        <p className="text-subtle mt-2 text-[10px]">
          Écrivez « Bon pour accord » ou une formulation équivalente.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={submitAccept}
          disabled={loading}
          className="ui-btn-primary flex-1 py-3"
        >
          {loading ? "Validation…" : "Signer et accepter le devis"}
        </button>
        <button
          type="button"
          onClick={onRefuse}
          disabled={loading}
          className="ui-btn-outline flex-1 border-red-600 py-3 text-red-700 dark:border-red-400 dark:text-red-300"
        >
          Je refuse
        </button>
      </div>
    </div>
  );
}
