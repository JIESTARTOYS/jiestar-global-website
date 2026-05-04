import { GlobeIcon, PackageIcon, ShieldIcon, TruckIcon } from "@/components/ui/Icons";

const metrics = [
  {
    value: "200+",
    label: "Global Partners",
    icon: GlobeIcon,
  },
  {
    value: "100+",
    label: "Countries Served",
    icon: TruckIcon,
  },
  {
    value: "20M+",
    label: "Sets Delivered",
    icon: PackageIcon,
  },
  {
    value: "15+",
    label: "Years of Experience",
    icon: ShieldIcon,
  },
];

const steps = [
  ["1", "Contact Us", "Share your needs and business info."],
  ["2", "Proposal & Quote", "Get a tailored solution and pricing."],
  ["3", "Sample & Confirm", "Review samples and finalize details."],
  ["4", "Mass Production", "Strict quality control and on-time delivery."],
  ["5", "After-Sales Support", "Long-term service and growth support."],
];

export function CustomSolutions() {
  return (
    <section className="bg-[#f6f7f9] px-5 py-8 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[0.7fr_1.3fr] lg:p-6">
        <div>
          <h2 className="text-2xl font-black text-slate-950">Wholesale Partnership</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Grow together. We support partners worldwide with reliable supply and strong service.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4">
            {metrics.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.value} className="flex items-center gap-2.5 sm:gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 sm:h-10 sm:w-10">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-lg font-black text-slate-950 sm:text-xl">{item.value}</p>
                    <p className="text-xs font-semibold text-slate-500">{item.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="scrollbar-none -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:overflow-visible sm:px-0 sm:pb-0 sm:grid-cols-5">
          {steps.map(([number, title, text]) => (
            <article key={number} className="flex min-h-56 w-44 shrink-0 snap-start flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-4 text-center sm:w-auto">
              <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-black text-red-600 shadow-sm">
                {number}
              </span>
              <h3 className="mt-3 text-sm font-black text-slate-950">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
