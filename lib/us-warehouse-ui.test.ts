import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("the U.S. warehouse page renders a recoverable empty-collection state", () => {
  const page = source("../app/us-warehouse/page.tsx");

  assert.match(page, /getShopifyCollectionSummary\(US_WAREHOUSE_COLLECTION_HANDLE\)/);
  assert.match(page, /Warehouse selection update in progress/);
  assert.match(page, /temporarilyUnavailable/);
  assert.doesNotMatch(page, /notFound\(/);
});

test("catalog, home, and product detail surfaces gate the U.S. badge by eligibility", () => {
  for (const path of [
    "../components/product/CatalogProductCard.tsx",
    "../components/product/ProductCard.tsx",
    "../components/product/ProductDetailTop.tsx",
    "../components/sections/FeaturedProducts.tsx",
  ]) {
    const component = source(path);
    assert.match(component, /product\.usWarehouseEligible/);
    assert.match(component, /UsWarehouseBadge/);
  }

  assert.match(source("../components/product/UsWarehouseBadge.tsx"), /Ships from U\.S\./);
});
