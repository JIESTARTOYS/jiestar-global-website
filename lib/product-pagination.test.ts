import assert from "node:assert/strict";
import test from "node:test";
import { getCompactPaginationItems } from "./product-pagination.ts";

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
