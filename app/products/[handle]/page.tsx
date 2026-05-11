import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductActions } from "@/components/product/ProductActions";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ArrowRightIcon, PackageIcon, ShieldIcon, TruckIcon } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/LinkButton";
import { products } from "@/lib/data";
import { createMetadata } from "@/lib/seo";
import { getShopifyProduct } from "@/lib/shopify";

type PageProps = {
  params: Promise<{ handle: string }>;
};

function cleanDescriptionHtml(html: string) {
  let cleaned = html.trim();
  const emptyBlockPattern =
    /<(p|div)(?:\s[^>]*)?>(?:\s|&nbsp;|&#160;|<br\s*\/?>|<span(?:\s[^>]*)?>(?:\s|&nbsp;|&#160;|<br\s*\/?>)*<\/span>)*<\/\1>/gi;

  let previous = "";
  while (previous !== cleaned) {
    previous = cleaned;
    cleaned = cleaned.replace(emptyBlockPattern, "");
  }

  return cleaned.replace(/^(?:\s|&nbsp;|&#160;|<br\s*\/?>)+/gi, "").trim();
}

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
    ["Release Date", product.releaseDate],
    ["Piece Count", product.pieceCount],
    ["Recommended Age", product.recommendedAge],
    ["Finished Model Size", product.finishedSize],
    ["Package Size", product.packageSize],
    ["Material", product.material],
    ["Shipping", product.shipping],
  ].filter((spec): spec is [string, string] => Boolean(spec[1]));
  const descriptionHtml = cleanDescriptionHtml(product.descriptionHtml ?? "");
  const hasDescriptionHtmlContent = Boolean(
    descriptionHtml?.replace(/<[^>]*>/g, "").trim() || descriptionHtml?.includes("<img"),
  );
  const descriptionText = product.description.trim();

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
          <ProductGallery product={product} />

          <div className="lg:sticky lg:top-24">
            <p className="text-sm font-black uppercase text-red-600">{product.category}</p>
            <h1 className="mt-3 text-3xl font-black leading-tight tracking-normal text-slate-950 sm:text-4xl">{product.title}</h1>
            <p className="mt-4 text-2xl font-semibold text-slate-950">{product.price}</p>
            <p className="mt-4 text-base leading-8 text-slate-600">{product.description}</p>

            <div className="mt-6">
              <ProductActions productTitle={product.title} variantId={product.variantId} />
            </div>

            <div className="mt-6 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
              {[
                { title: "Display build", text: "Designed for shelf presence.", icon: PackageIcon },
                {
                  title: "Secure checkout",
                  text: product.variantId ? "Checkout is handled by Shopify." : "Checkout preview until Shopify variants are connected.",
                  icon: ShieldIcon,
                },
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
              Specification values combine Shopify product data with local first-batch catalog details where the SKU matches.
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

        <section className="mt-12">
          <div>
            <p className="text-sm font-black uppercase text-red-600">Description</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Product Details</h2>
          </div>
          {descriptionHtml && hasDescriptionHtmlContent ? (
            <div
              className="mt-6 max-w-none rounded-lg border border-slate-200 bg-white p-4 text-base leading-8 text-slate-700 shadow-sm shadow-slate-950/[0.02] [&_a]:font-semibold [&_a]:text-red-600 [&_img]:my-4 [&_img]:h-auto [&_img]:w-full [&_img]:rounded-lg [&_img]:object-contain [&_li]:ml-5 [&_li]:list-disc [&_p]:my-4 [&_strong]:font-black [&_ul]:my-4 sm:p-6"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          ) : (
            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5 text-base leading-8 text-slate-700 shadow-sm shadow-slate-950/[0.02]">
              {descriptionText || product.sellingPoint}
            </div>
          )}
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
