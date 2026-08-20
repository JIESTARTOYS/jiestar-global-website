import Link from "next/link";
import { LocalizedMobileNav } from "@/components/i18n/LocalizedMobileNav";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { PrefixedLocale } from "@/lib/i18n/routing";

export function LocalizedHeader({ locale }: { locale: PrefixedLocale }) {
  const dictionary = getDictionary(locale);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-5 px-5 py-4 lg:px-8">
        <Link
          href="/"
          hrefLang="en"
          prefetch={false}
          className="flex shrink-0 items-center gap-3"
          aria-label={dictionary.homeLabel}
        >
          <SiteLogo className="size-16" priority />
        </Link>

        <nav
          className="hidden flex-1 items-center justify-center gap-5 xl:flex 2xl:gap-7"
          aria-label={dictionary.navigationLabel}
        >
          {dictionary.navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              hrefLang={item.language}
              prefetch={false}
              className="relative whitespace-nowrap text-sm font-bold text-slate-700 transition hover:text-red-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div aria-hidden="true" className="hidden size-16 shrink-0 xl:block" />

        <div className="ml-auto xl:hidden">
          <LocalizedMobileNav dictionary={dictionary} />
        </div>
      </div>
    </header>
  );
}
