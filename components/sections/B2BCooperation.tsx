import Image from "next/image";
import type { ReactNode } from "react";
import { LinkButton } from "@/components/ui/LinkButton";
import { ArrowRightIcon, FactoryIcon, GlobeIcon, PackageIcon, SparkIcon } from "@/components/ui/Icons";

const items = [
  {
    title: "OEM / ODM Manufacturing",
    text: "Turn your idea into products with full customization.",
    icon: FactoryIcon,
  },
  {
    title: "Custom Development",
    text: "Tailored designs, molds, packaging and instructions.",
    icon: SparkIcon,
  },
  {
    title: "Co-Branding Programs",
    text: "Build branded sets with your identity.",
    icon: PackageIcon,
  },
  {
    title: "Sub-Brand Partnership",
    text: "Launch exclusive collections under your sub-brand.",
    icon: GlobeIcon,
  },
];

export function B2BCooperation() {
  return (
    <section className="bg-[#f6f7f9] px-5 py-8 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1.8fr_1fr] lg:p-6">
        <div>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-2xl font-black text-slate-950">B2B & Custom Solutions</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                From concept to shelf, complete solutions to grow your brand.
              </p>
            </div>
            <LinkButton href="/custom-solutions" className="shrink-0">
              Learn More
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </LinkButton>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <LinkCard key={item.title} title={item.title} text={item.text}>
                  <Icon className="h-6 w-6" />
                </LinkCard>
              );
            })}
          </div>
        </div>
        <div className="relative min-h-64 overflow-hidden rounded-lg bg-slate-100">
          <Image
            src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80"
            alt="Business partners discussing wholesale and custom building block cooperation"
            fill
            sizes="(min-width: 1024px) 32vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}

function LinkCard({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <article className="group relative min-h-32 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-red-200 hover:bg-red-50/40">
      <div className="text-red-600">{children}</div>
      <h3 className="mt-4 text-sm font-black leading-5 text-slate-950">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-slate-500">{text}</p>
      <span className="absolute bottom-3 right-3 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition group-hover:border-red-600 group-hover:bg-red-600 group-hover:text-white">
        <ArrowRightIcon className="h-3 w-3" />
      </span>
    </article>
  );
}
