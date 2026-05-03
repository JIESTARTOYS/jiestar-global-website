import { InquiryForm } from "@/components/forms/InquiryForm";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Custom Building Block Solutions",
  description:
    "Explore JIESTAR OEM / ODM customization, product co-development, exclusive SKUs, product line planning, and sub-brand partnership.",
  path: "/custom-solutions",
});

const capabilities = [
  ["OEM Customization", "Adjust product, packaging, logo, and market-facing presentation."],
  ["ODM Development", "Develop new products around market demand and product direction."],
  ["Product Co-Development", "Build differentiated products with long-term business partners."],
  ["Exclusive SKU", "Create dedicated versions for channels, platforms, or regional markets."],
  ["Exclusive Product Line", "Plan a focused product series around a partner's market strategy."],
  ["Sub-Brand Partnership", "Support long-term cooperation and sub-brand co-creation."],
];

export default function CustomSolutionsPage() {
  return (
    <div className="bg-white">
      <section className="bg-slate-950 px-5 py-20 text-white lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">Custom Solutions</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-normal">OEM, ODM, Product Co-Development, and Sub-Brand Cooperation</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Build custom building block products, exclusive product lines, and long-term brand partnerships with JIESTAR.
          </p>
          <div className="mt-8">
            <LinkButton href="#project-form" variant="dark">Start a Custom Project</LinkButton>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader title="Custom Cooperation Capabilities" description="Custom Solutions is for partners who need more than existing product wholesale." />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(([title, description]) => (
              <article key={title} className="rounded-lg border border-slate-200 bg-slate-50 p-6">
                <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader title="Cooperation Process" description="A simple first-version process keeps communication clear while leaving room for larger custom projects." />
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {["Share requirements", "Review product direction", "Confirm scope and MOQ", "Develop sample and launch"].map((step, index) => (
              <div key={step} className="rounded-lg bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">Step {index + 1}</p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">{step}</h2>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="project-form" className="px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1fr]">
          <SectionHeader title="Start a Custom Project" description="Tell us your cooperation type, customization needs, estimated quantity, and target market." />
          <InquiryForm type="custom" />
        </div>
      </section>
    </div>
  );
}
