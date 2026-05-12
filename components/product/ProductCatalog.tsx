import Link from "next/link";
import type { Collection, Product } from "@/lib/data";
import { CatalogProductCard } from "@/components/product/CatalogProductCard";
import { CategoryCarousel } from "@/components/product/CategoryCarousel";
import {
  ChevronDownIcon,
  GridIcon,
  HomeIcon,
  ListIcon,
  RotateIcon,
  ShieldIcon,
  SlidersIcon,
  StoreIcon,
  TruckIcon,
} from "@/components/ui/Icons";

type ProductCatalogProps = {
  allProducts: Product[];
  products: Product[];
  collections: Collection[];
  selectedFilters: {
    category?: string;
    pieces?: string;
    price?: string;
    sort: string;
  };
};

type FilterKey = "category" | "pieces" | "price" | "sort";

function priceNumber(price: string) {
  return Number(price.replace(/[^0-9.]/g, "")) || 0;
}

function pieceCountNumber(pieceCount: string) {
  return Number(pieceCount.replace(/[^0-9]/g, "")) || 0;
}

function rangeCount(products: Product[], min: number, max?: number) {
  return products.filter((product) => {
    const count = pieceCountNumber(product.pieceCount);
    return max ? count >= min && count <= max : count >= min;
  }).length;
}

function buildFilterHref(
  selectedFilters: ProductCatalogProps["selectedFilters"],
  key: FilterKey,
  value?: string,
) {
  const params = new URLSearchParams();

  for (const [filterKey, filterValue] of Object.entries(selectedFilters)) {
    if (!filterValue || filterKey === "sort" && filterValue === "popular") {
      continue;
    }

    params.set(filterKey, filterValue);
  }

  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }

  if (params.get("sort") === "popular") {
    params.delete("sort");
  }

  const query = params.toString();

  return query ? `/products?${query}` : "/products";
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
  count,
  href,
  active,
}: {
  label: string;
  count: number;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
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
      <span className="text-xs text-slate-500">({count})</span>
    </Link>
  );
}

