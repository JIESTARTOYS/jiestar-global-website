import assert from "node:assert/strict";
import test from "node:test";
import type { Product } from "./data.ts";
import {
  createBreadcrumbJsonLd,
  createBlogPostingJsonLd,
  createMerchantReturnPolicyJsonLd,
  createMetadata,
  createOrganizationJsonLd,
  createProductJsonLd,
  createShippingPolicyJsonLd,
  createWebSiteJsonLd,
  getDisplayPrice,
  getProductHighlights,
  getProductSeoDescription,
  isPlaceholderPrice,
  retailShippingCountryCodes,
} from "./seo.ts";

const product: Product = {
  id: "gid://shopify/Product/1",
  handle: "sample-train-set",
  title: "Sample Train Building Block Set",
  category: "Trains",
  collectionHandle: "trains",
  price: "$999.00",
  image: "https://cdn.example.com/train.webp",
  imageAlt: "Sample train product image",
  description: "",
  sellingPoint: "A train-themed building block set.",
  sku: "JS-TR-100",
  pieceCount: "968 pcs",
  recommendedAge: "12+",
  difficulty: "Intermediate",
  finishedSize: "42 x 8 x 12 cm",
  packageSize: "48 x 32 x 8 cm",
  material: "ABS plastic",
  shipping: "Calculated at checkout.",
};

test("isPlaceholderPrice identifies known quote-only placeholder prices", () => {
  assert.equal(isPlaceholderPrice("$999.00"), true);
  assert.equal(isPlaceholderPrice("999"), true);
  assert.equal(isPlaceholderPrice("USD 999.00"), true);
  assert.equal(isPlaceholderPrice("$89.00"), false);
});

test("getDisplayPrice replaces placeholder prices with request-quote copy", () => {
  assert.deepEqual(getDisplayPrice("$999.00"), {
    label: "Request Quote",
    caption: "Wholesale pricing available after inquiry",
    isQuoteOnly: true,
  });
});

test("createProductJsonLd excludes offers when price is a placeholder", () => {
  const schema = createProductJsonLd(product, {
    description: "Sample crawlable product description.",
    path: "/products/sample-train-set",
  });

  assert.equal(schema["@type"], "Product");
  assert.equal(schema.name, "Sample Train Building Block Set");
  assert.equal(schema.sku, "JS-TR-100");
  assert.equal("offers" in schema, false);
});

test("createProductJsonLd links valid offers to shipping and return policies", () => {
  const schema = createProductJsonLd(
    { ...product, price: "$89.00" },
    {
      description: "Sample crawlable product description.",
      path: "/products/sample-train-set",
    },
  );
  const offer = schema.offers as Record<string, unknown>;

  assert.equal(offer.itemCondition, "https://schema.org/NewCondition");
  assert.deepEqual(offer.shippingDetails, {
    "@type": "OfferShippingDetails",
    hasShippingService: {
      "@id": "https://www.jiestartoys.com/policies/shipping-policy#standard-shipping",
    },
  });
  assert.deepEqual(offer.hasMerchantReturnPolicy, {
    "@id": "https://www.jiestartoys.com/policies/refund-policy#return-policy",
  });
});

test("createShippingPolicyJsonLd exposes the supported markets and delivery periods", () => {
  const schema = createShippingPolicyJsonLd();
  const service = schema.hasShippingService;
  const destinations = service.shippingConditions.shippingDestination;

  assert.equal(schema["@id"], "https://www.jiestartoys.com/#organization");
  assert.equal(service["@id"], "https://www.jiestartoys.com/policies/shipping-policy#standard-shipping");
  assert.equal(service.handlingTime.duration.minValue, 1);
  assert.equal(service.handlingTime.duration.maxValue, 3);
  assert.equal(service.shippingConditions.transitTime.duration.minValue, 7);
  assert.equal(service.shippingConditions.transitTime.duration.maxValue, 16);
  assert.deepEqual(
    destinations.map((destination) => destination.addressCountry),
    [...retailShippingCountryCodes],
  );
  assert.equal("shippingRate" in service.shippingConditions, false);
});

