import { PolicyPage } from "@/components/ui/PolicyPage";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Shipping Policy",
  description: "JIESTAR shipping policy for retail orders, wholesale supply, and custom project delivery support.",
  path: "/policies/shipping-policy",
});

export default function ShippingPolicyPage() {
  return (
    <PolicyPage
      title="Shipping Policy"
      description="This policy explains how JIESTAR handles shipping information for retail customers and business partners. Shipping options, costs, and timelines may vary by destination, product availability, order size, and final order confirmation."
      sections={[
        {
          title: "Retail orders",
          body: "For direct-to-consumer purchases, available shipping methods and charges are shown during Shopify checkout whenever checkout is enabled for the selected product and destination.",
          items: [
            "Shipping fees, taxes, duties, and delivery estimates may vary by country or region.",
            "The final shipping cost is confirmed before payment through the checkout flow.",
            "Order processing and delivery updates are managed through Shopify order records and related customer notifications.",
          ],
        },
        {
          title: "Wholesale and B2B shipments",
          body: "Wholesale supply, OEM / ODM projects, product co-development, and sub-brand cooperation orders are handled separately from standard retail checkout.",
          items: [
            "Lead time, carton quantity, shipping method, documentation, and logistics terms are confirmed by the JIESTAR business team before order confirmation.",
            "Large orders may require sea freight, air freight, forwarder pickup, or other agreed logistics arrangements.",
            "MOQ, production schedule, and destination market requirements may affect the final delivery plan.",
          ],
        },
        {
          title: "Delivery information",
          items: [
            "Please provide a complete and accurate shipping address, contact name, phone number, and email address.",
            "JIESTAR is not responsible for delays caused by incomplete address information, customs review, local carrier issues, or force majeure events.",
            "If a package appears delayed, damaged, or lost, contact JIESTAR support with your order number and available tracking information.",
          ],
        },
      ]}
      note={{
        title: "Shipping coverage",
        body: "Retail shipping options and delivery methods vary by destination, product availability, order size, and active checkout coverage.",
      }}
    />
  );
}
