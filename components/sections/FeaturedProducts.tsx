import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, CartIcon, HeartIcon } from "@/components/ui/Icons";
import type { Product } from "@/lib/data";

export function FeaturedProducts({ products }: { products: Product[] }) {
  const featuredProducts = products.slice(0, 4);

  return (
    <section className="bg-[#f6f7f9] px-5 pb-10 pt-7 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-black text-slate-950">Featured Products</h2>
          <Link href="/products" className="hidden items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-red-600 sm:flex">
            View all products
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        {featuredProducts.length ? (
          <div className="scrollbar-none -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:overflow-visible sm:px-0 sm:pb-0 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <HomeProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="text-xl font-semibold text-slate-950">Products are being prepared</h2>
            <p className="mt-3 text-slate-600">
              Shopify products or collection data will appear here once the store is connected.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function HomeProductCard({ product }: { product: Product }) {
  return (
    <article className="group w-[56vw] max-w-56 shrink-0 snap-start overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-950/[0.06] sm:w-auto sm:max-w-none">
      <div className="relative">
        <Link href={`/products/${product.handle}`} className="block" aria-label={`View ${product.title}`}>
          <div className="relative aspect-square overflow-hidden bg-slate-50">
            <span className="absolute left-2 top-2 z-10 rounded-md bg-slate-950 px-1.5 py-1 text-[10px] font-black text-white sm:left-3 sm:top-3 sm:px-2 sm:text-[11px]">
              New
            </span>
            <Image
              src={product.image}
              alt={product.imageAlt}
              fill
              sizes="(min-width: 1280px) 24vw, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition duration-300 group-hover:scale-[1.04]"
            />
          </div>
        </Link>
        <Link
          href={`/products/${product.handle}`}
          aria-label={`Save ${product.title}`}
          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition hover:border-red-200 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 sm:right-3 sm:top-3 sm:h-8 sm:w-8"
        >
          <HeartIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
        <p className="mt-2 text-base font-black text-slate-950 sm:mt-3 sm:text-lg">{product.price}</p>
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
