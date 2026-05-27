"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  validateEmail,
  validateFrenchPhone,
  validateFrenchPostcode,
  validatePassword,
  validateSiret,
} from "@/lib/validation";

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    raisonSociale: "",
    siret: "",
    adresse: "",
    codePostal: "",
    ville: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const checks = [
      validateEmail(form.email),
      validatePassword(form.password),
      form.phone ? validateFrenchPhone(form.phone) : null,
      validateSiret(form.siret),
      validateFrenchPostcode(form.codePostal),
    ].filter(Boolean);

    if (checks.length > 0) {
      setError(checks[0]!);
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", ...form }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erreur inscription");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const inputClass = "input-field";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-xl bg-danger/10 px-4 py-2 text-sm text-danger">{error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Votre nom</label>
          <input required value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium">Téléphone</label>
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass} placeholder="06 XX XX XX XX" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Email</label>
        <input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass} />
      </div>

      <div>
        <label className="block text-sm font-medium">Mot de passe (8 car. min.)</label>
        <input type="password" required minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} className={inputClass} />
      </div>

      <hr className="border-border" />
      <p className="text-sm font-medium text-foreground">Votre entreprise (mentions légales PDF)</p>

      <div>
        <label className="block text-sm font-medium">Raison sociale</label>
        <input required value={form.raisonSociale} onChange={(e) => update("raisonSociale", e.target.value)} className={inputClass} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">SIRET</label>
          <input required value={form.siret} onChange={(e) => update("siret", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium">Code postal</label>
          <input required value={form.codePostal} onChange={(e) => update("codePostal", e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Adresse</label>
        <input required value={form.adresse} onChange={(e) => update("adresse", e.target.value)} className={inputClass} />
      </div>

      <div>
        <label className="block text-sm font-medium">Ville</label>
        <input required value={form.ville} onChange={(e) => update("ville", e.target.value)} className={inputClass} />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
        {loading ? "Création…" : "Créer mon compte — 30 secondes"}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Gratuit 30 jours · Sans carte ·{" "}
        <Link href="/connexion" className="link-primary">Déjà inscrit ?</Link>
      </p>
    </form>
  );
}
