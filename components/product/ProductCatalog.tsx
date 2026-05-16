"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Collection, Product } from "@/lib/data";
import { CatalogProductCard } from "@/components/product/CatalogProductCard";
import { CategoryCarousel } from "@/components/product/CategoryCarousel";
import {
  ChevronDownIcon,
  HomeIcon,
  RotateIcon,
  ShieldIcon,
  SlidersIcon,
  StoreIcon,
  TruckIcon,
} from "@/components/ui/Icons";

type ProductCatalogProps = {
  allProducts: Product[];
  collections: Collection[];
  selectedFilters: {
    query?: string;
    category?: string;
    pieces?: string;
    price?: string;
    sort: string;
  };
};

type FilterKey = "query" | "category" | "pieces" | "price" | "sort";
type ProductFilters = ProductCatalogProps["selectedFilters"];
type FilterAction = (key: FilterKey, value?: string) => void;

function priceNumber(price: string) {
  return Number(price.replace(/[^0-9.]/g, "")) || 0;
}

function pieceCountNumber(pieceCount: string) {
  return Number(pieceCount.replace(/[^0-9]/g, "")) || 0;
}

function filterByPieceCount(product: Product, range?: string) {
  const count = pieceCountNumber(product.pieceCount);

  if (!range || !count) {
    return true;
  }

  if (range === "under-500") {
    return count < 500;
  }

  if (range === "500-1000") {
    return count >= 500 && count <= 1000;
  }

  if (range === "1000-2000") {
    return count >= 1000 && count <= 2000;
  }

  if (range === "2000-plus") {
    return count >= 2000;
  }

  return true;
}

function filterByPrice(product: Product, range?: string) {
  const price = priceNumber(product.price);

  if (!range || !price) {
    return true;
  }

  if (range === "under-50") {
    return price < 50;
  }

  if (range === "50-100") {
    return price >= 50 && price <= 100;
  }

  if (range === "100-150") {
    return price > 100 && price <= 150;
  }

  if (range === "150-plus") {
    return price > 150;
  }

  return true;
}

function sortProducts(products: Product[], sort?: string) {
  const sortedProducts = [...products];

  if (sort === "price-asc") {
    return sortedProducts.sort((a, b) => priceNumber(a.price) - priceNumber(b.price));
  }

  if (sort === "price-desc") {
    return sortedProducts.sort((a, b) => priceNumber(b.price) - priceNumber(a.price));
  }

  if (sort === "newest") {
    return sortedProducts.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      return bTime - aTime;
    });
  }

  return sortedProducts;
}

