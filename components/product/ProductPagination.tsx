"use client";

import { getCompactPaginationItems, type CompactPaginationItem } from "@/lib/product-pagination";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/Icons";

type ProductPaginationProps = {
  currentPage: number;
  totalPages: number;
  getPageHref: (page: number) => string;
  onPageChange: (page: number) => void;
  ariaLabel?: string;
};

export function ProductPagination({
  currentPage,
  totalPages,
  getPageHref,
  onPageChange,
  ariaLabel = "Product pagination",
}: ProductPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const desktopPages = getCompactPaginationItems(currentPage, totalPages);
  const mobilePages = getCompactPaginationItems(currentPage, totalPages, 0);
  const linkClass =
    "inline-flex h-9 min-w-9 shrink-0 items-center justify-center rounded-md border px-2 text-xs font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 sm:h-10 sm:min-w-10 sm:px-3 sm:text-sm";
  const arrowClass = `${linkClass} gap-1.5 sm:min-w-[5.75rem]`;
  const disabledClass = "pointer-events-none border-slate-200 bg-slate-50 text-slate-300";
  const inactiveClass = "border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:text-red-600";
  const activeClass = "border-red-600 bg-red-600 text-white shadow-sm shadow-red-600/20";
  const ellipsisClass =
    "inline-flex h-9 min-w-5 shrink-0 items-center justify-center text-xs font-black text-slate-400 sm:h-10 sm:min-w-8 sm:text-sm";
  const renderPageItems = (items: CompactPaginationItem[]) =>
    items.map((item, index) => {
      if (item === "ellipsis") {
        return (
          <span key={`ellipsis-${index}`} className={ellipsisClass} aria-hidden="true">
            ...
          </span>
        );
      }

      return (
        <a
          key={item}
          href={getPageHref(item)}
          onClick={(event) => {
            event.preventDefault();
            onPageChange(item);
          }}
          aria-current={currentPage === item ? "page" : undefined}
          aria-label={`Go to page ${item}`}
          className={`${linkClass} ${currentPage === item ? activeClass : inactiveClass}`}
        >
          {item}
        </a>
      );
    });

  return (
    <nav
      className="flex items-center justify-between gap-2 overflow-hidden rounded-lg border border-slate-200 bg-white px-2 py-3 shadow-sm shadow-slate-950/[0.03] sm:px-4"
      aria-label={ariaLabel}
    >
      <a
        href={getPageHref(currentPage - 1)}
        onClick={(event) => {
          event.preventDefault();
          if (currentPage > 1) {
            onPageChange(currentPage - 1);
          }
        }}
        aria-disabled={currentPage === 1 ? "true" : undefined}
        aria-label="Previous page"
        className={`${arrowClass} ${currentPage === 1 ? disabledClass : inactiveClass}`}
      >
        <ChevronLeftIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
      </a>

      <div className="flex min-w-0 flex-1 justify-center">
        <div className="flex items-center justify-center gap-1.5 sm:hidden">{renderPageItems(mobilePages)}</div>
        <div className="hidden items-center justify-center gap-2 sm:flex">{renderPageItems(desktopPages)}</div>
      </div>

      <a
        href={getPageHref(currentPage + 1)}
        onClick={(event) => {
          event.preventDefault();
          if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
          }
        }}
        aria-disabled={currentPage === totalPages ? "true" : undefined}
        aria-label="Next page"
        className={`${arrowClass} ${currentPage === totalPages ? disabledClass : inactiveClass}`}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRightIcon className="h-4 w-4" />
      </a>
    </nav>
  );
}
