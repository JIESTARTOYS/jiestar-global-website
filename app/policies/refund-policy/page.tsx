import { PolicyPage } from "@/components/ui/PolicyPage";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Returns & Refunds", description: "JIESTAR returns, refunds, exchanges, and quality issue support.", path: "/policies/refund-policy" });

export default function RefundPolicyPage() {
  return <PolicyPage title="Returns & Refunds" sections={["Retail returns and refunds are handled according to order status, product condition, and Shopify checkout records.", "For quality issues, incorrect items, or missing parts, contact support with your order number, product SKU, photos, and a clear description."]} />;
}
