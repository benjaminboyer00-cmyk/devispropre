export const LIST_PAGE_SIZE = 20;

export function parsePageParam(raw?: string | null): number {
  const n = parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

export function paginationBounds(page: number, pageSize = LIST_PAGE_SIZE) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export function totalPages(total: number, pageSize = LIST_PAGE_SIZE): number {
  if (total <= 0) return 1;
  return Math.ceil(total / pageSize);
}

export function buildPageHref(
  basePath: string,
  page: number,
  params?: Record<string, string | undefined>
): string {
  const sp = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) sp.set(key, value);
    }
  }
  if (page > 1) sp.set("page", String(page));
  const query = sp.toString();
  return query ? `${basePath}?${query}` : basePath;
}
