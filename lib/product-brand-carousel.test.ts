import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { isSubBrandCollectionEnabled, subBrands } from "./sub-brands.ts";

test("products page uses a sub-brand carousel instead of category carousel for the top showcase", () => {
  assert.ok(existsSync("components/product/BrandCollectionCarousel.tsx"), "Expected products brand carousel component");

  const productCatalogSource = readFileSync("components/product/ProductCatalog.tsx", "utf8");
  const brandCarouselSource = readFileSync("components/product/BrandCollectionCarousel.tsx", "utf8");

  assert.match(productCatalogSource, /import \{ BrandCollectionCarousel \}/);
  assert.match(productCatalogSource, /import \{ subBrands \}/);
  assert.match(productCatalogSource, /<BrandCollectionCarousel brands=\{subBrands\} \/>/);
  assert.doesNotMatch(productCatalogSource, /<CategoryCarousel collections=\{visibleCollections\} products=\{allProducts\} \/>/);

  const enabledBrands = subBrands.filter(
    (brand) => brand.collectionHandle && isSubBrandCollectionEnabled(brand.collectionHandle),
  );

  for (const brand of enabledBrands) {
    assert.ok(brand.collectionHandle, `${brand.name} needs a collection handle`);
    assert.match(brandCarouselSource, new RegExp(`/collections/\\$\\{brand\\.collectionHandle\\}`));
  }

  assert.equal(isSubBrandCollectionEnabled("small-angle"), false);
  assert.match(brandCarouselSource, /isSubBrandCollectionEnabled/);
  assert.doesNotMatch(brandCarouselSource, /products\?category=/);
  assert.doesNotMatch(brandCarouselSource, /brand\.description/);
  assert.match(brandCarouselSource, /LinkedSubBrand/);
  assert.match(brandCarouselSource, /linkedBrands\.map/);
});
