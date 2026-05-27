"use client";

import { useEffect, useState } from "react";

interface Member {
  id: string;
  email: string;
  status: string;
  name: string | null;
}

export function TeamPanel() {
  const [members, setMembers] = useState<Member[]>([]);
  const [maxMembers, setMaxMembers] = useState(5);
  const [canManage, setCanManage] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function load() {
    fetch("/api/team")
      .then((r) => r.json())
      .then((data) => {
        setMembers(data.members ?? []);
        setMaxMembers(data.maxMembers ?? 5);
        setCanManage(data.canManage ?? false);
      });
  }

  useEffect(() => {
    load();
  }, []);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Invitation envoyée." : data.error ?? "Erreur");
    if (res.ok) {
      setEmail("");
      load();
    }
  }

  async function remove(memberId: string) {
    await fetch(`/api/team?memberId=${memberId}`, { method: "DELETE" });
    load();
  }

  if (maxMembers === 0 && !canManage) return null;

  return (
    <div className="ui-card-padded space-y-4">
      <h2 className="heading font-semibold">Équipe Pro ({members.length}/{maxMembers})</h2>
      <p className="text-body text-sm">
        Invitez jusqu&apos;à {maxMembers} collaborateurs. Ils accèdent aux devis et factures de votre entreprise.
      </p>

      {message && <p className="ui-alert-success text-sm">{message}</p>}

      {canManage && members.length < maxMembers && (
        <form onSubmit={invite} className="flex gap-2">
          <input
            type="email"
            required
            placeholder="email@collaborateur.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="ui-input flex-1"
          />
          <button type="submit" className="ui-btn-primary shrink-0">
            Inviter
          </button>
        </form>
      )}

      <ul className="border-divide-theme divide-y">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between py-3 text-sm">
            <div>
              <p className="heading font-medium">{m.email}</p>
              <p className="text-subtle text-xs">
                {m.status === "ACTIVE" ? m.name ?? "Actif" : "Invitation en attente"}
              </p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => remove(m.id)}
                className="text-sm text-red-600 hover:underline"
              >
                Retirer
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
