import assert from "node:assert/strict";
import test from "node:test";
import {
  PRODUCT_PAGE_SIZE,
  buildPaginationHref,
  clampProductPage,
  getCompactPaginationItems,
  normalizeProductPage,
} from "./product-pagination.ts";

test("getCompactPaginationItems shows a compact opening range", () => {
  assert.deepEqual(getCompactPaginationItems(1, 45), [1, 2, 3, 4, "ellipsis", 45]);
});

test("getCompactPaginationItems keeps the current page centered in the middle", () => {
  assert.deepEqual(getCompactPaginationItems(20, 45), [1, "ellipsis", 19, 20, 21, "ellipsis", 45]);
});

test("getCompactPaginationItems shows a compact closing range", () => {
  assert.deepEqual(getCompactPaginationItems(45, 45), [1, "ellipsis", 42, 43, 44, 45]);
});

test("getCompactPaginationItems shows every page when the range is already short", () => {
  assert.deepEqual(getCompactPaginationItems(3, 6), [1, 2, 3, 4, 5, 6]);
});

test("PRODUCT_PAGE_SIZE keeps product and collection archives at 12 items", () => {
  assert.equal(PRODUCT_PAGE_SIZE, 12);
});

test("normalizeProductPage treats invalid or first-page values as page 1", () => {
  assert.equal(normalizeProductPage(undefined), 1);
  assert.equal(normalizeProductPage(""), 1);
  assert.equal(normalizeProductPage("not-a-page"), 1);
  assert.equal(normalizeProductPage("1"), 1);
  assert.equal(normalizeProductPage("3"), 3);
});

test("clampProductPage keeps the page inside the available range", () => {
  assert.equal(clampProductPage(8, 4), 4);
  assert.equal(clampProductPage(0, 4), 1);
  assert.equal(clampProductPage(Number.NaN, 4), 1);
  assert.equal(clampProductPage(2, 4), 2);
  assert.equal(clampProductPage(3, 0), 1);
});

test("buildPaginationHref keeps page 1 clean and appends later pages", () => {
  assert.equal(buildPaginationHref("/collections/vehicles", 1), "/collections/vehicles");
  assert.equal(buildPaginationHref("/collections/vehicles", 2), "/collections/vehicles?page=2");
});
