"use client";

import { useState } from "react";
import { CartIcon, ShieldIcon } from "@/components/ui/Icons";

export function ProductActions({ productTitle }: { productTitle: string }) {
  const [status, setStatus] = useState<string | null>(null);

  function handleAddToCart() {
    setStatus("Preview mode: Shopify cart and checkout will be enabled after product variant IDs are connected.");
  }

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm shadow-slate-950/[0.03] sm:grid-cols-2">
      <div className="flex items-start gap-2 sm:col-span-2">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-slate-700">
          <ShieldIcon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-xs font-black uppercase text-slate-500">Shopify checkout preview</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Product buttons are staged for the storefront UI. Real cart and checkout will be enabled after Shopify variants are connected.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleAddToCart}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-red-600 px-5 py-3 text-sm font-black text-white shadow-sm shadow-red-600/20 transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        aria-label={`Add ${productTitle} to cart`}
      >
        <CartIcon className="h-4 w-4" />
        Add to Cart
      </button>
      <button
        type="button"
        onClick={handleAddToCart}
        className="min-h-12 rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:border-slate-400 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
        aria-label={`Buy ${productTitle} now`}
      >
        Buy Now
      </button>
      <p className="rounded-md bg-white px-3 py-2 text-sm leading-6 text-slate-600 sm:col-span-2">
        {status ?? "Buttons are shown in preview mode. They will connect to Shopify cart and checkout after Storefront API product data is live."}
      </p>
    </div>
  );
}
