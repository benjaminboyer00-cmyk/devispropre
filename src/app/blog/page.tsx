import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { ALL_BLOG_ARTICLES } from "@/lib/guides";
import { ROUTES } from "@/lib/routes";
import { jsonLdBreadcrumbList, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Blog facturation et devis pour artisans",
  description:
    "Guides pratiques : devis conforme, TVA artisan, facturation auto-entrepreneur, mentions légales et envoi WhatsApp. Conseils terrain pour plombiers, électriciens et artisans BTP.",
  path: "/blog",
  keywords: [
    "devis plombier",
    "comment faire un devis",
    "devis facile artisan",
    "facture auto entrepreneur",
    "devis artisan conforme",
    "TVA travaux",
    "logiciel devis artisan",
  ],
});

const BREADCRUMBS = [
  { name: "Accueil", path: "/" },
  { name: "Blog", path: "/blog" },
];

export default function BlogPage() {
  return (
    <>
      <JsonLd data={jsonLdBreadcrumbList(BREADCRUMBS)} />

      <div className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <nav aria-label="Fil d'Ariane" className="text-sm text-subtle">
          <Link href="/" className="link-blue hover:underline">
            Accueil
          </Link>
          <span className="mx-2">/</span>
          <span aria-current="page">Blog</span>
        </nav>

        <h1 className="heading-hero mt-6 text-3xl sm:text-4xl">
          Guides devis &amp; facturation pour artisans
        </h1>
        <p className="text-lead mt-4 font-light">
          Articles pratiques pour rédiger des devis conformes, gérer la TVA et facturer sans
          ressaisie. Chaque guide est rédigé pour le terrain — chantier, mobile, WhatsApp.
        </p>

        <ul className="mt-12 space-y-4">
          {ALL_BLOG_ARTICLES.map((article) => (
            <li key={article.href}>
              <Link href={article.href} className="ui-card-padded block hover:no-underline">
                <h2 className="heading text-lg font-semibold">{article.title}</h2>
                <p className="text-body mt-2 text-sm">{article.description}</p>
                <p className="text-subtle mt-3 text-xs">
                  {article.keywords.slice(0, 3).join(" · ")}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <p className="text-body mt-12 text-sm">
          Prêt à passer à l&apos;action ?{" "}
          <Link href={ROUTES.creerDevis} className="link-underline font-medium">
            Créer un devis gratuit
          </Link>
          {" · "}
          <Link href={ROUTES.conformite} className="link-underline font-medium">
            Conformité TVA 2018
          </Link>
        </p>
      </div>
    </>
  );
}
