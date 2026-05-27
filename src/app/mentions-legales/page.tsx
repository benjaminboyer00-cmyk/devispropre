import type { Metadata } from "next";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Mentions légales",
};

export default function MentionsLegalesPage() {
  const e = LEGAL.editor;
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 prose prose-slate">
      <h1>Mentions légales</h1>
      <h2>Éditeur du site</h2>
      <p>
        {e.name} — {e.company}<br />
        Email : {e.email}<br />
        Téléphone : {e.phone}
      </p>
      <h2>Hébergement</h2>
      <p>Hetzner Online GmbH — Allemagne</p>
      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble du contenu du site devispropre.fr est protégé par le droit d&apos;auteur.
      </p>
    </article>
  );
}
