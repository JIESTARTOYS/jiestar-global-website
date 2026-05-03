import Image from "next/image";
import { LinkButton } from "@/components/ui/LinkButton";
import { FactoryIcon, GlobeIcon, PackageIcon, ShieldIcon, SparkIcon, TruckIcon } from "@/components/ui/Icons";

const stats = [
  ["10,000+", "Designs"],
  ["100+", "Countries"],
  ["20M+", "Happy Builders"],
  ["Since 1998", "Building Dreams"],
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
    <section className="bg-white px-3 pb-6">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-b-lg border border-slate-200 bg-[linear-gradient(90deg,#ffffff_0%,#f7f8fa_48%,#eef1f5_100%)] shadow-sm">
        <div className="relative grid min-h-[560px] items-center gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:px-12 lg:py-14">
          <div className="relative z-10 max-w-xl">
            <h1 className="text-5xl font-black leading-[0.98] tracking-normal text-slate-950 sm:text-6xl lg:text-7xl">
              Build Beyond Imagination<span className="text-red-600">.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-slate-600 sm:text-lg">
              Premium building block sets for creators, dreamers and builders of all ages.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/products" className="min-w-32">
                Shop Now
              </LinkButton>
              <LinkButton href="/collections/technic-vehicles" variant="secondary" className="min-w-44">
                Explore Collections
              </LinkButton>
            </div>
          </div>

          <div className="relative z-0 min-h-[280px] lg:min-h-[420px]">
            <div className="absolute right-0 top-4 hidden h-72 w-72 rounded-full bg-red-100/60 blur-3xl lg:block" />
            <div className="absolute right-2 top-0 hidden h-full w-1/2 bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(203,213,225,.4))] lg:block" />
            <Image
              src="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1500&q=85"
              alt="Red sports car display model representing JIESTAR building block sets"
              fill
              priority
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-contain object-center drop-shadow-2xl"
            />
            <FloatingBrick className="left-4 top-4 rotate-[-18deg] bg-red-600" />
            <FloatingBrick className="bottom-12 left-12 rotate-[-12deg] bg-yellow-400" />
            <FloatingBrick className="right-7 top-16 rotate-[18deg] bg-slate-200" />
            <FloatingBrick className="bottom-6 right-12 rotate-[10deg] bg-slate-900" />
          </div>
        </div>

        <div className="grid border-t border-slate-200 bg-white/90 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(([value, label]) => (
            <div key={value} className="flex items-center gap-3 border-b border-slate-200 px-5 py-5 sm:border-r lg:border-b-0">
              <GlobeIcon className="h-5 w-5 shrink-0 text-slate-800" />
              <div>
                <p className="text-sm font-black text-slate-950">{value}</p>
                <p className="text-xs font-medium text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid border-t border-slate-200 bg-white md:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-center gap-4 border-b border-slate-200 px-5 py-6 md:border-r lg:border-b-0">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-950">
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

function FloatingBrick({ className }: { className: string }) {
  return (
    <span className={`absolute hidden h-7 w-14 rounded-sm shadow-lg shadow-slate-950/10 sm:block ${className}`}>
      <span className="absolute left-2 top-1.5 h-3 w-3 rounded-full bg-white/30" />
      <span className="absolute left-6 top-1.5 h-3 w-3 rounded-full bg-white/30" />
      <span className="absolute right-2 top-1.5 h-3 w-3 rounded-full bg-white/30" />
      <SparkIcon className="sr-only" />
    </span>
  );
}
