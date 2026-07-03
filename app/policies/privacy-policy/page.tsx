import { PolicyPage } from "@/components/ui/PolicyPage";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Privacy Policy | JIESTAR Toys",
  description: "How JIESTAR handles website, customer, checkout, support, and business inquiry information.",
  path: "/policies/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      description="This privacy policy explains how JIESTAR may collect and use information from website visitors, retail customers, support contacts, and business inquiry contacts. Region-specific privacy requirements may require additional notices or procedures."
      sections={[
        {
          title: "Information we may collect",
          items: [
            "Contact details such as name, company, country or region, email address, phone number, and message content.",
            "Retail order details and checkout information handled through Shopify and related commerce services.",
            "Support request details such as order number, product SKU, missing piece information, photos, and delivery information.",
            "Business inquiry details related to wholesale supply, OEM / ODM customization, product co-development, exclusive SKU programs, or sub-brand partnership.",
            "Basic website usage information such as pages visited, device/browser information, referral source, and cookie or analytics signals where enabled.",
          ],
        },
        {
          title: "How we use information",
          items: [
            "To process retail orders, checkout communication, customer service, and after-sales support.",
            "To respond to wholesale, custom solutions, product development, and business cooperation inquiries.",
            "To review missing piece, replacement part, return, refund, or quality issue requests.",
            "To improve website structure, product presentation, support workflows, and customer communication.",
            "To maintain website security, prevent misuse, and support ordinary business operations.",
          ],
        },
        {
          title: "Shopify and service providers",
          body: "JIESTAR uses Shopify as the commerce backend for storefront checkout, order processing, payment handling, customer records, and related commerce functions.",
          items: [
            "Payment information is processed through Shopify and its payment-related services; JIESTAR does not need to store full card details in the website frontend.",
            "We may use service providers for hosting, analytics, email communication, logistics coordination, and customer support.",
            "Service providers should only access information needed to provide their services to JIESTAR.",
          ],
        },
        {
          title: "International website operations",
          items: [
            "Because JIESTAR serves global customers and partners, information may be processed across regions as needed for orders, support, logistics, and business communication.",
            "Visitors should avoid submitting confidential product ideas, private business plans, or sensitive personal information unless it is needed for the request.",
            "If you want to review, correct, or delete information submitted to JIESTAR, contact us with enough detail to identify the related request or order.",
          ],
        },
      ]}
      note={{
        title: "Policy scope",
        body: "This page is a general privacy policy for the JIESTAR global website. Region-specific privacy requirements may require additional notices or procedures as the storefront expands.",
      }}
    />
  );
}
