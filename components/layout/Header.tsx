import Link from "next/link";
import { navigation } from "@/lib/data";
import type { HeaderSearchProduct } from "@/lib/header-search-products";
import { UserIcon } from "@/components/ui/Icons";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { CartHeaderButton } from "@/components/cart/CartHeaderButton";
import { HeaderMobileSearch, HeaderSearch } from "@/components/layout/HeaderSearch";
import { HeaderMobileNav } from "@/components/layout/HeaderMobileNav";

type HeaderProps = {
  searchProducts?: HeaderSearchProduct[];
};

export function Header({ searchProducts = [] }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-5 px-5 py-4 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="JIESTAR home">
          <SiteLogo className="size-16" priority />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-8 lg:flex" aria-label="Main navigation">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative text-sm font-bold text-slate-700 transition hover:text-red-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <HeaderSearch products={searchProducts} />
          <Link href="/account" className="flex h-11 items-center gap-2 rounded-md px-2 text-sm font-bold text-slate-700 hover:text-red-600">
            <UserIcon className="h-5 w-5" />
            <span>Account</span>
          </Link>
          <CartHeaderButton />
        </div>

        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <HeaderMobileSearch products={searchProducts} />
          <CartHeaderButton compact />
        </div>

        <HeaderMobileNav navigation={navigation} />
      </div>
    </header>
  );
}
