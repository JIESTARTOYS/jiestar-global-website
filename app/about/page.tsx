import Link from "next/link";
import Image from "next/image";
import type { ComponentType, SVGProps } from "react";
import {
  ArrowRightIcon,
  FactoryIcon,
  GlobeIcon,
  PackageIcon,
  ShieldIcon,
  SparkIcon,
  StoreIcon,
  TruckIcon,
} from "@/components/ui/Icons";
import { SubBrandCarousel } from "@/components/sections/SubBrandCarousel";
import { ShowroomHighlights } from "@/components/sections/ShowroomHighlights";
import { HeroBannerButton } from "@/components/ui/HeroBannerButton";
import { createMetadata } from "@/lib/seo";
import { subBrands } from "@/lib/sub-brands";

export const metadata = createMetadata({
  title: "About JIESTAR",
  description:
    "Learn how JIESTAR connects integrated building block factory capability, one-stop custom service, B2B cooperation, and DTC product experiences.",
  path: "/about",
});

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type Capability = {
  title: string;
  description: string;
  icon: IconComponent;
};

type FactoryVisual = {
  label: string;
  note: string;
  image: string;
  alt: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  sizes?: string;
};

const factorySignals: Array<{ label: string; icon: IconComponent }> = [
  { label: "Founded in 1998", icon: StoreIcon },
  { label: "Injection Molding", icon: FactoryIcon },
  { label: "QC & Weighing Record", icon: ShieldIcon },
  { label: "Warehouse Supply", icon: TruckIcon },
  { label: "OEM / ODM Support", icon: GlobeIcon },
];

const factoryCapabilities: Capability[] = [
  {
    title: "Factory overview",
    description:
      "A real factory base connects JIESTAR product development, production areas, quality review, packaging, and warehouse operations.",
    icon: FactoryIcon,
  },
  {
    title: "Product development",
    description:
      "Product direction, model structure, build experience, display value, and market fit can be discussed before production planning.",
    icon: SparkIcon,
  },
  {
    title: "Production coordination",
    description:
      "Existing product supply, OEM / ODM customization, sample follow-up, and product line cooperation are handled through direct project communication.",
    icon: PackageIcon,
  },
  {
    title: "Packaging and market readiness",
    description:
      "Packaging direction, SKU details, logo presentation, retail display needs, and channel materials can be prepared around the partner's market.",
    icon: StoreIcon,
  },
  {
    title: "Quality review support",
    description:
      "Part checks, random inspection, trial assembly, and project review help partners align expectations before larger order decisions.",
    icon: ShieldIcon,
  },
  {
    title: "Global cooperation",
    description:
      "JIESTAR supports wholesale buyers, distributors, custom project partners, sub-brand cooperation, and direct product customers.",
    icon: GlobeIcon,
  },
];

const customServiceSteps = [
  ["01", "Project brief", "Clarify product category, target market, sales channel, price band, and cooperation type."],
  ["02", "Structure and sample review", "Discuss model structure, build experience, sample needs, and production-ready details."],
  ["03", "Part and function checks", "Review parts, fit, appearance, and functional details against the confirmed product direction."],
  ["04", "Packaging and brand plan", "Align box direction, SKU details, logo placement, product naming, and retail-facing materials."],
  ["05", "Production coordination", "Plan quantity direction, lead time, order rhythm, and project communication for the partner's market."],
  ["06", "Launch and replenishment", "Support wholesale supply, custom launches, replenishment planning, and long-term cooperation."],
];

const audiencePaths = [
  {
    title: "For B2B partners",
    eyebrow: "Wholesale / OEM / ODM / Sub-brand",
    description:
      "Use JIESTAR when your business needs factory-direct building block supply, custom product development, exclusive SKUs, packaging customization, or long-term product line cooperation.",
    href: "/custom-solutions",
    linkLabel: "Start a custom project",
    bullets: [
      "Wholesale supply and catalog discussion",
      "OEM / ODM customization and product co-development",
      "Exclusive product line and sub-brand partnership",
    ],
  },
  {
    title: "For DTC customers",
    eyebrow: "Collectors / builders / direct shoppers",
    description:
      "Explore JIESTAR building block sets through the global storefront, review product details, and use secure Shopify checkout for direct purchases.",
    href: "/products",
    linkLabel: "Explore products",
    bullets: [
      "Building block sets and display models",
      "Product detail pages with specifications",
      "Missing piece support and direct shopping flow",
    ],
  },
];

