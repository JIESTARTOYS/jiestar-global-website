import assert from "node:assert/strict";
import test from "node:test";

import { isValidProductHandle, SHOPIFY_HANDLE_MAX_LENGTH } from "./product-handle.ts";

test("accepts current Shopify-style product handles", () => {
  assert.equal(isValidProductHandle("guly-1-8-remote-control-drift-stunt-car-model-kit-10659"), true);
  assert.equal(isValidProductHandle("jj9268-jiestar-bird-of-paradise-flower-arrangement-building-set"), true);
  assert.equal(isValidProductHandle("61029"), true);
});

test("rejects image paths, unicode, plus signs, empty values, and malformed encoding", () => {
  assert.equal(isValidProductHandle("58127-white-background.jpg"), false);
  assert.equal(isValidProductHandle("58127-白底.jpg"), false);
  assert.equal(isValidProductHandle("58127-%E7%99%BD%E5%BA%95.jpg"), false);
  assert.equal(isValidProductHandle("51018+51019+51020"), false);
  assert.equal(isValidProductHandle(""), false);
  assert.equal(isValidProductHandle("%E0%A4%A"), false);
});

test("rejects additional path segments and encoded separators", () => {
  assert.equal(isValidProductHandle("valid-handle/extra-path"), false);
  assert.equal(isValidProductHandle("valid-handle%2Fextra-path"), false);
  assert.equal(isValidProductHandle("valid-handle%5Cextra-path"), false);
});

test("rejects handles longer than Shopify's maximum", () => {
  assert.equal(isValidProductHandle("a".repeat(SHOPIFY_HANDLE_MAX_LENGTH)), true);
  assert.equal(isValidProductHandle("a".repeat(SHOPIFY_HANDLE_MAX_LENGTH + 1)), false);
});
