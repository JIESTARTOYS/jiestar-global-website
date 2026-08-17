import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  getShopifyCatalogCacheKeyParts,
  getShopifyCatalogCacheOptions,
  getShopifyMaxAttempts,
  getShopifyOriginFetchOptions,
  hasShopifyGraphQLErrors,
  isRetriableShopifyStatus,
  shouldRetryShopifyFailure,
} from "./shopify-fetch-policy.ts";

test("raw Shopify requests always bypass the fetch cache", () => {
  assert.deepEqual(getShopifyOriginFetchOptions(), {
    cache: "no-store",
  });
});

test("parsed catalog data uses a five-minute Next.js cache", () => {
  assert.deepEqual(getShopifyCatalogCacheOptions(), {
    revalidate: 300,
  });
});

test("catalog cache keys include source, operation, query, and stable variables", () => {
  const input = {
    storeDomain: "example.myshopify.com",
    apiVersion: "2026-01",
    operation: "getShopifyProduct",
    query: "query Product($handle: String!) { product(handle: $handle) { id } }",
  };
  const first = getShopifyCatalogCacheKeyParts({
    ...input,
    variables: { cursor: undefined, handle: "model-kit" },
  });
  const reordered = getShopifyCatalogCacheKeyParts({
    ...input,
    variables: { handle: "model-kit", cursor: undefined },
  });
  const differentHandle = getShopifyCatalogCacheKeyParts({
    ...input,
    variables: { handle: "other-model" },
  });

  assert.deepEqual(first, reordered);
  assert.notDeepEqual(first, differentHandle);
  assert.deepEqual(first.slice(0, 5), [
    "shopify-catalog-v1",
    input.storeDomain,
    input.apiVersion,
    input.operation,
    input.query,
  ]);
  assert.equal(first.join("\n").includes("storefront-token"), false);
});

test("queries allow three attempts while mutations allow only one", () => {
  assert.equal(getShopifyMaxAttempts("query"), 3);
  assert.equal(getShopifyMaxAttempts("mutation"), 1);
});

test("only 429 and 5xx HTTP statuses are retriable", () => {
  assert.equal(isRetriableShopifyStatus(429), true);
  assert.equal(isRetriableShopifyStatus(500), true);
  assert.equal(isRetriableShopifyStatus(503), true);
  assert.equal(isRetriableShopifyStatus(400), false);
  assert.equal(isRetriableShopifyStatus(401), false);
  assert.equal(isRetriableShopifyStatus(403), false);
  assert.equal(isRetriableShopifyStatus(404), false);
});

test("queries retry network and transient HTTP failures within their attempt budget", () => {
  assert.equal(shouldRetryShopifyFailure("query", 1, { type: "network" }), true);
  assert.equal(shouldRetryShopifyFailure("query", 2, { type: "http", status: 503 }), true);
  assert.equal(shouldRetryShopifyFailure("query", 3, { type: "network" }), false);
  assert.equal(shouldRetryShopifyFailure("query", 1, { type: "http", status: 401 }), false);
});

test("mutations, GraphQL errors, and invalid responses are never retried", () => {
  assert.equal(shouldRetryShopifyFailure("mutation", 1, { type: "network" }), false);
  assert.equal(shouldRetryShopifyFailure("mutation", 1, { type: "http", status: 503 }), false);
  assert.equal(shouldRetryShopifyFailure("query", 1, { type: "graphql" }), false);
  assert.equal(shouldRetryShopifyFailure("query", 1, { type: "invalid-response" }), false);
});

test("GraphQL error classification requires a non-empty errors array", () => {
  assert.equal(hasShopifyGraphQLErrors([{ message: "Throttled" }]), true);
  assert.equal(hasShopifyGraphQLErrors([]), false);
  assert.equal(hasShopifyGraphQLErrors(undefined), false);
  assert.equal(hasShopifyGraphQLErrors({ message: "not-an-array" }), false);
});

test("cart mutations are no-store and never use the query retry policy", () => {
  const shopifySource = readFileSync(new URL("./shopify.ts", import.meta.url), "utf8");

  for (const operation of ["createCart", "addCartLine", "updateCartLine", "removeCartLine"]) {
    const callPolicy = new RegExp(
      `operation:\\s*"${operation}"[\\s\\S]{0,100}?cache:\\s*"no-store"[\\s\\S]{0,100}?requestKind:\\s*"mutation"`,
    );

    assert.match(shopifySource, callPolicy, `${operation} must not be cached or automatically replayed`);
  }

  assert.match(
    shopifySource,
    /operation:\s*"getCart"[\s\S]{0,100}?cache:\s*"no-store"[\s\S]{0,100}?requestKind:\s*"query"/,
  );
});
