"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { DocumentAuditTrail } from "@/components/audit/DocumentAuditTrail";
import { FactureSharePanel } from "@/components/facture/FactureSharePanel";
import { formatEuro } from "@/lib/format";
import { ROUTES } from "@/lib/routes";

interface FactureDetailProps {
  facture: {
    id: string;
    numero: string;
    status: string;
    totalTTC: number;
    lockedAt: string | null;
    contentHash: string | null;
    chainHash: string | null;
    shareToken: string | null;
    client: { nom: string; telephone: string | null };
    lignes: { description: string; quantite: number; prixUnitaireHT: number; totalHT: number }[];
    attestation: { numero: string } | null;
  };
  plan: string;
}

export function FactureActions({ facture, plan }: FactureDetailProps) {
  const starterPlus = plan === "STARTER" || plan === "PRO";
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState("");
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function issue() {
    setLoading("issue");
    const res = await fetch(`/api/factures/${facture.id}`, { method: "POST" });
    setLoading("");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast((data as { error?: string }).error ?? "Émission impossible", "error");
      return;
    }
    toast("Facture émise — document définitif");
    router.refresh();
  }

  async function pay() {
    setLoading("pay");
    await fetch(`/api/factures/${facture.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pay" }),
    });
    setLoading("");
    router.refresh();
  }

  async function cancelDraft() {
    setLoading("cancel");
    await fetch(`/api/factures/${facture.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    setLoading("");
    setConfirmCancel(false);
    router.refresh();
  }

  async function verify() {
    const res = await fetch(`/api/factures/${facture.id}/verify`);
    const data = await res.json();
    setVerifyResult(data.valid);
  }

  const shareUrl =
    facture.shareToken && origin && (facture.status === "EMISE" || facture.status === "PAYEE")
      ? `${origin}${ROUTES.publicFacture(facture.shareToken)}`
      : null;

  return (
    <div className="space-y-4">
      <ConfirmDialog
        open={confirmCancel}
        title="Annuler le brouillon ?"
        message="Ce brouillon de facture sera définitivement annulé. Cette action est irréversible."
        confirmLabel="Annuler le brouillon"
        variant="danger"
        loading={loading === "cancel"}
        onConfirm={cancelDraft}
        onCancel={() => setConfirmCancel(false)}
      />

      <div className="space-y-3">
        {shareUrl && (facture.status === "EMISE" || facture.status === "PAYEE") && (
          <FactureSharePanel
            numero={facture.numero}
            clientName={facture.client.nom}
            shareUrl={shareUrl}
            clientPhone={facture.client.telephone}
          />
        )}

        {facture.status === "BROUILLON" && (
          <button
            onClick={issue}
            disabled={!!loading}
            className="ui-btn-primary w-full py-4 text-base font-semibold"
          >
            Émettre la facture →
          </button>
        )}
        {facture.status === "EMISE" && (
          <button onClick={pay} disabled={!!loading} className="w-full rounded-lg bg-green-600 py-3 text-base font-medium text-white">
            Marquer payée
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
        {facture.status === "BROUILLON" && (
          <button
            onClick={() => setConfirmCancel(true)}
            disabled={!!loading}
            className="ui-btn-outline text-sm text-red-700"
          >
            Annuler
          </button>
        )}
        {(facture.status === "EMISE" || facture.status === "PAYEE") && !starterPlus && (
          <Link href="/tarifs" className="ui-btn-outline text-sm">
            Partage complet — Starter
          </Link>
        )}
        <a href={`/api/factures/${facture.id}/pdf`} target="_blank" className="ui-btn-outline text-sm">
          PDF
        </a>
        {facture.contentHash && (
          <button onClick={verify} className="ui-btn-outline text-sm">
            Vérifier
          </button>
        )}
      </div>

      {facture.lockedAt && (
        <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-800">
          🔒 Facture verrouillée — inaltérable (loi anti-fraude TVA 2018)
        </p>
      )}

      {facture.attestation && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-body text-sm">
            Attestation de conformité : {facture.attestation.numero}
          </p>
          <a
            href={`/api/factures/${facture.id}/attestation/pdf`}
            target="_blank"
            className="ui-btn-outline text-sm"
          >
            Télécharger l&apos;attestation PDF
          </a>
        </div>
      )}

      {verifyResult !== null && (
        <p className={`text-sm ${verifyResult ? "text-green-700" : "text-red-700"}`}>
          {verifyResult ? "✓ Chaîne d'intégrité valide" : "✗ Altération détectée"}
        </p>
      )}

      {facture.contentHash && (
        <p className="break-all font-mono text-xs text-slate-400">
          Hash : {facture.contentHash.slice(0, 32)}…
          {facture.chainHash && ` · Chaîne : ${facture.chainHash.slice(0, 16)}…`}
        </p>
      )}

      <DocumentAuditTrail entityType="facture" entityId={facture.id} enabled={starterPlus} />

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <tbody>
            {facture.lignes.map((l, i) => (
              <tr key={i} className="border-b">
                <td className="p-3">{l.description}</td>
                <td className="p-3 text-right">{formatEuro(l.totalHT)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3 text-right font-bold">{formatEuro(facture.totalTTC)} TTC</div>
      </div>
    </div>
  );
}

export function FacturePageWrapper({ facture, plan }: FactureDetailProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href={ROUTES.dashboardFactures} className="link-blue text-sm">
        ← Factures
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Facture {facture.numero}</h1>
      <p className="text-slate-600">Client : {facture.client.nom}</p>
      <div className="mt-8">
        <FactureActions facture={facture} plan={plan} />
      </div>
    </div>
  );
}
