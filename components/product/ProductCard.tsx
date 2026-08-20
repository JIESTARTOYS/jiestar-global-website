import Link from "next/link";
import type { ProductSummary } from "@/lib/data";
import { ProductImageSwap } from "@/components/product/ProductImageSwap";
import { getDisplayPrice } from "@/lib/seo";

export function ProductCard({ product }: { product: ProductSummary }) {
  const displayPrice = getDisplayPrice(product.price);

  return (
    <article className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <Link href={`/products/${product.handle}`} prefetch={false} className="block">
        <div className="relative">
          <ProductImageSwap
            product={product}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="aspect-square"
            imageClassName=""
          />
        </div>
        <div className="p-4">
          <h3 className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-slate-950">{product.title}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">{product.category}</p>
          <p className="mt-1 text-xs text-slate-500">
            {product.pieceCount} · Ages {product.recommendedAge}
          </p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span>
              <span className="block text-lg font-black text-slate-950">{displayPrice.label}</span>
              {displayPrice.isQuoteOnly ? (
                <span className="block text-[11px] font-semibold text-slate-500">Contact for catalog pricing</span>
              ) : null}
            </span>
            <span className="inline-flex h-9 w-28 items-center justify-center rounded-md bg-red-600 text-xs font-black text-white transition group-hover:bg-red-700">
              View Details
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
