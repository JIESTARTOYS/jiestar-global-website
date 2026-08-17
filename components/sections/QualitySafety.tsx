import Image from "next/image";
import { LinkButton } from "@/components/ui/LinkButton";
import { PackageIcon, ShieldIcon, SparkIcon, TruckIcon } from "@/components/ui/Icons";

const qualityPoints = [
  {
    title: "Innovative Design",
    text: "Original models and creative concepts.",
    icon: SparkIcon,
  },
  {
    title: "Premium Quality",
    text: "Safe materials and precise fit.",
    icon: ShieldIcon,
  },
  {
    title: "Global Standards",
    text: "Reliable quality for worldwide markets.",
    icon: PackageIcon,
  },
  {
    title: "Sustainable Future",
    text: "Responsible growth and service.",
    icon: TruckIcon,
  },
];

export function QualitySafety() {
  return (
    <section className="bg-[#f6f7f9] px-5 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="lg:max-w-lg">
            <h2 className="text-2xl font-black text-slate-950">Quality You Can Build On</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              JIESTAR focuses on reliable materials, stable production, and detailed quality control to deliver safe, durable, and enjoyable building experiences.
            </p>
          </div>
          <LinkButton href="/quality-safety" prefetch={false} className="w-full px-5 lg:mt-2 lg:w-auto lg:min-w-72">
            Learn Our Quality Standard
          </LinkButton>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <div className="lg:max-w-md">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm">
              <Image
                src="/images/site-visuals/factory/manual-sorting-review.webp"
                alt="Manual sorting review station with packed building block parts and an inspection checklist"
                fill
                unoptimized
                sizes="(min-width: 1024px) 30vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent p-4">
                <p className="text-xs font-bold uppercase text-white/70">Inspection Focus</p>
                <p className="mt-1 text-sm font-black text-white">Material, clutch power and finished model details</p>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:gap-4">
            {qualityPoints.map((point) => {
              const Icon = point.icon;
              return (
                <article
                  key={point.title}
                  className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm shadow-slate-950/[0.02] lg:block lg:p-5"
                >
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-white text-red-600 shadow-sm ring-1 ring-slate-200 lg:size-auto lg:bg-transparent lg:shadow-none lg:ring-0">
                    <Icon className="h-5 w-5 lg:h-6 lg:w-6" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-950 lg:mt-4">{point.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500 lg:mt-2">{point.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
