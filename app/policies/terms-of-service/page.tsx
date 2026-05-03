import { PolicyPage } from "@/components/ui/PolicyPage";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Terms of Service", description: "JIESTAR website terms of service for customers and business visitors.", path: "/policies/terms-of-service" });

export default function TermsPage() {
  return <PolicyPage title="Terms of Service" sections={["By using the JIESTAR website, visitors agree to use product, content, and inquiry information responsibly.", "Product availability, prices, shipping terms, and business cooperation details may vary by market, order quantity, and final confirmation."]} />;
}
