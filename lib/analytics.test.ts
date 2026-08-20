import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyInquiryFailure,
  createCommerceAnalyticsEvent,
  createInquiryAnalyticsEvent,
  createInquiryFailureAnalyticsEvents,
  sanitizeAnalyticsPathname,
  sanitizeAnalyticsUrl,
} from "./analytics.ts";

test("classifyInquiryFailure distinguishes validation, rate-limit, delivery, and network failures", () => {
  assert.deepEqual(classifyInquiryFailure(400), {
    outcome: "validation_failed",
    validated: false,
  });
  assert.deepEqual(classifyInquiryFailure(429), {
    outcome: "rate_limited",
    validated: false,
  });
  assert.deepEqual(classifyInquiryFailure(502), {
    outcome: "delivery_failed",
    validated: true,
  });
  assert.deepEqual(classifyInquiryFailure(503), {
    outcome: "delivery_failed",
    validated: true,
  });
  assert.deepEqual(classifyInquiryFailure(), {
    outcome: "network_failed",
    validated: false,
  });
});

test("a delivery-stage 502 records Validated before Failed with a categorical outcome", () => {
  const sequence = createInquiryFailureAnalyticsEvents(
    {
      locale: "es",
      formType: "contact",
      sourcePath: "/es/contact",
    },
    502,
  );

  assert.deepEqual(sequence.events.map((event) => event.name), [
    "Inquiry Validated",
    "Inquiry Failed",
  ]);
  assert.equal(sequence.events[1].properties.outcome, "delivery_failed");
});

test("createInquiryAnalyticsEvent strips query PII and rejects an invalid product handle", () => {
  const event = createInquiryAnalyticsEvent("Inquiry Failed", {
    locale: "es",
    formType: "wholesale",
    sourcePath: "/es/wholesale?email=private@example.com#message",
    productHandle: "private@example.com",
    outcome: "delivery_failed",
  });

  assert.deepEqual(event, {
    name: "Inquiry Failed",
    properties: {
      locale: "es",
      form_type: "wholesale",
      source_path: "/es/wholesale",
      outcome: "delivery_failed",
    },
  });
  assert.doesNotMatch(JSON.stringify(event), /private@example\.com|message/);
});

test("analytics event builders keep bounded non-PII commerce attribution", () => {
  const inquiryEvent = createInquiryAnalyticsEvent("Inquiry Submitted", {
    locale: "en",
    formType: "contact",
    sourcePath: "/contact",
    productHandle: "city-train-59005",
  });
  const commerceEvent = createCommerceAnalyticsEvent("Begin Checkout", {
    sourcePath: "/products/city-train-59005?ref=email",
    productHandle: "city-train-59005",
    checkoutType: "buy_now",
    cartQuantity: 1.4,
  });

  assert.equal(inquiryEvent.properties.product_handle, "city-train-59005");
  assert.deepEqual(commerceEvent, {
    name: "Begin Checkout",
    properties: {
      source_path: "/products/city-train-59005",
      product_handle: "city-train-59005",
      checkout_type: "buy_now",
      cart_quantity: 1,
    },
  });
});

test("sanitizeAnalyticsPathname rejects non-path input and bounds long paths", () => {
  assert.equal(sanitizeAnalyticsPathname("buyer@example.com"), "/");
  assert.equal(sanitizeAnalyticsPathname("/buyer@example.com"), "/");
  assert.equal(sanitizeAnalyticsPathname(`/${"a".repeat(400)}`).length, 240);
});

test("sanitizeAnalyticsUrl removes query strings, fragments, and URL credentials", () => {
  assert.equal(
    sanitizeAnalyticsUrl(
      "https://buyer%40example.com:secret@www.jiestartoys.com/contact?email=buyer@example.com#whatsapp",
    ),
    "https://www.jiestartoys.com/contact",
  );
  assert.equal(
    sanitizeAnalyticsUrl("https://www.jiestartoys.com/es/contact?product=city-train-59005"),
    "https://www.jiestartoys.com/es/contact",
  );
  assert.equal(sanitizeAnalyticsUrl("javascript:alert(1)"), null);
  assert.equal(sanitizeAnalyticsUrl("not a url"), null);
});
