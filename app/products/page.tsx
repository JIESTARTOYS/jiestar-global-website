import Link from "next/link";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { collections } from "@/lib/data";
import { createMetadata } from "@/lib/seo";
import { getShopifyProducts } from "@/lib/shopify";

export const metadata = createMetadata({
  title: "Building Block Sets",
  description:
    "Browse JIESTAR building block sets for collectors, families, retailers, ecommerce sellers, and wholesale buyers.",
  path: "/products",
});

export default async function ProductsPage() {
  const products = await getShopifyProducts();

  return (
    <div className="bg-slate-50 px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          title="Building Block Sets"
          description="Explore JIESTAR product lines for direct purchase, wholesale supply, and custom product development opportunities."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          {collections.map((collection) => (
            <Link
              key={collection.handle}
              href={`/collections/${collection.handle}`}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-950"
            >
              {collection.title}
            </Link>
          ))}
        </div>
        <div className="mt-10">
          <ProductGrid products={products} />
        </div>
      </div>
    </div>
  );
}
