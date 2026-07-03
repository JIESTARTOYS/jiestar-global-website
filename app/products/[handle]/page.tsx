import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetailTop } from "@/components/product/ProductDetailTop";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/LinkButton";
import type { Product, ProductSummary } from "@/lib/data";
import {
  createBreadcrumbJsonLd,
  createJsonLdScript,
  createMetadata,
  createProductJsonLd,
  getProductHighlights,
  getProductSeoDescription,
} from "@/lib/seo";
import { sanitizeShopifyHtml } from "@/lib/sanitize-html";
import { getShopifyCollectionSummary, getShopifyProduct, getShopifyProductSummaries } from "@/lib/shopify";

type PageProps = {
  params: Promise<{ handle: string }>;
};

export const dynamicParams = true;

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

async function getRelatedProducts(product: Product): Promise<ProductSummary[]> {
  try {
    const collectionProducts = (await getShopifyCollectionSummary(product.collectionHandle))?.products ?? [];
    const relatedFromCollection = collectionProducts.filter((item) => item.handle !== product.handle);

    if (relatedFromCollection.length) {
      return relatedFromCollection.slice(0, 4);
    }

    const catalogProducts = await getShopifyProductSummaries();

    return catalogProducts.filter((item) => item.handle !== product.handle).slice(0, 4);
  } catch (error) {
    console.warn("[product-detail:related-products]", {
      handle: product.handle,
      collectionHandle: product.collectionHandle,
      message: error instanceof Error ? error.message : "Related products lookup failed.",
    });

    return [];
  }
}

export async function generateStaticParams() {
  const shopifyProducts = await getShopifyProductSummaries();

  return shopifyProducts.map((product) => ({ handle: product.handle }));
}

export async function generateMetadata({ params }: PageProps) {
  const { handle } = await params;
  const product = await getShopifyProduct(handle);

  if (!product) {
    return {};
  }

  return createMetadata({
    title: `${product.title} | JIESTAR Building Block Set`,
    description: product.description || getProductSeoDescription(product),
    path: `/products/${handle}`,
    image: product.image,
  });
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { handle } = await params;
  const product = await getShopifyProduct(handle);

  if (!product) {
    notFound();
  }

  const related = await getRelatedProducts(product);
  const productVariants = product.variants ?? [];
  const productVariantSkus = productVariants.map((variant) => variant.sku).filter(Boolean);
  const hasMultipleVariants = productVariants.length > 1;
  const specs = [
    [hasMultipleVariants ? "Available SKUs" : "SKU", hasMultipleVariants ? productVariantSkus.join(", ") : product.sku],
    ["Difficulty Level", product.difficulty],
    ["Piece Count", product.pieceCount],
    ["Recommended Age", product.recommendedAge],
    ["Finished Model Size", product.finishedSize],
    ["Package Size", product.packageSize],
    ["Material", product.material],
    ["Shipping", product.shipping],
  ].filter((spec): spec is [string, string] => Boolean(spec[1]));
  const descriptionHtml = sanitizeShopifyHtml(cleanDescriptionHtml(product.descriptionHtml ?? ""));
  const seoDescription = getProductSeoDescription(product);
  const productHighlights = getProductHighlights(product);
  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: product.category, path: `/collections/${product.collectionHandle}` },
    { name: product.title, path: `/products/${product.handle}` },
  ]);
  const productJsonLd = createProductJsonLd(product, {
    description: seoDescription,
    path: `/products/${product.handle}`,
  });
  const hasDescriptionHtmlContent = Boolean(
    descriptionHtml?.replace(/<[^>]*>/g, "").trim() || descriptionHtml?.includes("<img"),
  );
  const descriptionText = product.description.trim();

  return (
    <div className="bg-white px-5 py-8 lg:px-8 lg:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={createJsonLdScript([breadcrumbJsonLd, productJsonLd])}
      />
      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
          <Link href="/products" className="font-medium transition hover:text-red-600">Products</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/collections/${product.collectionHandle}`} className="font-medium transition hover:text-red-600">{product.category}</Link>
          <span aria-hidden="true">/</span>
          <span className="text-slate-700">{product.title}</span>
        </nav>

        <ProductDetailTop product={product} />

        <section className="mt-16">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-red-600">Details</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Product Specifications</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-500">
              Specification values are managed in Shopify product metafields, with SKU coming from the product variant.
            </p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {specs.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm shadow-slate-950/[0.02] sm:p-4">
                <p className="text-xs font-black uppercase text-slate-500">{label}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-950">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.86fr]">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-sm shadow-slate-950/[0.02] sm:p-6">
              <p className="text-sm font-black uppercase text-red-600">Product overview</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">JIESTAR Building Block Set Details</h2>
              <p className="mt-4 text-base leading-8 text-slate-700">{seoDescription}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.02] sm:p-6">
              <p className="text-sm font-black uppercase text-red-600">Highlights</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Product Highlights</h2>
              <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
                {productHighlights.map((highlight) => (
                  <li key={highlight} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-600" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="rounded-lg border border-red-100 bg-red-50 p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase text-red-600">B2B cooperation</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Interested in this product for wholesale or custom cooperation?
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Request wholesale catalog pricing, discuss MOQ and shipping, or review custom packaging and related product line planning with JIESTAR.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
                <LinkButton href="/wholesale" className="px-4">Request Wholesale Quote</LinkButton>
                <LinkButton href="/custom-solutions" variant="secondary" className="px-4">Discuss Custom Packaging</LinkButton>
                <LinkButton href="/contact" variant="secondary" className="px-4">Contact Sales</LinkButton>
              </div>
            </div>
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
