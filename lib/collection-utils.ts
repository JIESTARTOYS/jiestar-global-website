import type { Collection, ProductSummary } from "./data";
import { isSubBrandCollectionHandle } from "./sub-brands.ts";

export function getCollectionProductCount(collection: Collection, products: ProductSummary[]) {
  return products.filter(
    (product) => product.collectionHandle === collection.handle || product.category === collection.title,
  ).length;
}

export function getCollectionsWithProducts(collections: Collection[], products: ProductSummary[]) {
  return collections.filter(
    (collection) => !isSubBrandCollectionHandle(collection.handle) && getCollectionProductCount(collection, products) > 0,
  );
}
