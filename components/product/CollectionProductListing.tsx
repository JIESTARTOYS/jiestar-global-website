"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProductSummary } from "@/lib/data";
import {
  buildPaginationHref,
  clampProductPage,
  normalizeProductPage,
  PRODUCT_PAGE_SIZE,
} from "@/lib/product-pagination";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/LinkButton";
import { CatalogProductCard } from "@/components/product/CatalogProductCard";
import { ProductPagination } from "@/components/product/ProductPagination";

type CollectionProductListingProps = {
  products: ProductSummary[];
  collectionHandle: string;
  selectedPage?: string;
};

export function CollectionProductListing({
  products,
  collectionHandle,
  selectedPage,
}: CollectionProductListingProps) {
  const listingRef = useRef<HTMLDivElement>(null);
  const basePath = `/collections/${collectionHandle}`;
  const [currentPage, setCurrentPage] = useState(() => normalizeProductPage(selectedPage));
  const totalPages = Math.max(1, Math.ceil(products.length / PRODUCT_PAGE_SIZE));
  const safeCurrentPage = clampProductPage(currentPage, totalPages);
  const paginatedProducts = useMemo(
    () =>
      products.slice(
        (safeCurrentPage - 1) * PRODUCT_PAGE_SIZE,
        safeCurrentPage * PRODUCT_PAGE_SIZE,
      ),
    [products, safeCurrentPage],
  );
  const getPageHref = useCallback((page: number) => buildPaginationHref(basePath, page), [basePath]);
  const scrollToListing = useCallback(() => {
    window.requestAnimationFrame(() => {
      const target = listingRef.current;

      if (!target) {
        return;
      }

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const stickyHeaderOffset = 112;
      const top = target.getBoundingClientRect().top + window.scrollY - stickyHeaderOffset;

      window.scrollTo({
        top: Math.max(0, top),
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });
  }, []);
  const handlePageChange = useCallback(
    (page: number) => {
      const nextPage = clampProductPage(page, totalPages);

      setCurrentPage(nextPage);
      window.history.pushState(null, "", getPageHref(nextPage));
      scrollToListing();
    },
    [getPageHref, scrollToListing, totalPages],
  );

  useEffect(() => {
    const handlePopState = () => {
      const page = new URLSearchParams(window.location.search).get("page");
      setCurrentPage(normalizeProductPage(page));
    };

    handlePopState();
    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      window.history.replaceState(null, "", getPageHref(safeCurrentPage));
      return;
    }

    if (safeCurrentPage === 1 && new URLSearchParams(window.location.search).has("page")) {
      window.history.replaceState(null, "", getPageHref(1));
    }
  }, [currentPage, getPageHref, safeCurrentPage]);

  if (!products.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
        <h2 className="text-xl font-black text-slate-950">Products are being prepared</h2>
        <p className="mt-3 text-slate-600">
          Add products to this Shopify collection to display them here, or browse the full catalog while this category is being prepared.
        </p>
        <LinkButton href="/products" className="mt-6">
          Browse All Products
          <ArrowRightIcon className="ml-2 h-4 w-4" />
        </LinkButton>
      </div>
    );
  }

  return (
    <div ref={listingRef} className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {paginatedProducts.map((product) => (
          <CatalogProductCard key={product.id} product={product} />
        ))}
      </div>
      <ProductPagination
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        getPageHref={getPageHref}
        onPageChange={handlePageChange}
        ariaLabel="Collection product pagination"
      />
    </div>
  );
}
