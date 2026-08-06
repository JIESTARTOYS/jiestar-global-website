export const US_WAREHOUSE_COLLECTION_HANDLE = "us-warehouse";

type CollectionHandle = {
  handle: string;
};

export function isUsWarehouseEligible(collections: CollectionHandle[]) {
  return collections.some((collection) => collection.handle === US_WAREHOUSE_COLLECTION_HANDLE);
}

export function excludeUsWarehouseCollection<T extends CollectionHandle>(collections: T[]) {
  return collections.filter((collection) => collection.handle !== US_WAREHOUSE_COLLECTION_HANDLE);
}
