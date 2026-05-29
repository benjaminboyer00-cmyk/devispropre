import { GUIDE_ARTICLES, type GuideArticle } from "@/lib/guides";
import { JsonLd } from "@/components/seo/JsonLd";
import { MARKETING_SITEMAP_LAST_MODIFIED } from "@/lib/local-seo";
import { jsonLdBlogPosting } from "@/lib/seo";

/** JSON-LD Article pour les guides pratiques (/guide/*). */
export function GuideArticleJsonLd({ article }: { article: GuideArticle }) {
  const published =
    article.datePublished ?? MARKETING_SITEMAP_LAST_MODIFIED.toISOString();
  const modified = article.dateModified ?? published;

  return (
    <JsonLd
      data={jsonLdBlogPosting({
        headline: article.title,
        description: article.description,
        path: article.href,
        datePublished: published,
        dateModified: modified,
      })}
    />
  );
}

export function guideArticleMeta(articleHref: string): GuideArticle | undefined {
  return GUIDE_ARTICLES.find((a) => a.href === articleHref);
}
