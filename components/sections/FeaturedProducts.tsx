import { ProductGrid } from "@/components/product/ProductGrid";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/Icons";
import type { Product } from "@/lib/data";

export function FeaturedProducts({ products }: { products: Product[] }) {
  return (
    <section className="bg-[#f6f7f9] px-5 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-slate-950">Featured Products</h2>
          <Link href="/products" className="hidden items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-red-600 sm:flex">
            View all products
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        <div>
          <ProductGrid products={products.slice(0, 4)} />
        </div>
      </div>
    </section>
  );
}
