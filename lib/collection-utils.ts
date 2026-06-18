import type { Collection, ProductSummary } from "./data";

export function getCollectionProductCount(collection: Collection, products: ProductSummary[]) {
  return products.filter(
    (product) => product.collectionHandle === collection.handle || product.category === collection.title,
  ).length;
}

export function getCollectionsWithProducts(collections: Collection[], products: ProductSummary[]) {
  return collections.filter((collection) => getCollectionProductCount(collection, products) > 0);
}
