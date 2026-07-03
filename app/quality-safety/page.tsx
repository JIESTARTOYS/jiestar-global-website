import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Blocks, Headphones, PackageCheck, SearchCheck, SwatchBook, type LucideIcon } from "lucide-react";
import { ArrowRightIcon, FactoryIcon, PackageIcon, ShieldIcon, SparkIcon, TruckIcon } from "@/components/ui/Icons";
import { HeroBannerButton } from "@/components/ui/HeroBannerButton";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Quality & Safety | JIESTAR Building Block Sets",
  description:
    "Learn how JIESTAR approaches material safety, quality control, product inspection, stable clutch power, compliance preparation, and missing piece support.",
  path: "/quality-safety",
});

const heroStats = [
  ["Materials", "ABS focus"],
  ["Fit", "Stable clutch"],
  ["Checks", "Multi-step review"],
];

const trustStrip = [
  {
    label: "Materials",
    value: "ABS-focused review",
    icon: SwatchBook,
  },
  {
    label: "Build experience",
    value: "Stable clutch fit",
    icon: Blocks,
  },
  {
    label: "Inspection",
    value: "Six-stage workflow",
    icon: SearchCheck,
  },
  {
    label: "Service",
    value: "Replacement support",
    icon: Headphones,
  },
];

type ProcessStep = {
  number: string;
  title: string;
  text: string;
  icon: LucideIcon;
  highlight?: boolean;
};

const processSteps: ProcessStep[] = [
  {
    number: "01",
    title: "Material review",
    text: "Review material suitability, appearance, and production requirements before product release.",
    icon: SwatchBook,
    highlight: true,
  },
  {
    number: "02",
    title: "Part inspection",
    text: "Check molded parts for color consistency, visible defects, fit, and category-specific details.",
    icon: SearchCheck,
  },
  {
    number: "03",
    title: "Clutch power / build test",
    text: "Review the building experience so models feel stable, satisfying, and suitable for the intended audience.",
    icon: Blocks,
  },
  {
    number: "04",
    title: "Finished model check",
    text: "Confirm the completed model, key functions, display proportions, and instruction clarity.",
    icon: BadgeCheck,
  },
  {
    number: "05",
    title: "Packaging and order check",
    text: "Review packaging, SKU details, quantity, and shipping readiness before handoff.",
    icon: PackageCheck,
  },
  {
    number: "06",
    title: "After-sales support",
    text: "Support missing piece requests, product questions, and partner communication after delivery.",
    icon: Headphones,
    highlight: true,
  },
];

const dtcTrust = [
  {
    title: "Safe building experience",
    text: "Product information, material expectations, and age guidance stay clear for retail customers and collectors.",
    icon: ShieldIcon,
  },
  {
    title: "Stable clutch power",
    text: "Fit consistency matters for display models, repeated building, and more complex collector sets.",
    icon: PackageIcon,
  },
  {
    title: "Missing piece support",
    text: "Customers can request help for missing parts, product questions, and order-related service needs.",
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
    text: "Support long-term planning with repeatable quality expectations across future SKUs.",
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
    text: "Documentation is reviewed by product type and order details.",
    icon: PackageIcon,
  },
  {
    title: "Support path",
    text: "Contact sales for business documentation questions.",
    icon: SparkIcon,
  },
];

const certificatePreviews = [
  {
    title: "EU / UK declarations",
    label: "Declaration preview",
    src: "/images/site-visuals/certificates/eu-declaration-preview.jpg",
    alt: "Reduced-resolution preview of a declaration document for building block safety documentation",
  },
  {
    title: "CPC documentation",
    label: "US market file",
    src: "/images/site-visuals/certificates/cpc-preview.jpg",
    alt: "Reduced-resolution preview of a Children's Product Certificate document",
  },
  {
    title: "EN71-related report",
    label: "Test report preview",
    src: "/images/site-visuals/certificates/en71-report-preview.jpg",
    alt: "Reduced-resolution preview of an EN71-related test report cover page",
  },
];

const certificatePreviewClasses = [
  "lg:absolute lg:left-6 lg:top-7 lg:z-10 lg:w-[46%] lg:-rotate-3",
  "lg:absolute lg:right-6 lg:top-16 lg:z-20 lg:w-[38%] lg:rotate-3",
  "lg:absolute lg:bottom-7 lg:left-[30%] lg:z-30 lg:w-[42%] lg:rotate-2",
];

const documentationTypes = [
  "EU / UK declarations",
  "EN71-related reports",
  "ASTM-related review",
  "CPSIA / CPC documentation",
  "Restricted-substance review",
  "Age-grade and market files",
];

const snakeOrderClasses: Record<string, string> = {
  "01": "sm:order-1",
  "02": "sm:order-2",
  "03": "sm:order-4",
  "04": "sm:order-3",
  "05": "sm:order-5",
  "06": "sm:order-6",
};

