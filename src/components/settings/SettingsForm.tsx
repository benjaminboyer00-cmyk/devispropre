"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  companyUpdateSchema,
  formatZodError,
  profileUpdateSchema,
} from "@/lib/schemas/forms";
import {
  validateFrenchPhone,
  validateFrenchPostcode,
  validateSiret,
} from "@/lib/validation";

interface SettingsData {
  profile: { name: string; email: string; phone: string | null; plan: string };
  company: {
    raisonSociale: string;
    siret: string;
    adresse: string;
    codePostal: string;
    ville: string;
    tvaApplicable: boolean;
    logoUrl: string | null;
  } | null;
  isTeamMember?: boolean;
}

export function SettingsForm() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  async function checkout(plan: "STARTER" | "PRO") {
    setCheckoutLoading(plan);
    setMessage("");
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const json = await res.json();
    setCheckoutLoading("");
    if (json.url) {
      window.location.href = json.url;
    } else {
      setMessage(json.error ?? "Paiement indisponible");
    }
  }

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    const fd = new FormData(e.currentTarget);
    const parsed = profileUpdateSchema.safeParse({
      name: fd.get("name"),
      email: fd.get("email"),
      phone: (fd.get("phone") as string) || null,
    });
    if (!parsed.success) {
      setMessage(formatZodError(parsed.error));
      return;
    }
    const phoneErr = parsed.data.phone ? validateFrenchPhone(parsed.data.phone) : null;
    if (phoneErr) {
      setMessage(phoneErr);
      return;
    }
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "profile", ...parsed.data }),
    });
    setMessage(res.ok ? "Profil mis à jour" : "Erreur profil");
  }

  async function saveCompany(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    const fd = new FormData(e.currentTarget);
    const parsed = companyUpdateSchema.safeParse({
      raisonSociale: fd.get("raisonSociale"),
      siret: fd.get("siret"),
      adresse: fd.get("adresse"),
      codePostal: fd.get("codePostal"),
      ville: fd.get("ville"),
      tvaApplicable: fd.get("tvaApplicable") === "on",
    });
    if (!parsed.success) {
      setMessage(formatZodError(parsed.error));
      return;
    }
    const extra = [
      parsed.data.siret ? validateSiret(parsed.data.siret) : null,
      parsed.data.codePostal ? validateFrenchPostcode(parsed.data.codePostal) : null,
    ].filter(Boolean);
    if (extra.length > 0) {
      setMessage(extra[0]!);
      return;
    }
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "company", ...parsed.data }),
    });
    setMessage(res.ok ? "Entreprise mise à jour" : "Erreur entreprise");
  }

  async function uploadLogo(file: File) {
    if (file.size > 500_000) {
      setMessage("Logo max 500 Ko");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const logoUrl = reader.result as string;
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "company", logoUrl }),
      });
      setMessage(res.ok ? "Logo mis à jour" : "Erreur logo");
      if (res.ok) {
        const json = await res.json();
        setData((d) =>
          d && d.company ? { ...d, company: { ...d.company, logoUrl: json.company?.logoUrl ?? null } } : d
        );
      }
    };
    reader.readAsDataURL(file);
  }

  if (loading) return <p>Chargement…</p>;
  if (!data) return <p>Erreur chargement</p>;

  const inputClass = "ui-input mt-1";
  const plan = data.profile.plan;

  return (
    <div className="space-y-10">
      {message && (
        <p className={message.includes("Erreur") || message.includes("invalide") ? "ui-alert-error" : "ui-alert-success"}>
          {message}
        </p>
      )}

      {!data.isTeamMember && (
        <div className="ui-card-padded space-y-4">
          <h2 className="heading font-semibold">Votre abonnement</h2>
          <p className="text-body text-sm">
            Plan actuel : <strong>{plan}</strong>
          </p>
          {plan === "FREE" && (
            <p className="text-body text-sm">
              Passez au Starter pour WhatsApp, factures TVA 2018, relances J+3 et attestation PDF.
            </p>
          )}
          {plan !== "PRO" && (
            <div className="flex flex-wrap gap-2">
              {plan !== "STARTER" && (
                <button
                  type="button"
                  disabled={!!checkoutLoading}
                  onClick={() => checkout("STARTER")}
                  className="ui-btn-primary text-sm"
                >
                  {checkoutLoading === "STARTER" ? "Redirection…" : "Starter — 19€/mois"}
                </button>
              )}
              <button
                type="button"
                disabled={!!checkoutLoading}
                onClick={() => checkout("PRO")}
                className="ui-btn-outline text-sm"
              >
                {checkoutLoading === "PRO" ? "Redirection…" : "Pro — 39€/mois"}
              </button>
            </div>
          )}
          <Link href="/tarifs" className="link-underline text-sm">
            Voir le détail des fonctionnalités par plan
          </Link>
        </div>
      )}

      <form onSubmit={saveProfile} className="ui-card-padded space-y-4">
        <h2 className="heading font-semibold">Profil</h2>
        <div>
          <label className="ui-label">Nom</label>
          <input name="name" defaultValue={data.profile.name} className={inputClass} required />
        </div>
        <div>
          <label className="ui-label">Email</label>
          <input name="email" type="email" defaultValue={data.profile.email} className={inputClass} required />
        </div>
        <div>
          <label className="ui-label">Téléphone</label>
          <input name="phone" defaultValue={data.profile.phone ?? ""} className={inputClass} />
        </div>
        <button type="submit" className="ui-btn-primary">
          Enregistrer
        </button>
      </form>

      {data.company && !data.isTeamMember && (
        <form onSubmit={saveCompany} className="ui-card-padded space-y-4">
          <h2 className="heading font-semibold">Entreprise</h2>
          <div>
            <label className="ui-label">Raison sociale</label>
            <input name="raisonSociale" defaultValue={data.company.raisonSociale} className={inputClass} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="ui-label">SIRET</label>
              <input name="siret" defaultValue={data.company.siret} className={inputClass} required />
            </div>
            <div>
              <label className="ui-label">Code postal</label>
              <input name="codePostal" defaultValue={data.company.codePostal} className={inputClass} required />
            </div>
          </div>
          <div>
            <label className="ui-label">Adresse</label>
            <input name="adresse" defaultValue={data.company.adresse} className={inputClass} required />
          </div>
          <div>
            <label className="ui-label">Ville</label>
            <input name="ville" defaultValue={data.company.ville} className={inputClass} required />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input name="tvaApplicable" type="checkbox" defaultChecked={data.company.tvaApplicable} />
            Je facture la TVA (décocher si franchise en base — art. 293 B CGI)
          </label>
          <div>
            <label className="ui-label">Logo (PNG/JPG, max 500 Ko)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])}
              className="mt-1 text-sm"
            />
            {data.company.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.company.logoUrl} alt="Logo" className="mt-2 h-16 object-contain" />
            )}
          </div>
          <button type="submit" className="ui-btn-primary">
            Enregistrer
          </button>
        </form>
      )}
    </div>
  );
}
