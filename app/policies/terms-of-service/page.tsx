import { PolicyPage } from "@/components/ui/PolicyPage";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Terms of Service",
  description: "JIESTAR website terms for retail visitors, support requests, and business cooperation inquiries.",
  path: "/policies/terms-of-service",
});

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms of Service"
      description="These terms explain the basic rules for using the JIESTAR global website, product information, retail checkout paths, support pages, and business inquiry channels."
      sections={[
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
            "Shopify handles checkout, payment processing, order records, customer notifications, and related commerce functions for retail purchases.",
            "A retail order is not final until the checkout process, payment, and order confirmation are completed through the active storefront flow.",
            "JIESTAR may review or cancel orders when required because of inventory errors, checkout issues, suspected misuse, or unavailable shipping coverage.",
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
          title: "Support and policy updates",
          items: [
            "Shipping, replacement parts, returns, refunds, privacy, and other support policies may be updated from time to time.",
            "The most current policy pages on this website should be reviewed before placing an order or submitting a business request.",
            "If a policy question affects an active order or project, contact JIESTAR for written clarification.",
          ],
        },
      ]}
    />
  );
}
