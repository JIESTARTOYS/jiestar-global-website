import assert from "node:assert/strict";
import test from "node:test";

import { StaleDataCache } from "./stale-data-cache.ts";

test("StaleDataCache reuses a successful value during its TTL", async () => {
  let now = 1_000;
  let loadCount = 0;
  const cache = new StaleDataCache<string>(300_000, () => now);
  const loader = async () => {
    loadCount += 1;
    return "catalog";
  };

  const first = await cache.get(loader);
  now += 60_000;
  const second = await cache.get(loader);

  assert.deepEqual(first, { value: "catalog", source: "loaded" });
  assert.deepEqual(second, { value: "catalog", source: "fresh" });
  assert.equal(loadCount, 1);
});

test("StaleDataCache returns the last successful value when refresh fails", async () => {
  let now = 1_000;
  const cache = new StaleDataCache<string>(300_000, () => now);

  await cache.get(async () => "catalog");
  now += 300_001;

  const refreshError = new Error("temporary Shopify failure");
  const result = await cache.get(async () => {
    throw refreshError;
  });

  assert.equal(result.value, "catalog");
  assert.equal(result.source, "stale");
  assert.equal(result.error, refreshError);
});

test("StaleDataCache surfaces an initial load failure", async () => {
  const cache = new StaleDataCache<string>(300_000);

  await assert.rejects(
    cache.get(async () => {
      throw new Error("Shopify unavailable");
    }),
    /Shopify unavailable/,
  );
});

test("StaleDataCache coalesces concurrent refreshes", async () => {
  let resolveLoader: ((value: string) => void) | undefined;
  let loadCount = 0;
  const cache = new StaleDataCache<string>(300_000);
  const loader = () => {
    loadCount += 1;
    return new Promise<string>((resolve) => {
      resolveLoader = resolve;
    });
  };

  const first = cache.get(loader);
  const second = cache.get(loader);
  resolveLoader?.("catalog");

  assert.deepEqual(await first, { value: "catalog", source: "loaded" });
  assert.deepEqual(await second, { value: "catalog", source: "loaded" });
  assert.equal(loadCount, 1);
});
