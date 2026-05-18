import Image from "next/image";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { LinkButton } from "@/components/ui/LinkButton";

export function BrandStory() {
  return (
    <section className="bg-[#f6f7f9] px-5 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03]">
        <div className="grid lg:min-h-[28rem] lg:grid-cols-[1fr_1fr]">
          <div className="relative min-h-80 overflow-hidden bg-slate-100 lg:min-h-full">
            <Image
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80"
              alt="Modern business building representing JIESTAR global brand operations"
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

          <div className="flex min-h-full flex-col justify-center px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
            <p className="text-xs font-black uppercase tracking-normal text-red-600">About JIESTAR</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">
              Global Brand, Builder-First Products
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Founded in 1998, Guangdong Jiexing Toys Industrial Co., Ltd. has developed into an integrated toy company combining product development, production, and sales. Through continuous innovation and long-term cooperation with global partners, JIESTAR creates building block products with engaging building experiences, display value, and market potential.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {["Since 1998", "Product development", "Global cooperation"].map((item) => (
                <div key={item} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="text-xs font-black uppercase leading-5 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-7">
              <LinkButton href="/about" variant="secondary">
                Learn Our Story
              </LinkButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
