import { PolicyPage } from "@/components/ui/PolicyPage";
import { createJsonLdScript, createMerchantReturnPolicyJsonLd, createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Returns & Refunds | JIESTAR Toys",
  description: "JIESTAR returns, refunds, exchanges, quality issue support, and replacement part guidance.",
  path: "/policies/refund-policy",
});

export default function RefundPolicyPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={createJsonLdScript(createMerchantReturnPolicyJsonLd())} />
      <PolicyPage
        title="Returns & Refunds"
        description="Retail customers may request a return within 14 days after delivery. Please obtain return authorization and a designated return address before sending anything back. This policy does not limit rights that cannot be excluded under applicable consumer law."
        updatedLabel="Last updated July 21, 2026"
        sections={[
          {
            title: "Cancel before dispatch",
            items: [
              "Contact JIESTAR as soon as possible with your order number if you want to cancel or change an order.",
              "We will try to help before dispatch, but cancellation cannot be guaranteed once warehouse processing has started.",
              "If the order has already shipped, the return process below applies.",
            ],
          },
          {
            title: "14-day return request",
            body: "For retail orders, contact us within 14 days after delivery to request a return. If the return is approved, send it within 14 days after receiving our authorization and return instructions.",
            items: [
              "Include the order number, product SKU, reason for the request, and relevant photos or video where appropriate.",
              "Do not send a return to the sender address on the parcel or to any other address without approval. We will provide the designated return address after authorization.",
              "Use a tracked shipping service and keep the shipping receipt until the return is resolved.",
            ],
          },
          {
            title: "Change-of-mind returns",
            body: "For a return because the customer ordered the wrong item, no longer wants it, or changed their mind, the product must be unused, unbuilt, complete, and in its original packaging. Inner bags should remain sealed.",
            items: [
              "All pieces, accessories, manuals, stickers, gifts, and packaging included with the order must be returned.",
              "EU and UK customers may inspect goods as reasonably necessary to establish their nature, characteristics, and functioning.",
              "Where permitted by law, a refund may be reduced to reflect missing items, damage, or loss in value caused by handling beyond what is reasonably necessary for inspection.",
            ],
          },
          {
            title: "Return shipping and original delivery charges",
            items: [
              "For change-of-mind returns, the customer pays the tracked return shipping cost.",
              "For a confirmed incorrect item, shipping damage, missing contents, or product defect, JIESTAR will cover reasonable return or remedy costs and provide instructions before any shipment is made.",
              "Outside regions where a refund is required by law, original delivery charges are not refundable for change-of-mind returns. For EU and UK withdrawals, the lowest-cost standard outbound delivery charge is refunded where required by law.",
            ],
          },
          {
            title: "Damaged, incorrect, missing, or defective items",
            body: "Please report an obvious shipping damage, incorrect item, missing contents, or suspected defect within 14 days after delivery where possible. Reporting promptly helps us investigate, but this recommended period does not limit any longer non-excludable rights under local law.",
            items: [
              "Provide the order number, SKU, packaging photos, and clear photos or video showing the problem.",
              "Depending on the confirmed issue, we may offer replacement parts, a replacement product, a partial refund, a full refund, or another remedy required by applicable law.",
              "If international return shipping would be clearly disproportionate, we may approve a replacement, replacement parts, partial refund, or refund without requiring the product to be returned. This does not remove a customer's formal return rights where applicable.",
            ],
          },
          {
            title: "Refund timing",
            body: "Once an authorized return is received and inspected, or a no-return solution is approved, JIESTAR will initiate the approved refund within 5 business days.",
            items: [
              "Refunds are sent to the original payment method unless another method is required or agreed.",
              "Banks and payment providers may need additional time to post the refund after it is initiated.",
              "We do not charge a fixed restocking fee. Where permitted by law, actual missing items, damage, or diminished value may be deducted and explained.",
            ],
          },
          {
            title: "Wholesale and custom orders",
            body: "B2B, wholesale, OEM / ODM, product co-development, custom packaging, exclusive SKU, and sub-brand orders are governed by the applicable quotation, purchase order, contract, or other written agreement.",
            items: [
              "Bulk quality claims, carton shortages, and shipment discrepancies should include the relevant order documents and supporting evidence.",
              "The retail 14-day return process does not replace separately agreed commercial terms.",
            ],
          },
        ]}
        note={{
          title: "Return authorization is required",
          body: "Contact JIESTAR before sending anything back. We do not publish one fixed international return address because the designated address and most practical remedy depend on the order, destination, and issue. Unauthorized returns may be delayed or cannot be matched to the original order.",
        }}
        ctaLabel="Request Return Support"
      />
    </>
  );
}
