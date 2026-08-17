import Link from "next/link";
import { SubBrandCarousel } from "@/components/sections/SubBrandCarousel";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { subBrands } from "@/lib/sub-brands";

export function HomeBrandPortfolio() {
  return (
    <section className="bg-[#f6f7f9] px-5 pb-12 pt-2 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-950">JIESTAR Brand Portfolio</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Explore the JIESTAR flagship brand and focused sub-brands built for different product categories and market positions.
            </p>
          </div>
          <Link href="/about" prefetch={false} className="hidden items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-red-600 sm:flex">
            Learn about brands
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        <SubBrandCarousel brands={subBrands} fadeBackground="page" />
      </div>
    </section>
  );
}
