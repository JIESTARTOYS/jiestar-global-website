import assert from "node:assert/strict";
import test from "node:test";
import {
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
