import Link from "next/link";
import type { Collection, Product } from "@/lib/data";
import { CatalogProductCard } from "@/components/product/CatalogProductCard";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
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
  products: Product[];
  collections: Collection[];
};

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

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-slate-200 pt-5 first:border-t-0 first:pt-0">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-black text-slate-950">{title}</h2>
        <ChevronDownIcon className="h-4 w-4 text-slate-700" />
      </div>
      {children}
    </section>
  );
}

function FilterCheckbox({ label, count }: { label: string; count: number }) {
  return (
    <label className="flex min-h-7 items-center justify-between gap-3 text-sm text-slate-600">
      <span className="flex min-w-0 items-center gap-2">
        <input
          type="checkbox"
          className="h-4 w-4 shrink-0 rounded border-slate-300 accent-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          aria-label={`Filter by ${label}`}
        />
        <span className="truncate">{label}</span>
      </span>
      <span className="text-xs text-slate-500">({count})</span>
    </label>
  );
}

function FilterPanel({ products, collections }: ProductCatalogProps) {
  const prices = products.map((product) => priceNumber(product.price)).filter(Boolean);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-lg font-black text-slate-950">Filters</h2>
        <button type="button" className="text-xs font-black text-red-600 transition hover:text-red-700">
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
            <FilterCheckbox label="Under $50" count={products.filter((product) => priceNumber(product.price) < 50).length} />
            <FilterCheckbox label="$50 - $100" count={products.filter((product) => priceNumber(product.price) >= 50 && priceNumber(product.price) <= 100).length} />
            <FilterCheckbox label="$100 - $150" count={products.filter((product) => priceNumber(product.price) > 100 && priceNumber(product.price) <= 150).length} />
            <FilterCheckbox label="$150+" count={products.filter((product) => priceNumber(product.price) > 150).length} />
          </div>
        </FilterSection>

        <FilterSection title="Category">
          <div className="grid gap-2">
            {collections.map((collection) => (
              <FilterCheckbox
                key={collection.handle}
                label={collection.title}
                count={products.filter((product) => product.collectionHandle === collection.handle || product.category === collection.title).length}
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Piece Count">
          <div className="grid gap-2">
            <FilterCheckbox label="Under 500" count={rangeCount(products, 0, 499)} />
            <FilterCheckbox label="500 - 1000" count={rangeCount(products, 500, 1000)} />
            <FilterCheckbox label="1000 - 2000" count={rangeCount(products, 1001, 2000)} />
            <FilterCheckbox label="2000+" count={rangeCount(products, 2001)} />
          </div>
        </FilterSection>
      </div>

      <button
        type="button"
        className="mt-7 min-h-11 w-full rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-600 transition hover:border-red-300 hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        aria-describedby="catalog-filter-preview-note"
      >
        Preview Filters
      </button>
      <p id="catalog-filter-preview-note" className="mt-3 text-xs leading-5 text-slate-500">
        Filter controls are visual placeholders until Shopify product filters are connected.
      </p>
    </aside>
  );
}

function CatalogToolbar({ productCount }: { productCount: number }) {
  return (
    <div className="hidden min-h-16 items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-5 shadow-sm shadow-slate-950/[0.03] lg:flex">
      <p className="text-sm font-semibold text-slate-700">{productCount} Products</p>
      <div className="flex items-center gap-4">
        <button type="button" className="flex items-center gap-2 text-sm text-slate-700 transition hover:text-slate-950">
          <span>Sort by:</span>
          <span className="font-black text-slate-950">Popular</span>
          <ChevronDownIcon className="h-4 w-4" />
        </button>
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

function MobileControls({ products, collections }: ProductCatalogProps) {
  return (
    <div className="grid gap-3 lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <details className="group relative">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-black text-slate-950 shadow-sm">
            <SlidersIcon className="h-4 w-4 text-red-600" />
            Filter
          </summary>
          <div className="absolute left-0 top-12 z-20 w-[min(86vw,20rem)]">
            <FilterPanel products={products} collections={collections} />
          </div>
        </details>

        <button
          type="button"
          className="flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-950 shadow-sm"
        >
          Sort: Popular
          <ChevronDownIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Pagination() {
  const pages = ["1", "2", "3", "4", "5", "...", "19"];

  return (
    <nav className="hidden items-center justify-center gap-2 lg:flex" aria-label="Product pagination">
      <button
        type="button"
        aria-label="Previous page"
        className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      {pages.map((page, index) => (
        <button
          key={`${page}-${index}`}
          type="button"
          aria-current={page === "1" ? "page" : undefined}
          className={
            page === "1"
              ? "flex h-10 min-w-10 items-center justify-center rounded-md bg-red-600 px-3 text-sm font-black text-white"
              : "flex h-10 min-w-10 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
          }
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        aria-label="Next page"
        className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </nav>
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

export function ProductCatalog({ products, collections }: ProductCatalogProps) {
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

          <MobileControls products={products} collections={collections} />

          <div className="mt-5 grid gap-6 lg:mt-7 lg:grid-cols-[16rem_minmax(0,1fr)]">
            <div className="hidden lg:block">
              <FilterPanel products={products} collections={collections} />
            </div>

            <div className="grid gap-5">
              <CatalogToolbar productCount={products.length} />

              {products.length ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {products.map((product) => (
                    <CatalogProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
                  <h2 className="text-xl font-black text-slate-950">Products are being prepared</h2>
                  <p className="mt-3 text-slate-600">
                    Shopify products or collection data will appear here once the store is connected.
                  </p>
                </div>
              )}

              <Pagination />
              <button
                type="button"
                className="min-h-11 rounded-md border border-red-200 bg-white px-5 py-3 text-sm font-black text-red-600 shadow-sm transition hover:border-red-300 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 lg:hidden"
              >
                Load More
              </button>
            </div>
          </div>
        </div>
      </section>

      <TrustStrip />
    </div>
  );
}