const tourShots: FactoryVisual[] = [
  {
    label: "Injection molding workshop",
    note: "Organized injection molding equipment and floor lanes show the production base behind JIESTAR building block parts.",
    image: "/images/site-visuals/factory/factory-injection-workshop.webp",
    alt: "Injection molding machines arranged in a clean JIESTAR factory workshop",
    className: "lg:col-span-2 lg:row-span-2",
    sizes: "(min-width: 1024px) 50vw, (min-width: 768px) 50vw, 100vw",
  },
  {
    label: "Automated sorting line",
    note: "Sorting equipment helps coordinate part handling before manual review, packing, and project handoff.",
    image: "/images/site-visuals/factory/factory-sorting-line.webp",
    alt: "Automated building block part sorting line inside the JIESTAR factory",
  },
  {
    label: "Random inspection station",
    note: "Sample bags, weighing, and inspection records give buyers a clear view of practical QC work.",
    image: "/images/site-visuals/factory/qc-random-inspection.webp",
    alt: "Random inspection station with building block parts, record sheet, and weighing scale",
  },
  {
    label: "Prototype build validation",
    note: "Trial assembly checks structure stability, parts compatibility, building sequence, and appearance details.",
    image: "/images/site-visuals/factory/prototype-build-validation.webp",
    alt: "Prototype workbench with building block parts and instruction pages for structure validation",
  },
  {
    label: "Manual sorting review",
    note: "Manual review after sorting supports quantity checks, appearance checks, parts matching, and defect marking.",
    image: "/images/site-visuals/factory/manual-sorting-review.webp",
    alt: "Manual sorting review table with packed building block parts and inspection checklist",
  },
  {
    label: "Packaging materials storage",
    note: "Organized packaging materials support box preparation, SKU handling, and market-ready product handoff.",
    image: "/images/site-visuals/factory/packaging-materials-storage.webp",
    alt: "Packaging materials stored on organized warehouse racks in the JIESTAR factory",
  },
  {
    label: "Warehouse ready stock",
    note: "Labeled cartons and clear aisles help support wholesale supply, replenishment, and shipment preparation.",
    image: "/images/site-visuals/factory/warehouse-ready-stock.webp",
    alt: "Labeled cartons arranged in a clean JIESTAR warehouse aisle",
  },
  {
    label: "Factory gate sign",
    note: "The factory entrance connects the public JIESTAR brand with its operating company and onsite production base.",
    image: "/images/site-visuals/factory/factory-gate-sign.webp",
    alt: "JIESTAR factory gate sign for Jie Xing Toys Industrial Co., Ltd",
  },
];

