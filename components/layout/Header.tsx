import Link from "next/link";
import { navigation, type Product } from "@/lib/data";
import { MenuIcon, SearchIcon, UserIcon } from "@/components/ui/Icons";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { CartHeaderButton } from "@/components/cart/CartHeaderButton";
import { HeaderSearch } from "@/components/layout/HeaderSearch";

type HeaderProps = {
  searchProducts?: Product[];
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
          <Link href="/products" aria-label="Search products" className="rounded-md p-2 text-slate-800 hover:bg-slate-100">
            <SearchIcon className="h-5 w-5" />
          </Link>
          <CartHeaderButton compact />
        </div>

        <details className="group lg:hidden">
          <summary className="cursor-pointer list-none rounded-md border border-slate-200 bg-white p-2 text-slate-900 shadow-sm">
            <MenuIcon className="h-5 w-5" />
          </summary>
          <div className="absolute left-0 top-full w-full border-b border-slate-200 bg-white px-5 py-5 shadow-lg shadow-slate-950/5">
            <nav className="mx-auto grid max-w-7xl gap-2" aria-label="Mobile navigation">
              {navigation.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-md px-3 py-3 text-base font-bold text-slate-800 hover:bg-slate-50">
                  {item.label}
                </Link>
              ))}
              <Link href="/account" className="flex items-center gap-3 rounded-md px-3 py-3 text-base font-bold text-slate-800 hover:bg-slate-50">
                <UserIcon className="h-5 w-5 text-red-600" />
                Account
              </Link>
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}
