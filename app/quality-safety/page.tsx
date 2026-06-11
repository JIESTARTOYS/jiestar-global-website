import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, FactoryIcon, PackageIcon, ShieldIcon, SparkIcon, StoreIcon, TruckIcon } from "@/components/ui/Icons";
import { HeroBannerButton } from "@/components/ui/HeroBannerButton";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Quality & Safety",
  description:
    "Learn how JIESTAR approaches material safety, quality control, product inspection, stable clutch power, compliance preparation, and missing piece support.",
  path: "/quality-safety",
});

const heroStats = [
  ["Materials", "ABS focus"],
  ["Fit", "Stable clutch"],
  ["Checks", "Multi-step review"],
];

const processSteps = [
  ["01", "Material review", "Review material suitability, appearance, and production requirements before product release."],
  ["02", "Part inspection", "Check molded parts for color consistency, visible defects, fit, and category-specific details."],
  ["03", "Clutch power / build test", "Review the building experience so models feel stable, satisfying, and suitable for the intended audience."],
  ["04", "Finished model check", "Confirm the completed model, key functions, display proportions, and instruction clarity."],
  ["05", "Packaging and order check", "Review packaging, SKU details, quantity, and shipping readiness before handoff."],
  ["06", "After-sales support", "Support missing piece requests, product questions, and partner communication after delivery."],
];

const dtcTrust = [
  {
    title: "Safe building experience",
    text: "Product information, material expectations, and age guidance are presented clearly for retail customers and collectors.",
    icon: ShieldIcon,
  },
  {
    title: "Stable clutch power",
    text: "Fit consistency matters for both display models and repeated building, especially on complex collector sets.",
    icon: PackageIcon,
  },
  {
    title: "Missing piece support",
    text: "Customers can request support for missing parts, product questions, and order-related service needs.",
    icon: TruckIcon,
  },
];

const b2bTrust = [
  {
    title: "Pre-production sample discussion",
    text: "Align structure, materials, packaging direction, and launch requirements before larger orders.",
  },
  {
    title: "Product inspection communication",
    text: "Share quality focus points clearly during wholesale, OEM / ODM, or custom project discussions.",
  },
  {
    title: "Packaging review",
    text: "Review SKU details, package format, market language needs, and shipment readiness.",
  },
  {
    title: "Market compliance preparation",
    text: "Discuss documentation needs based on destination market, product type, and order scope.",
  },
  {
    title: "Product line consistency",
    text: "Support long-term product planning with repeatable quality expectations across future SKUs.",
  },
];

const supportLinks = [
  ["Replacement Parts", "/support/replacement-parts"],
  ["Shipping Policy", "/policies/shipping-policy"],
  ["Returns & Refunds", "/policies/refund-policy"],
];

const complianceNotes = [
  {
    title: "Market needs",
    text: "Discuss destination requirements before confirmation.",
    icon: FactoryIcon,
  },
  {
    title: "Product scope",
    text: "Documentation depends on product type and order details.",
    icon: PackageIcon,
  },
  {
    title: "Support path",
    text: "Contact sales for business documentation questions.",
    icon: SparkIcon,
  },
];

