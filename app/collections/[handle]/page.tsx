import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionProductListing } from "@/components/product/CollectionProductListing";
import { ArrowRightIcon, HomeIcon, PackageIcon, ShieldIcon, StoreIcon, TruckIcon } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/LinkButton";
import { getCollection, getProductsByCollection } from "@/lib/data";
import { createMetadata } from "@/lib/seo";
import { getShopifyCollectionSummary, getShopifyCollections } from "@/lib/shopify";

type PageProps = {
  params: Promise<{ handle: string }>;
};

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const collections = await getShopifyCollections();

  return collections.map((collection) => ({ handle: collection.handle }));
}

export async function generateMetadata({ params }: PageProps) {
  const { handle } = await params;
  const collection = (await getShopifyCollectionSummary(handle))?.collection ?? getCollection(handle);

  if (!collection) {
    return {};
  }

  return createMetadata({
    title: `${collection.title} Building Block Sets`,
    description: collection.description,
    path: `/collections/${handle}`,
  });
}

export default async function CollectionPage({ params }: PageProps) {
  const { handle } = await params;
  const shopifyCollection = await getShopifyCollectionSummary(handle);
  const collection = shopifyCollection?.collection ?? getCollection(handle);

  if (!collection) {
    notFound();
  }

  const products = shopifyCollection?.products ?? getProductsByCollection(handle);

  return (
    <div className="bg-[#f7f8fa] px-4 py-8 sm:px-5 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
          <Link href="/" className="flex items-center gap-2 transition hover:text-red-600">
            <HomeIcon className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/products" className="font-medium transition hover:text-red-600">Products</Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-slate-700">{collection.title}</span>
        </nav>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03]">
          <div className="grid lg:grid-cols-[1.02fr_0.98fr] lg:items-stretch">
            <div className="flex flex-col justify-center p-5 sm:p-8 lg:p-10">
              <p className="text-sm font-black uppercase text-red-600">Collection</p>
              <h1 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                {collection.title} Building Block Sets
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">{collection.description}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { title: `${products.length} products`, text: "Available in this collection", icon: PackageIcon },
                  { title: "Live catalog", text: "Updated from the store catalog", icon: StoreIcon },
                  { title: "Business inquiry", text: "Wholesale and custom support", icon: ShieldIcon },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <Icon className="h-5 w-5 text-red-600" />
                      <p className="mt-2 text-sm font-black text-slate-950">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{item.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="relative min-h-64 bg-slate-100 lg:min-h-full">
              {collection.image ? (
                <>
                  <Image
                    src={collection.image}
                    alt={collection.imageAlt ?? `${collection.title} collection banner`}
                    fill
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
                </>
              ) : (
                <div className="flex h-full min-h-64 items-center justify-center bg-slate-100 px-6 text-center text-sm font-black uppercase text-slate-500">
                  Collection image pending
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03] lg:sticky lg:top-24 lg:self-start">
            <p className="text-sm font-black text-slate-950">Collection options</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Browse this product direction, compare available sets, or contact JIESTAR for wholesale supply and custom cooperation.
            </p>
            <div className="mt-5 grid gap-3 text-sm">
              <LinkButton href="/products" variant="secondary" className="w-full px-4">All Products</LinkButton>
              <LinkButton href={`/products?category=${collection.handle}`} variant="secondary" className="w-full px-4">
                Filter Catalog
              </LinkButton>
              <LinkButton href="/wholesale" className="w-full px-4">
                Wholesale Inquiry
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </LinkButton>
            </div>
            <div className="mt-5 rounded-md border border-slate-200 bg-slate-50/70 p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-red-100 bg-white text-red-600">
                  <TruckIcon className="h-4 w-4" />
                </span>
                <p className="text-xs font-black text-slate-950">Checkout details</p>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Shipping, inventory, and payment options are confirmed during secure Shopify checkout.
              </p>
            </div>
          </aside>

          <div>
            <div className="mb-4 flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.03] sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-black text-slate-950">{products.length} products in this collection</p>
              <Link href={`/products?category=${collection.handle}`} className="text-xs font-black leading-5 text-red-600 transition hover:text-red-700">
                Open with catalog filters
              </Link>
            </div>
            <CollectionProductListing
              products={products}
              collectionHandle={collection.handle}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