export default function QualitySafetyPage() {
  return (
    <div className="bg-[#f6f7f9] text-slate-950">
      <section className="relative overflow-hidden bg-slate-950 px-5 py-16 text-white sm:py-20 lg:px-8">
        <div className="absolute inset-0 opacity-35">
          <Image
            src="/images/site-visuals/factory/manual-sorting-review.webp"
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/75" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div>
            <nav className="mb-8 flex items-center gap-2 text-sm text-slate-400" aria-label="Breadcrumb">
              <Link href="/" className="font-semibold transition hover:text-white">
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <span className="font-semibold text-white">Quality & Safety</span>
            </nav>

            <p className="text-sm font-semibold uppercase tracking-normal text-red-300">Quality & Safety</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-normal text-white sm:text-5xl lg:text-[56px]">
              Quality You Can Build On
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              Reliable materials, stable fit, practical inspection, and responsive support for builders and global partners.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <HeroBannerButton href="/products">View Products</HeroBannerButton>
              <HeroBannerButton href="/contact" variant="secondary">Contact Sales</HeroBannerButton>
              <HeroBannerButton href="/support/replacement-parts" variant="secondary">
                Replacement Parts
                <ArrowRightIcon className="ml-2 size-4" />
              </HeroBannerButton>
            </div>
          </div>

          <aside className="rounded-lg border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <div className="flex size-11 items-center justify-center rounded-md bg-white text-slate-950">
                <ShieldIcon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Quality summary</p>
                <p className="text-sm text-slate-400">For products, partners, and support</p>
              </div>
            </div>
            <dl className="grid gap-4 pt-5">
              {heroStats.map(([label, value]) => (
                <div key={label} className="grid gap-1">
                  <dt className="text-xs font-semibold uppercase tracking-normal text-slate-400">{label}</dt>
                  <dd className="text-sm font-semibold leading-6 text-white">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 border-t border-white/10 pt-5 text-xs leading-5 text-slate-400">
              Formal documentation is confirmed by product, order, and destination market.
            </p>
          </aside>
        </div>
      </section>

      <section className="bg-[#F6F8FC] px-4 pb-8 sm:px-5 lg:px-8">
        <div className="relative z-10 mx-auto -mt-7 grid max-w-7xl gap-0 overflow-hidden rounded-2xl border border-[#DFE6F0] bg-white shadow-xl shadow-slate-950/[0.06] sm:grid-cols-2 lg:grid-cols-4">
          {trustStrip.map(({ label, value, icon: Icon }) => (
            <article key={label} className="flex items-center gap-4 border-b border-[#DFE6F0] p-5 last:border-b-0 sm:[&:nth-child(3)]:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#E3192D] ring-1 ring-red-100">
                <Icon className="size-5" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-normal text-[#536581]">{label}</p>
                <p className="mt-1 text-sm font-black leading-5 text-[#0B1635]">{value}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[radial-gradient(circle_at_18%_0%,#eef6ff_0%,#f8fbff_46%,#F6F8FC_100%)] px-4 py-12 sm:px-5 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-[#E3192D]">Quality workflow</p>
            <h2 className="text-3xl font-black leading-tight tracking-[-0.01em] text-slate-950 sm:text-4xl">
              From material review to after-sales support
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600">
              The workflow reduces product risk before launch and improves support clarity after purchase or shipment.
            </p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-stretch">
            <div className="relative min-h-[360px] overflow-hidden rounded-[20px] border border-slate-200/80 bg-slate-100 shadow-lg shadow-slate-950/[0.07] sm:min-h-[480px] lg:min-h-full">
              <Image
                src="/images/site-visuals/factory/manual-sorting-review.webp"
                alt="Manual sorting review station with packed building block parts and an inspection checklist"
                fill
                unoptimized
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/62 via-slate-950/10 to-transparent" />
              <div className="absolute left-5 top-5 grid gap-3">
                <div className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-black text-white shadow-md shadow-red-950/20">
                  <ShieldIcon className="size-5" />
                  QUALITY CONTROL
                </div>
                <div className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black text-white shadow-md shadow-slate-950/20">
                  <Blocks className="size-5" strokeWidth={1.8} />
                  6-STAGE WORKFLOW
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
                <p className="max-w-sm text-lg font-black leading-6">Inspection starts before production and continues through service.</p>
              </div>
            </div>

            <div className="relative">
              <svg
                className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full lg:block"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M45 16 H55 V50 H45 V84 H55" fill="none" stroke="#D8E1EC" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
                {[
                  [45, 16],
                  [55, 16],
                  [55, 50],
                  [45, 50],
                  [45, 84],
                  [55, 84],
                ].map(([cx, cy]) => (
                  <g key={`${cx}-${cy}`}>
                    <circle cx={cx} cy={cy} r="1.65" fill="#FEE2E2" stroke="#F8FAFC" strokeWidth="0.7" />
                    <circle cx={cx} cy={cy} r="0.85" fill="#E3192D" />
                  </g>
                ))}
              </svg>

              <div className="relative z-10 grid gap-4 sm:grid-cols-2 sm:gap-x-16 sm:gap-y-6">
                {processSteps.map(({ number, title, text, icon: Icon, highlight }, index) => (
                  <div key={number} className={["relative grid grid-cols-[1.25rem_1fr] gap-4 sm:block", snakeOrderClasses[number]].join(" ")}>
                    <div className="relative flex justify-center sm:hidden" aria-hidden="true">
                      {index < processSteps.length - 1 ? <span className="absolute bottom-[-1rem] top-5 w-px bg-slate-300" /> : null}
                      <span className="relative mt-6 size-3 rounded-full border-2 border-white bg-red-600 shadow-sm shadow-red-900/20" />
                    </div>
                    <article
                      className={[
                        "group min-h-[188px] rounded-[20px] border p-5 shadow-sm transition duration-200 ease-out motion-reduce:transition-none motion-reduce:hover:translate-y-0 hover:-translate-y-1 hover:border-red-200 hover:shadow-xl hover:shadow-slate-950/[0.08]",
                        highlight
                          ? "border-red-100 bg-gradient-to-br from-red-50/90 via-white/92 to-white"
                          : "border-[#DFE6F0] bg-white/90 backdrop-blur-sm",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-4">
                        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100 transition group-hover:bg-red-100">
                          <Icon className="size-6" strokeWidth={1.8} />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                            <p className="text-3xl font-black leading-none text-red-600">{number}</p>
                            <h3 className="text-base font-black leading-6 text-slate-950">{title}</h3>
                          </div>
                          <p className="mt-4 text-sm leading-6 text-slate-600">{text}</p>
                        </div>
                      </div>
                    </article>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-12 sm:px-5 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#E3192D]">Two support paths</p>
              <h2 className="mt-3 max-w-xl text-3xl font-black leading-tight tracking-[-0.01em] text-[#0B1635] sm:text-4xl">
                Built for builders. Structured for partners.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[#536581] lg:justify-self-end">
              Retail customers need a clear support path. Business customers need quality alignment before production, transparent order checks, and reliable communication after delivery.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="rounded-[28px] border border-[#DFE6F0] bg-[#F8FAFD] p-5 shadow-sm shadow-slate-950/[0.03] sm:p-6 lg:p-8">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#E3192D]">For builders & collectors</p>
              <h3 className="mt-4 text-2xl font-black tracking-[-0.01em] text-[#0B1635]">DTC trust and service support</h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#536581]">
                Retail customers need clear product information, reliable parts, and a simple support path when something is missing or unclear.
              </p>

              <div className="mt-6 grid gap-3">
                {dtcTrust.map((item) => {
                  const Icon = item.icon;

                  return (
                    <article key={item.title} className="grid gap-3 rounded-2xl border border-[#DFE6F0] bg-white p-4 transition duration-200 hover:-translate-y-1 hover:border-red-200 hover:shadow-lg hover:shadow-slate-950/[0.05] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:grid-cols-[auto_1fr]">
                      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-red-50 text-[#E3192D] ring-1 ring-red-100">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h4 className="text-sm font-black text-[#0B1635]">{item.title}</h4>
                        <p className="mt-1 text-xs leading-5 text-[#536581]">{item.text}</p>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {supportLinks.map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    className="inline-flex min-h-10 items-center rounded-lg border border-[#DFE6F0] bg-white px-4 text-xs font-black text-[#E3192D] transition duration-200 hover:border-red-200 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:translate-y-px"
                  >
                    {label}
                    <ArrowRightIcon className="ml-2 size-3.5" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-[#18264A] bg-[#0B1635] p-5 text-white shadow-xl shadow-slate-950/15 sm:p-6 lg:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-red-300">For business partners</p>
                  <h3 className="mt-4 text-2xl font-black tracking-[-0.01em] text-white">B2B quality communication</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                    Wholesale, OEM / ODM, and sub-brand cooperation require quality alignment before production and clear communication after delivery.
                  </p>
                </div>
                <span className="inline-flex w-fit rounded-full border border-red-300/20 bg-red-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-normal text-red-200">
                  B2B Priority
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {b2bTrust.map((item, index) => (
                  <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 transition duration-200 hover:-translate-y-1 hover:border-red-300/40 hover:bg-white/[0.1] hover:shadow-lg hover:shadow-black/15 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-xs font-black text-red-200 ring-1 ring-red-300/15">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h4 className="text-sm font-black leading-5 text-white">{item.title}</h4>
                        <p className="mt-1 text-xs leading-5 text-slate-300">{item.text}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/wholesale"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-5 text-sm font-black text-[#0B1635] transition duration-200 hover:bg-[#E3192D] hover:text-white focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 focus:ring-offset-[#0B1635] active:translate-y-px"
                >
                  Explore Wholesale
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/custom-solutions"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/20 bg-white/5 px-5 text-sm font-black text-white transition duration-200 hover:border-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 focus:ring-offset-[#0B1635] active:translate-y-px"
                >
                  Custom Solutions
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F6F8FC] px-4 py-12 sm:px-5 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] border border-[#18264A] bg-[#0B1635] p-5 text-white shadow-xl shadow-slate-950/15 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="relative min-h-[500px] rounded-[24px] border border-white/10 bg-white/[0.06] p-4 shadow-inner shadow-white/5 sm:min-h-[360px] sm:p-5 lg:min-h-[520px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(227,25,45,0.18),transparent_34%),radial-gradient(circle_at_86%_80%,rgba(255,255,255,0.1),transparent_30%)]" />
              <div className="relative grid gap-4 sm:grid-cols-3 lg:absolute lg:inset-0 lg:block">
                {certificatePreviews.map((item, index) => (
                  <article
                    key={item.title}
                    className={[
                      "overflow-hidden rounded-2xl border border-white/15 bg-white shadow-2xl shadow-black/25 transition duration-200 hover:-translate-y-1 hover:border-red-200 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                      certificatePreviewClasses[index],
                    ].join(" ")}
                  >
                    <div className="relative aspect-[0.72] bg-white">
                      <Image
                        src={item.src}
                        alt={item.alt}
                        fill
                        sizes="(min-width: 1024px) 240px, (min-width: 640px) 30vw, 82vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0B1635]/88 via-[#0B1635]/58 to-transparent p-3">
                        <p className="text-[11px] font-black uppercase tracking-normal text-red-100">{item.label}</p>
                        <h3 className="mt-1 text-sm font-black leading-5 text-white">{item.title}</h3>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-red-300">International safety documentation</p>
              <h2 className="mt-3 max-w-xl text-3xl font-black leading-tight tracking-[-0.01em] text-white sm:text-4xl">
                Documentation without unverified claims
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
                Selected documentation can include EU / UK declarations, EN71-related reports, ASTM / CPSIA / CPC documentation, and restricted-substance review, depending on product scope and destination market.
              </p>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                JIESTAR discusses documentation per product, age grade, order scope, and market requirements before order approval or launch.
              </p>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                <p className="text-sm font-black text-white">Reduced-resolution public previews.</p>
                <p className="mt-1 text-xs leading-5 text-slate-300">
                  Final document availability is confirmed for the relevant product, age grade, market, and order scope.
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {documentationTypes.map((item, index) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                    <span className="inline-flex size-8 items-center justify-center rounded-lg bg-red-500/10 text-xs font-black text-red-200 ring-1 ring-red-300/15">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="mt-3 text-sm font-black leading-5 text-white">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-5 text-sm font-black text-[#0B1635] transition duration-200 hover:bg-[#E3192D] hover:text-white focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 focus:ring-offset-[#0B1635] active:translate-y-px"
                >
                  Contact Sales
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {complianceNotes.map(({ title, text, icon: Icon }, index) => (
              <article key={title} className="grid gap-4 rounded-2xl border border-[#DFE6F0] bg-white p-4 text-[#0B1635] shadow-sm shadow-black/5 transition duration-200 hover:-translate-y-1 hover:border-red-200 hover:shadow-lg hover:shadow-black/10 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:grid-cols-[auto_1fr_auto] sm:items-center lg:grid-cols-[auto_1fr]">
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-red-50 text-[#E3192D] ring-1 ring-red-100">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-[#0B1635]">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#536581]">{text}</p>
                </div>
                <span className="text-xs font-black text-slate-300 lg:hidden">{String(index + 1).padStart(2, "0")}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-12 sm:px-5 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-6 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#E3192D] to-[#B90F20] p-6 text-white shadow-xl shadow-red-950/15 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-red-100">Talk to the JIESTAR team</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight tracking-[-0.01em] text-white sm:text-4xl">
              Need quality documentation for a specific product or market?
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-red-50">
              Share the product category, destination market, order scope, and documentation needs. Our team can clarify the appropriate next steps.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-6 text-sm font-black text-[#E3192D] transition duration-200 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#E3192D] active:translate-y-px"
            >
              Contact Sales
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/wholesale"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/30 bg-white/5 px-6 text-sm font-black text-white transition duration-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#E3192D] active:translate-y-px"
            >
              View Wholesale
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
