import { PolicyPage } from "@/components/ui/PolicyPage";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Shipping Policy", description: "JIESTAR shipping policy and delivery support information.", path: "/policies/shipping-policy" });

export default function ShippingPolicyPage() {
  return <PolicyPage title="Shipping Policy" sections={["Shipping methods, costs, and delivery timelines are confirmed during Shopify checkout based on destination and order details.", "For wholesale orders, shipping terms, lead time, and logistics support are discussed with the JIESTAR business team before order confirmation."]} />;
}
