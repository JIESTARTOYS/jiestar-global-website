import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { ArrowRightIcon, FactoryIcon, StoreIcon, TruckIcon } from "@/components/ui/Icons";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const confidencePaths: Array<{
  title: string;
  eyebrow: string;
  description: string;
  points: string[];
  href: string;
  linkLabel: string;
  icon: IconComponent;
}> = [
  {
    title: "Retail customers",
    eyebrow: "DTC confidence",
    description: "Clear product pages, secure Shopify checkout, and support paths for missing pieces or order questions.",
    points: ["Product detail before purchase", "Secure checkout flow", "After-sales support"],
    href: "/products",
    linkLabel: "Explore products",
    icon: StoreIcon,
  },
  {
    title: "Wholesale buyers",
    eyebrow: "Channel supply",
    description: "Existing product directions, catalog request flow, MOQ discussion, and private follow-up for channel buyers.",
    points: ["Catalog request", "MOQ and shipping discussion", "Retail and ecommerce channels"],
    href: "/wholesale",
    linkLabel: "Request catalog",
    icon: TruckIcon,
  },
  {
    title: "Custom partners",
    eyebrow: "Long-term cooperation",
    description: "OEM / ODM customization, product co-development, packaging direction, and exclusive SKU planning.",
    points: ["OEM / ODM projects", "Exclusive product lines", "Sub-brand partnership"],
    href: "/custom-solutions",
    linkLabel: "Start a project",
    icon: FactoryIcon,
  },
];

export function BrandStrength() {
  return (
    <section className="bg-[#f6f7f9] px-5 pb-6 pt-10 lg:px-8 lg:pt-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 max-w-3xl">
          <p className="text-sm font-black uppercase text-red-600">Buyer & Partner Confidence</p>
          <h2 className="mt-2 text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">
            Clear paths for shoppers, buyers, and custom partners.
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {confidencePaths.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.title} className="group flex min-h-full flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03] transition hover:-translate-y-0.5 hover:border-red-100 hover:shadow-lg hover:shadow-slate-950/[0.06] sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase text-red-600">{item.eyebrow}</p>
                    <h3 className="mt-2 text-xl font-black text-slate-950">{item.title}</h3>
                  </div>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-red-100 bg-red-50 text-red-600">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
                <ul className="mt-5 grid gap-2 text-sm font-semibold text-slate-700">
                  {item.points.map((point) => (
                    <li key={point} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-600" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={item.href}
                  prefetch={false}
                  className="mt-6 inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-black text-slate-950 transition group-hover:border-red-600 group-hover:bg-red-600 group-hover:text-white"
                >
                  {item.linkLabel}
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
