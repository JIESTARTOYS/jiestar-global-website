import assert from "node:assert/strict";
import test from "node:test";
import { rewriteCheckoutUrl } from "./checkout-url.ts";

test("rewriteCheckoutUrl preserves the Shopify checkout path and query", () => {
  assert.equal(
    rewriteCheckoutUrl(
      "https://jiestartoys.myshopify.com/checkouts/cn/token?key=value",
      "checkout.jiestartoys.com",
    ),
    "https://checkout.jiestartoys.com/checkouts/cn/token?key=value",
  );
});

test("rewriteCheckoutUrl falls back when no valid HTTPS domain is configured", () => {
  const checkoutUrl = "https://jiestartoys.myshopify.com/checkouts/cn/token";

  assert.equal(rewriteCheckoutUrl(checkoutUrl), checkoutUrl);
  assert.equal(rewriteCheckoutUrl(checkoutUrl, "http://checkout.jiestartoys.com"), checkoutUrl);
  assert.equal(rewriteCheckoutUrl("not-a-url", "checkout.jiestartoys.com"), "not-a-url");
});
