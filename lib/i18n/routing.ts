export const locales = ["en", "es"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const prefixedLocales = ["es"] as const;

export type PrefixedLocale = (typeof prefixedLocales)[number];

export const translatedPaths = [
  "/",
  "/wholesale",
  "/custom-solutions",
  "/contact",
  "/quality-safety",
] as const;

export type TranslatedPath = (typeof translatedPaths)[number];

const translatedPathSet = new Set<string>(translatedPaths);

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function isPrefixedLocale(value: string): value is PrefixedLocale {
  return (prefixedLocales as readonly string[]).includes(value);
}

export function isTranslatedPath(pathname: string) {
  return translatedPathSet.has(normalizePathname(pathname));
}

/**
 * Returns the localized URL for translated pages. Paths that are not part of
 * the pilot remain on the unprefixed English site instead of creating a mixed
 * or non-existent Spanish page.
 */
export function localizedHref(locale: Locale, pathname: string) {
  const normalized = normalizePathname(pathname);

  if (locale === defaultLocale || !translatedPathSet.has(normalized)) {
    return normalized;
  }

  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}

/**
 * Returns an exact language counterpart only when both pages are translated.
 * This prevents a language switcher from presenting an unrelated page as an
 * equivalent translation.
 */
export function getCounterpartHref(pathname: string, targetLocale: Locale): string | null {
  const normalized = normalizePathname(pathname);
  const sourcePath = stripLocalePrefix(normalized);

  if (!translatedPathSet.has(sourcePath)) {
    return null;
  }

  return localizedHref(targetLocale, sourcePath);
}

export function stripLocalePrefix(pathname: string) {
  const normalized = normalizePathname(pathname);
  const segments = normalized.split("/").filter(Boolean);

  if (segments.length > 0 && isPrefixedLocale(segments[0])) {
    const remainder = `/${segments.slice(1).join("/")}`;
    return remainder === "/" ? "/" : remainder;
  }

  return normalized;
}

function normalizePathname(pathname: string) {
  const withoutQueryOrHash = pathname.split(/[?#]/, 1)[0]?.trim() || "/";
  const withLeadingSlash = withoutQueryOrHash.startsWith("/")
    ? withoutQueryOrHash
    : `/${withoutQueryOrHash}`;

  if (withLeadingSlash === "/") {
    return "/";
  }

  return withLeadingSlash.replace(/\/+$/, "");
}
