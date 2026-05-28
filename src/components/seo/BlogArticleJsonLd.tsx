import { BLOG_EDITORIAL_ARTICLES, type GuideArticle } from "@/lib/guides";
import { JsonLd } from "@/components/seo/JsonLd";
import { jsonLdBlogPosting } from "@/lib/seo";

/** JSON-LD BlogPosting pour un article éditorial du registre guides.ts */
export function BlogArticleJsonLd({ article }: { article: GuideArticle }) {
  if (!article.datePublished) return null;
  return (
    <JsonLd
      data={jsonLdBlogPosting({
        headline: article.title,
        description: article.description,
        path: article.href,
        datePublished: article.datePublished,
        dateModified: article.dateModified ?? article.datePublished,
      })}
    />
  );
}

export function blogArticleMeta(articleHref: string): GuideArticle | undefined {
  return BLOG_EDITORIAL_ARTICLES.find((a) => a.href === articleHref);
}
