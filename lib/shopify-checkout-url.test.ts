import assert from "node:assert/strict";
import test from "node:test";

import { applyShopifyCheckoutDomain } from "./shopify-checkout-url.ts";

test("uses the configured checkout host without changing the cart path or query", () => {
  const checkoutUrl =
    "https://jiestartoys.myshopify.com/cart/c/cart-token?key=cart-key&_s=session&_y=visitor";

  assert.equal(
    applyShopifyCheckoutDomain(checkoutUrl, "checkout.jiestartoys.com"),
    "https://checkout.jiestartoys.com/cart/c/cart-token?key=cart-key&_s=session&_y=visitor",
  );
});

test("accepts an HTTPS checkout origin", () => {
  assert.equal(
    applyShopifyCheckoutDomain(
      "https://jiestartoys.myshopify.com/checkouts/cn/checkout-token/en-us?key=checkout-key",
      "https://checkout.jiestartoys.com",
    ),
    "https://checkout.jiestartoys.com/checkouts/cn/checkout-token/en-us?key=checkout-key",
  );
});

test("returns the original checkout URL when no valid domain is configured", () => {
  const checkoutUrl = "https://jiestartoys.myshopify.com/cart/c/cart-token?key=cart-key";

  assert.equal(applyShopifyCheckoutDomain(checkoutUrl), checkoutUrl);
  assert.equal(applyShopifyCheckoutDomain(checkoutUrl, "http://checkout.jiestartoys.com"), checkoutUrl);
  assert.equal(applyShopifyCheckoutDomain(checkoutUrl, "https://checkout.jiestartoys.com/unexpected"), checkoutUrl);
});
