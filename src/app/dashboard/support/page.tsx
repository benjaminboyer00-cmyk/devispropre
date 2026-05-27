"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function SupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<{ id: string; subject: string; status: string; createdAt: string }[]>([]);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/support")
      .then(async (r) => {
        const data = await r.json();
        if (r.ok) setTickets(data.tickets ?? []);
        else setError(data.error ?? "Accès réservé au plan Pro");
      })
      .catch(() => setError("Erreur de chargement"));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFeedback("");
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setFeedback(data.error ?? "Erreur");
      return;
    }
    setFeedback("Ticket créé — réponse prioritaire sous 24h ouvrées.");
    setSubject("");
    setMessage("");
    setTickets((t) => [{ ...data.ticket, createdAt: new Date().toISOString() }, ...t]);
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <p className="ui-alert-error">{error}</p>
        <Link href="/tarifs" className="link-underline mt-4 inline-block">
          Passer au plan Pro
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:py-12">
      <Link href="/dashboard" className="link-blue text-sm">
        ← Dashboard
      </Link>
      <h1 className="heading-section mt-4">Support prioritaire Pro</h1>
      <p className="text-body mt-2">
        Réponse garantie sous 24h ouvrées — file prioritaire.
      </p>

      <form onSubmit={submit} className="ui-card-padded mt-8 space-y-4">
        {feedback && <p className="ui-alert-success text-sm">{feedback}</p>}
        <div>
          <label className="ui-label">Sujet</label>
          <input
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="ui-input mt-1"
          />
        </div>
        <div>
          <label className="ui-label">Message</label>
          <textarea
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="ui-input mt-1"
          />
        </div>
        <button type="submit" disabled={loading} className="ui-btn-primary w-full">
          {loading ? "Envoi…" : "Ouvrir un ticket prioritaire"}
        </button>
      </form>

      {tickets.length > 0 && (
        <section className="mt-10">
          <h2 className="heading-card">Vos tickets</h2>
          <ul className="ui-list mt-4">
            {tickets.map((t) => (
              <li key={t.id} className="ui-list-row">
                <span>{t.subject}</span>
                <span className="text-subtle text-sm">{t.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
