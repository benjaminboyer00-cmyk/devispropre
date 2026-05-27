"use client";

import { useState } from "react";

interface AuditEntry {
  id: string;
  action: string;
  createdAt: string;
  metadata: string;
  contentHash: string | null;
}

interface DocumentAuditTrailProps {
  entityType: "devis" | "facture";
  entityId: string;
  enabled: boolean;
}

export function DocumentAuditTrail({ entityType, entityId, enabled }: DocumentAuditTrailProps) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState("");

  async function load() {
    if (entries) {
      setOpen(!open);
      return;
    }
    setError("");
    const res = await fetch(
      `/api/audit?entityType=${entityType}&entityId=${encodeURIComponent(entityId)}`
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Accès réservé au plan Starter");
      return;
    }
    setEntries(data);
    setOpen(true);
  }

  if (!enabled) return null;

  return (
    <div className="space-y-2">
      <button type="button" onClick={load} className="ui-btn-outline text-sm">
        {open ? "Masquer le journal" : "Journal d'audit du document"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {open && entries && (
        <ul className="ui-list max-h-48 overflow-y-auto text-xs">
          {entries.length === 0 ? (
            <li className="p-3 text-subtle">Aucune entrée</li>
          ) : (
            entries.map((e) => (
              <li key={e.id} className="border-divide-theme border-b px-3 py-2">
                <span className="font-medium">{e.action}</span>
                <span className="text-subtle ml-2">
                  {new Date(e.createdAt).toLocaleString("fr-FR")}
                </span>
                {e.contentHash && (
                  <p className="text-subtle mt-0.5 font-mono">hash {e.contentHash.slice(0, 12)}…</p>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
