import { ArrowRightIcon, GlobeIcon, PackageIcon, ShieldIcon, TruckIcon } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/LinkButton";

const metrics = [
  {
    value: "Wholesale",
    label: "Catalog supply",
    icon: GlobeIcon,
  },
  {
    value: "OEM/ODM",
    label: "Project discussion",
    icon: TruckIcon,
  },
  {
    value: "Packaging",
    label: "Custom planning",
    icon: PackageIcon,
  },
  {
    value: "Support",
    label: "Long-term supply",
    icon: ShieldIcon,
  },
];

const steps = [
  ["1", "Contact Us", "Share your needs and business info."],
  ["2", "Catalog Review", "Review suitable product categories."],
  ["3", "Sample Discussion", "Confirm sample and packaging needs."],
  ["4", "Order Planning", "Discuss quantity, timeline, and shipping."],
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
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/wholesale" className="w-full px-4 sm:w-auto">
              Wholesale Cooperation
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </LinkButton>
            <LinkButton href="/custom-solutions" variant="secondary" className="w-full px-4 sm:w-auto">
              Custom Solutions
            </LinkButton>
          </div>
        </div>
        <div className="scrollbar-none -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:overflow-visible sm:px-0 sm:pb-0 sm:grid-cols-5">
          {steps.map(([number, title, text]) => (
            <article key={number} className="grid min-h-56 w-44 shrink-0 snap-start grid-rows-[2.25rem_3.5rem_5rem] place-items-center content-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-center sm:w-auto">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-black text-red-600 shadow-sm">
                {number}
              </span>
              <h3 className="self-start text-sm font-black leading-5 text-slate-950">{title}</h3>
              <p className="self-start text-xs leading-5 text-slate-500">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
