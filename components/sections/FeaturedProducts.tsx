import Link from "next/link";
import { ArrowRightIcon, CartIcon } from "@/components/ui/Icons";
import { ProductImageSwap } from "@/components/product/ProductImageSwap";
import type { ProductSummary } from "@/lib/data";
import { selectLatestHomeProducts } from "@/lib/home-products";
import { getDisplayPrice } from "@/lib/seo";
import { UsWarehouseBadge } from "@/components/product/UsWarehouseBadge";

export function FeaturedProducts({ products }: { products: ProductSummary[] }) {
  const latestProducts = selectLatestHomeProducts(products);

  return (
    <section className="bg-[#f6f7f9] px-5 pb-10 pt-7 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-black text-slate-950">Latest Products</h2>
          <Link href="/products" className="hidden items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-red-600 sm:flex">
            View all products
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        {latestProducts.length ? (
          <div className="scrollbar-none -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:overflow-visible sm:px-0 sm:pb-0 sm:grid-cols-2 lg:grid-cols-4">
            {latestProducts.map((product) => (
              <HomeProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="text-xl font-semibold text-slate-950">Latest products are currently unavailable</h2>
            <p className="mt-3 text-slate-600">
              Browse the product catalog or check back for new JIESTAR releases.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function HomeProductCard({ product }: { product: ProductSummary }) {
  const displayPrice = getDisplayPrice(product.price);

  return (
    <article className="group w-[56vw] max-w-56 shrink-0 snap-start overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-950/[0.06] sm:w-auto sm:max-w-none">
      <div className="relative">
        <Link href={`/products/${product.handle}`} className="block" aria-label={`View ${product.title}`}>
          <div className="relative">
            {product.usWarehouseEligible ? (
              <UsWarehouseBadge className="absolute left-2 top-2 z-10 bg-white/95 shadow-sm sm:left-3 sm:top-3" />
            ) : (
              <span className="absolute left-2 top-2 z-10 rounded-md bg-slate-950 px-1.5 py-1 text-[10px] font-black text-white sm:left-3 sm:top-3 sm:px-2 sm:text-[11px]">
                New
              </span>
            )}
            <ProductImageSwap
              product={product}
              sizes="(min-width: 1280px) 24vw, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="aspect-square"
              imageClassName=""
            />
          </div>
        </Link>
      </div>
      <div className="p-3 sm:p-4">
        <Link href={`/products/${product.handle}`} className="block">
          <h3 className="line-clamp-2 min-h-9 text-xs font-black leading-4.5 text-slate-950 transition group-hover:text-red-600 sm:min-h-10 sm:text-sm sm:leading-5">
            {product.title}
          </h3>
        </Link>
        <p className="mt-1 text-[11px] font-semibold text-slate-500 sm:text-xs">{product.category}</p>
        <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">
          {product.pieceCount} · Ages {product.recommendedAge}
        </p>
        <p className="mt-2 text-base font-black text-slate-950 sm:mt-3 sm:text-lg">{displayPrice.label}</p>
        {displayPrice.isQuoteOnly ? (
          <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">Contact for catalog pricing</p>
        ) : null}
        <Link
          href={`/products/${product.handle}`}
          className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-red-600 px-2 text-xs font-black text-white shadow-sm shadow-red-600/20 transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 sm:mt-4 sm:h-10 sm:gap-2 sm:px-3 sm:text-sm"
          aria-label={`View ${product.title} before adding to cart`}
        >
          <CartIcon className="h-4 w-4" />
          <span className="hidden min-[380px]:inline">View Details</span>
          <span className="min-[380px]:hidden">View</span>
        </Link>
      </div>
    </article>
  );
}
