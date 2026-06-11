import type { ComponentType, SVGProps } from "react";
import Image from "next/image";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { ArrowRightIcon, FactoryIcon, GlobeIcon, PackageIcon, ShieldIcon, StoreIcon, TruckIcon, UserIcon } from "@/components/ui/Icons";
import { HeroBannerButton } from "@/components/ui/HeroBannerButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Request Wholesale Price Catalog",
  description:
    "Leave your email to request JIESTAR wholesale catalog and private pricing follow-up for product, MOQ, and order discussions.",
  path: "/wholesale",
});

const heroStats = [
  ["INQUIRY", "Business profile review"],
  ["CATALOG", "Wholesale catalog and private pricing"],
  ["FOLLOW-UP", "MOQ, shipping, and order details"],
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
  ["Wholesale catalog request", "Start a private catalog and pricing follow-up with JIESTAR.", FactoryIcon],
  ["Category options", "Review existing JIESTAR product lines before choosing items for your market.", StoreIcon],
  ["Follow-up discussion", "Continue product, MOQ, logistics, and order questions through WhatsApp, email, or social media.", TruckIcon],
];

const process: Array<[string, string, string, IconComponent]> = [
  ["01", "Inquiry Review", "Submit your email and optional business details so the team can identify buyer type, market direction, and product fit.", UserIcon],
  ["02", "Catalog Matching", "JIESTAR reviews your market and product direction, then follows up with relevant catalog and pricing information privately.", PackageIcon],
  ["03", "Private Follow-Up", "Continue by email, WhatsApp, or social media to discuss MOQ, hot-selling categories, packaging, and logistics questions.", GlobeIcon],
  ["04", "Order Planning", "Confirm sample needs, quantity direction, lead time, shipping approach, and future replenishment planning.", TruckIcon],
];

const faqs = [
  [
    "Can I request a product catalog before placing an order?",
    "Yes. Leave your email to start a wholesale catalog request before detailed order discussion.",
  ],
  [
    "Do I need to fill in every form field?",
    "No. Email is the only required field for wholesale catalog requests. WhatsApp, company, country, and product interests help the team follow up faster.",
  ],
  [
    "How do we continue after receiving the catalog?",
    "After JIESTAR reviews the inquiry and follows up, product selection, MOQ, shipping, packaging, and order details can be discussed through WhatsApp, email, or other social media channels.",
  ],
  [
    "What if I need custom packaging, OEM / ODM, or an exclusive product line?",
    "Wholesale is for existing product supply. For custom development, packaging customization, or long-term product line cooperation, use the Custom Solutions path.",
  ],
];

export default function WholesalePage() {
  return (
    <div className="bg-slate-50 text-slate-950">
      <section className="relative overflow-hidden bg-slate-950 px-5 py-16 text-white sm:py-20 lg:px-8">
        <div className="absolute inset-0 opacity-35">
          <Image
            src="/images/site-visuals/b2b-catalog-meeting.png"
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
            <p className="text-sm font-semibold uppercase tracking-normal text-red-300">WHOLESALE PROGRAM</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-normal sm:text-5xl lg:text-[56px]">
              Request Wholesale Catalog & Pricing
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              Apply to receive JIESTAR wholesale catalogs, product materials, and private pricing for retailers, distributors, e-commerce sellers, and channel buyers.
              <br />
              <br />
              Our team will review your inquiry and follow up with MOQ, shipping, and order details through your preferred contact channel.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <HeroBannerButton href="#wholesale-form">Request Catalog</HeroBannerButton>
              <HeroBannerButton href="#catalog-request" variant="secondary">How It Works</HeroBannerButton>
              <HeroBannerButton href="/products" variant="secondary">
                View Products
                <ArrowRightIcon className="ml-2 size-4" />
              </HeroBannerButton>
            </div>
          </div>

          <aside className="rounded-lg border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <div className="flex size-11 items-center justify-center rounded-md bg-white text-slate-950">
                <GlobeIcon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">How wholesale requests work</p>
                <p className="text-sm text-slate-400">Reviewed before private pricing</p>
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
              title="For buyers who want to review wholesale pricing first"
              description="This page is for B2B buyers who want to receive a wholesale price catalog before discussing MOQ, order planning, logistics, or product selection in detail."
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
              title="What happens after you leave your email"
              description="JIESTAR uses the inquiry to understand your market and product direction, then shares relevant wholesale materials and continues business details through direct communication."
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

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
            <SectionHeader
              eyebrow="Workflow"
              title="Wholesale Catalog & Pricing Workflow"
              description="Wholesale pricing is handled as a private B2B communication flow. The inquiry starts lightweight, but the follow-up is matched to buyer type, market, and product direction."
            />
            <div className="mt-6 rounded-lg border border-red-100 bg-red-50 p-4">
              <div className="flex gap-3">
                <ShieldIcon className="mt-0.5 size-5 shrink-0 text-red-600" />
                <p className="text-sm font-semibold leading-6 text-slate-800">
                  Wholesale pricing is shared privately after inquiry review.
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Email is enough to start. Company, country, WhatsApp, and category interests help the team prepare a more relevant catalog response.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid gap-3">
              {process.map(([number, title, description, Icon], index) => (
                <article key={number} className="relative grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[auto_1fr] sm:p-5">
                  {index < process.length - 1 ? (
                    <span className="absolute left-9 top-16 hidden h-[calc(100%_-_1.5rem)] w-px bg-slate-200 sm:block" aria-hidden="true" />
                  ) : null}
                  <div className="relative z-10 flex size-10 items-center justify-center rounded-md bg-slate-950 text-white shadow-sm">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-black uppercase text-red-600">{number}</span>
                      <h2 className="text-lg font-black text-slate-950">{title}</h2>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="catalog-request" className="scroll-mt-24 bg-slate-950 px-5 py-14 text-white lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex size-11 items-center justify-center rounded-md bg-white text-slate-950">
              <PackageIcon className="size-5" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-normal text-red-300">Private wholesale pricing</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-white">Wholesale pricing is shared after inquiry review</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
              Submit your email and the JIESTAR team will review your business direction before following up with relevant catalog and wholesale pricing information. MOQ, shipping, packaging, product selection, and order planning can be confirmed afterward through WhatsApp, email, or other social media.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
            <HeroBannerButton href="#wholesale-form">Request Wholesale Catalog</HeroBannerButton>
            <HeroBannerButton href="/products" variant="secondary">View Product Lines</HeroBannerButton>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1fr]">
          <SectionHeader
            eyebrow="FAQ"
            title="Catalog request questions"
            description="These answers explain what happens before the team continues the conversation by email, WhatsApp, or social media."
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
              title="Request the wholesale price catalog"
              description="Submit your email to start the wholesale catalog request. Optional WhatsApp, company, country, and category details help JIESTAR prepare the right catalog and pricing follow-up."
            />
            <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">Useful details for catalog matching</p>
              <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
                {["WhatsApp or preferred social media contact", "Company and country / region", "Interested product categories", "Estimated quantity, if already known"].map((item) => (
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
