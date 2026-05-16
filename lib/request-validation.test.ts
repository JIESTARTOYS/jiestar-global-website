import assert from "node:assert/strict";
import test from "node:test";
import { normalizeInquiryPayload } from "./request-validation.ts";

test("normalizeInquiryPayload trims strings and enforces required contact fields", () => {
  const result = normalizeInquiryPayload({
    type: "contact",
    name: "  Chen  ",
    country: "  China ",
    email: " buyer@example.com ",
    message: "  I want product information. ",
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.payload, {
    type: "contact",
    name: "Chen",
    country: "China",
    email: "buyer@example.com",
    message: "I want product information.",
  });
});

test("normalizeInquiryPayload rejects missing required fields", () => {
  const result = normalizeInquiryPayload({
    type: "custom",
    email: "buyer@example.com",
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.missingFields, ["name", "country", "message"]);
});

test("normalizeInquiryPayload rejects overlong text values", () => {
  const result = normalizeInquiryPayload({
    type: "wholesale",
    email: "buyer@example.com",
    message: "x".repeat(5001),
  });

  assert.equal(result.ok, false);
  assert.equal(result.error, "Field message is too long.");
});
