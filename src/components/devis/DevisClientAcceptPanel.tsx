"use client";

import { useState } from "react";
import { SignaturePad } from "@/components/devis/SignaturePad";

interface DevisClientAcceptPanelProps {
  loading: boolean;
  onAccept: (payload: { acceptanceText: string; signatureData: string }) => void;
  onRefuse: () => void;
}

const DEFAULT_TEXT = "Bon pour accord";

/** Acceptation client en ligne — signature + mention manuscrite numérique. */
export function DevisClientAcceptPanel({ loading, onAccept, onRefuse }: DevisClientAcceptPanelProps) {
  const [acceptanceText, setAcceptanceText] = useState(DEFAULT_TEXT);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [error, setError] = useState("");

  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function submitAccept() {
    setError("");
    if (!signatureData) {
      setError("Signez dans la zone prévue avant de valider.");
      return;
    }
    if (!acceptanceText.trim()) {
      setError("Indiquez « Bon pour accord » ou votre mention d'acceptation.");
      return;
    }
    onAccept({ acceptanceText: acceptanceText.trim(), signatureData });
  }

  return (
    <div className="mt-6 space-y-5 border-t border-[var(--border)] pt-6">
      <div>
        <h2 className="heading text-lg font-semibold">Valider ce devis</h2>
        <p className="text-body mt-1 text-sm">
          Signez ci-dessous et confirmez votre accord — équivalent à une signature manuscrite sur le
          PDF.
        </p>
      </div>

      {error && <p className="ui-alert-error text-sm">{error}</p>}

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
