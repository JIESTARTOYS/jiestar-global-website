import assert from "node:assert/strict";
import test from "node:test";
import type { Collection, ProductSummary } from "./data.ts";
import { getCollectionsWithProducts } from "./collection-utils.ts";

function product(overrides: Partial<ProductSummary> = {}): ProductSummary {
  return {
    id: "product-1",
    handle: "product-1",
    title: "Product 1",
    category: "Vehicles",
    collectionHandle: "vehicles",
    price: "$10.00",
    image: "/image.jpg",
    imageAlt: "Product image",
    sku: "SKU-1",
    pieceCount: "100 pcs",
    recommendedAge: "8+",
    usWarehouseEligible: false,
    ...overrides,
  };
}

test("getCollectionsWithProducts excludes sub-brand collections from category lists", () => {
  const collections: Collection[] = [
    {
      handle: "vehicles",
      title: "Vehicles",
      description: "Vehicle building block sets.",
    },
    {
      handle: "small-angle",
      title: "Small Angle",
      description: "Small Angle brand collection.",
    },
  ];

  const visibleCollections = getCollectionsWithProducts(collections, [
    product(),
    product({
      id: "small-angle-product",
      collectionHandle: "small-angle",
      category: "Small Angle",
    }),
  ]);

  assert.deepEqual(
    visibleCollections.map((collection) => collection.handle),
    ["vehicles"],
  );
});
