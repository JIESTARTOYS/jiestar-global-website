import { PolicyPage } from "@/components/ui/PolicyPage";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Terms of Service | JIESTAR Toys",
  description: "JIESTAR website terms for retail visitors, support requests, and business cooperation inquiries.",
  path: "/policies/terms-of-service",
});

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms of Service"
      description="These terms govern use of the JIESTAR global website and eligible retail orders sold by HONG KONG ZHILE TRADING CO., LIMITED."
      updatedLabel="Last updated July 24, 2026"
      sections={[
        {
          title: "Merchant and website operator",
          body: "HONG KONG ZHILE TRADING CO., LIMITED operates this international website and is the seller and merchant of record for eligible retail orders placed through it. JIESTAR is the customer-facing trade name used on the website.",
          items: [
            "Guangdong Jiexing Toys Industrial Co., Ltd. is responsible for the JIESTAR brand, product development, manufacturing, and supply.",
            "The Hong Kong company is authorized to operate JIESTAR international sales channels and handle retail orders, payments, customer support, returns, and refunds for this website.",
            "The full company registration, business registration, address, telephone, and email details are displayed on this page and on the Business & Legal Information page.",
          ],
        },
        {
          title: "Use of the website",
          items: [
            "Visitors should use the JIESTAR website, product pages, support pages, and inquiry forms in a lawful and responsible way.",
            "Website content is provided for product browsing, retail purchase preparation, customer support, and business cooperation evaluation.",
            "Visitors should not misuse forms, attempt unauthorized access, copy website content for misleading purposes, or interfere with website operation.",
          ],
        },
        {
          title: "Product information",
          body: "JIESTAR works to present product information clearly, but product details may change as collections, packaging, Shopify data, and market availability are updated.",
          items: [
            "Prices, product availability, SKU information, images, specifications, shipping options, and promotions may change without prior notice.",
            "Piece count, recommended age, model size, package size, and other specifications should be reviewed on the product page and final order confirmation.",
            "Product colors, packaging, and details may vary slightly due to production updates, screen settings, or market-specific requirements.",
          ],
        },
        {
          title: "Checkout and payments",
          items: [
            "Retail checkout is provided through Shopify. Payments may be processed by the payment methods and regulated payment providers displayed at checkout.",
            "A retail order is not final until the checkout process, payment, and order confirmation are completed through the active storefront flow.",
            "JIESTAR may review or cancel orders when required because of inventory errors, checkout issues, suspected misuse, or unavailable shipping coverage.",
            "The customer must provide complete and accurate billing, contact, and delivery information. Fraud screening, authentication, or additional verification may apply.",
          ],
        },
        {
          title: "Shipping, returns, and refunds",
          items: [
            "Processing times, delivery estimates, shipping charges, tracking, taxes, and duties are described in the Shipping Policy and at checkout.",
            "Retail return eligibility, authorization, return costs, damaged or incorrect items, and refund timing are described in the Returns & Refunds policy.",
            "Nothing in these terms limits consumer rights that cannot lawfully be excluded in the customer's country or region.",
          ],
        },
        {
          title: "Business cooperation",
          body: "Wholesale supply, factory-direct supply, OEM / ODM customization, product co-development, exclusive SKU programs, exclusive product lines, and sub-brand partnerships require direct confirmation with the JIESTAR business team.",
          items: [
            "MOQ, quotation, sample cost, tooling, packaging customization, lead time, payment terms, shipping terms, and exclusivity are not confirmed by website inquiry alone.",
            "Business cooperation details become binding only when both parties confirm the relevant written quotation, purchase order, agreement, or approved project document.",
            "JIESTAR may decline inquiries that do not fit product capability, compliance requirements, production schedule, or brand cooperation direction.",
          ],
        },
        {
          title: "Intellectual property",
          body: "Website text, product images, logos, product designs, catalogs, and other materials may be protected by trademark, copyright, design, or other intellectual property rights.",
          items: [
            "Visitors may use the website for personal shopping or legitimate business evaluation but may not reproduce, misrepresent, sell, or exploit protected content without authorization.",
            "Company registration does not itself grant ownership of third-party trademarks or intellectual property.",
          ],
        },
        {
          title: "Governing law and disputes",
          body: "These terms and retail transactions with HONG KONG ZHILE TRADING CO., LIMITED are governed by the laws of the Hong Kong Special Administrative Region, without excluding mandatory consumer protections that apply in the customer's place of residence.",
          items: [
            "The parties should first try to resolve questions or complaints through the contact details shown on this website.",
            "Subject to any mandatory consumer forum rights, disputes are submitted to the non-exclusive jurisdiction of the courts of Hong Kong.",
            "If a provision is unenforceable, the remaining provisions continue to apply.",
          ],
        },
        {
          title: "Updates and contact",
          items: [
            "These terms and related policies may be updated to reflect operational, legal, checkout, or service changes.",
            "The version published when an order is placed applies to that order unless mandatory law requires otherwise.",
            "Contact JIESTAR using the business telephone or email displayed below for questions about these terms or an active order.",
          ],
        },
      ]}
    />
  );
}
