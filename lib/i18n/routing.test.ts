import assert from "node:assert/strict";
import test from "node:test";
import {
  getCounterpartHref,
  isLocale,
  isPrefixedLocale,
  localizedHref,
  stripLocalePrefix,
} from "./routing.ts";

const translatedRoutePairs = [
  ["/", "/es"],
  ["/wholesale", "/es/wholesale"],
  ["/custom-solutions", "/es/custom-solutions"],
  ["/contact", "/es/contact"],
  ["/quality-safety", "/es/quality-safety"],
] as const;

test("locale guards distinguish supported languages from prefixed pilot routes", () => {
  assert.equal(isLocale("en"), true);
  assert.equal(isLocale("es"), true);
  assert.equal(isLocale("fr"), false);
  assert.equal(isPrefixedLocale("es"), true);
  assert.equal(isPrefixedLocale("en"), false);
});

test("localizedHref only prefixes routes translated in the Spanish pilot", () => {
  assert.equal(localizedHref("es", "/"), "/es");
  assert.equal(localizedHref("es", "/wholesale"), "/es/wholesale");
  assert.equal(localizedHref("es", "/products"), "/products");
  assert.equal(localizedHref("en", "/contact"), "/contact");
});

test("counterpart mapping returns all five exact translations in both directions", () => {
  for (const [englishPath, spanishPath] of translatedRoutePairs) {
    assert.equal(
      getCounterpartHref(englishPath, "es"),
      spanishPath,
      `${englishPath} should map to ${spanishPath}`,
    );
    assert.equal(
      getCounterpartHref(spanishPath, "en"),
      englishPath,
      `${spanishPath} should map to ${englishPath}`,
    );
  }
});

test("untranslated English and Spanish paths do not create false counterparts", () => {
  for (const path of ["/products", "/blog/b2b-guide", "/collections/trains"]) {
    assert.equal(getCounterpartHref(path, "es"), null);
    assert.equal(getCounterpartHref(`/es${path}`, "en"), null);
  }
});

test("stripLocalePrefix only removes a complete Spanish locale segment", () => {
  const cases = [
    ["/es", "/"],
    ["/es/", "/"],
    ["/es/contact/", "/contact"],
    ["/es/contact?product=valid-handle#inquiry", "/contact"],
    ["es/quality-safety/", "/quality-safety"],
    ["/espanol", "/espanol"],
    ["/es-mx/contact", "/es-mx/contact"],
    ["/en/contact", "/en/contact"],
    ["/products/es", "/products/es"],
  ] as const;

  for (const [pathname, expected] of cases) {
    assert.equal(stripLocalePrefix(pathname), expected);
  }
});
