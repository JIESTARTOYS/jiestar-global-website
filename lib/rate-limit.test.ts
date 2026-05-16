import assert from "node:assert/strict";
import test from "node:test";
import { createRateLimiter } from "./rate-limit.ts";

test("createRateLimiter blocks requests after the configured limit", () => {
  const limiter = createRateLimiter({ limit: 2, windowMs: 1000, now: () => 1000 });

  assert.equal(limiter.check("ip:1").allowed, true);
  assert.equal(limiter.check("ip:1").allowed, true);
  assert.equal(limiter.check("ip:1").allowed, false);
});

test("createRateLimiter allows requests after the window resets", () => {
  let now = 1000;
  const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => now });

  assert.equal(limiter.check("ip:1").allowed, true);
  assert.equal(limiter.check("ip:1").allowed, false);

  now = 2500;

  assert.equal(limiter.check("ip:1").allowed, true);
});
