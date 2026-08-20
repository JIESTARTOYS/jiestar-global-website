import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function openingTags(component: string, tagName: "Link" | "LinkButton" | "HeroBannerButton") {
  return component.match(new RegExp(`<${tagName}\\b[\\s\\S]*?>`, "g")) ?? [];
}

const prefetchDisabled = /prefetch\s*=\s*\{\s*false\s*\}/;

test("homepage passes lightweight category cards to ProductCategories", () => {
  const page = source("../app/(default)/page.tsx");
  const categoryMapping = page.match(
    /const\s+productCategories\s*=\s*getCollectionsWithProducts\([\s\S]*?\)\.map\(\s*\(collection\)\s*=>\s*\(\{([\s\S]*?)\}\)\s*\);/,
  );
  const productCategoriesTag = page.match(/<ProductCategories\b[\s\S]*?\/>/);

  assert.ok(categoryMapping, "homepage should derive lightweight category cards on the server");
  assert.ok(productCategoriesTag, "homepage should render ProductCategories");

  const mappedFields = Array.from(categoryMapping[1].matchAll(/^\s*([A-Za-z_$][\w$]*)\s*:/gm), (match) => match[1]);

  assert.deepEqual(
    [...mappedFields].sort(),
    ["handle", "image", "imageAlt", "productCount", "title"].sort(),
  );
  assert.match(productCategoriesTag[0], /\bcategories\s*=\s*\{\s*productCategories\s*\}/);
  assert.doesNotMatch(productCategoriesTag[0], /\b(?:products|collections)\s*=/);
});

test("request-heavy navigation surfaces explicitly disable Next.js prefetch", () => {
  const cases = [
    { label: "Header", path: "../components/layout/Header.tsx", tagName: "Link", minimum: 3 },
    { label: "HeaderMobileNav", path: "../components/layout/HeaderMobileNav.tsx", tagName: "Link", minimum: 2 },
    { label: "Footer", path: "../components/layout/Footer.tsx", tagName: "Link", minimum: 2 },
    { label: "HomeHero", path: "../components/sections/HomeHero.tsx", tagName: "LinkButton", minimum: 2 },
    {
      label: "B2BCooperation",
      path: "../components/sections/B2BCooperation.tsx",
      tagName: "LinkButton",
      minimum: 1,
    },
    {
      label: "QualitySafety",
      path: "../components/sections/QualitySafety.tsx",
      tagName: "LinkButton",
      minimum: 1,
    },
    {
      label: "FinalCTA",
      path: "../components/sections/FinalCTA.tsx",
      tagName: "HeroBannerButton",
      minimum: 2,
    },
    {
      label: "ProductCategories",
      path: "../components/sections/ProductCategories.tsx",
      tagName: "Link",
      marker: "/collections/${category.handle}",
      minimum: 1,
    },
    {
      label: "FeaturedProducts",
      path: "../components/sections/FeaturedProducts.tsx",
      tagName: "Link",
      marker: "/products/${product.handle}",
      minimum: 3,
    },
    {
      label: "SubBrandCarousel",
      path: "../components/sections/SubBrandCarousel.tsx",
      tagName: "Link",
      marker: "/collections/${brand.collectionHandle}",
      minimum: 1,
    },
    {
      label: "CatalogProductCard",
      path: "../components/product/CatalogProductCard.tsx",
      tagName: "Link",
      marker: "/products/${product.handle}",
      minimum: 3,
    },
    {
      label: "ProductCard",
      path: "../components/product/ProductCard.tsx",
      tagName: "Link",
      marker: "/products/${product.handle}",
      minimum: 1,
    },
    {
      label: "CategoryCarousel",
      path: "../components/product/CategoryCarousel.tsx",
      tagName: "Link",
      marker: "/collections/${collection.handle}",
      minimum: 1,
    },
    {
      label: "BrandCollectionCarousel",
      path: "../components/product/BrandCollectionCarousel.tsx",
      tagName: "Link",
      marker: "/collections/${brand.collectionHandle}",
      minimum: 1,
    },
  ] as const;

  for (const item of cases) {
    const tags = openingTags(source(item.path), item.tagName);
    const relevantTags = "marker" in item ? tags.filter((tag) => tag.includes(item.marker)) : tags;

    assert.ok(
      relevantTags.length >= item.minimum,
      `${item.label} should expose at least ${item.minimum} request-relevant ${item.tagName} tag(s)`,
    );

    for (const tag of relevantTags) {
      assert.match(tag, prefetchDisabled, `${item.label} request-relevant links should disable prefetch`);
    }
  }
});
