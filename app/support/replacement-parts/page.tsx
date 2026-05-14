import { ReplacementPartsForm } from "@/components/forms/ReplacementPartsForm";
import { PolicyPage } from "@/components/ui/PolicyPage";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Replacement Parts & Missing Pieces",
  description: "Request JIESTAR support for missing, incorrect, damaged, or lost building block pieces.",
  path: "/support/replacement-parts",
});

export default function ReplacementPartsPage() {
  return (
    <PolicyPage
      title="Replacement Parts & Missing Pieces"
      description="JIESTAR building block sets include many small components, and we want customers and partners to have a clear support path when a set includes a missing, incorrect, damaged, or lost piece."
      sections={[
        {
          title: "What this support covers",
          items: [
            "Missing pieces discovered during the building process.",
            "Incorrect pieces that do not match the product instructions or parts list.",
            "Damaged pieces that affect assembly, stability, or display quality.",
            "Lost pieces may be reviewed case by case based on product availability and order information.",
          ],
        },
        {
          title: "Information to prepare",
          body: "Start with the order and contact details. The support team can ask for exact piece information, photos, or manual references after the first contact.",
          items: [
            "Order number or purchase channel.",
            "Product name, product SKU, or product page link.",
            "Your name, country / region, email, and WhatsApp or phone number when available.",
            "Photos, manual page references, bag numbers, part colors, and quantities can be confirmed later if needed.",
          ],
        },
        {
          title: "How requests are handled",
          items: [
            "JIESTAR reviews replacement requests against order records, product information, and available parts inventory.",
            "Some replacement requests may require additional photos or details before they can be confirmed.",
            "Replacement availability and delivery method may vary by product, market, and parts stock.",
          ],
        },
        {
          title: "B2B and partner support",
          body: "For wholesale supply, OEM / ODM customization, exclusive SKU, or sub-brand partnership orders, replacement parts and after-sales handling can be coordinated through the assigned JIESTAR business contact.",
          items: [
            "Partners should provide purchase order details, product SKU, affected quantity, and destination market information.",
            "Batch issues, carton-level issues, or channel after-sales requests are reviewed separately from single retail requests.",
          ],
        },
      ]}
      note={{
        title: "Before requesting a refund",
        body: "For missing or incorrect building block pieces, replacement part support is usually the fastest first step. Refund or return requests for broader product issues can be reviewed under the Returns & Refunds policy.",
      }}
      ctaLabel="Request support"
    >
      <ReplacementPartsForm />
    </PolicyPage>
  );
}
