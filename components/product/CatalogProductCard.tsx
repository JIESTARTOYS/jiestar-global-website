import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/data";
import { CartIcon, HeartIcon } from "@/components/ui/Icons";

export function CatalogProductCard({ product }: { product: Product }) {
  return (
    <article className="group rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-950/[0.06]">
      <div className="relative">
        <Link href={`/products/${product.handle}`} className="block" aria-label={`View ${product.title}`}>
          <div className="relative aspect-square overflow-hidden rounded-t-lg bg-slate-50">
            <Image
              src={product.image}
              alt={product.imageAlt}
              fill
              sizes="(min-width: 1280px) 24vw, (min-width: 1024px) 32vw, 50vw"
              className="object-cover transition duration-300 group-hover:scale-[1.04]"
            />
          </div>
        </Link>
        <Link
          href={`/products/${product.handle}`}
          aria-label={`Open ${product.title} details`}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-900 shadow-sm transition hover:border-red-200 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 sm:right-3 sm:top-3"
        >
          <HeartIcon className="h-4 w-4" />
        </Link>
      </div>

      <div className="px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4">
        <Link href={`/products/${product.handle}`} className="block">
          <h2 className="line-clamp-2 min-h-10 text-[13px] font-black leading-5 text-slate-950 transition group-hover:text-red-600 sm:text-base sm:leading-6">
            {product.title}
          </h2>
        </Link>
        <div className="mt-1.5 flex min-h-6 flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-500 sm:text-xs">
          <span>{product.pieceCount.toUpperCase()}</span>
          <span className="rounded bg-slate-100 px-1.5 py-1 text-slate-600">{product.category}</span>
        </div>
        <p className="mt-2 text-sm font-black text-slate-950 sm:text-base">{product.price}</p>
        <Link
          href={`/products/${product.handle}`}
          className="mt-3 flex min-h-9 w-full items-center justify-center gap-2 rounded-md bg-red-600 px-3 py-2 text-xs font-black text-white shadow-sm shadow-red-600/20 transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 sm:min-h-10 sm:text-sm"
          aria-label={`View ${product.title} before adding to cart`}
        >
          <CartIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Add to Cart</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>
    </article>
  );
}
