import { PolicyPage } from "@/components/ui/PolicyPage";
import { createJsonLdScript, createMetadata, createShippingPolicyJsonLd } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Shipping Policy | JIESTAR Toys",
  description: "JIESTAR shipping policy for retail orders, wholesale supply, and custom project delivery support.",
  path: "/policies/shipping-policy",
});

export default function ShippingPolicyPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={createJsonLdScript(createShippingPolicyJsonLd())} />
      <PolicyPage
        title="Shipping Policy"
        description="This policy explains processing times, delivery estimates, shipping charges, tracking, and delivery support for JIESTAR retail orders. Wholesale and custom orders follow their confirmed commercial terms."
        updatedLabel="Last updated July 21, 2026"
        sections={[
          {
            title: "Order processing",
            body: "Retail orders are normally processed within 1–3 business days after payment is confirmed. Business days are Monday through Friday, excluding public holidays.",
            items: [
              "Processing time is separate from the delivery estimate shown below.",
              "During product launches, sales, or public holidays, warehouse processing may take longer.",
              "When an order ships, we send a dispatch confirmation with tracking information when tracking is available.",
            ],
          },
          {
            title: "Delivery estimates",
            body: "After dispatch, delivery usually takes 7–16 calendar days. This is an estimate, not a guaranteed delivery date.",
            items: [
              "Current retail shipping markets are the United States, Canada, Australia, the United Kingdom, Germany, France, Belgium, Spain, Italy, the Netherlands, Poland, and Sweden.",
              "Peak seasons, customs inspections, severe weather, local carrier capacity, and remote destinations may extend delivery time.",
              "Availability and the delivery estimate shown at checkout may vary by product and destination.",
            ],
          },
          {
            title: "Shipping charges, taxes, and duties",
            body: "Available shipping methods and charges are calculated at checkout according to the destination country and the products in the order. We do not publish a single fixed international shipping fee.",
            items: [
              "The checkout total and order confirmation show the shipping charge collected by JIESTAR.",
              "Import duties, taxes, or local handling fees may apply where they are not collected at checkout and are determined by the destination authorities or carrier.",
              "Any destination-specific checkout terms shown before payment form part of the order information.",
            ],
          },
          {
            title: "Addresses, tracking, and delays",
            items: [
              "Customers must provide a complete and accurate delivery address, recipient name, phone number, and email address.",
              "Contact us immediately if an address is wrong. We will try to update it before dispatch, but changes cannot be guaranteed after an order enters warehouse processing or ships.",
              "Tracking can take several days to update after dispatch. If a shipment appears significantly delayed, lost, or damaged, contact JIESTAR with the order number and tracking details so we can investigate.",
            ],
          },
          {
            title: "Wholesale and custom shipments",
            body: "Wholesale, OEM / ODM, product co-development, and custom orders are not governed by the standard retail delivery estimate.",
            items: [
              "Production lead time, carton quantity, freight method, Incoterms, documentation, and delivery arrangements are confirmed in the quotation, purchase order, contract, or other written agreement.",
              "Large orders may use sea freight, air freight, forwarder pickup, or another agreed logistics method.",
            ],
          },
        ]}
        note={{
          title: "Estimated times can change",
          body: "The 7–16 day estimate starts after dispatch. Customs review, peak demand, remote-area delivery, carrier disruption, and events outside our reasonable control can cause additional delay.",
        }}
        ctaLabel="Contact Support"
      />
    </>
  );
}
