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
  assert.match(
    sanitized,
    /<img src="https:\/\/cdn\.shopify\.com\/image\.jpg\?width=960" alt="Product" loading="lazy" decoding="async">/,
  );
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

test("sanitizeShopifyHtml slims Shopify detail images at render time", () => {
  const html = `<p><img src="https://cdn.shopify.com/s/files/1/0804/0824/8569/files/detail.jpg?v=123" alt="Detail image"></p>`;

  const sanitized = sanitizeShopifyHtml(html);

  assert.equal(
    sanitized,
    '<p><img src="https://cdn.shopify.com/s/files/1/0804/0824/8569/files/detail.jpg?v=123&amp;width=960" alt="Detail image" loading="lazy" decoding="async"></p>',
  );
});
