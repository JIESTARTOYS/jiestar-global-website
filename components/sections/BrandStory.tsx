import Image from "next/image";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { LinkButton } from "@/components/ui/LinkButton";

const brandSignals = [
  ["Since", "1998"],
  ["Role", "Product development"],
  ["Focus", "Global cooperation"],
];

export function BrandStory() {
  return (
    <section className="bg-[#f6f7f9] px-5 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03]">
        <div className="grid lg:min-h-[28rem] lg:grid-cols-[1fr_1fr]">
          <div className="relative min-h-80 overflow-hidden bg-slate-100 lg:min-h-full">
            <Image
              src="/images/site-visuals/brand-operations.avif"
              alt="Representative product planning workspace for global building block brand operations"
              fill
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0)_42%,rgba(15,23,42,.45)_100%)]" />
            <div className="absolute left-6 top-6 rounded-md bg-white p-1 shadow-lg shadow-slate-950/15">
              <SiteLogo className="size-16" />
            </div>
            <div className="absolute bottom-6 left-6 right-6 rounded-lg border border-white/20 bg-slate-950/70 p-4 text-white shadow-lg shadow-slate-950/15 backdrop-blur">
              <p className="text-xs font-black uppercase text-red-200">Brand foundation</p>
              <p className="mt-1 text-sm font-semibold leading-6">
                Product development, production, global sales, and long-term partner cooperation.
              </p>
            </div>
          </div>

          <div className="relative flex min-h-full flex-col justify-center overflow-hidden bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_58%,#f8fafc_100%)] px-6 py-8 sm:px-8 lg:px-12 lg:py-12">
            <div aria-hidden="true" className="absolute inset-y-8 left-0 hidden w-1 rounded-r-full bg-red-600 lg:block" />
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-normal text-red-700">
                <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                About JIESTAR
              </div>
              <h2 className="mt-4 max-w-xl text-3xl font-black leading-tight tracking-normal text-slate-950 sm:text-4xl lg:text-[42px]">
                Global Brand, Builder-First Products
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                Founded in 1998, Guangdong Jiexing Toys Industrial Co., Ltd. has developed into an integrated toy company combining product development, production, and sales. Through continuous innovation and long-term cooperation with global partners, JIESTAR creates building block products with engaging building experiences, display value, and market potential.
              </p>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {brandSignals.map(([label, value]) => (
                <div key={value} className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm shadow-slate-950/[0.02]">
                  <p className="text-[11px] font-black uppercase leading-4 text-slate-400">{label}</p>
                  <p className="mt-2 text-sm font-black leading-5 text-slate-950">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <LinkButton href="/about" variant="secondary">
                Learn Our Story
              </LinkButton>
              <p className="max-w-xs text-xs font-semibold leading-5 text-slate-500">
                Built for direct shoppers, wholesale buyers, and custom product partners.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
