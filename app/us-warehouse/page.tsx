import Image from "next/image";
import Link from "next/link";
import { CatalogProductCard } from "@/components/product/CatalogProductCard";
import { GlobeIcon, PackageIcon, ShieldIcon, TruckIcon } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/LinkButton";
import { createMetadata } from "@/lib/seo";
import { getShopifyCollectionSummary, ShopifyUnavailableError } from "@/lib/shopify";
import { US_WAREHOUSE_COLLECTION_HANDLE } from "@/lib/us-warehouse";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "U.S. Warehouse Building Block Sets | JIESTAR",
  description:
    "Explore JIESTAR building block sets eligible for U.S. warehouse fulfillment. Shipping options and final charges are shown at checkout for eligible U.S. addresses.",
  path: "/us-warehouse",
});

async function getWarehouseCollection() {
  try {
    return {
      data: await getShopifyCollectionSummary(US_WAREHOUSE_COLLECTION_HANDLE),
      temporarilyUnavailable: false,
    };
  } catch (error) {
    if (error instanceof ShopifyUnavailableError) {
      return { data: undefined, temporarilyUnavailable: true };
    }

    throw error;
  }
}

export default async function UsWarehousePage() {
  const { data, temporarilyUnavailable } = await getWarehouseCollection();
  const products = data?.products ?? [];
  const heroProducts = products.slice(0, 4);

  return (
    <main className="bg-[#f6f7f9]">
      <section className="px-4 pb-8 pt-6 sm:px-5 lg:px-8 lg:pb-12 lg:pt-10">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.04] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-12">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-blue-700">
              <TruckIcon className="h-5 w-5" />
              U.S. delivery program
            </div>
            <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Selected builds,<br />closer to you.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Shop selected JIESTAR building block sets eligible for fulfillment from our U.S. warehouse network to eligible U.S. addresses.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="#warehouse-products">Shop eligible sets</LinkButton>
              <LinkButton href="/policies/shipping-policy" variant="secondary">Shipping details</LinkButton>
            </div>
            <p className="mt-5 text-xs leading-5 text-slate-500">
              Eligibility is not a live inventory guarantee. Final shipping options and charges are confirmed at checkout.
            </p>
          </div>

          <div className="relative min-h-[22rem] overflow-hidden bg-slate-950 p-4 sm:min-h-[30rem] sm:p-5 lg:min-h-[38rem]">
            {heroProducts.length ? (
              <div className="grid h-full grid-cols-2 grid-rows-2 gap-3 sm:gap-4">
                {heroProducts.map((product, index) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.handle}`}
                    className={`group relative overflow-hidden rounded-lg bg-white ${index === 0 ? "row-span-2" : ""}`}
                    aria-label={`View ${product.title}`}
                  >
                    <Image
                      src={product.image}
                      alt={product.imageAlt}
                      fill
                      sizes={index === 0 ? "(min-width: 1024px) 28vw, 50vw" : "(min-width: 1024px) 24vw, 50vw"}
                      className="object-contain p-3 transition duration-300 group-hover:scale-[1.03] sm:p-5"
                      priority={index < 2}
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex h-full min-h-[20rem] items-center justify-center rounded-lg border border-white/10 bg-slate-900 px-8 text-center">
                <div>
                  <PackageIcon className="mx-auto h-10 w-10 text-red-500" />
                  <p className="mt-4 text-lg font-black text-white">Product selection is being updated</p>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">Please check back shortly or browse the full product catalog.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-5 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {[
            {
              title: "Ships from U.S.",
              text: "Eligible products can be fulfilled through our U.S. warehouse program.",
              icon: TruckIcon,
            },
            {
              title: "For eligible U.S. addresses",
              text: "Availability depends on the destination and the products in your cart.",
              icon: GlobeIcon,
            },
            {
              title: "Checkout confirms the total",
              text: "Shopify shows the final available shipping option and charge before payment.",
              icon: ShieldIcon,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03]">
                <Icon className="h-6 w-6 text-red-600" />
                <h2 className="mt-4 text-base font-black text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="warehouse-products" className="scroll-mt-28 border-y border-slate-200 bg-white px-4 py-12 sm:px-5 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-red-600">U.S. warehouse eligible</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Shop the selection</h2>
            </div>
            {products.length ? <p className="text-sm font-semibold text-slate-500">{products.length} products</p> : null}
          </div>

          {products.length ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <CatalogProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center sm:p-12">
              <PackageIcon className="mx-auto h-8 w-8 text-slate-500" />
              <h3 className="mt-4 text-xl font-black text-slate-950">
                {temporarilyUnavailable ? "Warehouse selection temporarily unavailable" : "Warehouse selection update in progress"}
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
                We are refreshing the eligible product list. Try again shortly, browse all products, or contact JIESTAR for help.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <LinkButton href="/us-warehouse" variant="secondary">Try again</LinkButton>
                <LinkButton href="/products">Browse all products</LinkButton>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="px-4 py-12 sm:px-5 lg:px-8 lg:py-16">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-xl bg-slate-950 p-6 text-white sm:p-8">
            <p className="text-sm font-black uppercase text-red-400">Orders from more than one location</p>
            <h2 className="mt-3 text-2xl font-black sm:text-3xl">Your order may ship together or separately</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              When a cart includes U.S. warehouse eligible products and products fulfilled from another location, Shopify may combine shipping charges or split the shipment. Review the final shipping option and total at checkout before paying.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
            <p className="text-sm font-black uppercase text-red-600">Buying for your business?</p>
            <h2 className="mt-3 text-2xl font-black text-slate-950">Plan wholesale supply with JIESTAR</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Ask about wholesale selection, mixed SKUs, target markets, and longer-term product cooperation.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <LinkButton href="/wholesale">Wholesale</LinkButton>
              <LinkButton href="/contact" variant="secondary">Contact us</LinkButton>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
