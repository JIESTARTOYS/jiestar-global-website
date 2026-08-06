import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const collectionPageSource = readFileSync("app/collections/[handle]/page.tsx", "utf8");

test("brand collection pages use configured names, headings, metadata, and logos", () => {
  assert.match(collectionPageSource, /subBrandForHandle\.seo\.title/);
  assert.match(collectionPageSource, /subBrandForHandle\.seo\.pageHeading/);
  assert.match(collectionPageSource, /const displayTitle = subBrand\?\.name/);
  assert.match(collectionPageSource, /alt=\{`\$\{subBrand\.name\} brand logo`\}/);
  assert.match(collectionPageSource, /image: subBrandForHandle\.image/);
});

test("brand collection pages render unique guidance and crawlable portfolio links", () => {
  assert.match(collectionPageSource, /subBrand\.seo\.overview\.map/);
  assert.match(collectionPageSource, /subBrand\.seo\.productFocus\.map/);
  assert.match(collectionPageSource, /subBrand\.seo\.selectionGuide/);
  assert.match(collectionPageSource, /subBrand\.seo\.audience/);
  assert.match(collectionPageSource, /getEnabledSubBrands\(\)/);
  assert.match(collectionPageSource, /\{brand\.name\} building block sets/);
  assert.match(collectionPageSource, /href=\{`\/collections\/\$\{brand\.collectionHandle\}`\}/);
});

test("brand collection pages emit collection schema for the current product page", () => {
  assert.match(collectionPageSource, /createBrandCollectionJsonLd/);
  assert.match(collectionPageSource, /products: pagination\.items/);
  assert.match(collectionPageSource, /positionOffset: \(pagination\.currentPage - 1\) \* PRODUCT_PAGE_SIZE/);
  assert.match(collectionPageSource, /pagePath/);
});
