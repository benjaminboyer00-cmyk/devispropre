"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PdfDownloadButton } from "@/components/ui/PdfDownloadButton";
import { useToast } from "@/components/ui/ToastProvider";
import { DocumentAuditTrail } from "@/components/audit/DocumentAuditTrail";
import { DevisSharePanel } from "@/components/devis/DevisSharePanel";
import { formatEuro } from "@/lib/format";

interface DevisDetailProps {
  devis: {
    id: string;
    numero: string;
    status: string;
    totalTTC: number;
    lockedAt: string | null;
    contentHash: string | null;
    shareToken: string | null;
    client: { nom: string; telephone: string | null };
    lignes: { description: string; quantite: number; prixUnitaireHT: number; totalHT: number }[];
  };
  plan: string;
  subscriptionActive?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  BROUILLON: "📄 Brouillon",
  ENVOYE: "✈️ Envoyé",
  ACCEPTE: "✅ Accepté",
  REFUSE: "❌ Refusé",
  FACTURE: "💰 Facturé",
};

export function DevisActions({ devis, subscriptionActive = true }: DevisDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState("");
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [origin, setOrigin] = useState("");
  const [confirmSend, setConfirmSend] = useState(false);
  const [actionError, setActionError] = useState("");

  const statusIdempotencyKey = useMemo(
    () => `devis-status-${devis.id}`,
    [devis.id]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture window.location au montage (SSR-safe)
    setOrigin(window.location.origin);
  }, []);

  async function send() {
    setLoading("send");
    setActionError("");
    const res = await fetch(`/api/devis/${devis.id}/send`, { method: "POST" });
    setLoading("");
    setConfirmSend(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = (data as { error?: string }).error ?? "Envoi impossible.";
      toast(msg, "error");
      setActionError(msg);
      return;
    }
    toast("Devis envoyé et verrouillé");
    router.refresh();
  }

  async function setStatus(status: "ACCEPTE" | "REFUSE") {
    setLoading(status);
    setActionError("");
    const res = await fetch(`/api/devis/${devis.id}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": statusIdempotencyKey,
      },
      body: JSON.stringify({ status }),
    });
    setLoading("");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = (data as { error?: string }).error ?? "Action impossible.";
      toast(msg, "error");
      setActionError(msg);
      return;
    }
    toast(status === "ACCEPTE" ? "Devis marqué accepté" : "Devis marqué refusé");
    router.refresh();
  }

  async function toFacture(issueNow: boolean) {
    setLoading(issueNow ? "facture-issue" : "facture");
    setActionError("");
    const res = await fetch("/api/factures", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": `facture-from-${devis.id}`,
      },
      body: JSON.stringify({ devisId: devis.id }),
    });
    const facture = await res.json();
    if (!res.ok) {
      setLoading("");
      toast(facture.error ?? "Impossible de créer la facture.", "error");
      setActionError(facture.error ?? "Impossible de créer la facture.");
      return;
    }

    if (issueNow) {
      const issueRes = await fetch(`/api/factures/${facture.id}`, { method: "POST" });
      setLoading("");
      if (!issueRes.ok) {
        toast("Facture créée — émission à finaliser", "info");
        router.push(`/dashboard/factures/${facture.id}`);
        return;
      }
      toast("Facture émise avec succès");
      router.push(`/dashboard/factures/${facture.id}?issued=1`);
      return;
    }

    setLoading("");
    toast("Brouillon facture créé");
    router.push(`/dashboard/factures/${facture.id}`);
  }

  async function verify() {
    const res = await fetch(`/api/devis/${devis.id}/verify`);
    const data = await res.json();
    setVerifyResult(data.valid);
  }

  const paidAccess = subscriptionActive;
  const shareUrl =
    paidAccess && devis.shareToken && origin ? `${origin}/devis/${devis.shareToken}` : null;

  return (
    <div className="space-y-4">
      {actionError && <p className="ui-alert-error text-sm">{actionError}</p>}

      {!subscriptionActive && (
        <div className="ui-alert-success text-sm">
          <p className="font-semibold">Votre devis {devis.numero} est enregistré.</p>
          <p className="mt-1">
            Activez l&apos;essai Starter pour obtenir le PDF, le lien client et le partage WhatsApp.
          </p>
          <Link href="/dashboard/activer" className="ui-btn-primary mt-4 inline-flex px-5 py-2 text-sm">
            Choisir mon abonnement →
          </Link>
        </div>
      )}

      <ConfirmDialog
        open={confirmSend}
        title="Envoyer et verrouiller ?"
        message="Une fois envoyé, ce devis ne pourra plus être modifié (conformité légale). Un lien client sera généré."
        confirmLabel="Envoyer"
        loading={loading === "send"}
        onConfirm={send}
        onCancel={() => setConfirmSend(false)}
      />

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm dark:bg-slate-800 dark:text-slate-200">
          {STATUS_LABELS[devis.status] ?? devis.status}
        </span>
        {devis.lockedAt && (
          <span className="ui-alert-success inline-block rounded-full px-3 py-1 text-sm">
            🔒 Verrouillé — inaltérable
          </span>
        )}
      </div>

      {shareUrl && devis.status === "ENVOYE" && (
        <DevisSharePanel
          numero={devis.numero}
          clientName={devis.client.nom}
          shareUrl={shareUrl}
          clientPhone={devis.client.telephone}
        />
      )}

      <div className="space-y-3">
        {devis.status === "BROUILLON" && subscriptionActive && (
          <>
            <PdfDownloadButton
              href={`/api/devis/${devis.id}/pdf`}
              filename={`devis-${devis.numero}.pdf`}
              className="ui-btn-outline block w-full py-3 text-center text-base"
              label="📄 Aperçu / télécharger le PDF"
            />
            <button
              onClick={() => setConfirmSend(true)}
              disabled={!!loading}
              aria-busy={loading === "send"}
              className="ui-btn-primary w-full py-4 text-base font-semibold disabled:opacity-60"
            >
              {loading === "send" ? "Envoi et verrouillage…" : "Envoyer au client →"}
            </button>
          </>
        )}

        {devis.status === "ENVOYE" && !shareUrl && paidAccess && (
          <p className="text-body text-sm">Lien client indisponible — contactez le support.</p>
        )}

        {devis.status === "ENVOYE" && !paidAccess && (
          <Link href="/dashboard/activer" className="ui-btn-primary block w-full py-4 text-center text-base">
            Activer l&apos;essai pour partager
          </Link>
        )}

        {devis.status === "ACCEPTE" && paidAccess && (
          <>
            <button
              onClick={() => toFacture(true)}
              disabled={!!loading}
              aria-busy={loading === "facture-issue"}
              className="w-full rounded-lg bg-amber-600 py-4 text-base font-semibold text-white hover:bg-amber-500 disabled:opacity-60"
            >
              {loading === "facture-issue"
                ? "Génération du document sécurisé…"
                : "Créer et émettre la facture →"}
            </button>
            <button
              onClick={() => toFacture(false)}
              disabled={!!loading}
              aria-busy={loading === "facture"}
              className="ui-btn-outline w-full py-3 text-sm disabled:opacity-60"
            >
              {loading === "facture" ? "Création…" : "Créer un brouillon facture"}
            </button>
          </>
        )}

        {devis.status === "ACCEPTE" && !paidAccess && (
          <Link href="/dashboard/activer" className="ui-btn-primary block w-full py-4 text-center text-base">
            Activer l&apos;essai pour facturer
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
        {subscriptionActive && devis.status !== "BROUILLON" && (
          <PdfDownloadButton
            href={`/api/devis/${devis.id}/pdf`}
            filename={`devis-${devis.numero}.pdf`}
            className="ui-btn-outline text-sm"
            label="PDF"
          />
        )}

        {devis.status === "ENVOYE" && (
          <>
            <button onClick={() => setStatus("ACCEPTE")} disabled={!!loading} className="ui-btn-outline text-sm text-green-700">
              Accepté
            </button>
            <button onClick={() => setStatus("REFUSE")} disabled={!!loading} className="ui-btn-outline text-sm text-red-700">
              Refusé
            </button>
          </>
        )}

        {devis.contentHash && (
          <button onClick={verify} className="ui-btn-outline text-sm">
            Vérifier
          </button>
        )}
      </div>

      {verifyResult !== null && (
        <p className={`text-sm ${verifyResult ? "text-green-700" : "text-red-700"}`}>
          {verifyResult ? "✓ Document intact — aucune altération détectée" : "✗ Altération détectée — contactez le support"}
        </p>
      )}

      {devis.contentHash && (
        <p className="break-all font-mono text-xs text-slate-400">
          Hash : {devis.contentHash.slice(0, 32)}…
        </p>
      )}

      <DocumentAuditTrail entityType="devis" entityId={devis.id} enabled={paidAccess} />

      <div className="ui-list overflow-hidden">
        {/* Mobile : cartes empilées */}
        <ul className="space-y-3 p-3 md:hidden">
          {devis.lignes.map((l, i) => (
            <li
              key={i}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm"
            >
              <p className="heading font-medium">{l.description}</p>
              <dl className="text-body mt-2 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-subtle">Qté</dt>
                  <dd>{l.quantite}</dd>
                </div>
                <div>
                  <dt className="text-subtle">P.U.</dt>
                  <dd>{formatEuro(l.prixUnitaireHT)}</dd>
                </div>
                <div>
                  <dt className="text-subtle">Total</dt>
                  <dd className="font-medium">{formatEuro(l.totalHT)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
        {/* Desktop : tableau */}
        <table className="hidden w-full text-sm md:table">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
              <th className="p-3">Description</th>
              <th className="p-3">Qté</th>
              <th className="p-3">P.U.</th>
              <th className="p-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {devis.lignes.map((l, i) => (
              <tr key={i} className="border-b border-slate-200 dark:border-slate-700">
                <td className="p-3">{l.description}</td>
                <td className="p-3">{l.quantite}</td>
                <td className="p-3">{formatEuro(l.prixUnitaireHT)}</td>
                <td className="p-3">{formatEuro(l.totalHT)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3 text-right font-bold">{formatEuro(devis.totalTTC)} TTC</div>
      </div>
    </div>
  );
}