function FactoryVisualCard({ label, note, image, alt, priority = false, className = "", imageClassName = "", sizes = "(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw" }: FactoryVisual) {
  return (
    <div
      className={`group relative flex min-h-56 min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 p-5 shadow-sm shadow-slate-950/[0.04] transition hover:border-red-200 ${className}`}
    >
      <Image
        src={image}
        alt={alt}
        fill
        preload={priority}
        loading={priority ? "eager" : undefined}
        unoptimized
        sizes={sizes}
        className={`object-cover opacity-95 transition duration-500 group-hover:scale-[1.03] ${imageClassName}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-slate-950/5" />
      <div className="relative mt-auto text-white">
        <h3 className="mt-2 text-xl font-bold tracking-normal">{label}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-200">{note}</p>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="overflow-x-hidden bg-white text-slate-950">
      <section className="overflow-hidden border-b border-slate-200 bg-white px-5 py-12 sm:py-16 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[0.74fr_1.26fr] lg:items-center">
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-normal text-red-600">About JIESTAR</p>
            <h1 className="mt-4 max-w-2xl break-words text-[34px] font-bold leading-[1.12] tracking-normal text-slate-950 sm:text-5xl lg:text-[60px] lg:leading-[1.04]">
              Inside JIESTAR&apos;s Building Block Manufacturing Base
            </h1>
            <div className="mt-8 lg:hidden">
              <FactoryVisualCard
                label="Injection Workshop"
                note="Organized molding lines show the production base behind JIESTAR building block parts."
                image="/images/site-visuals/factory/factory-injection-workshop.webp"
                alt="Injection molding machines arranged in a clean JIESTAR factory workshop"
                priority
                sizes="100vw"
                className="min-h-[260px]"
                imageClassName="object-[center_54%]"
              />
            </div>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              Since 1998, JIESTAR has supported global building block partners with product development, injection molding, quality inspection, warehouse supply, wholesale cooperation, and OEM / ODM projects.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 sm:w-auto"
              >
                Explore Products
              </Link>
              <Link
                href="/custom-solutions"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-bold text-slate-950 transition hover:border-slate-950 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 sm:w-auto"
              >
                Custom Solutions
                <ArrowRightIcon className="ml-2 size-4" />
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-5">
              {factorySignals.map((signal, index) => (
                <div
                  key={signal.label}
                  className={`min-w-0 bg-white px-3 py-4 text-center ${index === factorySignals.length - 1 ? "col-span-2 sm:col-span-1" : ""}`}
                >
                  <div className="mx-auto flex size-10 items-center justify-center text-red-600">
                    <signal.icon className="size-6" />
                  </div>
                  <p className="mt-3 break-words text-xs font-bold leading-5 text-slate-950">{signal.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden min-w-0 gap-4 lg:grid lg:grid-cols-[1.08fr_0.92fr]">
            <FactoryVisualCard
              label="Injection Workshop"
              note="Organized molding lines support stable building block part production."
              image="/images/site-visuals/factory/factory-injection-workshop.webp"
              alt="Injection molding machines arranged in a clean JIESTAR factory workshop"
              priority
              sizes="(min-width: 1024px) 38vw, 100vw"
              className="min-h-[360px] sm:min-h-[520px] lg:row-span-2 lg:min-h-[620px]"
              imageClassName="object-[center_54%]"
            />
            <FactoryVisualCard
              label="QC & Weighing Record"
              note="Parts are checked and weighed with recorded inspection steps."
              image="/images/site-visuals/factory/qc-random-inspection.webp"
              alt="Quality inspection table with building block parts, weighing scale, and inspection records"
              priority
              sizes="(min-width: 1024px) 30vw, 100vw"
              className="min-h-[240px] sm:min-h-[300px]"
              imageClassName="object-[center_48%]"
            />
            <FactoryVisualCard
              label="Warehouse Storage"
              note="Cartons are sorted by SKU and area for efficient supply handling."
              image="/images/site-visuals/factory/warehouse-ready-stock.webp"
              alt="Labeled JIESTAR cartons arranged in an organized warehouse aisle"
              priority
              sizes="(min-width: 1024px) 30vw, 100vw"
              className="min-h-[240px] sm:min-h-[300px]"
              imageClassName="object-[center_52%]"
            />
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-normal text-red-600">Factory capability</p>
              <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
                An integrated factory system for products, partners, and long-term lines
              </h2>
            </div>
            <p className="text-sm leading-7 text-slate-600 sm:text-base">
              From product development to production coordination, packaging review, quality checks, and global cooperation, JIESTAR gives partners a clearer path from idea to supply.
            </p>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
            {factoryCapabilities.map((item) => (
              <article key={item.title} className="bg-white p-6">
                <div className="flex size-11 items-center justify-center rounded-md bg-slate-950 text-white">
                  <item.icon className="size-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold tracking-normal text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <p className="text-sm font-bold uppercase tracking-normal text-red-600">One-stop custom service</p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
              From product idea to market-ready building block line
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              JIESTAR can support partners beyond basic wholesale. Custom product development, packaging and brand customization, exclusive SKUs, exclusive product lines, and sub-brand cooperation can be planned as one connected project.
            </p>
            <div className="mt-6 border-t border-slate-200 pt-5">
              <p className="text-sm font-bold text-slate-950">Project scope confirmed with partners</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Product type, destination market, order details, and documentation needs are aligned during project review.
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {customServiceSteps.map(([number, title, description]) => (
              <article key={number} className="grid gap-4 border-b border-slate-200 py-5 sm:grid-cols-[5rem_1fr]">
                <p className="text-2xl font-black tracking-normal text-red-600">{number}</p>
                <div>
                  <h3 className="text-xl font-bold tracking-normal text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-5 py-16 text-white lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-normal text-red-300">B2B and DTC</p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-white sm:text-4xl">
              One factory-backed brand serving business partners and direct customers
            </h2>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {audiencePaths.map((path) => (
              <article key={path.title} className="rounded-lg border border-white/10 bg-white/[0.06] p-6">
                <p className="text-xs font-bold uppercase tracking-normal text-red-300">{path.eyebrow}</p>
                <h3 className="mt-3 text-2xl font-bold tracking-normal text-white">{path.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{path.description}</p>
                <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-200">
                  {path.bullets.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-red-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={path.href}
                  className="mt-6 inline-flex min-h-11 items-center rounded-md bg-white px-4 text-sm font-bold text-slate-950 transition hover:bg-red-600 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
                >
                  {path.linkLabel}
                  <ArrowRightIcon className="ml-2 size-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ShowroomHighlights />

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-normal text-red-600">Production workflow</p>
              <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
                Inside the production workflow
              </h2>
            </div>
            <p className="text-sm leading-7 text-slate-600 sm:text-base">
              Production, sorting, inspection, trial assembly, packaging, and warehouse handling work together before product handoff.
            </p>
          </div>

          <div className="mt-10 grid auto-rows-[minmax(14rem,auto)] gap-4 md:grid-cols-2 lg:grid-cols-4">
            {tourShots.map((shot) => (
              <FactoryVisualCard key={shot.label} {...shot} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-normal text-red-600">Brand portfolio</p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
              JIESTAR flagship and differentiated brand directions
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              Explore the JIESTAR main brand alongside focused sub-brands built for different product categories, market positions, and partner cooperation paths.
            </p>
          </div>
          <div className="mt-8">
            <SubBrandCarousel brands={subBrands} />
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-lg bg-slate-950 text-white">
          <div className="grid gap-8 px-5 py-10 sm:px-8 lg:px-10 lg:py-12 xl:grid-cols-[1fr_auto] xl:items-center">
            <div className="max-w-3xl">
              <div className="mb-5 flex size-11 items-center justify-center rounded-md bg-white text-slate-950">
                <StoreIcon className="size-5" />
              </div>
              <p className="text-sm font-bold uppercase tracking-normal text-red-300">Next step</p>
              <h2 className="mt-3 text-3xl font-bold tracking-normal text-white sm:text-4xl">
                Explore products, wholesale supply, or a custom building block project
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                Choose the JIESTAR path that fits your goal: product browsing, wholesale supply, OEM / ODM customization, sub-brand cooperation, or general contact.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 xl:justify-items-end">
              <HeroBannerButton href="/products" className="whitespace-nowrap sm:min-w-44">Products</HeroBannerButton>
              <HeroBannerButton href="/wholesale" variant="secondary" className="whitespace-nowrap sm:min-w-44">Wholesale</HeroBannerButton>
              <HeroBannerButton href="/custom-solutions" variant="secondary" className="whitespace-nowrap sm:min-w-44">Custom Solutions</HeroBannerButton>
              <HeroBannerButton href="/contact" variant="secondary" className="whitespace-nowrap sm:min-w-44">Contact</HeroBannerButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