function normalizeSearchText(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function productMatchesQuery(product: Product, query?: string) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  const searchableText = [
    product.title,
    product.sku,
    product.category,
    product.collectionHandle,
    product.series,
    product.description,
    product.sellingPoint,
    product.pieceCount,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}

function filterProducts(products: Product[], selectedFilters: ProductFilters) {
  return sortProducts(
    products.filter((product) => {
      const selectedCategory = selectedFilters.category;
      const matchesCategory =
        !selectedCategory ||
        product.collectionHandle === selectedCategory ||
        product.category.toLowerCase() === selectedCategory.toLowerCase();

      return (
        productMatchesQuery(product, selectedFilters.query) &&
        matchesCategory &&
        filterByPieceCount(product, selectedFilters.pieces) &&
        filterByPrice(product, selectedFilters.price)
      );
    }),
    selectedFilters.sort,
  );
}

function filtersFromUrl(defaultFilters: ProductFilters): ProductFilters {
  if (typeof window === "undefined") {
    return defaultFilters;
  }

  const params = new URLSearchParams(window.location.search);

  return {
    query: params.get("q") ?? undefined,
    category: params.get("category") ?? undefined,
    pieces: params.get("pieces") ?? undefined,
    price: params.get("price") ?? undefined,
    sort: params.get("sort") ?? "popular",
  };
}

function buildFilterHref(
  selectedFilters: ProductFilters,
  key: FilterKey,
  value?: string,
) {
  const params = new URLSearchParams();

  for (const [filterKey, filterValue] of Object.entries(selectedFilters)) {
    if (!filterValue || filterKey === "sort" && filterValue === "popular") {
      continue;
    }

    params.set(filterKey === "query" ? "q" : filterKey, filterValue);
  }

  if (value) {
    params.set(key === "query" ? "q" : key, value);
  } else {
    params.delete(key === "query" ? "q" : key);
  }

  if (params.get("sort") === "popular") {
    params.delete("sort");
  }

  const query = params.toString();

  return query ? `/products?${query}` : "/products";
}

function buildFilters(selectedFilters: ProductFilters, key: FilterKey, value?: string): ProductFilters {
  const nextFilters = { ...selectedFilters };
  const cleanValue = value?.trim();

  if (cleanValue) {
    nextFilters[key] = cleanValue;
  } else {
    delete nextFilters[key];
  }

  if (!nextFilters.sort) {
    nextFilters.sort = "popular";
  }

  return nextFilters;
}

function FilterSection({
  title,
  children,
  scrollable = false,
}: {
  title: string;
  children: React.ReactNode;
  scrollable?: boolean;
}) {
  return (
    <details open className="group border-t border-slate-200 pt-5 first:border-t-0 first:pt-0">
      <summary className="mb-4 flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <h2 className="text-sm font-black text-slate-950">{title}</h2>
        <ChevronDownIcon className="h-4 w-4 text-slate-700 transition group-open:rotate-180" />
      </summary>
      <div
        className={
          scrollable
            ? "max-h-[24.5rem] overflow-y-auto pr-2 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin]"
            : undefined
        }
      >
        {children}
      </div>
    </details>
  );
}

function FilterLink({
  label,
  href,
  active,
  onClick,
}: {
  label: string;
  href: string;
  active: boolean;
  onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={
        active
          ? "flex min-h-8 items-center justify-between gap-3 rounded-md bg-red-50 px-2 text-sm font-black text-red-700"
          : "flex min-h-8 items-center justify-between gap-3 rounded-md px-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
      }
    >
      <span className="flex min-w-0 items-center gap-2">
        <span
          aria-hidden="true"
          className={
            active
              ? "h-2.5 w-2.5 shrink-0 rounded-full bg-red-600"
              : "h-2.5 w-2.5 shrink-0 rounded-full border border-slate-300"
          }
        />
        <span className="truncate">{label}</span>
      </span>
    </a>
  );
}

function FilterPanel({
  allProducts,
  collections,
  selectedFilters,
  onFilterChange,
  onClearFilters,
}: Pick<ProductCatalogProps, "allProducts" | "collections"> & {
  selectedFilters: ProductFilters;
  onFilterChange: FilterAction;
  onClearFilters: () => void;
}) {
  const prices = allProducts.map((product) => priceNumber(product.price)).filter(Boolean);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const priceOptions = [
    {
      label: "Under $50",
      value: "under-50",
    },
    {
      label: "$50 - $100",
      value: "50-100",
    },
    {
      label: "$100 - $150",
      value: "100-150",
    },
    {
      label: "$150+",
      value: "150-plus",
    },
  ];
  const pieceOptions = [
    { label: "Under 500", value: "under-500" },
    { label: "500 - 1000", value: "500-1000" },
    { label: "1000 - 2000", value: "1000-2000" },
    { label: "2000+", value: "2000-plus" },
  ];

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-lg font-black text-slate-950">Filters</h2>
        <button
          type="button"
          onClick={onClearFilters}
          className="text-xs font-black text-red-600 transition hover:text-red-700"
        >
          Clear all
        </button>
      </div>

      <div className="grid gap-6">
        <FilterSection title="Price">
          <div className="mb-4 flex items-center justify-between text-sm font-medium text-slate-700">
            <span>${minPrice.toFixed(0)}</span>
            <span>${maxPrice.toFixed(0)}</span>
          </div>
          <div aria-hidden="true" className="relative mb-4 h-5">
            <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-red-100" />
            <div className="absolute left-1 right-1 top-1/2 h-1 -translate-y-1/2 rounded-full bg-red-600" />
            <div className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-red-600 bg-white" />
            <div className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-red-600 bg-white" />
          </div>
          <div className="grid gap-2">
            {priceOptions.map((option) => (
              <FilterLink
                key={option.value}
                label={option.label}
                href={buildFilterHref(
                  selectedFilters,
                  "price",
                  selectedFilters.price === option.value ? undefined : option.value,
                )}
                active={selectedFilters.price === option.value}
                onClick={(event) => {
                  event.preventDefault();
                  onFilterChange("price", selectedFilters.price === option.value ? undefined : option.value);
                }}
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Category" scrollable>
          <div className="grid gap-2">
            {collections.map((collection) => (
              <FilterLink
                key={collection.handle}
                label={collection.title}
                href={buildFilterHref(
                  selectedFilters,
                  "category",
                  selectedFilters.category === collection.handle ? undefined : collection.handle,
                )}
                active={selectedFilters.category === collection.handle}
                onClick={(event) => {
                  event.preventDefault();
                  onFilterChange(
                    "category",
                    selectedFilters.category === collection.handle ? undefined : collection.handle,
                  );
                }}
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Piece Count">
          <div className="grid gap-2">
            {pieceOptions.map((option) => (
              <FilterLink
                key={option.value}
                label={option.label}
                href={buildFilterHref(
                  selectedFilters,
                  "pieces",
                  selectedFilters.pieces === option.value ? undefined : option.value,
                )}
                active={selectedFilters.pieces === option.value}
                onClick={(event) => {
                  event.preventDefault();
                  onFilterChange("pieces", selectedFilters.pieces === option.value ? undefined : option.value);
                }}
              />
            ))}
          </div>
        </FilterSection>
      </div>
    </aside>
  );
}

const sortLabels: Record<string, string> = {
  popular: "Popular",
  "price-asc": "Price low to high",
  "price-desc": "Price high to low",
  newest: "Newest",
};

function CatalogToolbar({
  productCount,
  selectedFilters,
  onFilterChange,
}: {
  productCount: number;
  selectedFilters: ProductFilters;
  onFilterChange: FilterAction;
}) {
  const sortOptions = [
    ["popular", "Popular"],
    ["price-asc", "Price low to high"],
    ["price-desc", "Price high to low"],
    ["newest", "Newest"],
  ];

  return (
    <div className="hidden items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-5 py-3 shadow-sm shadow-slate-950/[0.03] lg:flex">
      <p className="shrink-0 text-sm font-semibold text-slate-700">{productCount} Products</p>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
        <details className="group relative">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm text-slate-700 transition hover:text-slate-950">
            <span>Sort by:</span>
            <span className="font-black text-slate-950">{sortLabels[selectedFilters.sort] ?? "Popular"}</span>
            <ChevronDownIcon className="h-4 w-4" />
          </summary>
          <div className="absolute right-0 top-9 z-20 grid w-48 gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg shadow-slate-950/[0.08]">
            {sortOptions.map(([value, label]) => (
              <a
                key={value}
                href={buildFilterHref(selectedFilters, "sort", value)}
                onClick={(event) => {
                  event.preventDefault();
                  onFilterChange("sort", value);
                }}
                className={
                  selectedFilters.sort === value
                    ? "rounded-md bg-red-50 px-3 py-2 text-sm font-black text-red-700"
                    : "rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                }
              >
                {label}
              </a>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}

function MobileControls({
  allProducts,
  collections,
  selectedFilters,
  onFilterChange,
  onClearFilters,
}: Pick<ProductCatalogProps, "allProducts" | "collections"> & {
  selectedFilters: ProductFilters;
  onFilterChange: FilterAction;
  onClearFilters: () => void;
}) {
  return (
    <div className="grid gap-3 lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <details className="group relative">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-black text-slate-950 shadow-sm">
            <SlidersIcon className="h-4 w-4 text-red-600" />
            Filter
          </summary>
          <div className="absolute left-0 top-12 z-20 w-[min(86vw,20rem)]">
            <FilterPanel
              allProducts={allProducts}
              collections={collections}
              selectedFilters={selectedFilters}
              onFilterChange={onFilterChange}
              onClearFilters={onClearFilters}
            />
          </div>
        </details>

        <a
          href={buildFilterHref(selectedFilters, "sort", selectedFilters.sort === "price-asc" ? "popular" : "price-asc")}
          onClick={(event) => {
            event.preventDefault();
            onFilterChange("sort", selectedFilters.sort === "price-asc" ? "popular" : "price-asc");
          }}
          className="flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-950 shadow-sm"
        >
          Sort: {sortLabels[selectedFilters.sort] ?? "Popular"}
          <ChevronDownIcon className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

function TrustStrip() {
  const items = [
    { title: "Official JIESTAR Store", text: "Genuine products & quality guarantee", icon: StoreIcon },
    { title: "Shipping Support", text: "Options confirmed at checkout", icon: TruckIcon },
    { title: "Returns Review", text: "Clear support path after purchase", icon: RotateIcon },
    { title: "Secure Checkout", text: "100% secure payments", icon: ShieldIcon },
  ];

  return (
    <section className="border-t border-slate-200 bg-white px-4 py-5 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.title} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-red-100 bg-red-50 text-red-600">
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <strong className="block text-sm font-black text-slate-950">{item.title}</strong>
                <span className="block text-xs text-slate-500">{item.text}</span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ProductCatalog(props: ProductCatalogProps) {
  const { allProducts } = props;
  const [selectedFilters, setSelectedFilters] = useState<ProductFilters>(props.selectedFilters);
  const products = useMemo(() => filterProducts(allProducts, selectedFilters), [allProducts, selectedFilters]);
  const activeFilterCount = [
    selectedFilters.query,
    selectedFilters.category,
    selectedFilters.pieces,
    selectedFilters.price,
  ].filter(Boolean).length;
  const searchQuery = normalizeSearchText(selectedFilters.query);
  const updateFilters = useCallback(
    (nextFilters: ProductFilters) => {
      setSelectedFilters(nextFilters);

      const nextHref = buildFilterHref(nextFilters, "sort", nextFilters.sort);
      window.history.pushState(null, "", nextHref);
    },
    [],
  );
  const handleFilterChange = useCallback<FilterAction>(
    (key, value) => {
      updateFilters(buildFilters(selectedFilters, key, value));
    },
    [selectedFilters, updateFilters],
  );
  const clearFilters = useCallback(() => {
    setSelectedFilters({ sort: "popular" });
    window.history.pushState(null, "", "/products");
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setSelectedFilters(filtersFromUrl(props.selectedFilters));
    };

    handlePopState();
    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, [props.selectedFilters]);

  return (
    <div className="bg-[#f7f8fa]">
      <section className="px-4 py-8 sm:px-5 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-7xl">
          <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
            <Link href="/" className="flex items-center gap-2 transition hover:text-red-600">
              <HomeIcon className="h-4 w-4" />
              <span className="sr-only">Home</span>
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-slate-600">Shop All</span>
          </nav>

          <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black leading-tight text-slate-950 sm:text-4xl">All Products</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                Explore our full collection of JIESTAR building block sets.
              </p>
            </div>
            <div className="hidden rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-black text-red-600 shadow-sm shadow-slate-950/[0.03] lg:flex lg:items-center lg:gap-2">
              <TruckIcon className="h-5 w-5" />
              Shipping confirmed at checkout
            </div>
          </div>

          <CategoryCarousel collections={props.collections} products={allProducts} />

          <MobileControls
            allProducts={allProducts}
            collections={props.collections}
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
          />

          <div className="mt-5 grid items-start gap-6 lg:mt-7 lg:grid-cols-[16rem_minmax(0,1fr)]">
            <div className="hidden lg:block">
              <FilterPanel
                allProducts={allProducts}
                collections={props.collections}
                selectedFilters={selectedFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
              />
            </div>

            <div className="grid auto-rows-max content-start gap-4 self-start">
              <CatalogToolbar
                productCount={products.length}
                selectedFilters={selectedFilters}
                onFilterChange={handleFilterChange}
              />
              {activeFilterCount > 0 ? (
                <div className="flex items-start justify-between gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
                  <p>
                    Showing <strong>{products.length}</strong> of <strong>{allProducts.length}</strong> products
                    {searchQuery ? (
                      <>
                        {" "}
                        for <strong>&ldquo;{selectedFilters.query?.trim()}&rdquo;</strong>
                      </>
                    ) : null}
                    {" "}
                    with the selected filters.
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="shrink-0 font-black text-red-700 transition hover:text-red-800"
                  >
                    Clear filters
                  </button>
                </div>
              ) : null}

              {products.length ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {products.map((product) => (
                    <CatalogProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
                  <h2 className="text-xl font-black text-slate-950">
                    {searchQuery ? "No products match this search" : "No products match these filters"}
                  </h2>
                  <p className="mt-3 text-slate-600">
                    Clear the search or choose another category, price range, or piece count.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <TrustStrip />
    </div>
  );
}
