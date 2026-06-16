import assert from "node:assert/strict";
import test from "node:test";
import nextConfig from "../next.config.ts";

test("Next image config keeps generated Shopify srcsets compact", () => {
  assert.deepEqual(nextConfig.images?.deviceSizes, [320, 384, 640, 750, 768]);
  assert.deepEqual(nextConfig.images?.imageSizes, [32, 48, 64, 96, 128, 256, 384]);
});
