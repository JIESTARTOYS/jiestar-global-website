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

test("normalizeInquiryPayload accepts bounded locale and source attribution fields", () => {
  const result = normalizeInquiryPayload({
    type: "wholesale",
    email: "buyer@example.com",
    locale: "es",
    sourcePath: " /es/wholesale ",
    productHandle: "city-train-59005",
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.payload, {
    type: "wholesale",
    email: "buyer@example.com",
    locale: "es",
    sourcePath: "/es/wholesale",
    productHandle: "city-train-59005",
  });
});

test("normalizeInquiryPayload rejects unsupported locales and non-pathname sources", () => {
  const unsupportedLocale = normalizeInquiryPayload({
    type: "wholesale",
    email: "buyer@example.com",
    locale: "fr",
  });
  const sourceWithQuery = normalizeInquiryPayload({
    type: "wholesale",
    email: "buyer@example.com",
    sourcePath: "/es/wholesale?email=buyer@example.com",
  });
  const absoluteSource = normalizeInquiryPayload({
    type: "wholesale",
    email: "buyer@example.com",
    sourcePath: "https://example.com/es/wholesale",
  });
  const overlongSource = normalizeInquiryPayload({
    type: "wholesale",
    email: "buyer@example.com",
    sourcePath: `/${"a".repeat(500)}`,
  });

  assert.equal(unsupportedLocale.ok, false);
  assert.equal(unsupportedLocale.error, "Invalid locale.");
  assert.equal(sourceWithQuery.ok, false);
  assert.equal(sourceWithQuery.error, "Field sourcePath must be a pathname.");
  assert.equal(absoluteSource.ok, false);
  assert.equal(absoluteSource.error, "Field sourcePath must be a pathname.");
  assert.equal(overlongSource.ok, false);
  assert.equal(overlongSource.error, "Field sourcePath is too long.");
});

test("normalizeInquiryPayload bounds and validates product attribution", () => {
  const invalidHandle = normalizeInquiryPayload({
    type: "wholesale",
    email: "buyer@example.com",
    productHandle: "Buyer @ Example",
  });
  const overlongHandle = normalizeInquiryPayload({
    type: "wholesale",
    email: "buyer@example.com",
    productHandle: "a".repeat(256),
  });

  assert.equal(invalidHandle.ok, false);
  assert.equal(invalidHandle.error, "Invalid product handle.");
  assert.equal(overlongHandle.ok, false);
  assert.equal(overlongHandle.error, "Field productHandle is too long.");
});
