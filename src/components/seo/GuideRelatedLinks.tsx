import Link from "next/link";
import { GUIDE_ARTICLES } from "@/lib/guides";
import { ROUTES } from "@/lib/routes";

interface GuideRelatedLinksProps {
  current: string;
}

export function GuideRelatedLinks({ current }: GuideRelatedLinksProps) {
  const others = GUIDE_ARTICLES.filter((g) => g.href !== current).slice(0, 4);

  return (
    <section className="not-prose mt-16 border-t border-[var(--border)] pt-10">
      <h2 className="heading-section text-xl">Guides connexes</h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {others.map((g) => (
          <li key={g.href}>
            <Link href={g.href} className="ui-card-padded block hover:no-underline">
              <p className="heading text-base font-semibold">{g.title}</p>
              <p className="text-body mt-1 text-sm">{g.description}</p>
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
      <p className="text-body mt-6 text-sm">
        <Link href="/blog" className="link-underline font-medium">
          Voir tous les guides
        </Link>
      </p>
    </section>
  );
}
