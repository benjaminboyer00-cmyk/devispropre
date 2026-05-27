"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validateEmail } from "@/lib/validation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const emailErr = validateEmail(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erreur de connexion");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="ui-alert-error">{error}</p>}
      <div>
        <label className="ui-label">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="ui-input mt-1"
        />
      </div>
      <div>
        <label className="ui-label">Mot de passe</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="ui-input mt-1"
        />
      </div>
      <button type="submit" disabled={loading} className="ui-btn-primary w-full py-3">
        {loading ? "Connexion…" : "Se connecter"}
      </button>
      <p className="text-body text-center text-sm">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="link-underline font-medium">
          Inscription gratuite
        </Link>
      </p>
    </form>
  );
}
