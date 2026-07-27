export type ShopifyFetchCacheMode = "catalog" | "no-store";

export function getShopifyFetchCacheOptions(mode: ShopifyFetchCacheMode) {
  return mode === "catalog"
    ? { next: { revalidate: 300 } }
    : { cache: "no-store" as const };
}
