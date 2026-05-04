import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ProductActions } from "@/components/product/ProductActions";
import { ProductGrid } from "@/components/product/ProductGrid";
import { products } from "@/lib/data";
import { createMetadata } from "@/lib/seo";
import { getShopifyProduct } from "@/lib/shopify";

type PageProps = {
  params: Promise<{ handle: string }>;
};

export function generateStaticParams() {
  return products.map((product) => ({ handle: product.handle }));
}

export async function generateMetadata({ params }: PageProps) {
  const { handle } = await params;
  const product = await getShopifyProduct(handle);

  if (!product) {
    return {};
  }

  return createMetadata({
    title: product.title,
    description: product.description,
    path: `/products/${handle}`,
  });
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { handle } = await params;
  const product = await getShopifyProduct(handle);

  if (!product) {
    notFound();
  }

  const related = products.filter((item) => item.handle !== product.handle).slice(0, 4);
  const specs = [
    ["SKU", product.sku],
    ["Piece Count", product.pieceCount],
    ["Recommended Age", product.recommendedAge],
    ["Difficulty Level", product.difficulty],
    ["Finished Model Size", product.finishedSize],
    ["Package Size", product.packageSize],
    ["Material", product.material],
    ["Shipping", product.shipping],
  ];

  return (
    <div className="bg-white px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
            <Image
              src={product.image}
              alt={product.imageAlt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{product.category}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-slate-950">{product.title}</h1>
            <p className="mt-4 text-2xl font-semibold text-slate-950">{product.price}</p>
            <div className="mt-6">
              <ProductActions productTitle={product.title} />
            </div>
            <p className="mt-6 text-base leading-8 text-slate-600">{product.description}</p>
            <ul className="mt-6 grid gap-3 text-sm text-slate-700">
              <li>Designed for display value and a satisfying building experience.</li>
              <li>Suitable for DTC shoppers, collectors, and B2B product evaluation.</li>
              <li>Missing piece support is available through customer service.</li>
            </ul>
            <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-950">Business Cooperation</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Interested in wholesale or custom versions of this product? Contact us for business cooperation.
              </p>
              <Link href="/contact" className="mt-4 inline-flex text-sm font-semibold text-slate-950 underline">
                Contact JIESTAR
              </Link>
            </div>
          </div>
        </div>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-slate-950">Product Specifications</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {specs.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <p className="mt-2 text-sm text-slate-950">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-slate-950">Related Products</h2>
          <div className="mt-6">
            <ProductGrid products={related} />
          </div>
        </section>
      </div>
    </div>
  );
}
