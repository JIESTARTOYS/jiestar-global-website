import Link from "next/link";
import { BusinessIdentity } from "@/components/ui/BusinessIdentity";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Business & Legal Information | JIESTAR Toys",
  description:
    "Verified company, registration, address, telephone, seller, and brand relationship information for the JIESTAR global website.",
  path: "/business-information",
});

const policyLinks = [
  ["Terms of Service", "/policies/terms-of-service"],
  ["Privacy Policy", "/policies/privacy-policy"],
  ["Shipping Policy", "/policies/shipping-policy"],
  ["Returns & Refunds", "/policies/refund-policy"],
] as const;

export default function BusinessInformationPage() {
  return (
    <div className="bg-[#f7f8fa] px-4 py-10 sm:px-5 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="text-sm font-black uppercase text-red-600">Business information</p>
          <h1 className="mt-3 text-4xl font-black tracking-normal text-slate-950 sm:text-5xl">
            Business &amp; Legal Information
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
            This page identifies the company operating JIESTAR&apos;s international website and retail sales channel,
            together with its relationship to the JIESTAR brand and manufacturing company.
          </p>
        </header>

        <BusinessIdentity />

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-xl font-black text-slate-950">Customer policies</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Review the policies that apply to website use, personal information, shipping, returns, refunds, and
            retail orders.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {policyLinks.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 transition hover:border-red-600 hover:text-red-600"
              >
                {label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
