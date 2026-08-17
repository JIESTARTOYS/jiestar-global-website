import Image from "next/image";
import { LinkButton } from "@/components/ui/LinkButton";
import { FactoryIcon, PackageIcon, ShieldIcon, TruckIcon } from "@/components/ui/Icons";

const stats = [
  ["Official", "Brand website"],
  ["DTC", "Building block sets"],
  ["Wholesale", "Business inquiry"],
  ["OEM/ODM", "Custom solutions"],
];

const trustItems = [
  {
    title: "Premium Quality",
    text: "Strict quality control",
    icon: ShieldIcon,
  },
  {
    title: "Global Shipping",
    text: "Fast & reliable delivery",
    icon: TruckIcon,
  },
  {
    title: "Secure Payments",
    text: "Safe & trusted checkout",
    icon: PackageIcon,
  },
  {
    title: "OEM/ODM Support",
    text: "One-stop custom solutions",
    icon: FactoryIcon,
  },
];

export function HomeHero() {
  return (
    <section className="bg-white px-3 pb-5">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-b-lg border border-slate-200 bg-[linear-gradient(90deg,#ffffff_0%,#f7f8fa_50%,#eef1f5_100%)] shadow-sm shadow-slate-950/[0.04]">
        <div className="relative grid min-h-[540px] items-center gap-5 px-5 py-10 sm:gap-8 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:px-12 lg:py-12">
          <div className="relative z-10 max-w-xl">
            <h1 className="text-5xl font-black leading-[0.98] tracking-normal text-slate-950 sm:text-6xl lg:text-[76px]">
              Build Beyond Imagination<span className="text-red-600">.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-slate-600 sm:text-lg">
              Factory-direct building block sets and custom product solutions for global retailers, brand partners, collectors and builders.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/products" prefetch={false} className="min-w-32">
                Explore Products
              </LinkButton>
              <LinkButton href="/custom-solutions" prefetch={false} variant="secondary" className="min-w-44">
                Start a Project
              </LinkButton>
            </div>
            <div className="mt-9 hidden max-w-lg grid-cols-2 gap-x-5 gap-y-4 border-t border-slate-200 pt-5 sm:grid sm:grid-cols-4">
              {stats.map(([value, label]) => (
                <div key={value}>
                  <p className="text-sm font-black text-slate-950">{value}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-0 -mx-2 aspect-[1448/1086] w-[calc(100%+1rem)] overflow-visible sm:mx-0 sm:w-full lg:-mb-9 lg:-mr-10 lg:translate-x-4 lg:scale-[1.1]">
            <div
              aria-hidden="true"
              className="absolute -bottom-[3%] left-[23%] right-[1%] h-[22%] rounded-full bg-slate-950/10 blur-2xl"
            />
            <Image
              src="/images/home/jiestar-home-hero-product-showcase-soft-background-v4.avif"
              alt="JIESTAR product line showcase with sports car, aircraft, train, space shuttle, airship, flower and vehicle building block models"
              fill
              priority
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="relative z-10 object-contain object-center drop-shadow-[0_32px_38px_rgba(15,23,42,0.18)]"
            />
          </div>
        </div>

        <div className="grid border-t border-slate-200 bg-white/95 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-center gap-4 border-b border-slate-200 px-5 py-5 sm:border-r lg:border-b-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-950">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-sm font-black text-slate-950">{item.title}</h2>
                  <p className="mt-1 text-xs font-medium text-slate-500">{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
