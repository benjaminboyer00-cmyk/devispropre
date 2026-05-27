"use client";

import { useEffect, useState } from "react";

interface SessionRow {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  lastSeenAt: string;
  current: boolean;
}

function formatDevice(userAgent: string | null): string {
  if (!userAgent) return "Appareil inconnu";
  if (/iPhone|iPad/i.test(userAgent)) return "iPhone / iPad";
  if (/Android/i.test(userAgent)) return "Android";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Mac OS/i.test(userAgent)) return "Mac";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Navigateur";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AccountSessionsPanel() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [message, setMessage] = useState("");

  function load() {
    fetch("/api/auth/sessions")
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function revokeSession(sessionId: string) {
    setActionLoading(sessionId);
    setMessage("");
    const res = await fetch("/api/auth/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke", sessionId }),
    });
    const json = await res.json();
    setActionLoading("");
    if (json.loggedOut) {
      window.location.href = "/connexion";
      return;
    }
    if (res.ok) {
      setMessage("Session révoquée");
      load();
    } else {
      setMessage("Impossible de révoquer cette session");
    }
  }

  async function revokeOthers() {
    setActionLoading("others");
    setMessage("");
    const res = await fetch("/api/auth/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke-others" }),
    });
    setActionLoading("");
    if (res.ok) {
      setMessage("Autres sessions déconnectées");
      load();
    }
  }

  return (
    <div className="ui-card-padded space-y-4" id="securite">
      <h2 className="heading font-semibold">Sécurité — sessions actives</h2>
      <p className="text-body text-sm">
        Chaque connexion crée une session révocable. Déconnectez les appareils que vous ne reconnaissez pas.
      </p>

      {message && <p className="ui-alert-success text-sm">{message}</p>}

      {loading ? (
        <p className="text-subtle text-sm">Chargement…</p>
      ) : sessions.length === 0 ? (
        <p className="text-subtle text-sm">Aucune session active.</p>
      ) : (
        <ul className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)]">
          {sessions.map((s) => (
            <li key={s.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div>
                <p className="heading text-sm font-medium">
                  {formatDevice(s.userAgent)}
                  {s.current && (
                    <span className="ml-2 rounded bg-green-50 px-2 py-0.5 text-xs text-green-800">
                      Session actuelle
                    </span>
                  )}
                </p>
                <p className="text-subtle text-xs">
                  {s.ipAddress ? `IP ${s.ipAddress} · ` : ""}
                  Dernière activité : {formatDate(s.lastSeenAt)}
                </p>
              </div>
              {!s.current && (
                <button
                  type="button"
                  disabled={!!actionLoading}
                  onClick={() => revokeSession(s.id)}
                  className="ui-btn-outline text-xs"
                >
                  {actionLoading === s.id ? "…" : "Déconnecter"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {sessions.length > 1 && (
        <button
          type="button"
          disabled={!!actionLoading}
          onClick={revokeOthers}
          className="ui-btn-outline text-sm"
        >
          {actionLoading === "others" ? "…" : "Déconnecter tous les autres appareils"}
        </button>
      )}
    </div>
  );
}
