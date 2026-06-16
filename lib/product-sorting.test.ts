import assert from "node:assert/strict";
import test from "node:test";
import type { Product } from "./data.ts";
import { DEFAULT_PRODUCT_SORT, sortProductsForCatalog } from "./product-sorting.ts";

function product(id: string, createdAt?: string): Product {
  return {
    id,
    handle: id,
    title: id,
    category: "Category",
    collectionHandle: "category",
    price: "$999.00",
    image: "/image.jpg",
    imageAlt: id,
    description: "",
    sellingPoint: "",
    sku: id,
    pieceCount: "",
    recommendedAge: "",
    difficulty: "",
    finishedSize: "",
    packageSize: "",
    material: "",
    shipping: "",
    createdAt,
  };
}

test("DEFAULT_PRODUCT_SORT starts product archives with newest products", () => {
  assert.equal(DEFAULT_PRODUCT_SORT, "newest");
});

test("sortProductsForCatalog sorts newest products first by default", () => {
  const products = [
    product("older", "2026-06-10T00:00:00Z"),
    product("newest", "2026-06-15T00:00:00Z"),
    product("middle", "2026-06-12T00:00:00Z"),
  ];

  assert.deepEqual(
    sortProductsForCatalog(products).map((item) => item.id),
    ["newest", "middle", "older"],
  );
});
