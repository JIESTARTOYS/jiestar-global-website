import type { ProductSummary } from "@/lib/data";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ products }: { products: ProductSummary[] }) {
  if (!products.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
        <h2 className="text-xl font-semibold text-slate-950">No products available here yet</h2>
        <p className="mt-3 text-slate-600">
          Browse the full catalog or contact JIESTAR for product availability.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
