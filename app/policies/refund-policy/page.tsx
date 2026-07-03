import { PolicyPage } from "@/components/ui/PolicyPage";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Returns & Refunds | JIESTAR Toys",
  description: "JIESTAR returns, refunds, exchanges, quality issue support, and replacement part guidance.",
  path: "/policies/refund-policy",
});

export default function RefundPolicyPage() {
  return (
    <PolicyPage
      title="Returns & Refunds"
      description="This policy explains how JIESTAR reviews return, refund, exchange, and quality issue requests. Final handling depends on order status, product condition, checkout records, product availability, and support confirmation."
      sections={[
        {
          title: "Before shipment",
          items: [
            "If your retail order has not shipped, contact support as soon as possible with your order number.",
            "Cancellation or order changes may depend on whether payment, order processing, or warehouse preparation has already started.",
            "If cancellation is approved, refund handling follows the payment and Shopify order process used for the purchase.",
          ],
        },
        {
          title: "After shipment or delivery",
          body: "Once an order has shipped or been delivered, return eligibility is reviewed case by case.",
          items: [
            "The support team may ask for your order number, product SKU, package photos, product condition, and a clear description of the issue.",
            "Products should generally be kept complete, clean, and in their original packaging while the request is being reviewed.",
            "Return address, shipping method, and return approval must be confirmed by JIESTAR support before any product is sent back.",
          ],
        },
        {
          title: "Quality issues or incorrect items",
          items: [
            "If a product arrives damaged, defective, or different from the item ordered, contact support with clear photos and order details.",
            "JIESTAR may offer replacement parts, replacement product support, exchange guidance, or refund review depending on the issue.",
            "For missing building block pieces, the replacement parts process is usually the most direct solution.",
          ],
        },
        {
          title: "Wholesale and custom orders",
          body: "B2B orders, OEM / ODM projects, product co-development, exclusive SKU programs, and sub-brand partnerships are handled according to the confirmed quotation, purchase order, production agreement, or written communication between both parties.",
          items: [
            "Bulk returns, quality claims, carton shortages, and shipment discrepancies must include order documents and supporting evidence.",
            "Custom packaging, custom product development, and partner-specific SKUs may have different return or cancellation rules.",
          ],
        },
      ]}
      note={{
        title: "Do not ship returns without confirmation",
        body: "Please contact JIESTAR before sending any product back. Unapproved returns may be delayed, refused, or difficult to match with the original order.",
      }}
    />
  );
}
