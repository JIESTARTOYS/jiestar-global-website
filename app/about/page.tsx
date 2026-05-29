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
} from "@/components/ui/Icons";
import { SubBrandCarousel } from "@/components/sections/SubBrandCarousel";
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
  image?: string;
  priority?: boolean;
  className?: string;
};

const factorySignals = [
  ["Founded", "1998"],
  ["Factory role", "Integrated building block production partner"],
  ["Customer paths", "B2B cooperation and DTC shopping"],
];

const factoryCapabilities: Capability[] = [
  {
    title: "Factory overview",
    description:
      "A clear company layer for partners who need to understand JIESTAR as a serious building block supplier, not only an online storefront.",
    icon: FactoryIcon,
  },
  {
    title: "Product development",
    description:
      "Product direction, model structure, play value, display value, and market fit can be discussed before a product enters production planning.",
    icon: SparkIcon,
  },
  {
    title: "Production coordination",
    description:
      "Existing product supply, OEM / ODM customization, sample follow-up, and product line cooperation are handled through practical factory communication.",
    icon: PackageIcon,
  },
  {
    title: "Packaging and market readiness",
    description:
      "Packaging direction, logo presentation, retail display needs, and channel materials can be prepared around the partner's market.",
    icon: StoreIcon,
  },
  {
    title: "Quality review support",
    description:
      "Product checking, documentation preparation, and project review can be aligned before official materials or market files are shared.",
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
  ["01", "Concept direction", "Clarify category, target customer, price band, visual direction, and cooperation type."],
  ["02", "Structure and sample work", "Discuss model structure, building experience, sample needs, and production-ready details."],
  ["03", "Packaging and brand presentation", "Plan box direction, logo placement, product naming, and retail-facing materials."],
  ["04", "Production planning", "Align quantity direction, lead time, product line rhythm, and order communication."],
  ["05", "Quality review", "Check product details and prepare project documentation based on confirmed market needs."],
  ["06", "Delivery and launch support", "Support wholesale supply, custom launches, replenishment planning, and long-term cooperation."],
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
    label: "Factory exterior",
    note: "Onsite shoot target: main entrance, factory signage, and a wide exterior angle.",
    image: "/images/home/jiestar-home-hero-user-composite-wechat-v2-web.png",
    className: "lg:col-span-2 lg:row-span-2",
  },
  {
    label: "Showroom display",
    note: "Onsite shoot target: finished JIESTAR product displays and brand presentation.",
    image: "/images/categories/category-modular-buildings.png",
  },
  {
    label: "Design discussion",
    note: "Onsite shoot target: product planning, design review, or model development work.",
    image: "/images/categories/category-technic.png",
  },
  {
    label: "Sample room",
    note: "Onsite shoot target: prototypes, sample shelves, or product testing tables.",
    image: "/images/categories/category-brick-alliance.png",
  },
  {
    label: "Production line",
    note: "Onsite shoot target: clean production or assembly area without sensitive details.",
    image: "/images/categories/category-engineering.png",
  },
  {
    label: "Packaging area",
    note: "Onsite shoot target: box preparation, packed products, or packaging workflow.",
    image: "/images/categories/category-storage-box.png",
  },
  {
    label: "Warehouse",
    note: "Onsite shoot target: organized product storage, cartons, or shipping preparation.",
    image: "/images/categories/category-city.png",
  },
  {
    label: "QC checking table",
    note: "Onsite shoot target: product inspection, part checking, or documentation review.",
    image: "/images/categories/category-scene.png",
  },
];

function FactoryVisualCard({ label, note, image, priority = false, className = "" }: FactoryVisual) {
  return (
    <div
      className={`group relative flex min-h-56 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 p-5 shadow-sm shadow-slate-950/[0.04] transition hover:border-red-200 ${className}`}
    >
      {image ? (
        <Image
          src={image}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover opacity-75 transition duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#7f1d1d_100%)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/10" />
      <div className="relative mt-auto text-white">
        <p className="text-xs font-bold uppercase tracking-normal text-red-200">Factory image direction</p>
        <h3 className="mt-2 text-xl font-bold tracking-normal">{label}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-200">{note}</p>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="bg-white text-slate-950">
      <section className="overflow-hidden border-b border-slate-200 bg-white px-5 py-14 sm:py-18 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-normal text-red-600">About JIESTAR</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl lg:text-[64px] lg:leading-[1.02]">
              Large-scale building block factory behind the JIESTAR brand
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              Founded in 1998, JIESTAR connects integrated building block factory capability with one-stop custom service, wholesale cooperation, sub-brand partnerships, and direct-to-consumer product experiences.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              >
                Explore Products
              </Link>
              <Link
                href="/custom-solutions"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-bold text-slate-950 transition hover:border-slate-950 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              >
                Custom Solutions
                <ArrowRightIcon className="ml-2 size-4" />
              </Link>
            </div>
            <dl className="mt-10 grid gap-3 sm:grid-cols-3">
              {factorySignals.map(([label, value]) => (
                <div key={label} className="border-l-2 border-red-600 pl-4">
                  <dt className="text-xs font-bold uppercase tracking-normal text-slate-500">{label}</dt>
                  <dd className="mt-2 text-sm font-bold leading-6 text-slate-950">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_0.78fr]">
            <FactoryVisualCard
              label="Factory-backed brand hub"
              note="Use this hero area for the final factory exterior, showroom, or premium product display image when the onsite shoot is complete."
              image="/images/home/jiestar-home-hero-user-composite-wechat-v2-web.png"
              priority
              className="min-h-[360px] sm:min-h-[500px]"
            />
            <div className="grid gap-4">
              <FactoryVisualCard
                label="Showroom product wall"
                note="Use this slot for final product walls, finished models, or brand display areas."
                image="/images/categories/category-modular-buildings.png"
                priority
                className="min-h-56 sm:min-h-[240px]"
              />
              <div className="rounded-lg bg-slate-950 p-5 text-white">
                <div className="flex size-11 items-center justify-center rounded-md bg-white text-slate-950">
                  <FactoryIcon className="size-5" />
                </div>
                <p className="mt-5 text-sm font-bold uppercase tracking-normal text-red-300">Factory tour page</p>
                <p className="mt-2 text-2xl font-bold tracking-normal">Structured for real factory, showroom, production, packaging, and QC photography.</p>
              </div>
            </div>
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
              The About page should help international buyers understand how JIESTAR works behind the storefront: product development, production coordination, packaging discussion, quality review, and global cooperation are connected into one practical building block supply path.
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
              JIESTAR can support partners beyond basic wholesale: custom product development, packaging and brand customization, exclusive SKUs, exclusive product lines, and sub-brand cooperation can be planned as one connected project.
            </p>
            <div className="mt-6 rounded-lg border border-red-100 bg-red-50 p-5">
              <p className="text-sm font-bold text-slate-950">No unverified claims</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Certification, capacity, output, and award details should be added only after official JIESTAR materials are provided.
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

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-normal text-red-600">Factory image brief</p>
              <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
                Image directions for the real JIESTAR factory shoot
              </h2>
            </div>
            <p className="text-sm leading-7 text-slate-600 sm:text-base">
              These directions keep the onsite shoot tied to actual page needs. Replace the temporary local visuals with approved photos after the exterior, showroom, sample room, production, packaging, warehouse, and QC areas are photographed.
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
                Use the About page as the trust layer, then choose the path that matches your goal: direct shopping, wholesale catalog discussion, OEM / ODM customization, sub-brand cooperation, or general contact.
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
