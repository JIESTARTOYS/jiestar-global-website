import Link from "next/link";
import Image from "next/image";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { ArrowRightIcon, FactoryIcon, PackageIcon, ShieldIcon, StoreIcon } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/LinkButton";
import { BusinessIdentity } from "@/components/ui/BusinessIdentity";
import { siteConfig } from "@/lib/data";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Contact JIESTAR | Wholesale & Custom Building Block Inquiries",
  description:
    "Contact JIESTAR for product purchases, wholesale inquiries, OEM / ODM customization, product co-development, sub-brand partnerships, and customer support.",
  path: "/contact",
});

const contactPaths = [
  {
    title: "Wholesale supply",
    text: "Existing product catalog, MOQ, channel supply, ecommerce and retail purchasing.",
    href: "/wholesale",
    icon: StoreIcon,
  },
  {
    title: "Custom solutions",
    text: "OEM / ODM, product co-development, exclusive SKUs, packaging and sub-brand cooperation.",
    href: "/custom-solutions",
    icon: FactoryIcon,
  },
  {
    title: "Customer support",
    text: "Product purchase questions, shipping, returns, replacement parts and missing piece support.",
    href: "/support/replacement-parts",
    icon: ShieldIcon,
  },
];

export default function ContactPage() {
  return (
    <div className="bg-[#f7f8fa] px-4 py-8 sm:px-5 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <section className="grid gap-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03] sm:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:p-10">
          <div>
            <p className="text-sm font-black uppercase text-red-600">Contact</p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
              Talk with JIESTAR about products, supply, or custom cooperation.
            </h1>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Use this form for DTC questions, wholesale supply, OEM / ODM customization, product co-development, exclusive product lines, or sub-brand partnership.
            </p>
            <div className="mt-6 grid gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase text-slate-500">Business cooperation</p>
                <Link href={`mailto:${siteConfig.businessEmail}`} className="mt-2 inline-flex break-all text-sm font-black text-slate-950 transition hover:text-red-600">
                  {siteConfig.businessEmail}
                </Link>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase text-slate-500">Customer service</p>
                <Link href={`mailto:${siteConfig.supportEmail}`} className="mt-2 inline-flex break-all text-sm font-black text-slate-950 transition hover:text-red-600">
                  {siteConfig.supportEmail}
                </Link>
              </div>
            </div>
            <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-white">
              <div className="relative aspect-[4/3] bg-slate-100">
                <Image
                  src="/images/site-visuals/showroom/showroom-sample-consultation.webp"
                  alt="JIESTAR showroom table with sample models, packaging, product catalogs, and cooperation discussion materials"
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 32vw, 100vw"
                  className="object-cover object-[center_48%]"
                />
              </div>
              <div className="p-4">
                <p className="text-xs font-black tracking-normal text-red-200">Sample Consultation &amp; Cooperation Discussion</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-100">
                  Submit product inquiries, wholesale requests, or custom cooperation briefs through one contact point.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-4 sm:p-5">
            <InquiryForm type="contact" />
          </div>
        </section>

        <BusinessIdentity className="mt-8" />

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          {contactPaths.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03]">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-red-50 text-red-600">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-lg font-black text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                <Link href={item.href} className="mt-4 inline-flex items-center text-sm font-black text-red-600 transition hover:text-red-700">
                  View details
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </section>

        <section className="mt-8 grid gap-4 rounded-lg border border-slate-200 bg-slate-950 p-5 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/10 text-white">
              <PackageIcon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-black">Preparing a product inquiry?</h2>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Share product category, estimated quantity, target market, timeline, and any packaging or customization needs for faster review.
              </p>
            </div>
          </div>
          <LinkButton href="/products" variant="dark">
            Browse Products
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </LinkButton>
        </section>
      </div>
    </div>
  );
}
