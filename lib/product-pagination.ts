export type CompactPaginationItem = number | "ellipsis";
export type ProductPageValue = string | string[] | number | null | undefined;

export const PRODUCT_PAGE_SIZE = 12;

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function normalizeProductPage(value?: ProductPageValue) {
  const firstValue = Array.isArray(value) ? value[0] : value;
  const page = typeof firstValue === "number" ? firstValue : Number.parseInt(firstValue ?? "", 10);

  return Number.isFinite(page) && page > 1 ? Math.floor(page) : 1;
}

export function clampProductPage(page: number, totalPages: number) {
  const safeTotalPages = Math.max(1, Math.floor(totalPages));
  const safePage = Number.isFinite(page) ? Math.floor(page) : 1;

  return Math.min(Math.max(1, safePage), safeTotalPages);
}

export function buildPaginationHref(basePath: string, page: number) {
  const safePage = normalizeProductPage(page);

  return safePage > 1 ? `${basePath}?page=${safePage}` : basePath;
}

export function getPaginatedItems<T>(items: T[], page: ProductPageValue, pageSize = PRODUCT_PAGE_SIZE) {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const totalPages = Math.max(1, Math.ceil(items.length / safePageSize));
  const currentPage = clampProductPage(normalizeProductPage(page), totalPages);

  return {
    currentPage,
    totalPages,
    items: items.slice((currentPage - 1) * safePageSize, currentPage * safePageSize),
  };
}

export function getCompactPaginationItems(
  currentPage: number,
  totalPages: number,
  siblingCount = 1,
): CompactPaginationItem[] {
  const pageCount = Math.max(0, Math.floor(totalPages));

  if (pageCount <= 0) {
    return [];
  }

  const current = Math.min(Math.max(1, Math.floor(currentPage)), pageCount);
  const edgeWindow = Math.max(3, siblingCount + 3);
  const shortRangeLimit = edgeWindow * 2 - 1;

  if (pageCount <= shortRangeLimit) {
    return range(1, pageCount);
  }

  if (current <= edgeWindow) {
    return [...range(1, edgeWindow), "ellipsis", pageCount];
  }

  if (current >= pageCount - edgeWindow + 1) {
    return [1, "ellipsis", ...range(pageCount - edgeWindow + 1, pageCount)];
  }

  return [
    1,
    "ellipsis",
    ...range(current - siblingCount, current + siblingCount),
    "ellipsis",
    pageCount,
  ];
}
