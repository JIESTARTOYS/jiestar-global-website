import Image from "next/image";
import { LinkButton } from "@/components/ui/LinkButton";
import { FactoryIcon, PackageIcon, ShieldIcon, SparkIcon, TruckIcon } from "@/components/ui/Icons";

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
    <section className="bg-white px-3 pb-5">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-b-lg border border-slate-200 bg-[linear-gradient(90deg,#ffffff_0%,#f7f8fa_50%,#eef1f5_100%)] shadow-sm shadow-slate-950/[0.04]">
        <div className="relative grid min-h-[540px] items-center gap-5 px-5 py-10 sm:gap-8 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:px-12 lg:py-12">
          <div className="relative z-10 max-w-xl">
            <h1 className="text-5xl font-black leading-[0.98] tracking-normal text-slate-950 sm:text-6xl lg:text-[76px]">
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
            <div className="mt-9 hidden max-w-lg grid-cols-2 gap-x-5 gap-y-4 border-t border-slate-200 pt-5 sm:grid sm:grid-cols-4">
              {stats.map(([value, label]) => (
                <div key={value}>
                  <p className="text-sm font-black text-slate-950">{value}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-950/[0.07] sm:min-h-[360px] lg:min-h-[430px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_18%,rgba(230,0,18,.16),transparent_30%),linear-gradient(135deg,#ffffff_0%,#f4f6f8_54%,#e8edf3_100%)]" />
            <div className="absolute left-6 top-6 h-16 w-16 rounded-full border border-slate-200 bg-white/70" />
            <div className="absolute right-5 top-8 hidden rounded-md border border-slate-200 bg-white/80 px-3 py-2 text-xs font-black text-slate-950 shadow-sm sm:block">
              Collector Display
            </div>
            <div className="relative min-h-[230px] sm:min-h-[360px] lg:min-h-[430px]">
              <Image
                src="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1500&q=85"
                alt="Red sports car display model representing JIESTAR building block sets"
                fill
                priority
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover object-center sm:object-contain sm:p-8 lg:p-10"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/55 to-transparent p-4 sm:hidden">
                <p className="text-xs font-bold uppercase text-white/70">Featured Build</p>
                <p className="mt-1 text-sm font-black text-white">Display-ready model sets for creators and collectors</p>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 hidden rounded-md border border-white/70 bg-white/85 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm sm:block">
              Factory-direct building block sets
            </div>
            <FloatingBrick className="left-4 top-4 rotate-[-18deg] bg-red-600" />
            <FloatingBrick className="bottom-12 left-12 rotate-[-12deg] bg-yellow-400" />
            <FloatingBrick className="right-7 top-16 rotate-[18deg] bg-slate-200" />
            <FloatingBrick className="bottom-6 right-12 rotate-[10deg] bg-slate-900" />
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