export default function QualitySafetyPage() {
  return (
    <div className="bg-[#f7f8fa]">
      <section className="relative overflow-hidden bg-slate-950 px-4 py-10 text-white sm:px-5 lg:px-8 lg:py-14">
        <Image
          src="/images/site-visuals/qc-inspection.png"
          alt="Representative quality workflow visual for building block product inspection"
          fill
          sizes="100vw"
          className="object-cover opacity-28"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/88 to-slate-950/45" />

        <div className="relative mx-auto grid max-w-7xl gap-7 lg:grid-cols-[1fr_0.72fr] lg:items-center">
          <div>
            <nav className="mb-6 flex items-center gap-2 text-sm text-slate-300" aria-label="Breadcrumb">
              <Link href="/" className="transition hover:text-white">Home</Link>
              <span aria-hidden="true">/</span>
              <span className="font-semibold text-white">Quality & Safety</span>
            </nav>
            <p className="text-sm font-black uppercase text-red-300">Quality & safety</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight tracking-normal text-white sm:text-5xl">
              Quality You Can Build On
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200">
              JIESTAR focuses on reliable materials, stable fit, practical inspection workflows, and responsive support for DTC builders and global business partners.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <HeroBannerButton href="/products">View Products</HeroBannerButton>
              <HeroBannerButton href="/contact" variant="secondary">Contact Sales</HeroBannerButton>
              <HeroBannerButton href="/support/replacement-parts" variant="secondary">
                Replacement Parts
              </HeroBannerButton>
            </div>
          </div>

          <div className="w-full max-w-xl justify-self-end rounded-lg border border-white/15 bg-white/10 p-4 shadow-xl shadow-slate-950/20 backdrop-blur-md lg:max-w-md">
            <p className="text-xs font-black uppercase text-red-200">Inspection focus</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {heroStats.map(([label, value]) => (
                <div key={label} className="rounded-md border border-white/10 bg-white/10 p-3">
                  <p className="text-[11px] font-semibold uppercase leading-4 text-slate-300">{label}</p>
                  <p className="mt-1 text-sm font-black leading-5 text-white sm:text-base">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 hidden text-xs leading-5 text-slate-300 sm:block">
              Visuals are representative of quality workflow themes. Formal documentation depends on specific product, order, and market requirements.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-5 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-red-600">Quality workflow</p>
              <h2 className="mt-2 text-3xl font-black leading-tight text-slate-950">From material review to after-sales support</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              The workflow is designed to reduce product risk before launch and improve support clarity after purchase or shipment.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {processSteps.map(([number, title, text]) => (
              <article key={number} className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03]">
                <Image
                  src="/images/site-visuals/qc-inspection.png"
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover opacity-[0.08]"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white via-white/95 to-white/82" />
                <span className="relative inline-flex h-9 min-w-9 items-center justify-center rounded-md bg-red-50 px-2 text-sm font-black text-red-600">
                  {number}
                </span>
                <h3 className="relative mt-4 text-lg font-black text-slate-950">{title}</h3>
                <p className="relative mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-5 lg:px-8 lg:pb-14">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03] sm:p-6">
            <p className="text-sm font-black uppercase text-red-600">For builders and collectors</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">DTC trust and service support</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Retail customers need clear product information, reliable parts, and a support path when something is missing or unclear.
            </p>
            <div className="mt-6 grid flex-1 gap-3">
              {dtcTrust.map((item) => {
                const Icon = item.icon;

                return (
                  <article key={item.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <Icon className="h-5 w-5 text-red-600" />
                    <h3 className="mt-3 text-sm font-black text-slate-950">{item.title}</h3>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{item.text}</p>
                  </article>
                );
              })}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {supportLinks.map(([label, href]) => (
                <Link key={href} href={href} className="inline-flex min-h-10 items-center rounded-md border border-slate-200 bg-white px-4 text-sm font-black text-slate-950 transition hover:border-red-200 hover:text-red-600">
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-sm shadow-slate-950/[0.06] sm:p-6">
            <p className="text-sm font-black uppercase text-red-300">For business partners</p>
            <h2 className="mt-2 text-2xl font-black text-white">B2B quality communication</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Wholesale, OEM / ODM, and sub-brand cooperation often require quality alignment before production and clear communication after delivery.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {b2bTrust.map((item) => (
                <div key={item.title} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/10 p-4">
                  <StoreIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
                  <div>
                    <h3 className="text-sm font-black leading-5 text-white">{item.title}</h3>
                    <p className="mt-2 text-xs leading-5 text-slate-300">{item.text}</p>
                  </div>
                </div>
              ))}
              <div className="rounded-lg border border-red-300/20 bg-red-500/10 p-4 sm:col-span-2">
                <p className="text-xs font-black uppercase text-red-200">Business documentation</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Compliance and inspection materials should be discussed per product, market, and order. JIESTAR avoids displaying unverified certification claims on this page.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <HeroBannerButton href="/wholesale">Wholesale</HeroBannerButton>
              <HeroBannerButton href="/custom-solutions" variant="secondary">
                Custom Solutions
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </HeroBannerButton>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-5 lg:px-8 lg:pb-16">
        <div className="mx-auto grid max-w-7xl gap-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03] sm:p-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase text-red-600">Compliance-ready approach</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Documentation without unverified claims</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Compliance documentation can be discussed for specific markets and orders. JIESTAR does not display certification marks or test report claims here unless they are confirmed for the relevant product and market.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {complianceNotes.map(({ title, text, icon: Icon }) => (
              <article key={title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <Icon className="h-5 w-5 text-red-600" />
                <h3 className="mt-3 text-sm font-black text-slate-950">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
