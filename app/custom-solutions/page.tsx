import type { ComponentType, SVGProps } from "react";
import Image from "next/image";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { SubBrandCarousel } from "@/components/sections/SubBrandCarousel";
import { ArrowRightIcon, FactoryIcon, GlobeIcon, PackageIcon, ShieldIcon, SparkIcon, StoreIcon } from "@/components/ui/Icons";
import { HeroBannerButton } from "@/components/ui/HeroBannerButton";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { createMetadata } from "@/lib/seo";
import { subBrands } from "@/lib/sub-brands";

export const metadata = createMetadata({
  title: "Custom Building Block Solutions",
  description:
    "Explore JIESTAR OEM / ODM customization, product co-development, exclusive SKUs, product line planning, and sub-brand partnership.",
  path: "/custom-solutions",
});

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const heroStats = [
  ["Cooperation scope", "OEM / ODM, co-development, sub-brand"],
  ["Project focus", "Custom products and exclusive product lines"],
  ["Best fit", "Partners planning long-term building block programs"],
];

const capabilities: Array<[string, string, IconComponent]> = [
  ["OEM / ODM Customization", "Adjust product direction, model details, packaging, logo, and market-facing presentation.", FactoryIcon],
  ["Product Co-Development", "Develop differentiated building block sets around a partner's market, audience, and launch goals.", SparkIcon],
  ["Packaging & Brand Customization", "Support packaging direction, brand logo placement, and retail-ready presentation planning.", PackageIcon],
  ["Exclusive SKU", "Create dedicated versions for channels, platforms, regional markets, or campaign needs.", StoreIcon],
  ["Exclusive Product Line", "Plan a focused product series with consistent category logic, visual identity, and launch rhythm.", GlobeIcon],
  ["Sub-Brand Partnership", "Support long-term cooperation where JIESTAR helps partners build distinct product brands.", ShieldIcon],
];

const process = [
  ["01", "Project brief", "Share cooperation type, target market, category direction, quantity range, and launch needs."],
  ["02", "Product direction", "Review product concept, customization depth, packaging direction, and business fit."],
  ["03", "Sample development", "Confirm scope, timeline, MOQ direction, sample requirements, and approval details."],
  ["04", "Launch planning", "Prepare product line, packaging, ordering, and market launch communication with the partner."],
];

const faqs = [
  [
    "How is Custom Solutions different from Wholesale?",
    "Wholesale focuses on existing JIESTAR product supply. Custom Solutions is for OEM / ODM, custom product development, exclusive product lines, and sub-brand cooperation.",
  ],
  [
    "Can JIESTAR support a long-term sub-brand partnership?",
    "Yes. JIESTAR can discuss long-term cooperation where product planning, product development, packaging, and brand presentation are considered together.",
  ],
  [
    "Do I need a complete product brief before contacting JIESTAR?",
    "No. A clear market, product category, customization need, and target quantity are enough to start the first conversation.",
  ],
  [
    "Can custom projects include packaging and logo customization?",
    "Yes. Packaging customization and brand logo customization can be discussed as part of the custom project scope.",
  ],
];

export default function CustomSolutionsPage() {
  return (
    <div className="bg-slate-50 text-slate-950">
      <section className="relative overflow-hidden bg-slate-950 px-5 py-16 text-white sm:py-20 lg:px-8">
        <div className="absolute inset-0 opacity-35">
          <Image
            src="https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?auto=format&fit=crop&w=1800&q=80"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/75" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-red-300">Custom Solutions</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-normal sm:text-5xl lg:text-[56px]">
              Custom Building Block Solutions
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              Build OEM / ODM building block products, exclusive SKUs, custom product lines, and long-term sub-brand partnerships with JIESTAR.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <HeroBannerButton href="#project-form">Start Project</HeroBannerButton>
              <HeroBannerButton href="#sub-brand-examples" variant="secondary">Partner Inquiry</HeroBannerButton>
              <HeroBannerButton href="/wholesale" variant="secondary">
                Wholesale
                <ArrowRightIcon className="ml-2 size-4" />
              </HeroBannerButton>
            </div>
          </div>

          <aside className="rounded-lg border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <div className="flex size-11 items-center justify-center rounded-md bg-white text-slate-950">
                <SparkIcon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Partnership summary</p>
                <p className="text-sm text-slate-400">For custom projects beyond wholesale</p>
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
          </aside>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Capabilities"
            title="Custom cooperation capabilities"
            description="Custom Solutions is for partners who need more than existing product wholesale, including development, brand presentation, and long-term product line cooperation."
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(([title, description, Icon]) => (
              <article key={title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex size-11 items-center justify-center rounded-md bg-slate-950 text-white">
                  <Icon className="size-5" />
                </div>
                <h2 className="mt-5 text-lg font-semibold text-slate-950">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="sub-brand-examples" className="scroll-mt-24 bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Sub-brand cooperation"
            title="Sub-brand cooperation examples"
            description="JIESTAR has supported sub-brand cooperation directions that give partners a clearer product identity, market position, and long-term product development path."
          />
          <div className="mt-8">
            <SubBrandCarousel brands={subBrands} />
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Process"
            title="Cooperation process"
            description="A practical first-version process keeps communication clear while leaving room for larger custom projects and longer product line planning."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {process.map(([number, title, description]) => (
              <article key={number} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-bold text-red-600">{number}</p>
                <h2 className="mt-3 text-lg font-semibold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-5 py-14 text-white lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex size-11 items-center justify-center rounded-md bg-white text-slate-950">
              <ShieldIcon className="size-5" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-normal text-red-300">Beyond wholesale</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-white">Plan a custom product direction with JIESTAR</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
              Use Custom Solutions when your project needs product development, packaging and brand customization, an exclusive SKU, or long-term sub-brand cooperation.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
            <LinkButton href="#project-form" variant="dark">Start a Custom Project</LinkButton>
            <LinkButton href="/wholesale" variant="ghost" className="border border-white/25 text-white hover:bg-white/10">Compare Wholesale</LinkButton>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1fr]">
          <SectionHeader
            eyebrow="FAQ"
            title="Custom project questions"
            description="These answers help partners choose the right path before submitting a project inquiry."
          />
          <div className="grid gap-4">
            {faqs.map(([question, answer]) => (
              <article key={question} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-slate-950">{question}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="project-form" className="scroll-mt-24 px-5 pb-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1fr]">
          <div>
            <SectionHeader
              eyebrow="Inquiry"
              title="Start a custom project"
              description="Tell us your cooperation type, customization needs, estimated quantity, and target market so the JIESTAR team can understand the project direction."
            />
            <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">Helpful details to include</p>
              <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
                {["Cooperation type and target market", "Product category or concept direction", "Packaging, logo, or brand customization needs", "Estimated quantity and launch timeline"].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-red-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <InquiryForm type="custom" />
        </div>
      </section>
    </div>
  );
}
