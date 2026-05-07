import Image from "next/image";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { LinkButton } from "@/components/ui/LinkButton";

export function BrandStory() {
  return (
    <section className="bg-[#f6f7f9] px-5 py-8 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.95fr_1fr] lg:items-center">
        <div className="relative min-h-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <Image
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80"
            alt="Modern business building representing JIESTAR global brand operations"
            fill
            sizes="(min-width: 1024px) 48vw, 100vw"
            className="object-cover"
          />
          <div className="absolute left-6 top-6 rounded-md bg-white p-1 shadow-lg">
            <SiteLogo className="size-16" />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <p className="text-xs font-black uppercase tracking-normal text-red-600">About JIESTAR</p>
          <h2 className="mt-3 text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">Global Brand, Builder-First Products</h2>
          <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base">
            Founded in 1998, Guangdong Jiexing Toys Industrial Co., Ltd. has developed into an integrated toy company combining product development, production, and sales. Through continuous innovation and long-term cooperation with global partners, JIESTAR creates building block products with engaging building experiences, display value, and market potential.
          </p>
          <div className="mt-6">
            <LinkButton href="/about" variant="secondary">
              Learn Our Story
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
