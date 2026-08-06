import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionProductListing } from "@/components/product/CollectionProductListing";
import { ArrowRightIcon, HomeIcon, PackageIcon, ShieldIcon, StoreIcon, TruckIcon } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/LinkButton";
import { getCollection, getProductsByCollection } from "@/lib/data";
import { PRODUCT_PAGE_SIZE, buildPaginationHref, getPaginatedItems } from "@/lib/product-pagination";
import { createBrandCollectionJsonLd, createBreadcrumbJsonLd, createJsonLdScript, createMetadata } from "@/lib/seo";
import { getShopifyCollectionSummary, getShopifyCollections } from "@/lib/shopify";
import { getEnabledSubBrands, getSubBrandByCollectionHandle, isSubBrandCollectionEnabled } from "@/lib/sub-brands";

type PageProps = {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

function getCollectionSeoCopy(title: string) {
  const category = title.replace(/\s+collection$/i, "");

  return {
    title: `${category} Sets for Retail and Wholesale Buyers`,
    intro: `JIESTAR ${category} building block sets are designed for buyers who need retail-ready products, giftable models, display-oriented sets, or category-based product lines. This category can be suitable for toy stores, distributors, online sellers, collectors' markets, and buyers planning seasonal or themed product selections.`,
    planning: `For category planning, buyers should consider the expected customer age range, model size, finished display value, package format, piece count, price direction, and whether the products will be sold through retail shelves, marketplace listings, short-video commerce, specialty stores, or distributor catalogs. A focused category page helps buyers review available product directions before requesting catalog pricing or MOQ discussion.`,
    scenarios: `Suitable buyer scenarios may include retail shelf planning, e-commerce product launches, wholesale catalog selection, gift programs, display model categories, and product-line testing for a specific market. Buyers can compare product titles, SKU details, piece count, product imagery, and available category directions before sending an inquiry.`,
    cooperation: `For wholesale buyers, JIESTAR can support catalog discussion, MOQ planning, mixed SKU selection, packaging requirements, shipping options, and replenishment needs. If you need private label packaging, exclusive SKU planning, or a related custom project, please contact our team through the official inquiry channel.`,
    custom: `Custom cooperation can also start from this category. Buyers may ask whether a related product direction can support custom packaging, brand logo discussion, instruction manual planning, exclusive SKU development, or a broader product line for a specific channel. JIESTAR reviews these requests based on project scope, quantity range, budget direction, target market, and production feasibility.`,
  };
}

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const collections = await getShopifyCollections();

  return collections.map((collection) => ({ handle: collection.handle }));
}

export async function generateMetadata({ params, searchParams }: PageProps) {
  const [{ handle }, { page }] = await Promise.all([params, searchParams]);
  const subBrandForHandle = getSubBrandByCollectionHandle(handle);

  if (subBrandForHandle && !isSubBrandCollectionEnabled(handle)) {
    return {};
  }

  const shopifyCollection = await getShopifyCollectionSummary(handle);
  const collection = shopifyCollection?.collection ?? getCollection(handle);

  if (!collection) {
    return {};
  }

  const products = shopifyCollection?.products ?? getProductsByCollection(handle);
  const currentPage = getPaginatedItems(products, page).currentPage;
  const pagePath = buildPaginationHref(`/collections/${handle}`, currentPage);

  if (subBrandForHandle) {
    return createMetadata({
      title:
        currentPage > 1
          ? `${subBrandForHandle.seo.pageHeading} - Page ${currentPage} | JIESTAR`
          : subBrandForHandle.seo.title,
      description:
        currentPage > 1
          ? `Page ${currentPage}: ${subBrandForHandle.seo.description}`
          : subBrandForHandle.seo.description,
      path: pagePath,
      image: subBrandForHandle.image,
    });
  }

  return createMetadata({
    title:
      currentPage > 1
        ? `${collection.title} Building Block Sets - Page ${currentPage} | JIESTAR`
        : `${collection.title} Building Block Sets | JIESTAR Wholesale & Custom Supply`,
    description: `Explore JIESTAR ${collection.title} building block sets for retail, wholesale, gift, display, and custom product planning. Contact us for catalog, MOQ, packaging, and B2B cooperation.`,
    path: pagePath,
  });
}

