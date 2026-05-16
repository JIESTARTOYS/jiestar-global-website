# JIESTAR Global Website

Official global website for JIESTAR, built as an international building block brand hub for both DTC shopping and B2B cooperation.

The site is designed to support:

- Building block product browsing and future Shopify checkout.
- Wholesale supply inquiries for retailers, distributors, ecommerce sellers, and channel partners.
- Custom product development, OEM / ODM customization, product co-development, exclusive SKUs, and sub-brand partnerships.
- Long-term SEO content through Markdown-based blog pages.

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Shopify Storefront API for product and checkout integration
- Markdown-first content for the first version
- Vercel deployment

Shopify should handle products, cart, checkout, orders, payments, inventory, customer data, refunds, and ecommerce email notifications. Next.js handles the custom frontend, page structure, SEO, and user experience.

## Development Commands

```bash
pnpm dev
pnpm lint
pnpm build
```

Local development runs at:

```text
http://localhost:3000
```

## Current V1 Scope

Implemented routes include:

- Home
- Products
- Product detail template
- Collections
- Wholesale
- Custom Solutions
- About
- Quality & Safety
- Blog index and blog detail pages
- Contact
- Replacement Parts / Missing Pieces
- Shipping Policy
- Returns & Refunds
- Privacy Policy
- Terms of Service
- Sitemap and robots

The current product data uses local mock data when Shopify environment variables are not configured. Once Shopify is configured, product listing and product detail pages can fetch product data through the Shopify Storefront API.

## Environment Variables

Copy `.env.example` to `.env.local` for local development and fill in real values outside version control.

```text
NEXT_PUBLIC_SITE_URL=
SHOPIFY_STORE_DOMAIN=
SHOPIFY_STOREFRONT_ACCESS_TOKEN=
SHOPIFY_API_VERSION=
SHOPIFY_CUSTOMER_ACCOUNT_URL=
CONTACT_EMAIL=
SUPPORT_EMAIL=
```

Do not commit real tokens, API keys, customer data, or private credentials.

`SHOPIFY_CUSTOMER_ACCOUNT_URL` is optional and not secret. Use it when Shopify customer accounts are hosted on a dedicated account domain; otherwise the site falls back to `https://SHOPIFY_STORE_DOMAIN/account`.

## Inquiry Forms

The first version includes a basic `/api/inquiry` endpoint and reusable inquiry form component for wholesale, custom solutions, and contact pages.

The current endpoint validates the submission shape and returns a success response. Email delivery, CRM integration, or form platform integration can be added later when the preferred business workflow is confirmed.

## Content and Assets

Temporary remote images are currently used for layout validation. Replace them with real JIESTAR product, brand, factory, quality, custom development, and B2B cooperation imagery before public launch.

Asset requirements are tracked in `docs/06-asset-checklist.md`.
