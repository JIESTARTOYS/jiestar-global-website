import type { ComponentType, SVGProps } from "react";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { ArrowRightIcon, FactoryIcon, GlobeIcon, PackageIcon, ShieldIcon, StoreIcon, TruckIcon } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { collections } from "@/lib/data";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Wholesale Building Blocks",
  description:
    "Request factory-direct wholesale building block supply from JIESTAR for retailers, distributors, ecommerce sellers, and regional agents.",
  path: "/wholesale",
});

const heroStats = [
  ["Channel focus", "Retail, ecommerce, distribution"],
  ["Supply path", "Existing JIESTAR product lines"],
  ["Next step", "Catalog review and MOQ discussion"],
];

const buyers = [
  ["Toy wholesalers", "Source broader product ranges for existing sales channels."],
  ["Distributors", "Evaluate stable building block supply for regional markets."],
  ["Offline retailers", "Plan shelf-ready products for stores, malls, and gift shops."],
  ["Amazon sellers", "Review category fit, packaging needs, and launch timing."],
  ["TikTok Shop sellers", "Select visually strong sets for content-led product sales."],
  ["Educational buyers", "Discuss learning, gift, and family product programs."],
];

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const advantages: Array<[string, string, IconComponent]> = [
  ["Factory-direct supply", "Work with JIESTAR on existing products, catalog selection, and order planning.", FactoryIcon],
  ["Category coverage", "Explore vehicles, trains, architecture, book nooks, educational sets, and more.", StoreIcon],
  ["Launch support", "Discuss MOQ, product fit, replenishment direction, and sales channel needs.", TruckIcon],
];

const process = [
  ["01", "Submit inquiry", "Share your company, market, product category, estimated quantity, and sales channel."],
  ["02", "Review catalog", "JIESTAR helps you evaluate relevant existing product lines and category options."],
  ["03", "Discuss MOQ", "Confirm quantity direction, shipping terms, packaging needs, and launch requirements."],
  ["04", "Plan order", "Move toward sampling, order confirmation, and channel launch preparation."],
];

const faqs = [
  [
    "Can I request a product catalog before placing an order?",
    "Yes. Wholesale buyers can submit an inquiry with their market and product interests, then JIESTAR can follow up with suitable catalog information.",
  ],
  [
    "Is MOQ fixed for every product?",
    "MOQ depends on product category, order quantity, market requirements, and final order details. The inquiry form helps start that discussion.",
  ],
  [
    "Can JIESTAR support shipping discussions for wholesale orders?",
    "Yes. Shipping terms, lead time, and logistics direction are discussed with the business team before order confirmation.",
  ],
  [
    "What if I need custom packaging, OEM / ODM, or an exclusive product line?",
    "Wholesale is for existing product supply. For custom development, packaging customization, or long-term product line cooperation, use the Custom Solutions path.",
  ],
];

export default function WholesalePage() {
  return (
    <div className="bg-slate-50 text-slate-950">
      <section className="bg-slate-950 px-5 py-16 text-white sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-red-300">B2B Wholesale Supply</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-normal sm:text-5xl lg:text-6xl">
              Factory-Direct Building Block Supply for Global Channels
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              Source existing JIESTAR building block sets for retail, ecommerce, distribution, gift programs, and regional channel sales. Start with catalog review, MOQ discussion, and product fit for your market.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="#wholesale-form" variant="dark">Submit Wholesale Inquiry</LinkButton>
              <LinkButton href="#catalog-request" variant="ghost" className="border border-white/25 text-white hover:bg-white/10">Request Product Catalog</LinkButton>
              <LinkButton href="/products" variant="ghost" className="text-white hover:bg-white/10">
                View Product Lines
                <ArrowRightIcon className="ml-2 size-4" />
              </LinkButton>
            </div>
          </div>

          <aside className="rounded-lg border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <div className="flex size-11 items-center justify-center rounded-md bg-white text-slate-950">
                <GlobeIcon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Wholesale summary</p>
                <p className="text-sm text-slate-400">For channel procurement and existing products</p>
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
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <SectionHeader
              eyebrow="Wholesale fit"
              title="For buyers who need existing products and reliable channel supply"
              description="This path is built for B2B buyers evaluating JIESTAR product lines, catalog options, MOQ direction, and launch planning for their sales channels."
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {buyers.map(([title, description]) => (
                <article key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-base font-semibold text-slate-950">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader
              eyebrow="What buyers can discuss"
              title="Wholesale advantages"
              description="JIESTAR helps global channel partners evaluate existing product categories, request catalog information, and prepare product launches."
            />
            <div className="mt-8 grid gap-4">
              {advantages.map(([title, description, Icon]) => (
                <article key={title} className="flex gap-4 rounded-lg bg-slate-50 p-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="catalog-request" className="scroll-mt-24 bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeader
              eyebrow="Product catalog"
              title="Wholesale product categories"
              description="Use these categories as the starting point for catalog requests and product selection. Final availability, MOQ, and order details are confirmed through the business team."
            />
            <LinkButton href="/products" variant="secondary" className="w-full sm:w-auto">Browse Product Lines</LinkButton>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {collections.map((collection) => (
              <article key={collection.handle} className="rounded-lg border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">{collection.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{collection.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Process"
            title="Wholesale cooperation process"
            description="A simple first-version flow keeps wholesale communication focused on catalog fit, order direction, and launch preparation."
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
              <PackageIcon className="size-5" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-normal text-red-300">Catalog inquiry first</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-white">Request catalog support before order planning</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
              Wholesale inquiries are handled through business communication, not the DTC shopping cart. Share your market, product interests, estimated quantity, and channel so JIESTAR can recommend the right next step.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
            <LinkButton href="#wholesale-form" variant="dark">Submit Wholesale Inquiry</LinkButton>
            <LinkButton href="/products" variant="ghost" className="border border-white/25 text-white hover:bg-white/10">View Product Lines</LinkButton>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1fr]">
          <SectionHeader
            eyebrow="FAQ"
            title="Wholesale questions buyers often ask"
            description="These answers keep the first conversation practical while leaving final product, MOQ, and logistics details for business confirmation."
          />
          <div className="grid gap-4">
            {faqs.map(([question, answer]) => (
              <article key={question} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-slate-950">{question}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{answer}</p>
              </article>
            ))}
            <div className="rounded-lg border border-red-100 bg-red-50 p-5">
              <div className="flex gap-3">
                <ShieldIcon className="mt-0.5 size-5 shrink-0 text-red-600" />
                <p className="text-sm leading-6 text-slate-700">
                  Need custom development, packaging customization, or exclusive product line cooperation? Visit{" "}
                  <a href="/custom-solutions" className="font-semibold text-red-700 underline decoration-red-300 underline-offset-4 hover:text-red-800">
                    Custom Solutions
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="wholesale-form" className="scroll-mt-24 px-5 pb-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1fr]">
          <div>
            <SectionHeader
              eyebrow="Inquiry"
              title="Submit wholesale inquiry"
              description="Tell us your market, product category, estimated order quantity, and target sales channel. The more specific the request, the easier it is to recommend suitable catalog options."
            />
            <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">Helpful details to include</p>
              <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
                {["Country / region and sales channel", "Interested product categories", "Estimated order quantity or launch plan", "Any packaging or logistics questions"].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-red-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <InquiryForm type="wholesale" />
        </div>
      </section>
    </div>
  );
}
