"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";

interface SettingsData {
  profile: { name: string; email: string; phone: string | null; plan: string };
  company: {
    raisonSociale: string;
    siret: string;
    adresse: string;
    codePostal: string;
    ville: string;
    tvaApplicable: boolean;
    tvaIntracom: string | null;
    telephone: string | null;
    email: string | null;
    capitalSocial: string | null;
    rcs: string | null;
    assurances: string | null;
    logoUrl: string | null;
  } | null;
  isTeamMember?: boolean;
}

export function SettingsForm() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving("profile");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: "profile",
        name: fd.get("name"),
        email: fd.get("email"),
        phone: (fd.get("phone") as string) || null,
      }),
    });
    const json = await res.json();
    setSaving("");
    if (res.ok) toast("Profil mis à jour");
    else toast(json.error ?? "Erreur profil", "error");
  }

  async function saveCompany(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving("company");
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
        tvaIntracom: (fd.get("tvaIntracom") as string) || null,
        telephone: (fd.get("telephone") as string) || null,
        email: (fd.get("email") as string) || null,
        capitalSocial: (fd.get("capitalSocial") as string) || null,
        rcs: (fd.get("rcs") as string) || null,
        assurances: (fd.get("assurances") as string) || null,
      }),
    });
    const json = await res.json();
    setSaving("");
    if (res.ok) {
      toast("Entreprise mise à jour");
      if (json.company) {
        setData((d) => (d ? { ...d, company: json.company } : d));
      }
    } else {
      toast(json.error ?? "Erreur entreprise", "error");
    }
  }

  async function uploadLogo(file: File) {
    if (file.size > 500_000) {
      toast("Logo max 500 Ko", "error");
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
      if (res.ok) {
        toast("Logo mis à jour");
        const json = await res.json();
        setData((d) => (d ? { ...d, company: json.company ?? d.company } : d));
      } else {
        toast("Erreur logo", "error");
      }
    };
    reader.readAsDataURL(file);
  }

  if (loading) return <p className="text-subtle">Chargement…</p>;
  if (!data?.profile) return <p className="ui-alert-error">Impossible de charger vos paramètres.</p>;

  const inputClass = "ui-input mt-1";
  const company = data.company;

  return (
    <div className="space-y-10">
      <form onSubmit={saveProfile} className="ui-card-padded space-y-4" id="profil">
        <h2 className="heading font-semibold">Profil</h2>
        <div>
          <label className="ui-label">Nom</label>
          <input name="name" defaultValue={data.profile.name} className={inputClass} required />
        </div>
        <div>
          <label className="ui-label">Email</label>
          <input name="email" type="email" defaultValue={data.profile.email} className={inputClass} required readOnly aria-readonly="true" title="Contactez le support pour changer d'email" />
        </div>
        <div>
          <label className="ui-label">Téléphone</label>
          <input name="phone" defaultValue={data.profile.phone ?? ""} className={inputClass} />
        </div>
        <button type="submit" className="ui-btn-primary" disabled={saving === "profile"} aria-busy={saving === "profile"}>
          {saving === "profile" ? "Enregistrement…" : "Enregistrer le profil"}
        </button>
      </form>

      {!data.isTeamMember && (
        <form onSubmit={saveCompany} className="ui-card-padded space-y-4" id="entreprise">
          <h2 className="heading font-semibold">Entreprise</h2>
          <p className="text-body text-sm">
            Ces informations apparaissent sur vos devis et factures (mentions légales obligatoires).
          </p>
          <div>
            <label className="ui-label">Raison sociale</label>
            <input
              name="raisonSociale"
              defaultValue={company?.raisonSociale ?? ""}
              className={inputClass}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="ui-label">SIRET</label>
              <input name="siret" defaultValue={company?.siret ?? ""} className={inputClass} required />
            </div>
            <div>
              <label className="ui-label">Code postal</label>
              <input name="codePostal" defaultValue={company?.codePostal ?? ""} className={inputClass} required />
            </div>
          </div>
          <div>
            <label className="ui-label">Adresse</label>
            <input name="adresse" defaultValue={company?.adresse ?? ""} className={inputClass} required />
          </div>
          <div>
            <label className="ui-label">Ville</label>
            <input name="ville" defaultValue={company?.ville ?? ""} className={inputClass} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="ui-label">Téléphone entreprise</label>
              <input name="telephone" defaultValue={company?.telephone ?? ""} className={inputClass} />
            </div>
            <div>
              <label className="ui-label">Email entreprise</label>
              <input name="email" type="email" defaultValue={company?.email ?? ""} className={inputClass} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="ui-label">N° TVA intracom.</label>
              <input name="tvaIntracom" defaultValue={company?.tvaIntracom ?? ""} className={inputClass} />
            </div>
            <div>
              <label className="ui-label">RCS</label>
              <input name="rcs" defaultValue={company?.rcs ?? ""} className={inputClass} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="ui-label">Capital social</label>
              <input name="capitalSocial" defaultValue={company?.capitalSocial ?? ""} className={inputClass} />
            </div>
            <div>
              <label className="ui-label">Assurances (décennale, RC pro…)</label>
              <input name="assurances" defaultValue={company?.assurances ?? ""} className={inputClass} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input name="tvaApplicable" type="checkbox" defaultChecked={company?.tvaApplicable ?? false} />
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
            {company?.logoUrl && (
              <Image
                src={company.logoUrl}
                alt={company.raisonSociale ? `Logo de ${company.raisonSociale}` : "Logo entreprise"}
                width={120}
                height={64}
                unoptimized
                className="mt-2 h-16 w-auto object-contain"
              />
            )}
          </div>
          <button
            type="submit"
            className="ui-btn-primary"
            disabled={saving === "company"}
            aria-busy={saving === "company"}
          >
            {saving === "company" ? "Enregistrement…" : "Enregistrer l'entreprise"}
          </button>
        </form>
      )}
    </div>
  );
}
