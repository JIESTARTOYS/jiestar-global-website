"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { GlobeIcon } from "@/components/ui/Icons";
import { getLanguageSwitcherHref } from "@/lib/i18n/language-switcher";
import type { Locale } from "@/lib/i18n/routing";

type LanguageSwitcherProps = {
  locale: Locale;
};

const destinationCopy: Record<Locale, { label: string; ariaLabel: string; targetLocale: Locale }> = {
  en: {
    label: "Español · B2B",
    ariaLabel: "Open the Spanish B2B business section",
    targetLocale: "es",
  },
  es: {
    label: "Sitio en inglés",
    ariaLabel: "Ir al sitio principal en inglés",
    targetLocale: "en",
  },
};

const languageLinkClassName =
  "-ml-2 inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-sm px-2 text-sm font-semibold text-slate-300 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500";

export function LanguageSwitcherFallback({ locale }: { locale: Locale }) {
  const destination = destinationCopy[locale];
  const href = locale === "en" ? "/es" : "/";

  return <LanguageLink locale={locale} href={href} destination={destination} />;
}

export function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const productHandle = searchParams.get("product");
  const destination = destinationCopy[locale];
  const href = getLanguageSwitcherHref({ locale, pathname, productHandle });

  return <LanguageLink locale={locale} href={href} destination={destination} />;
}

function LanguageLink({
  locale,
  href,
  destination,
}: {
  locale: Locale;
  href: string;
  destination: (typeof destinationCopy)[Locale];
}) {
  return (
    <Link
      href={href}
      hrefLang={destination.targetLocale}
      prefetch={false}
      aria-label={destination.ariaLabel}
      className={languageLinkClassName}
    >
      <GlobeIcon className="size-4 shrink-0" />
      <span lang={locale === "en" ? "es" : undefined}>{destination.label}</span>
    </Link>
  );
}
