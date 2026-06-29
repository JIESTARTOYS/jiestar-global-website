import assert from "node:assert/strict";
import test from "node:test";
import { getSubBrandByCollectionHandle, subBrands } from "./sub-brands.ts";

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

test("getSubBrandByCollectionHandle returns the display logo data for a brand collection", () => {
  const brand = getSubBrandByCollectionHandle("tk-two");

  assert.equal(brand?.name, "TKTWO");
  assert.equal(brand?.image, "/images/sub-brands/tktwo-logo.png");
  assert.equal(getSubBrandByCollectionHandle("vehicles"), undefined);
});

test("subBrands include collection-page introductions", () => {
  for (const brand of subBrands) {
    assert.ok(brand.collectionDescription, `${brand.name} needs a collection page introduction`);
    assert.ok(brand.collectionDescription.length >= 100, `${brand.name} introduction should be substantial`);
    assert.notEqual(brand.collectionDescription, "Explore JIESTAR building block sets in this collection.");
  }
});
