import Link from "next/link";
import { Suspense } from "react";
import { LanguageSwitcher, LanguageSwitcherFallback } from "@/components/i18n/LanguageSwitcher";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { PrefixedLocale } from "@/lib/i18n/routing";

const exploreLinks = [
  ["Inicio", "/es", undefined],
  ["Catálogo en inglés", "/products", "en"],
  ["Blog en inglés", "/blog", "en"],
] as const;

const partnershipLinks = [
  ["Venta mayorista", "/es/wholesale", undefined],
  ["Soluciones a medida", "/es/custom-solutions", undefined],
  ["Contacto comercial", "/es/contact", undefined],
] as const;

const companyLinks = [
  ["Calidad y seguridad", "/es/quality-safety", undefined],
  ["Contacto", "/es/contact", undefined],
] as const;

const legalLinks = [
  ["Privacidad en inglés", "/policies/privacy-policy", "en"],
  ["Términos en inglés", "/policies/terms-of-service", "en"],
] as const;

export function LocalizedFooter({ locale }: { locale: PrefixedLocale }) {
  const dictionary = getDictionary(locale);

  return (
    <footer className="bg-slate-950 px-3 pb-3 text-white">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-t-lg bg-slate-950">
        <div className="grid gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_1fr_0.9fr_1fr] lg:gap-12 lg:px-8">
          <div className="min-w-0">
            <SiteLogo className="size-14" />
            <p className="mt-5 max-w-xs text-sm leading-6 text-slate-300">{dictionary.footer.description}</p>
            <div className="mt-4">
              <Suspense fallback={<LanguageSwitcherFallback locale={locale} />}>
                <LanguageSwitcher locale={locale} />
              </Suspense>
            </div>
          </div>
          <FooterColumn title={dictionary.footer.exploreTitle} links={exploreLinks} />
          <FooterColumn title={dictionary.footer.partnershipTitle} links={partnershipLinks} />
          <FooterColumn title={dictionary.footer.companyTitle} links={companyLinks} />
          <FooterColumn title={dictionary.footer.legalTitle} links={legalLinks} />
        </div>
        <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-5 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>© 2026 {dictionary.footer.copyright}</p>
          <p className="max-w-3xl leading-6 text-slate-300 sm:text-right">
            {dictionary.footer.languageScopeNotice}
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<readonly [string, string, string | undefined]>;
}) {
  return (
    <div className="min-w-0">
      <h2 className="text-sm font-bold uppercase tracking-normal text-white">{title}</h2>
      <ul className="mt-4 grid gap-3">
        {links.map(([label, href, language]) => (
          <li key={href + label}>
            <Link
              href={href}
              hrefLang={language}
              prefetch={false}
              className="block text-sm leading-6 text-slate-300 transition hover:text-white"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
