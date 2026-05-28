import Link from "next/link";
import { buildPageHref } from "@/lib/pagination";

interface ListPaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  /** Paramètres de requête à conserver (ex. vue=brouillons). */
  queryParams?: Record<string, string | undefined>;
  /** Libellé pour aria (ex. « devis », « factures »). */
  label?: string;
}

export function ListPagination({
  page,
  totalPages,
  basePath,
  queryParams,
  label = "résultats",
}: ListPaginationProps) {
  if (totalPages <= 1) return null;

  const prevHref = page > 1 ? buildPageHref(basePath, page - 1, queryParams) : null;
  const nextHref = page < totalPages ? buildPageHref(basePath, page + 1, queryParams) : null;

  return (
    <nav
      aria-label={`Pagination des ${label}`}
      className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-6"
    >
      <p className="text-subtle text-sm">
        Page {page} sur {totalPages}
      </p>
      <div className="flex gap-2">
        {prevHref ? (
          <Link href={prevHref} className="ui-btn-outline py-2 text-sm">
            ← Précédent
          </Link>
        ) : (
          <span className="ui-btn-outline pointer-events-none py-2 text-sm opacity-40" aria-hidden>
            ← Précédent
          </span>
        )}
        {nextHref ? (
          <Link href={nextHref} className="ui-btn-outline py-2 text-sm">
            Suivant →
          </Link>
        ) : (
          <span className="ui-btn-outline pointer-events-none py-2 text-sm opacity-40" aria-hidden>
            Suivant →
          </span>
        )}
      </div>
    </nav>
  );
}
