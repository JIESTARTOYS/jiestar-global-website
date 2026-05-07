import Image from "next/image";
import Link from "next/link";
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
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { collections, products } from "@/lib/data";
import { createMetadata } from "@/lib/seo";
import { subBrands } from "@/lib/sub-brands";

export const metadata = createMetadata({
  title: "About JIESTAR",
  description:
    "Learn about JIESTAR, founded in 1998, and its building block product development, production, sales, and global cooperation capabilities.",
  path: "/about",
});

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const overviewStats = [
  ["Founded", "1998"],
  ["Business model", "DTC + B2B cooperation"],
  ["Core focus", "Building block product development"],
];

const timeline = [
  ["1998", "Company foundation", "Guangdong Jiexing Toys Industrial Co., Ltd. began building long-term toy product capability."],
  ["Product development", "Integrated capabilities", "JIESTAR expanded across product development, production, sales, and market support."],
  ["Global cooperation", "Partner programs", "The team continued working with wholesale buyers, custom projects, and product line cooperation."],
  ["Now", "International brand hub", "The global website connects DTC builders, collectors, retailers, distributors, and custom cooperation partners."],
];

const facilities: Array<{
  title: string;
  description: string;
  image: string;
  alt: string;
  icon: IconComponent;
}> = [
  {
    title: "Product Development",
    description: "Concept direction, model structure, building experience, and display value are considered before a product reaches the market.",
    image: "https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?auto=format&fit=crop&w=1100&q=80",
    alt: "Product development desk with technical drawings and prototype components",
    icon: SparkIcon,
  },
  {
    title: "Manufacturing Coordination",
    description: "Production planning supports existing product supply, OEM / ODM projects, and longer product line cooperation.",
    image: "https://images.unsplash.com/photo-1565608438257-fac3c27beb36?auto=format&fit=crop&w=1100&q=80",
    alt: "Modern manufacturing floor used as a temporary production placeholder",
    icon: FactoryIcon,
  },
  {
    title: "Packaging & Market Readiness",
    description: "Packaging direction, channel needs, and retail presentation can be discussed for wholesale and custom cooperation.",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1100&q=80",
    alt: "Prepared product packages in a warehouse environment",
    icon: PackageIcon,
  },
];

const teamRoles = [
  ["Design Team", "Develops product concepts, visual direction, and model details for building block sets."],
  ["Engineering Team", "Translates concepts into buildable structures, samples, and production-ready details."],
  ["Business Team", "Supports wholesale buyers, custom projects, product line planning, and global communication."],
];

const documentationItems = [
  ["Material and production documentation", "Prepared according to project and market discussion needs."],
  ["Quality review workflow", "Supports product checks before launch and partner communication."],
  ["Compliance file readiness", "Specific certificates and market documents can be reviewed when official materials are provided."],
];

const portfolioProducts = products.slice(0, 4);
const portfolioCollections = collections.slice(0, 4);

