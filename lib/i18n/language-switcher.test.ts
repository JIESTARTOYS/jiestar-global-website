import assert from "node:assert/strict";
import test from "node:test";
import { getLanguageSwitcherHref } from "./language-switcher.ts";

test("language switcher uses exact counterparts and homepage fallbacks", () => {
  assert.equal(
    getLanguageSwitcherHref({ locale: "en", pathname: "/wholesale" }),
    "/es/wholesale",
  );
  assert.equal(
    getLanguageSwitcherHref({ locale: "es", pathname: "/es/quality-safety" }),
    "/quality-safety",
  );
  assert.equal(
    getLanguageSwitcherHref({ locale: "en", pathname: "/products/example" }),
    "/es",
  );
  assert.equal(
    getLanguageSwitcherHref({ locale: "es", pathname: "/es/unknown" }),
    "/",
  );
});

test("language switcher only preserves a valid product handle on contact counterparts", () => {
  assert.equal(
    getLanguageSwitcherHref({
      locale: "en",
      pathname: "/contact",
      productHandle: "city-train-59005",
    }),
    "/es/contact?product=city-train-59005",
  );
  assert.equal(
    getLanguageSwitcherHref({
      locale: "es",
      pathname: "/es/contact",
      productHandle: "city-train-59005",
    }),
    "/contact?product=city-train-59005",
  );
  assert.equal(
    getLanguageSwitcherHref({
      locale: "en",
      pathname: "/contact",
      productHandle: "private@example.com",
    }),
    "/es/contact",
  );
  assert.equal(
    getLanguageSwitcherHref({
      locale: "en",
      pathname: "/wholesale",
      productHandle: "city-train-59005",
    }),
    "/es/wholesale",
  );
});
