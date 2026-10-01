"use client";

import { useEffect, useRef, useState } from "react";
import { DevisClientAcceptPanel, type DevisAcceptPayload } from "@/components/devis/DevisClientAcceptPanel";
import { PublicDevisDocument, type PublicDevisData } from "@/components/devis/PublicDevisDocument";

export function PublicDevisView({ token }: { token: string }) {
  const [devis, setDevis] = useState<PublicDevisData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const idempotencyRef = useRef<string | null>(null);

  function nextIdempotencyKey(): string {
    const key = crypto.randomUUID();
    idempotencyRef.current = key;
    return key;
  }

  useEffect(() => {
    fetch(`/api/public/devis/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Devis introuvable");
        return r.json();
      })
      .then((data) => {
        if (data.error) setError(data.error);
        else setDevis(data);
      })
      .catch(() => setError("Impossible de charger le devis. Réessayez plus tard."))
      .finally(() => setLoading(false));
  }, [token]);

  async function requestOtp(email: string | null): Promise<{ emailHint: string } | { error: string }> {
    try {
      const res = await fetch(`/api/public/devis/${token}/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(email ? { email } : {}),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error ?? "Envoi du code impossible." };
      return { emailHint: data.emailHint };
    } catch {
      return { error: "Erreur réseau — réessayez." };
    }
  }

  async function respond(status: "ACCEPTE" | "REFUSE", extra?: DevisAcceptPayload) {
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/public/devis/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyRef.current ?? nextIdempotencyKey(),
        },
        body: JSON.stringify({ status, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur");
        // Le code OTP a pu être consommé : la prochaine tentative est une nouvelle requête.
        idempotencyRef.current = null;
        return;
      }
      setDevis((d) =>
        d
          ? {
              ...d,
              status,
              acceptedAt: status === "ACCEPTE" ? new Date().toISOString() : d.acceptedAt,
              clientAcceptanceText: extra?.acceptanceText ?? d.clientAcceptanceText,
              clientSignatureData: extra?.signatureData ?? d.clientSignatureData,
              signerName: extra?.signerName ?? d.signerName,
              hasSignedPdf: status === "ACCEPTE" ? true : d.hasSignedPdf,
            }
          : d
      );
    } catch {
      setError("Erreur réseau — réessayez.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <p className="text-body p-8 text-center">Chargement…</p>;
  if (error && !devis) {
    return <p className="ui-alert-error mx-auto max-w-md p-8 text-center">{error}</p>;
  }
  if (!devis) {
    return <p className="ui-alert-error mx-auto max-w-md p-8 text-center">Devis introuvable</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      {devis.integrityOk && (
        <p className="ui-alert-success mb-6 text-center text-sm">
          ✓ Document authentique — aucune altération détectée
        </p>
      )}

      {error && <p className="ui-alert-error mb-4 text-sm">{error}</p>}

      <PublicDevisDocument devis={devis}>
        {devis.status === "ENVOYE" && devis.canAccept !== false && (
          <DevisClientAcceptPanel
            loading={actionLoading}
            clientEmailHint={devis.clientEmailHint ?? null}
            defaultSignerName={devis.client.nom}
            companyName={devis.company?.raisonSociale ?? null}
            onRequestOtp={requestOtp}
            onAccept={(payload) => respond("ACCEPTE", payload)}
            onRefuse={() => respond("REFUSE")}
          />
        )}

        {devis.status === "ENVOYE" && devis.linkExpired && (
          <p className="ui-alert-warning mt-6 text-center text-sm">
            Ce lien de signature a expiré. Contactez votre artisan pour recevoir un nouveau devis.
          </p>
        )}

        {devis.status === "ACCEPTE" && (
          <div className="mt-6 space-y-3 text-center">
            <p className="font-medium text-green-700 dark:text-green-400">
              ✅ Devis accepté et signé — merci ! Une copie vous a été envoyée par e-mail.
            </p>
            {devis.hasSignedPdf && (
              <a
                href={`/api/public/devis/${token}/pdf`}
                className="ui-btn-outline inline-flex px-5 py-2 text-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                📄 Télécharger le devis signé (PDF)
              </a>
            )}
          </div>
        )}

        {devis.status === "REFUSE" && (
          <p className="mt-6 text-center font-medium text-red-700 dark:text-red-400">
            Devis refusé.
          </p>
        )}
      </PublicDevisDocument>
    </div>
  );
}
