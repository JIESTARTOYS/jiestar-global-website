import { isValidProductHandle } from "../product-handle.ts";
import type { Locale } from "./routing.ts";
import { getCounterpartHref, stripLocalePrefix } from "./routing.ts";

type LanguageSwitcherHrefInput = {
  locale: Locale;
  pathname: string;
  productHandle?: string | null;
};

export function getLanguageSwitcherHref({
  locale,
  pathname,
  productHandle,
}: LanguageSwitcherHrefInput) {
  const targetLocale: Locale = locale === "en" ? "es" : "en";
  const exactCounterpart = getCounterpartHref(pathname, targetLocale);
  const baseHref = exactCounterpart ?? (locale === "en" ? "/es" : "/");
  const isTranslatedContactCounterpart =
    exactCounterpart !== null && stripLocalePrefix(pathname) === "/contact";

  if (
    isTranslatedContactCounterpart &&
    productHandle &&
    isValidProductHandle(productHandle)
  ) {
    return `${baseHref}?product=${encodeURIComponent(productHandle)}`;
  }

  return baseHref;
}
