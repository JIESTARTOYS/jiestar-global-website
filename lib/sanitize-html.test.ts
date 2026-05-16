import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeShopifyHtml } from "./sanitize-html.ts";

test("sanitizeShopifyHtml removes unsafe tags and event handlers", () => {
  const html = `
    <p onclick="alert(1)">Safe text</p>
    <script>alert("xss")</script>
    <img src="https://cdn.shopify.com/image.jpg" onerror="alert(2)" alt="Product">
    <a href="javascript:alert(3)">Bad link</a>
  `;

  const sanitized = sanitizeShopifyHtml(html);

  assert.match(sanitized, /<p>Safe text<\/p>/);
  assert.match(sanitized, /<img src="https:\/\/cdn\.shopify\.com\/image\.jpg" alt="Product">/);
  assert.match(sanitized, /<a>Bad link<\/a>/);
  assert.doesNotMatch(sanitized, /script/i);
  assert.doesNotMatch(sanitized, /onclick/i);
  assert.doesNotMatch(sanitized, /onerror/i);
  assert.doesNotMatch(sanitized, /javascript:/i);
});

test("sanitizeShopifyHtml keeps only a conservative set of tags", () => {
  const html = `<div><h2>Details</h2><iframe src="https://example.com"></iframe><ul><li>One</li></ul></div>`;

  const sanitized = sanitizeShopifyHtml(html);

  assert.equal(sanitized, "<div><h2>Details</h2><ul><li>One</li></ul></div>");
});
