import { InquiryForm } from "@/components/forms/InquiryForm";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { siteConfig } from "@/lib/data";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Contact JIESTAR",
  description:
    "Contact JIESTAR for product purchases, wholesale inquiries, OEM / ODM customization, product co-development, sub-brand partnerships, and customer support.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="bg-slate-50 px-5 py-16 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1fr]">
        <div>
          <SectionHeader title="Contact JIESTAR" description="Choose the right contact path for product purchase, wholesale, custom project cooperation, or customer support." />
          <div className="mt-8 grid gap-4">
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Business cooperation</h2>
              <p className="mt-2 text-sm text-slate-600">{siteConfig.businessEmail}</p>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Customer service</h2>
              <p className="mt-2 text-sm text-slate-600">{siteConfig.supportEmail}</p>
            </div>
          </div>
        </div>
        <InquiryForm type="contact" />
      </div>
    </div>
  );
}
