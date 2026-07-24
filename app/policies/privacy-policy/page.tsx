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
      description="This policy explains how HONG KONG ZHILE TRADING CO., LIMITED handles information for the JIESTAR international website, retail orders, support, and business inquiries."
      updatedLabel="Last updated July 24, 2026"
      sections={[
        {
          title: "Who is responsible for your information",
          body: "HONG KONG ZHILE TRADING CO., LIMITED operates this website and is responsible for personal information used for international website operations and eligible retail sales. Guangdong Jiexing Toys Industrial Co., Ltd. may support brand, product, manufacturing, quality, or business-cooperation matters when needed.",
          items: [
            "Privacy questions and requests can be sent to the business email or telephone displayed below.",
            "Shopify and enabled payment providers separately process information needed to provide checkout, payment, fraud-prevention, and order services.",
          ],
        },
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
            "To comply with accounting, tax, fraud-prevention, payment, sanctions, customs, and other legal or regulatory obligations.",
          ],
        },
        {
          title: "Shopify, payments, and service providers",
          body: "JIESTAR uses Shopify as the commerce backend for checkout, order processing, customer records, and related commerce functions.",
          items: [
            "Payment information is processed by the payment providers displayed at checkout. The custom website frontend does not store full card details.",
            "We may use service providers for hosting, analytics, email, fraud screening, logistics, manufacturing coordination, and customer support.",
            "Service providers receive only the information reasonably needed for their services and are expected to protect it under applicable agreements and law.",
          ],
        },
        {
          title: "Sharing and international processing",
          items: [
            "Because JIESTAR serves global customers and partners, information may be processed in Hong Kong, mainland China, the destination market, and other locations used by Shopify, payment, hosting, logistics, or support providers.",
            "Information may be shared with the manufacturing company when needed for product support, replacement parts, quality investigation, wholesale, or custom project work.",
            "Information may also be disclosed when required by law, regulators, courts, payment networks, customs authorities, or to protect customers, the business, or the website.",
          ],
        },
        {
          title: "Retention, security, and your choices",
          items: [
            "Information is retained only as long as reasonably needed for orders, support, business relationships, security, accounting, legal obligations, or dispute resolution.",
            "Reasonable administrative and technical measures are used to reduce unauthorized access, loss, misuse, or disclosure, but no internet transmission is completely secure.",
            "Subject to applicable law, you may request access, correction, deletion, restriction, or other available privacy rights by contacting us with enough information to verify the request.",
            "Visitors should avoid submitting confidential product ideas, private business plans, or sensitive personal information unless it is needed for the request.",
          ],
        },
        {
          title: "Children and policy updates",
          items: [
            "This website is directed to adult shoppers, business buyers, and partners. Children should not submit personal information or place orders without a parent or legal guardian.",
            "This policy may be updated when website services, providers, laws, or business processes change. The current version and update date are published on this page.",
          ],
        },
      ]}
      note={{
        title: "Policy scope",
        body: "Mandatory privacy rights in a visitor's country or region continue to apply where they cannot lawfully be excluded.",
      }}
    />
  );
}
