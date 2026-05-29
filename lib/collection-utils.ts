import type { Collection, Product } from "./data";

export function getCollectionProductCount(collection: Collection, products: Product[]) {
  return products.filter(
    (product) => product.collectionHandle === collection.handle || product.category === collection.title,
  ).length;
}

export function getCollectionsWithProducts(collections: Collection[], products: Product[]) {
  return collections.filter((collection) => getCollectionProductCount(collection, products) > 0);
}