export default async function CollectionPage({ params, searchParams }: PageProps) {
  const [{ handle }, { page }] = await Promise.all([params, searchParams]);
  const subBrandForHandle = getSubBrandByCollectionHandle(handle);

  if (subBrandForHandle && !isSubBrandCollectionEnabled(handle)) {
    notFound();
  }

  const shopifyCollection = await getShopifyCollectionSummary(handle);
  const collection = shopifyCollection?.collection ?? getCollection(handle);

  if (!collection) {
    notFound();
  }

  const products = shopifyCollection?.products ?? getProductsByCollection(handle);
  const subBrand = getSubBrandByCollectionHandle(collection.handle);
  const isBrandCollection = Boolean(subBrand);
  const displayTitle = subBrand?.name ?? collection.title;
  const pageHeading = subBrand?.seo.pageHeading ?? `${displayTitle} Building Block Sets`;
  const collectionDescription = subBrand?.collectionDescription ?? collection.description;
  const collectionSeo = getCollectionSeoCopy(displayTitle);
  const pagination = getPaginatedItems(products, page);
  const pagePath = buildPaginationHref(`/collections/${collection.handle}`, pagination.currentPage);
  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: displayTitle, path: `/collections/${collection.handle}` },
  ]);
  const pageJsonLd = subBrand
    ? [
        breadcrumbJsonLd,
        createBrandCollectionJsonLd({
          brandName: subBrand.name,
          description: subBrand.seo.description,
          logo: subBrand.image,
          brandPath: `/collections/${collection.handle}`,
          pagePath,
          products: pagination.items,
          positionOffset: (pagination.currentPage - 1) * PRODUCT_PAGE_SIZE,
        }),
      ]
    : breadcrumbJsonLd;
  const otherBrands = subBrand
    ? getEnabledSubBrands().filter((brand) => brand.collectionHandle !== subBrand.collectionHandle)
    : [];

  return (
    <div className="bg-[#f7f8fa] px-4 py-8 sm:px-5 lg:px-8 lg:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={createJsonLdScript(pageJsonLd)} />
      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
          <Link href="/" className="flex items-center gap-2 transition hover:text-red-600">
            <HomeIcon className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/products" className="font-medium transition hover:text-red-600">Products</Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-slate-700">{displayTitle}</span>
        </nav>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03]">
          <div className="grid lg:grid-cols-[1.02fr_0.98fr] lg:items-stretch">
            <div className="flex flex-col justify-center p-5 sm:p-8 lg:p-10">
              <p className="text-sm font-black uppercase text-red-600">
                {subBrand?.isFlagship ? "Official flagship collection" : isBrandCollection ? "JIESTAR brand portfolio" : "Collection"}
              </p>
              <h1 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                {pageHeading}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">{collectionDescription}</p>
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
            <div
              className={
                isBrandCollection
                  ? "relative flex min-h-64 items-center justify-center bg-white p-8 sm:p-10 lg:min-h-full"
                  : "relative min-h-64 bg-slate-100 lg:min-h-full"
              }
            >
              {subBrand ? (
                <div className="relative h-44 w-full max-w-[16rem] sm:h-56 sm:max-w-[22rem] lg:h-72 lg:max-w-[30rem]">
                  <Image
                    src={subBrand.image}
                    alt={`${subBrand.name} brand logo`}
                    fill
                    sizes="(min-width: 1024px) 30rem, (min-width: 640px) 22rem, 16rem"
                    className="object-contain"
                    priority
                  />
                </div>
              ) : collection.image ? (
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

        {subBrand ? (
          <section
            className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03] sm:p-6 lg:p-8"
            aria-labelledby="brand-overview-heading"
          >
            <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
              <div>
                <h2 id="brand-overview-heading" className="text-3xl font-black leading-tight text-slate-950">
                  About the {subBrand.name} Collection
                </h2>
                {subBrand.seo.overview.map((paragraph) => (
                  <p key={paragraph} className="mt-4 max-w-[70ch] text-base leading-8 text-slate-600">
                    {paragraph}
                  </p>
                ))}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-950">What You&apos;ll Find</h2>
                <div className="mt-3 divide-y divide-slate-200 rounded-lg bg-slate-50 px-5">
                  {subBrand.seo.productFocus.map((focus) => (
                    <article key={focus.title} className="py-4">
                      <h3 className="text-base font-black text-slate-950">{focus.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{focus.description}</p>
                    </article>
                  ))}
                </div>
                <h2 className="mt-6 text-xl font-black text-slate-950">How to Explore This Collection</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{subBrand.seo.selectionGuide}</p>
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-5 rounded-lg bg-red-50 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <h2 className="text-xl font-black text-slate-950">Shopping, Wholesale & Product Cooperation</h2>
                <p className="mt-2 text-sm leading-7 text-slate-700">{subBrand.seo.audience}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <LinkButton href="/wholesale" className="px-4">Wholesale Inquiry</LinkButton>
                <LinkButton href="/custom-solutions" variant="secondary" className="px-4">Custom Solutions</LinkButton>
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-8 grid gap-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03] sm:p-6 lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
            <div>
              <p className="text-sm font-black uppercase text-red-600">Category guide</p>
              <h2 className="mt-2 text-3xl font-black tracking-normal text-slate-950">
                {collectionSeo.title}
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600">{collectionSeo.intro}</p>
              <p className="mt-4 text-base leading-8 text-slate-600">{collectionSeo.planning}</p>
            </div>
            <div className="grid gap-4">
              <article className="rounded-lg bg-slate-50 p-5">
                <h2 className="text-xl font-black text-slate-950">Suitable Buyer Scenarios</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{collectionSeo.scenarios}</p>
              </article>
              <article className="rounded-lg bg-red-50 p-5">
                <h2 className="text-xl font-black text-slate-950">Wholesale and Custom Cooperation</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{collectionSeo.cooperation}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{collectionSeo.custom}</p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <LinkButton href="/wholesale" className="px-4">Wholesale building block sets</LinkButton>
                  <LinkButton href="/custom-solutions" variant="secondary" className="px-4">Custom building block solutions</LinkButton>
                  <LinkButton href="/contact" variant="secondary" className="px-4">Contact JIESTAR official sales</LinkButton>
                </div>
              </article>
            </div>
          </section>
        )}

        {subBrand ? (
          <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="other-brands-heading">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 id="other-brands-heading" className="text-xl font-black text-slate-950">Explore Other JIESTAR Brands</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Compare focused collections across the JIESTAR brand portfolio.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {otherBrands.map((brand) => (
                  <Link
                    key={brand.name}
                    href={`/collections/${brand.collectionHandle}`}
                    className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                  >
                    {brand.name} building block sets
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-8 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03] lg:sticky lg:top-24 lg:self-start">
            <p className="text-sm font-black text-slate-950">Collection options</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {isBrandCollection
                ? "Browse this brand collection, compare available sets, or contact JIESTAR for wholesale supply and custom cooperation."
                : "Browse this product direction, compare available sets, or contact JIESTAR for wholesale supply and custom cooperation."}
            </p>
            <div className="mt-5 grid gap-3 text-sm">
              <LinkButton href="/products" variant="secondary" className="w-full px-4">All Products</LinkButton>
              {isBrandCollection ? null : (
                <LinkButton href={`/products?category=${collection.handle}`} variant="secondary" className="w-full px-4">
                  Filter Catalog
                </LinkButton>
              )}
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
              {isBrandCollection ? null : (
                <Link href={`/products?category=${collection.handle}`} className="text-xs font-black leading-5 text-red-600 transition hover:text-red-700">
                  Open with catalog filters
                </Link>
              )}
            </div>
            <CollectionProductListing
              products={products}
              collectionHandle={collection.handle}
              selectedPage={page}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
