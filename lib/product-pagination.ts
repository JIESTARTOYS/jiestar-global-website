export type CompactPaginationItem = number | "ellipsis";

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
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
