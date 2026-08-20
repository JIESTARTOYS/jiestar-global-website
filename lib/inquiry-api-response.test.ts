import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createInquiryDeliveryFailureResponse,
  publicInquiryDeliveryError,
} from "./inquiry-api-response.ts";

test("API delivery failure response preserves its shape without exposing provider details", () => {
  const response = createInquiryDeliveryFailureResponse({
    ok: false,
    deliveryConfigured: true,
    contactEmail: "info@jiestartoys.com",
    error: "Email delivery failed: private@example.com used secret-provider-token",
    logError: "resend_response_403",
  });

  assert.deepEqual(response, {
    error: publicInquiryDeliveryError,
    deliveryConfigured: true,
    contactEmail: "info@jiestartoys.com",
  });
  assert.deepEqual(Object.keys(response), ["error", "deliveryConfigured", "contactEmail"]);
  assert.doesNotMatch(JSON.stringify(response), /private@example\.com|secret-provider-token|resend_response/);
});

test("the inquiry route uses the tested public failure response builder", () => {
  const routeSource = readFileSync(new URL("../app/api/inquiry/route.ts", import.meta.url), "utf8");

  assert.match(routeSource, /createInquiryDeliveryFailureResponse\(delivery\)/);
  assert.doesNotMatch(routeSource, /error:\s*delivery\.error/);
});

test("API delivery failure response also masks an unconfigured provider", () => {
  const response = createInquiryDeliveryFailureResponse({
    ok: false,
    deliveryConfigured: false,
    contactEmail: "info@jiestartoys.com",
    error: "Email delivery is not configured.",
    logError: "delivery_not_configured",
  });

  assert.deepEqual(response, {
    error: publicInquiryDeliveryError,
    deliveryConfigured: false,
    contactEmail: "info@jiestartoys.com",
  });
});
