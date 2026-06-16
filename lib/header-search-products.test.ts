import assert from "node:assert/strict";
import test from "node:test";
import type { Product } from "./data.ts";
import { searchHeaderProducts, toHeaderSearchProducts } from "./header-search-products.ts";

test("toHeaderSearchProducts removes media and rich product fields from layout payloads", () => {
  const product: Product = {
    id: "gid://shopify/Product/1",
    handle: "test-product",
    title: "Test Product",
    category: "Vehicles",
    collectionHandle: "vehicles",
    price: "$99.00",
    image: "https://cdn.shopify.com/image.jpg",
    imageAlt: "Image",
    images: [{ src: "https://cdn.shopify.com/detail.jpg", alt: "Detail" }],
    description: "Long description",
    descriptionHtml: "<img src=\"https://cdn.shopify.com/detail.jpg\">",
    sellingPoint: "Selling point",
    sku: "SKU-1",
    pieceCount: "1000",
    recommendedAge: "8+",
    difficulty: "Medium",
    finishedSize: "",
    packageSize: "",
    material: "",
    shipping: "",
    variantId: "gid://shopify/ProductVariant/1",
    variants: [
      {
        id: "gid://shopify/ProductVariant/1",
        sku: "SKU-1",
        title: "Default",
        price: "$99.00",
        availableForSale: true,
        selectedOptions: [],
        image: { src: "https://cdn.shopify.com/variant.jpg", alt: "Variant" },
      },
    ],
    series: "Collector",
    createdAt: "2026-06-16T00:00:00Z",
  };

  assert.deepEqual(toHeaderSearchProducts([product]), [
    {
      id: "gid://shopify/Product/1",
      handle: "test-product",
      title: "Test Product",
      sku: "SKU-1",
      category: "Vehicles",
      collectionHandle: "vehicles",
      series: "Collector",
    },
  ]);
});

test("searchHeaderProducts returns a small filtered suggestion set", () => {
  const baseProduct: Product = {
    id: "gid://shopify/Product/1",
    handle: "test-product",
    title: "Test Product",
    category: "Vehicles",
    collectionHandle: "vehicles",
    price: "$99.00",
    image: "https://cdn.shopify.com/image.jpg",
    imageAlt: "Image",
    description: "Long description",
    sellingPoint: "Selling point",
    sku: "SKU-1",
    pieceCount: "1000",
    recommendedAge: "8+",
    difficulty: "Medium",
    finishedSize: "",
    packageSize: "",
    material: "",
    shipping: "",
    variantId: "gid://shopify/ProductVariant/1",
    series: "Collector",
    createdAt: "2026-06-16T00:00:00Z",
  };

  const results = searchHeaderProducts(
    [
      baseProduct,
      { ...baseProduct, id: "gid://shopify/Product/2", handle: "city-car", title: "City Car", sku: "CAR-2" },
      { ...baseProduct, id: "gid://shopify/Product/3", handle: "space-kit", title: "Space Kit", sku: "SPACE-3" },
    ],
    "car",
  );

  assert.deepEqual(results, [
    {
      id: "gid://shopify/Product/2",
      handle: "city-car",
      title: "City Car",
      sku: "CAR-2",
      category: "Vehicles",
      collectionHandle: "vehicles",
      series: "Collector",
    },
  ]);

  assert.deepEqual(searchHeaderProducts([baseProduct], "s"), []);
});
