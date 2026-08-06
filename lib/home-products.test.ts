import assert from "node:assert/strict";
import test from "node:test";
import type { ProductSummary } from "./data.ts";
import { selectLatestHomeProducts } from "./home-products.ts";

function product(id: string, createdAt: string): ProductSummary {
  return {
    id,
    handle: id,
    title: id,
    category: "Category",
    collectionHandle: "category",
    price: "$999.00",
    image: "/image.jpg",
    imageAlt: id,
    sku: id,
    pieceCount: "",
    recommendedAge: "",
    usWarehouseEligible: false,
    createdAt,
  };
}

test("selectLatestHomeProducts returns the four newest products", () => {
  const products = [
    product("older", "2026-06-10T00:00:00Z"),
    product("newest", "2026-06-15T00:00:00Z"),
    product("middle", "2026-06-12T00:00:00Z"),
    product("oldest", "2026-06-01T00:00:00Z"),
    product("second-newest", "2026-06-14T00:00:00Z"),
  ];

  assert.deepEqual(
    selectLatestHomeProducts(products).map((item) => item.id),
    ["newest", "second-newest", "middle", "older"],
  );
});
