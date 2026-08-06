import assert from "node:assert/strict";
import test from "node:test";
import type { ProductSummary } from "./data.ts";
import { selectProductSearchResults } from "./product-search.ts";

const products: ProductSummary[] = [
  {
    id: "1",
    handle: "jiqi-astronaut-display-model-kit-jq1102",
    title: "JIQI Astronaut Display Model Kit JQ1102",
    category: "Space",
    collectionHandle: "space",
    price: "$99.00",
    image: "https://cdn.shopify.com/main.jpg",
    imageAlt: "Astronaut product image",
    sku: "JQ1102",
    pieceCount: "1723 pcs",
    recommendedAge: "14+",
    usWarehouseEligible: false,
    createdAt: "2026-06-15T07:51:55Z",
  },
  {
    id: "2",
    handle: "jiqi-sirius-mecha-model-kit-jq1149",
    title: "JIQI Sirius Mecha Model Kit JQ1149",
    category: "Mecha & Robots",
    collectionHandle: "mecha-robots",
    price: "$99.00",
    image: "https://cdn.shopify.com/mecha.jpg",
    imageAlt: "Mecha product image",
    sku: "JQ1149",
    pieceCount: "1107 pcs",
    recommendedAge: "14+",
    usWarehouseEligible: false,
    createdAt: "2026-06-15T07:41:16Z",
  },
];

test("selectProductSearchResults ignores short queries", () => {
  assert.deepEqual(selectProductSearchResults(products, "j"), []);
});

test("selectProductSearchResults returns capped lightweight matches", () => {
  assert.deepEqual(selectProductSearchResults(products, "space", 5), [products[0]]);
});
