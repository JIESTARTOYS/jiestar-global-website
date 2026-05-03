import Link from "next/link";
import Image from "next/image";
import { collections } from "@/lib/data";
import { ArrowRightIcon } from "@/components/ui/Icons";

const categorySubtitles: Record<string, string> = {
  "Technic Vehicles": "Engineering & Motion",
  "Super Cars": "Cars, Trucks & More",
  "Military Models": "Tanks, Aircraft & More",
  Trains: "Classic Railway Sets",
  Architecture: "Iconic Buildings",
  "Pirate Ships": "Adventure Builds",
  "Book Nooks": "Display Scenes",
  "Educational Blocks": "Learning Sets",
};

export function ProductCategories() {
  return (
    <section className="bg-[#f6f7f9] px-5 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-slate-950">Featured Categories</h2>
          <Link href="/products" className="hidden items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-red-600 sm:flex">
            View all categories
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {collections.slice(0, 6).map((collection) => (
            <Link
              key={collection.handle}
              href={`/collections/${collection.handle}`}
              className="group relative min-h-44 overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <div>
                <h3 className="text-sm font-black text-slate-950">{collection.title}</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">{categorySubtitles[collection.title] ?? "Building Block Sets"}</p>
              </div>
              <div className="absolute bottom-8 left-4 right-4 h-24">
                <Image
                  src={collection.image}
                  alt={`${collection.title} collection`}
                  fill
                  sizes="(min-width: 1024px) 16vw, (min-width: 640px) 50vw, 100vw"
                  className="object-contain transition duration-300 group-hover:scale-105"
                />
              </div>
              <span className="absolute bottom-4 right-4 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition group-hover:border-red-600 group-hover:bg-red-600 group-hover:text-white">
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
