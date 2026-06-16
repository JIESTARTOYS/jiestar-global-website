import assert from "node:assert/strict";
import test from "node:test";
import type { Product } from "./data.ts";
import { toCatalogProducts } from "./catalog-products.ts";

function product(): Product {
  return {
    id: "gid://shopify/Product/1",
    handle: "test-product",
    title: "Test Product",
    category: "Vehicles",
    collectionHandle: "vehicles",
    price: "$99.00",
    image: "https://cdn.shopify.com/main.jpg",
    imageAlt: "Main",
    images: [
      { src: "https://cdn.shopify.com/1.jpg", alt: "1" },
      { src: "https://cdn.shopify.com/2.jpg", alt: "2" },
      { src: "https://cdn.shopify.com/3.jpg", alt: "3" },
    ],
    description: "Searchable description",
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
  };
}

test("toCatalogProducts keeps catalog card data but removes heavy detail payloads", () => {
  const [catalogProduct] = toCatalogProducts([product()]);

  assert.equal(catalogProduct.title, "Test Product");
  assert.equal(catalogProduct.image, "https://cdn.shopify.com/main.jpg");
  assert.deepEqual(catalogProduct.images, [
    { src: "https://cdn.shopify.com/1.jpg", alt: "1" },
    { src: "https://cdn.shopify.com/2.jpg", alt: "2" },
  ]);
  assert.equal(catalogProduct.descriptionHtml, undefined);
  assert.equal(catalogProduct.variants, undefined);
});
