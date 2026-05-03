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
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Quality You Can Build On</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              JIESTAR focuses on reliable materials, stable production, and detailed quality control to deliver safe, durable, and enjoyable building experiences.
            </p>
            <div className="mt-6">
              <LinkButton href="/quality-safety" variant="secondary">
                Learn Our Quality Standard
              </LinkButton>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {qualityPoints.map((point) => {
              const Icon = point.icon;
              return (
                <article key={point.title} className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <Icon className="h-6 w-6 text-red-600" />
                  <h3 className="mt-4 text-sm font-black text-slate-950">{point.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{point.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
