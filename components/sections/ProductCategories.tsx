import Link from "next/link";
import Image from "next/image";
import type { Collection, Product } from "@/lib/data";
import { ArrowRightIcon } from "@/components/ui/Icons";

type ProductCategoriesProps = {
  collections: Collection[];
  products: Product[];
};

function productCount(collection: Collection, products: Product[]) {
  return products.filter(
    (product) => product.collectionHandle === collection.handle || product.category === collection.title,
  ).length;
}

export function ProductCategories({ collections, products }: ProductCategoriesProps) {
  const visibleCollections = collections.filter(
    (collection) => collection.image || productCount(collection, products) > 0,
  );
  const featuredCollections = (visibleCollections.length ? visibleCollections : collections).slice(0, 6);

  return (
    <section className="bg-[#f6f7f9] px-5 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-black text-slate-950">Featured Categories</h2>
          <Link href="/products" className="hidden items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-red-600 sm:flex">
            Shop all products
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        <div className="scrollbar-none -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:overflow-visible sm:px-0 sm:pb-0 sm:grid-cols-2 lg:grid-cols-6">
          {featuredCollections.map((collection) => {
            const count = productCount(collection, products);

            return (
              <Link
                key={collection.handle}
                href={`/collections/${collection.handle}`}
                className="group w-[42vw] max-w-40 shrink-0 snap-start overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-950/[0.06] sm:w-auto sm:max-w-none"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-50 sm:aspect-[4/3]">
                  {collection.image ? (
                    <Image
                      src={collection.image}
                      alt={collection.imageAlt ?? `${collection.title} collection`}
                      fill
                      sizes="(min-width: 1024px) 16vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-slate-100 px-3 text-center text-[11px] font-black uppercase leading-4 text-slate-500">
                      Image pending
                    </div>
                  )}
                </div>
                <div className="flex min-h-16 items-end justify-between gap-2 p-2.5 sm:min-h-[76px] sm:gap-3 sm:p-3">
                  <div>
                    <h3 className="text-xs font-black leading-4 text-slate-950 transition group-hover:text-red-600 sm:text-sm sm:leading-5">{collection.title}</h3>
                    <p className="mt-1 text-[11px] font-semibold leading-3.5 text-slate-500 sm:text-xs sm:leading-4">{count} products</p>
                  </div>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition group-hover:border-red-600 group-hover:bg-red-600 group-hover:text-white sm:h-7 sm:w-7">
                    <ArrowRightIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
