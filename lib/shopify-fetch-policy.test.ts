import assert from "node:assert/strict";
import test from "node:test";

import { getShopifyFetchCacheOptions } from "./shopify-fetch-policy.ts";

test("catalog requests use a five-minute Next.js cache", () => {
  assert.deepEqual(getShopifyFetchCacheOptions("catalog"), {
    next: { revalidate: 300 },
  });
});

test("cart and checkout requests bypass caches", () => {
  assert.deepEqual(getShopifyFetchCacheOptions("no-store"), {
    cache: "no-store",
  });
});
