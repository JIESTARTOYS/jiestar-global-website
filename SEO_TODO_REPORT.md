# SEO TODO Report — Skipped Items Requiring Design Changes or Business Confirmation

Date: 2026-07-03
These recommendations were intentionally NOT implemented because they would require layout/design changes, business data confirmation, or carry regression risk. Preserve-design rule applied.

## Requires business confirmation (no fake claims allowed)

1. **Product schema `offers`** — omitted whenever the price is the $999 placeholder (existing guard). If real public prices are confirmed for more products, richer Offer data (priceValidUntil, shippingDetails) could be added.
2. **MOQ / lead time / production capacity figures** — task file forbids inventing these. Wholesale and Custom Solutions copy stays generic ("contact our team to discuss MOQ..."). If the business confirms real MOQ/lead-time ranges, adding them to the existing FAQ answers would strengthen long-tail queries like "building blocks wholesale MOQ".
3. **Organization `sameAs` social profiles** — no verified social URLs found in project config; not invented. Add official TikTok/Instagram/YouTube/LinkedIn URLs to `createOrganizationJsonLd()` once confirmed.
4. **Homepage stats (100+ countries, 20M+ builders, 200+ partners)** — already visible on the site; left untouched. Confirm these are defensible before further amplifying them in metadata or schema.

## Requires layout/design changes (forbidden in this task)

5. **Visible breadcrumb UI** — BreadcrumbList JSON-LD exists, but there is no visible breadcrumb trail on product/collection pages. Adding one would improve UX + SEO but changes layout.
6. **FAQ schema on Wholesale/Custom pages** — both pages have existing FAQ sections; FAQPage JSON-LD could be added safely later (schema-only, low risk), but Google now shows FAQ rich results only for limited sites, so value is modest. Deferred to keep this diff small.
7. **Longer collection descriptions** — collection pages use a generated one-line SEO description. An 80–180 word visible description area would help category long-tail SEO but needs a designed text block.
8. **Dedicated landing pages** for "building block manufacturer China", "wholesale building blocks for Amazon sellers", etc. — currently served by blog articles; standalone landing pages would be a design/IA project.

## Technical items to monitor (not changed)

9. **robots.txt `/*?*` disallow** — blocks all query-string URLs, including `/products?page=N` pagination and `?q=` search. Deep catalog pages are still discoverable via the sitemap (all product URLs listed), so this is acceptable, but if crawl coverage of the catalog looks weak in Search Console, consider allowing `?page=` with a canonical-to-self pattern instead. Left as-is to avoid duplicate-content risk.
10. **Blog article length** — current articles run ~470–950 words vs. the task's 900–1400 recommendation. Content quality is fine and non-spammy; expand top performers (wholesale guide, OEM vs ODM) with real detail (photos, real MOQ/packaging specifics) once business facts are confirmed.
11. **Root-page layout title fallback** — `app/layout.tsx` keeps its default title/template as a fallback for routes without explicit metadata (e.g. not-found). All real pages now use absolute titles.
12. **hreflang / multi-language** — out of scope for Version 1 per project rules.
13. **Image OG dimensions** — the default OG image is the brand logo; a dedicated 1200×630 OG banner image would render better in link previews. Needs a designed asset.
