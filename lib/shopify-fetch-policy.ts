export const SHOPIFY_CATALOG_REVALIDATE_SECONDS = 300;

export type ShopifyFetchCacheMode = "catalog" | "no-store";
export type ShopifyRequestKind = "query" | "mutation";

export type ShopifyFailure =
  | { type: "network" }
  | { type: "http"; status: number }
  | { type: "graphql" }
  | { type: "invalid-response" };

type ShopifyCatalogCacheKeyInput = {
  storeDomain: string;
  apiVersion: string;
  operation: string;
  query: string;
  variables?: Record<string, unknown>;
};

function normalizeCacheKeyValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeCacheKeyValue(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, normalizeCacheKeyValue(item)]),
    );
  }

  return value;
}

function serializeCacheKeyValue(value: unknown): string {
  if (value === undefined) {
    return "undefined";
  }

  return JSON.stringify(normalizeCacheKeyValue(value)) ?? "undefined";
}

export function getShopifyOriginFetchOptions() {
  return { cache: "no-store" as const };
}

export function getShopifyCatalogCacheOptions() {
  return { revalidate: SHOPIFY_CATALOG_REVALIDATE_SECONDS };
}

export function getShopifyCatalogCacheKeyParts({
  storeDomain,
  apiVersion,
  operation,
  query,
  variables,
}: ShopifyCatalogCacheKeyInput) {
  return [
    "shopify-catalog-v1",
    storeDomain,
    apiVersion,
    operation,
    query,
    serializeCacheKeyValue(variables),
  ];
}

export function getShopifyMaxAttempts(requestKind: ShopifyRequestKind) {
  return requestKind === "query" ? 3 : 1;
}

export function isRetriableShopifyStatus(status: number) {
  return status === 429 || status >= 500;
}

export function hasShopifyGraphQLErrors(errors: unknown) {
  return Array.isArray(errors) && errors.length > 0;
}

export function shouldRetryShopifyFailure(
  requestKind: ShopifyRequestKind,
  attempt: number,
  failure: ShopifyFailure,
) {
  if (attempt >= getShopifyMaxAttempts(requestKind)) {
    return false;
  }

  if (failure.type === "network") {
    return requestKind === "query";
  }

  return failure.type === "http" && isRetriableShopifyStatus(failure.status);
}
