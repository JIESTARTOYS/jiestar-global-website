import Link from "next/link";
import { businessConfig } from "@/lib/business";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function B2BManufacturerInfo({ custom = false }: { custom?: boolean }) {
  return (
    <section id="manufacturer-review" className="scroll-mt-24 bg-white px-5 py-16 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
        <div>
          <SectionHeader
            eyebrow="Manufacturer and quality review"
            title={custom ? "Review the manufacturing side of your custom project" : "Know the manufacturer behind your wholesale order"}
          />
          <p className="mt-4 text-sm leading-7 text-slate-600">
            {businessConfig.manufacturerName} is responsible for the JIESTAR brand, product development, manufacturing, and supply.
            {" "}{businessConfig.legalName} operates this international website and its sales channels.
          </p>
          <Link href="/business-information" className="mt-4 inline-block font-semibold text-red-700 underline decoration-red-300 underline-offset-4 hover:text-red-800">
            Review company and sales operator details
          </Link>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-950">{custom ? "Align the sample with the production brief" : "Check the selected products before ordering"}</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {custom
              ? "Use an agreed sample to review structure, part fit, instructions, packaging artwork, and the changes needed before production. Ask which dated production records and product-specific inspection documents can be supplied for your project."
              : "Review the selected SKU, sample contents, packaging, and carton details. Ask which product-specific inspection records and destination-market documents are available for the proposed order."}
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-600">Confirm document scope against the model, age grade, destination, and order before approval.</p>
          <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:gap-x-6">
            <Link href="/quality-safety" className="font-semibold text-red-700 underline decoration-red-300 underline-offset-4 hover:text-red-800">Quality and product documentation</Link>
            <Link href="/about" className="font-semibold text-red-700 underline decoration-red-300 underline-offset-4 hover:text-red-800">About JIESTAR manufacturing</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
