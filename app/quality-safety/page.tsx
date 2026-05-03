import { LinkButton } from "@/components/ui/LinkButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Quality & Safety",
  description:
    "Learn how JIESTAR approaches material safety, quality control, product inspection, stable clutch power, and missing piece support.",
  path: "/quality-safety",
});

const items = ["Material safety", "Quality control", "Production process", "Product inspection", "International compliance", "Stable clutch power", "Missing piece support", "Customer service support"];

export default function QualitySafetyPage() {
  return (
    <div className="bg-slate-50 px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          title="Quality & Safety"
          description="JIESTAR addresses trust concerns around product quality, safety, after-sales support, and replacement parts for both B2B and DTC customers."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <article key={item} className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-950">{item}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">Clear internal standards and customer support help make each building experience more reliable.</p>
            </article>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/products">View Products</LinkButton>
          <LinkButton href="/contact" variant="secondary">Contact Sales</LinkButton>
        </div>
      </div>
    </div>
  );
}
