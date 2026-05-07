import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ProductActions } from "@/components/product/ProductActions";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ArrowRightIcon, PackageIcon, ShieldIcon, TruckIcon } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/LinkButton";
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
  const highlights = [
    { label: "Pieces", value: product.pieceCount },
    { label: "Age", value: product.recommendedAge },
    { label: "Difficulty", value: product.difficulty },
  ];
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
    <div className="bg-white px-5 py-8 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
          <Link href="/products" className="font-medium transition hover:text-red-600">Products</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/collections/${product.collectionHandle}`} className="font-medium transition hover:text-red-600">{product.category}</Link>
          <span aria-hidden="true">/</span>
          <span className="text-slate-700">{product.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(24rem,0.98fr)] lg:items-start">
          <div className="grid gap-4">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100 shadow-sm shadow-slate-950/[0.04] sm:aspect-[4/3]">
              <span className="absolute left-4 top-4 z-10 rounded-md bg-slate-950 px-3 py-1.5 text-xs font-black uppercase text-white">
                Preview Product
              </span>
              <Image
                src={product.image}
                alt={product.imageAlt}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
                priority
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {highlights.map((item) => (
                <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-black uppercase text-slate-500">{item.label}</p>
                  <p className="mt-1 text-sm font-black text-slate-950">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:sticky lg:top-24">
            <p className="text-sm font-black uppercase text-red-600">{product.category}</p>
            <h1 className="mt-3 text-3xl font-black leading-tight tracking-normal text-slate-950 sm:text-4xl">{product.title}</h1>
            <p className="mt-4 text-2xl font-semibold text-slate-950">{product.price}</p>
            <p className="mt-4 text-base leading-8 text-slate-600">{product.description}</p>

            <div className="mt-6">
              <ProductActions productTitle={product.title} />
            </div>

            <div className="mt-6 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
              {[
                { title: "Display build", text: "Designed for shelf presence.", icon: PackageIcon },
                { title: "Secure checkout", text: "Shopify checkout planned.", icon: ShieldIcon },
                { title: "Support", text: "Missing piece support available.", icon: TruckIcon },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-3">
                    <Icon className="h-5 w-5 text-red-600" />
                    <p className="mt-2 font-black text-slate-950">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.text}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-lg border border-red-100 bg-red-50 p-5">
              <p className="text-xs font-black uppercase text-red-600">B2B cooperation</p>
              <h2 className="mt-2 text-lg font-black text-slate-950">Wholesale or custom version?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Interested in wholesale supply, exclusive SKUs, packaging customization, or a custom product line based on this direction?
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <LinkButton href="/contact" className="px-4">Contact JIESTAR</LinkButton>
                <LinkButton href="/custom-solutions" variant="secondary" className="px-4">
                  Custom Solutions
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </LinkButton>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-16">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-red-600">Details</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Product Specifications</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-500">
              Specification values are preview data until the live Shopify catalog and product metafields are connected.
            </p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {specs.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm shadow-slate-950/[0.02]">
                <p className="text-xs font-black uppercase text-slate-500">{label}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-950">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-red-600">Keep exploring</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Related Products</h2>
            </div>
            <Link href="/products" className="inline-flex text-sm font-black text-red-600 transition hover:text-red-700">
              View all products
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6">
            <ProductGrid products={related} />
          </div>
        </section>
      </div>
    </div>
  );
}