test("createMerchantReturnPolicyJsonLd describes the 14-day fee responsibilities", () => {
  const schema = createMerchantReturnPolicyJsonLd();
  const policy = schema.hasMerchantReturnPolicy;

  assert.equal(policy["@id"], "https://www.jiestartoys.com/policies/refund-policy#return-policy");
  assert.equal(policy.merchantReturnLink, "https://www.jiestartoys.com/policies/refund-policy");
  assert.equal(policy.merchantReturnDays, 14);
  assert.equal(policy.returnMethod, "https://schema.org/ReturnByMail");
  assert.equal(policy.customerRemorseReturnFees, "https://schema.org/ReturnFeesCustomerResponsibility");
  assert.equal(policy.itemDefectReturnFees, "https://schema.org/FreeReturn");
  assert.deepEqual(policy.applicableCountry, [...retailShippingCountryCodes]);
});

test("createMetadata emits absolute titles so the layout template does not double-append the brand", () => {
  const metadata = createMetadata({
    title: "Wholesale Building Blocks & Brick Sets | JIESTAR Factory Supply",
    description: "Sample description.",
    path: "/wholesale",
  });

  assert.deepEqual(metadata.title, {
    absolute: "Wholesale Building Blocks & Brick Sets | JIESTAR Factory Supply",
  });
  assert.equal(
    (metadata.alternates as { canonical: string }).canonical,
    "https://www.jiestartoys.com/wholesale",
  );
});

test("createWebSiteJsonLd exposes brand alternate names on the site entity", () => {
  const schema = createWebSiteJsonLd();

  assert.equal(schema["@type"], "WebSite");
  assert.ok(schema.alternateName.includes("Jie Star"));
});

test("createBreadcrumbJsonLd builds clean absolute item URLs", () => {
  const schema = createBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Wholesale", path: "/wholesale" },
  ]);

  assert.equal(schema["@type"], "BreadcrumbList");
  assert.equal(schema.itemListElement[1].item, "https://www.jiestartoys.com/wholesale");
});

test("createOrganizationJsonLd identifies the Hong Kong online seller", () => {
  const schema = createOrganizationJsonLd();

  assert.equal(schema["@type"], "Organization");
  assert.equal(schema["@id"], "https://www.jiestartoys.com/#organization");
  assert.equal(schema.name, "HONG KONG ZHILE TRADING CO., LIMITED");
  assert.equal(schema.legalName, "HONG KONG ZHILE TRADING CO., LIMITED");
  assert.equal(schema.telephone, "+8613710335072");
  assert.equal(schema.address.addressCountry, "HK");
  assert.equal(schema.logo, "https://www.jiestartoys.com/images/brand/jiestar-logo-color.png");
  assert.ok(schema.alternateName.includes("香港智樂貿易有限公司"));
  assert.equal(schema.brand.name, "JIESTAR");
});

test("createBlogPostingJsonLd includes cover image and honest publication dates", () => {
  const schema = createBlogPostingJsonLd({
    title: "Sample guide",
    description: "A sample guide description.",
    datePublished: "2026-07-10",
    dateModified: "2026-07-11",
    image: "/images/site-visuals/factory/qc-random-inspection.webp",
    path: "/blog/sample-guide",
  });

  assert.equal(schema.datePublished, "2026-07-10");
  assert.equal(schema.dateModified, "2026-07-11");
  assert.equal(
    schema.image,
    "https://www.jiestartoys.com/images/site-visuals/factory/qc-random-inspection.webp",
  );
});

test("product SEO helpers create category-aware crawlable text without fake data", () => {
  const description = getProductSeoDescription(product);
  const highlights = getProductHighlights(product);

  assert.match(description, /Sample Train Building Block Set is a JIESTAR building block set/);
  assert.match(description, /968 pcs/);
  assert.match(description, /wholesale supply, catalog selection, packaging planning/);
  assert.ok(highlights.some((item) => item.includes("train model")));
  assert.ok(highlights.includes("Wholesale catalog and MOQ discussion available"));
});
