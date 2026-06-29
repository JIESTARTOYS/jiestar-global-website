"use client";

import { CartIcon } from "@/components/ui/Icons";
import { useCart } from "@/components/cart/CartProvider";

type CartHeaderButtonProps = {
  compact?: boolean;
};

export function CartHeaderButton({ compact = false }: CartHeaderButtonProps) {
  const { count, openCart } = useCart();

  if (compact) {
    return (
      <button
        type="button"
        onClick={openCart}
        aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
        className="relative flex h-11 w-11 items-center justify-center rounded-md text-slate-800 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
      >
        <CartIcon className="h-5 w-5" />
        <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openCart}
      className="relative flex h-11 items-center gap-2 rounded-md px-2 text-sm font-bold text-slate-700 transition hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
      aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
    >
      <CartIcon className="h-5 w-5" />
      <span>Cart</span>
      <span className="absolute -right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
        {count}
      </span>
    </button>
  );
}
