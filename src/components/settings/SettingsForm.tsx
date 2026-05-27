"use client";

import { useEffect, useState } from "react";

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
}

export function SettingsForm() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: "profile",
        name: fd.get("name"),
        email: fd.get("email"),
        phone: fd.get("phone"),
      }),
    });
    setMessage(res.ok ? "Profil mis à jour" : "Erreur profil");
  }

  async function saveCompany(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: "company",
        raisonSociale: fd.get("raisonSociale"),
        siret: fd.get("siret"),
        adresse: fd.get("adresse"),
        codePostal: fd.get("codePostal"),
        ville: fd.get("ville"),
        tvaApplicable: fd.get("tvaApplicable") === "on",
      }),
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

  const inputClass = "input-field";

  return (
    <div className="space-y-10">
      {message && <p className="rounded-xl bg-success-muted px-4 py-2 text-sm text-success">{message}</p>}

      <form onSubmit={saveProfile} className="card-padded space-y-4">
        <h2 className="font-semibold">Profil</h2>
        <div>
          <label className="text-sm">Nom</label>
          <input name="name" defaultValue={data.profile.name} className={inputClass} required />
        </div>
        <div>
          <label className="text-sm">Email</label>
          <input name="email" type="email" defaultValue={data.profile.email} className={inputClass} required />
        </div>
        <div>
          <label className="text-sm">Téléphone</label>
          <input name="phone" defaultValue={data.profile.phone ?? ""} className={inputClass} />
        </div>
        <button type="submit" className="btn-primary w-full sm:w-auto">Enregistrer</button>
      </form>

      {data.company && (
        <form onSubmit={saveCompany} className="card-padded space-y-4">
          <h2 className="font-semibold">Entreprise</h2>
          <div>
            <label className="text-sm">Raison sociale</label>
            <input name="raisonSociale" defaultValue={data.company.raisonSociale} className={inputClass} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm">SIRET</label>
              <input name="siret" defaultValue={data.company.siret} className={inputClass} required />
            </div>
            <div>
              <label className="text-sm">Code postal</label>
              <input name="codePostal" defaultValue={data.company.codePostal} className={inputClass} required />
            </div>
          </div>
          <div>
            <label className="text-sm">Adresse</label>
            <input name="adresse" defaultValue={data.company.adresse} className={inputClass} required />
          </div>
          <div>
            <label className="text-sm">Ville</label>
            <input name="ville" defaultValue={data.company.ville} className={inputClass} required />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input name="tvaApplicable" type="checkbox" defaultChecked={data.company.tvaApplicable} />
            Je facture la TVA (décocher si franchise en base — art. 293 B CGI)
          </label>
          <div>
            <label className="text-sm">Logo (PNG/JPG, max 500 Ko)</label>
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} className="mt-1 text-sm" />
            {data.company.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.company.logoUrl} alt="Logo" className="mt-2 h-16 object-contain" />
            )}
          </div>
          <button type="submit" className="btn-primary w-full sm:w-auto">Enregistrer</button>
        </form>
      )}
    </div>
  );
}
