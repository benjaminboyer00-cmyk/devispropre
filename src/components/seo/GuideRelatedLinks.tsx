import Link from "next/link";
import { ROUTES } from "@/lib/routes";

const GUIDES = [
  { href: ROUTES.guideDevisConforme, title: "Devis artisan conforme", desc: "Mentions obligatoires et checklist" },
  { href: ROUTES.guideMentionsDevis, title: "Mentions obligatoires", desc: "SIRET, TVA, validité, signature" },
  { href: ROUTES.guideFacturationAe, title: "Facturation auto-entrepreneur", desc: "Devis → facture — franchise ou assujetti TVA" },
  { href: ROUTES.guideTvaArtisan, title: "TVA artisan travaux", desc: "10 %, 20 %, franchise en base" },
  { href: ROUTES.guideDevisWhatsapp, title: "Devis par WhatsApp", desc: "PDF pro, lien client, relance J+3" },
] as const;

interface GuideRelatedLinksProps {
  current: string;
}

export function GuideRelatedLinks({ current }: GuideRelatedLinksProps) {
  const others = GUIDES.filter((g) => g.href !== current).slice(0, 4);

  return (
    <section className="not-prose mt-16 border-t border-[var(--border)] pt-10">
      <h2 className="heading-section text-xl">Guides connexes</h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {others.map((g) => (
          <li key={g.href}>
            <Link href={g.href} className="ui-card-padded block hover:no-underline">
              <p className="heading text-base font-semibold">{g.title}</p>
              <p className="text-body mt-1 text-sm">{g.desc}</p>
            </Link>
          </li>
        ))}
        <li>
          <Link href={ROUTES.conformite} className="ui-card-padded block hover:no-underline">
            <p className="heading text-base font-semibold">Conformité TVA 2018</p>
            <p className="text-body mt-1 text-sm">Inaltérabilité, hash SHA-256, attestation</p>
          </Link>
        </li>
      </ul>
    </section>
  );
}