function FilterPanel({ allProducts, collections, selectedFilters }: ProductCatalogProps) {
  const prices = allProducts.map((product) => priceNumber(product.price)).filter(Boolean);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const priceOptions = [
    {
      label: "Under $50",
      value: "under-50",
      count: allProducts.filter((product) => priceNumber(product.price) < 50).length,
    },
    {
      label: "$50 - $100",
      value: "50-100",
      count: allProducts.filter((product) => priceNumber(product.price) >= 50 && priceNumber(product.price) <= 100).length,
    },
    {
      label: "$100 - $150",
      value: "100-150",
      count: allProducts.filter((product) => priceNumber(product.price) > 100 && priceNumber(product.price) <= 150).length,
    },
    {
      label: "$150+",
      value: "150-plus",
      count: allProducts.filter((product) => priceNumber(product.price) > 150).length,
    },
  ];
  const pieceOptions = [
    { label: "Under 500", value: "under-500", count: rangeCount(allProducts, 0, 499) },
    { label: "500 - 1000", value: "500-1000", count: rangeCount(allProducts, 500, 1000) },
    { label: "1000 - 2000", value: "1000-2000", count: rangeCount(allProducts, 1000, 2000) },
    { label: "2000+", value: "2000-plus", count: rangeCount(allProducts, 2000) },
  ];

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-lg font-black text-slate-950">Filters</h2>
        <Link href="/products" className="text-xs font-black text-red-600 transition hover:text-red-700">
          Clear all
        </Link>
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
                count={option.count}
                href={buildFilterHref(
                  selectedFilters,
                  "price",
                  selectedFilters.price === option.value ? undefined : option.value,
                )}
                active={selectedFilters.price === option.value}
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
                count={
                  allProducts.filter(
                    (product) => product.collectionHandle === collection.handle || product.category === collection.title,
                  ).length
                }
                href={buildFilterHref(
                  selectedFilters,
                  "category",
                  selectedFilters.category === collection.handle ? undefined : collection.handle,
                )}
                active={selectedFilters.category === collection.handle}
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
                count={option.count}
                href={buildFilterHref(
                  selectedFilters,
                  "pieces",
                  selectedFilters.pieces === option.value ? undefined : option.value,
                )}
                active={selectedFilters.pieces === option.value}
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
}: {
  productCount: number;
  selectedFilters: ProductCatalogProps["selectedFilters"];
}) {
  const sortOptions = [
    ["popular", "Popular"],
    ["price-asc", "Price low to high"],
    ["price-desc", "Price high to low"],
    ["newest", "Newest"],
  ];

  return (
    <div className="hidden items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-5 py-3 shadow-sm shadow-slate-950/[0.03] lg:flex">
      <p className="text-sm font-semibold text-slate-700">{productCount} Products</p>
      <div className="flex items-center gap-4">
        <details className="group relative">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm text-slate-700 transition hover:text-slate-950">
            <span>Sort by:</span>
            <span className="font-black text-slate-950">{sortLabels[selectedFilters.sort] ?? "Popular"}</span>
            <ChevronDownIcon className="h-4 w-4" />
          </summary>
          <div className="absolute right-0 top-9 z-20 grid w-48 gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg shadow-slate-950/[0.08]">
            {sortOptions.map(([value, label]) => (
              <Link
                key={value}
                href={buildFilterHref(selectedFilters, "sort", value)}
                className={
                  selectedFilters.sort === value
                    ? "rounded-md bg-red-50 px-3 py-2 text-sm font-black text-red-700"
                    : "rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                }
              >
                {label}
              </Link>
            ))}
          </div>
        </details>
        <div className="flex items-center gap-1" aria-label="Catalog view options">
          <button
            type="button"
            aria-label="Grid view"
            aria-pressed="true"
            className="flex h-10 w-10 items-center justify-center rounded-md bg-red-600 text-white shadow-sm shadow-red-600/20"
          >
            <GridIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="List view"
            aria-pressed="false"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
          >
            <ListIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileControls(props: ProductCatalogProps) {
  const { selectedFilters } = props;

  return (
    <div className="grid gap-3 lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <details className="group relative">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-black text-slate-950 shadow-sm">
            <SlidersIcon className="h-4 w-4 text-red-600" />
            Filter
          </summary>
          <div className="absolute left-0 top-12 z-20 w-[min(86vw,20rem)]">
            <FilterPanel {...props} />
          </div>
        </details>

        <Link
          href={buildFilterHref(selectedFilters, "sort", selectedFilters.sort === "price-asc" ? "popular" : "price-asc")}
          className="flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-950 shadow-sm"
        >
          Sort: {sortLabels[selectedFilters.sort] ?? "Popular"}
          <ChevronDownIcon className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function TrustStrip() {
  const items = [
    { title: "Official JIESTAR Store", text: "Genuine products & quality guarantee", icon: StoreIcon },
    { title: "Free Shipping", text: "On orders $49 and above", icon: TruckIcon },
    { title: "30-Day Returns", text: "Hassle-free returns", icon: RotateIcon },
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
  const { products, allProducts, selectedFilters } = props;
  const activeFilterCount = [selectedFilters.category, selectedFilters.pieces, selectedFilters.price].filter(Boolean).length;

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
              Free Shipping on orders $49+
            </div>
          </div>

          <CategoryCarousel collections={props.collections} products={allProducts} />

          <MobileControls {...props} />

          <div className="mt-5 grid items-start gap-6 lg:mt-7 lg:grid-cols-[16rem_minmax(0,1fr)]">
            <div className="hidden lg:block">
              <FilterPanel {...props} />
            </div>

            <div className="grid auto-rows-max content-start gap-4 self-start">
              <CatalogToolbar productCount={products.length} selectedFilters={selectedFilters} />
              {activeFilterCount > 0 ? (
                <div className="flex items-start justify-between gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
                  <p>
                    Showing <strong>{products.length}</strong> of <strong>{allProducts.length}</strong> products for the selected filters.
                  </p>
                  <Link href="/products" className="shrink-0 font-black text-red-700 transition hover:text-red-800">
                    Clear filters
                  </Link>
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
                  <h2 className="text-xl font-black text-slate-950">No products match these filters</h2>
                  <p className="mt-3 text-slate-600">
                    Clear the filters or choose another category, price range, or piece count.
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