export default function AboutPage() {
  return (
    <div className="bg-slate-50 text-slate-950">
      <section className="relative overflow-hidden bg-slate-950 px-5 py-16 text-white sm:py-20 lg:px-8">
        <div className="absolute inset-0 opacity-35">
          <Image
            src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1800&q=80"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/70" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.76fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-red-300">About JIESTAR</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-normal sm:text-5xl lg:text-[56px]">
              Global Brand & Product Partner
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              Founded in 1998, JIESTAR connects product design, manufacturing coordination, wholesale supply, and custom cooperation for international building block markets.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <HeroBannerButton href="/products">View Products</HeroBannerButton>
              <HeroBannerButton href="/contact" variant="secondary">Contact Us</HeroBannerButton>
            </div>
          </div>

          <aside className="rounded-lg border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <div className="flex size-11 items-center justify-center rounded-md bg-white text-slate-950">
                <GlobeIcon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Brand profile</p>
                <p className="text-sm text-slate-400">International DTC and B2B building block hub</p>
              </div>
            </div>
            <dl className="grid gap-4 pt-5">
              {overviewStats.map(([label, value]) => (
                <div key={label} className="grid gap-1">
                  <dt className="text-xs font-semibold uppercase tracking-normal text-slate-400">{label}</dt>
                  <dd className="text-sm font-semibold leading-6 text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>

      <section className="bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div>
            <SectionHeader
              eyebrow="Company overview"
              title="An integrated building block company with brand and cooperation capability"
              description="JIESTAR supports direct-to-consumer customers, channel buyers, OEM / ODM customization, product co-development, exclusive product lines, and sub-brand partnerships."
            />
            <div className="mt-8 space-y-5 text-base leading-8 text-slate-600">
              <p>
                Guangdong Jiexing Toys Industrial Co., Ltd. was founded in 1998 and has developed into an integrated toy company combining product development, production, and sales.
              </p>
              <p>
                The JIESTAR global website is built to make the company easier to understand for international customers: collectors can explore building block sets, while business partners can evaluate wholesale supply and custom cooperation paths.
              </p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {overviewStats.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-[0.92fr_1.08fr]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-slate-100">
              <Image
                src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80"
                alt="Modern office and product development workspace"
                fill
                sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="grid gap-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
                <Image
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1100&q=80"
                  alt="Team planning session for international product work"
                  fill
                  sizes="(min-width: 1024px) 32vw, (min-width: 640px) 45vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="rounded-lg border border-red-100 bg-red-50 p-5">
                <p className="text-sm font-semibold text-red-700">Built for two audiences</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  The About page must reassure both DTC builders and B2B buyers that JIESTAR is a brand, a product partner, and a long-term cooperation gateway.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Milestones"
            title="A focused path from toy company to global cooperation hub"
            description="These milestones describe the direction of the company without making unverifiable claims about awards, certifications, or market ranking."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {timeline.map(([year, title, description]) => (
              <article key={`${year}-${title}`} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-bold text-red-600">{year}</p>
                <h2 className="mt-3 text-lg font-semibold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <SectionHeader
              eyebrow="Facilities & manufacturing"
              title="Product development and production capability behind the brand"
              description="Temporary images are used here until official JIESTAR factory, production line, and sample room assets are available."
            />
            <p className="text-sm leading-7 text-slate-600 lg:max-w-xl">
              This section is designed as a credibility layer for business buyers. It explains how product ideas, manufacturing planning, packaging direction, and quality review can support both existing product supply and custom building block solutions.
            </p>
          </div>
          <div className="scrollbar-none -mx-5 mt-8 flex gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0">
            {facilities.map((item) => (
              <article key={item.title} className="w-[78vw] max-w-[360px] shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm md:w-auto md:max-w-none md:shrink">
                <div className="relative aspect-[4/3] bg-slate-100">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    sizes="(min-width: 768px) 31vw, 78vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <div className="flex size-11 items-center justify-center rounded-md bg-slate-950 text-white">
                    <item.icon className="size-5" />
                  </div>
                  <h2 className="mt-5 text-lg font-semibold text-slate-950">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-slate-100">
              <Image
                src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80"
                alt="Team members collaborating in a modern office"
                fill
                sizes="(min-width: 1024px) 29vw, (min-width: 640px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="grid gap-4">
              {teamRoles.map(([title, description]) => (
                <article key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-base font-semibold text-slate-950">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
          <div>
            <SectionHeader
              eyebrow="Office & team"
              title="Cross-functional teams for design, engineering, and global cooperation"
              description="JIESTAR product work is shaped by design thinking, structural development, production planning, packaging discussion, and business communication."
            />
            <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">How the team supports partners</p>
              <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
                {["Translate market needs into product direction", "Support existing product and catalog discussions", "Prepare custom cooperation conversations for OEM / ODM and product co-development"].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-red-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeader
              eyebrow="Portfolio"
              title="Representative product directions"
              description="These preview products use the current project data model and will be replaced or expanded as real Shopify product data becomes available."
            />
            <LinkButton href="/products" variant="secondary" className="w-full sm:w-auto">View All Products</LinkButton>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {portfolioProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.handle}`}
                className="group overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              >
                <div className="relative aspect-square bg-slate-100">
                  <Image
                    src={product.image}
                    alt={product.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 23vw, (min-width: 640px) 45vw, 100vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-normal text-red-600">{product.category}</p>
                  <h2 className="mt-2 text-base font-semibold leading-6 text-slate-950">{product.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{product.sellingPoint}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-5 flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {portfolioCollections.map((collection) => (
              <Link
                key={collection.handle}
                href={`/collections/${collection.handle}`}
                className="inline-flex min-h-11 shrink-0 items-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              >
                {collection.title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <SectionHeader
            eyebrow="Quality documentation"
            title="Compliance-ready presentation without unverified certificate claims"
            description="This placeholder area is prepared for official certificates, test reports, market documents, and award materials after verified assets are provided."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {documentationItems.map(([title, description]) => (
              <article key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex size-11 items-center justify-center rounded-md bg-slate-950 text-white">
                  <ShieldIcon className="size-5" />
                </div>
                <h2 className="mt-5 text-base font-semibold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Sub-brand cooperation"
            title="Examples of differentiated brand directions"
            description="JIESTAR can discuss long-term cooperation where product planning, product development, packaging, and brand presentation are considered together."
          />
          <div className="mt-8">
            <SubBrandCarousel brands={subBrands} />
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-lg bg-slate-950 text-white shadow-2xl shadow-slate-950/15">
          <div className="grid gap-8 px-5 py-10 sm:px-8 lg:px-10 lg:py-12 xl:grid-cols-[1fr_auto] xl:items-center">
            <div className="max-w-3xl">
              <div className="mb-5 flex size-11 items-center justify-center rounded-md bg-white text-slate-950">
                <StoreIcon className="size-5" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-normal text-red-300">Next step</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal text-white sm:text-4xl">Explore products or start a business conversation</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                Browse building block sets for DTC inspiration, or contact JIESTAR for wholesale supply, OEM / ODM customization, product co-development, exclusive product lines, and sub-brand cooperation.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:flex-nowrap xl:justify-end">
              <HeroBannerButton href="/contact" className="whitespace-nowrap sm:min-w-36">Contact Us</HeroBannerButton>
              <HeroBannerButton href="/products" variant="secondary" className="whitespace-nowrap sm:min-w-40">View Products</HeroBannerButton>
              <HeroBannerButton href="/custom-solutions" variant="secondary" className="whitespace-nowrap sm:min-w-48">
                Custom Solutions
                <ArrowRightIcon className="ml-2 size-4" />
              </HeroBannerButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
