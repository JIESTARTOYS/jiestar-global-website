import { InquiryForm } from "@/components/forms/InquiryForm";
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

const buyers = ["Toy wholesalers", "Distributors", "Offline retailers", "Amazon sellers", "TikTok Shop sellers", "Gift product buyers", "Educational product buyers", "Regional agents"];
const advantages = ["Factory-direct supply", "Wide product categories", "New product updates", "Catalog support", "MOQ discussion", "Replacement parts support"];

export default function WholesalePage() {
  return (
    <div className="bg-slate-50">
      <section className="bg-slate-950 px-5 py-20 text-white lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">B2B Wholesale</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-normal">Factory-Direct Building Block Supply for Global Channels</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Source existing JIESTAR building block sets for retail, ecommerce, distribution, gift programs, and regional channel sales.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <LinkButton href="#wholesale-form" variant="dark">Submit Wholesale Inquiry</LinkButton>
            <LinkButton href="/products" variant="secondary" className="border-white/25 bg-transparent text-white hover:bg-white/10">View Product Lines</LinkButton>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
          <div>
            <SectionHeader title="Who Wholesale Is For" description="The wholesale path is for buyers who want existing products, product catalogs, stable supply, and channel procurement support." />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {buyers.map((item) => <div key={item} className="rounded-md bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm">{item}</div>)}
            </div>
          </div>
          <div>
            <SectionHeader title="Wholesale Advantages" description="JIESTAR helps global channel partners evaluate products, request catalog information, and prepare product launches." />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {advantages.map((item) => <div key={item} className="rounded-md bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm">{item}</div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader title="Wholesale Product Categories" description="Use these categories as the starting point for catalog requests and product selection." />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {collections.map((collection) => (
              <div key={collection.handle} className="rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-slate-950">{collection.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{collection.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="wholesale-form" className="px-5 pb-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1fr]">
          <SectionHeader title="Submit Wholesale Inquiry" description="Tell us your market, product category, estimated order quantity, and target sales channel." />
          <InquiryForm type="wholesale" />
        </div>
      </section>
    </div>
  );
}
