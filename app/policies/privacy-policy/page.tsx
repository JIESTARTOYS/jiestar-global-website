import { PolicyPage } from "@/components/ui/PolicyPage";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Privacy Policy", description: "How JIESTAR handles website, customer, and inquiry information.", path: "/policies/privacy-policy" });

export default function PrivacyPolicyPage() {
  return <PolicyPage title="Privacy Policy" sections={["JIESTAR uses customer and inquiry information to process orders, respond to support requests, and follow up on business cooperation inquiries.", "Payment, checkout, and order information are handled through Shopify and its related services."]} />;
}
