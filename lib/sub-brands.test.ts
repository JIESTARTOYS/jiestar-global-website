import assert from "node:assert/strict";
import test from "node:test";
import {
  getEnabledSubBrands,
  getEnabledSubBrandCollectionHandles,
  getSubBrandByCollectionHandle,
  isSubBrandCollectionEnabled,
  isSubBrandCollectionHandle,
  subBrands,
} from "./sub-brands.ts";

test("subBrands expose Shopify collection handles for clickable brand cards", () => {
  const handlesByName = Object.fromEntries(subBrands.map((brand) => [brand.name, brand.collectionHandle]));

  assert.deepEqual(handlesByName, {
    JIESTAR: "jiestar",
    iBlock: "iblock",
    Xbert: "xbert",
    TKTWO: "tk-two",
    GULY: "guly",
    ZOIN: "zoin",
    JIQI: "jiqi",
    "Small Angle": "small-angle",
  });
});

test("Small Angle stays registered but is disabled for public collection navigation", () => {
  const smallAngle = subBrands.find((brand) => brand.name === "Small Angle");

  assert.equal(smallAngle?.collectionHandle, "small-angle");
  assert.equal(smallAngle?.isCollectionEnabled, false);
  assert.equal(isSubBrandCollectionHandle("small-angle"), true);
  assert.equal(isSubBrandCollectionEnabled("small-angle"), false);
  assert.deepEqual(getEnabledSubBrandCollectionHandles().includes("small-angle"), false);
});

test("getSubBrandByCollectionHandle returns the display logo data for a brand collection", () => {
  const brand = getSubBrandByCollectionHandle("tk-two");

  assert.equal(brand?.name, "TKTWO");
  assert.equal(brand?.image, "/images/sub-brands/tktwo-logo.png");
  assert.equal(getSubBrandByCollectionHandle("vehicles"), undefined);
});

test("ZOIN uses the current high resolution logo asset", () => {
  const brand = getSubBrandByCollectionHandle("zoin");

  assert.equal(brand?.name, "ZOIN");
  assert.equal(brand?.image, "/images/sub-brands/zoin-logo-high-res-web.png");
  assert.equal(brand?.width, 900);
  assert.equal(brand?.height, 884);
});

test("subBrands include collection-page introductions", () => {
  for (const brand of subBrands) {
    assert.ok(brand.collectionDescription, `${brand.name} needs a collection page introduction`);
    assert.ok(brand.collectionDescription.length >= 100, `${brand.name} introduction should be substantial`);
    assert.notEqual(brand.collectionDescription, "Explore JIESTAR building block sets in this collection.");
  }
});

test("public brand collections expose distinct search metadata and substantial page content", () => {
  const enabledBrands = getEnabledSubBrands();
  const titles = new Set(enabledBrands.map((brand) => brand.seo.title));
  const descriptions = new Set(enabledBrands.map((brand) => brand.seo.description));

  assert.equal(enabledBrands.length, 7);
  assert.equal(titles.size, enabledBrands.length);
  assert.equal(descriptions.size, enabledBrands.length);

  for (const brand of enabledBrands) {
    const visibleCopy = [
      ...brand.seo.overview,
      ...brand.seo.productFocus.flatMap((focus) => [focus.title, focus.description]),
      brand.seo.selectionGuide,
      brand.seo.audience,
    ].join(" ");
    const wordCount = visibleCopy.trim().split(/\s+/).length;

    assert.ok(brand.seo.title.startsWith(brand.name), `${brand.name} title should lead with the brand name`);
    assert.ok(brand.seo.title.length <= 60, `${brand.name} title should stay concise`);
    assert.ok(
      brand.seo.description.length >= 140 && brand.seo.description.length <= 165,
      `${brand.name} description should be between 140 and 165 characters`,
    );
    assert.match(brand.seo.pageHeading, new RegExp(brand.name, "i"));
    assert.equal(brand.seo.overview.length, 2);
    assert.ok(brand.seo.productFocus.length >= 3, `${brand.name} needs at least three verified product directions`);
    assert.ok(wordCount >= 240 && wordCount <= 400, `${brand.name} page copy should be substantial without padding`);
  }
});

test("Small Angle remains excluded from public brand SEO navigation", () => {
  assert.equal(getEnabledSubBrands().some((brand) => brand.name === "Small Angle"), false);
  assert.equal(getEnabledSubBrandCollectionHandles().includes("small-angle"), false);
});
