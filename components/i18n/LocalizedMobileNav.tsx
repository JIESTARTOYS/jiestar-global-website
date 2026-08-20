"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { MenuIcon } from "@/components/ui/Icons";
import type { SiteDictionary } from "@/lib/i18n/dictionaries";

type LocalizedMobileNavProps = {
  dictionary: SiteDictionary;
};

export function LocalizedMobileNav({ dictionary }: LocalizedMobileNavProps) {
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const closeMenu = () => {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  };

  useEffect(() => {
    closeMenu();
  }, [pathname]);

  return (
    <details ref={detailsRef} className="group xl:hidden">
      <summary
        aria-label={dictionary.openMenuLabel}
        className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-md border border-slate-200 bg-white text-slate-900 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
      >
        <MenuIcon className="h-5 w-5" />
      </summary>
      <div className="absolute left-0 top-full w-full border-b border-slate-200 bg-white px-5 py-5 shadow-lg shadow-slate-950/5">
        <nav className="mx-auto grid max-w-7xl gap-2" aria-label={dictionary.mobileNavigationLabel}>
          {dictionary.navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              hrefLang={item.language}
              prefetch={false}
              onClick={closeMenu}
              className="rounded-md px-3 py-3 text-base font-bold text-slate-800 hover:bg-slate-50"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </details>
  );
}
