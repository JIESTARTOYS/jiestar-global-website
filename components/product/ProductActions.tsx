"use client";

import { useState } from "react";

export function ProductActions({ productTitle }: { productTitle: string }) {
  const [status, setStatus] = useState<string | null>(null);

  function handleAddToCart() {
    setStatus("Preview mode: Shopify cart and checkout will be enabled after product variant IDs are connected.");
  }

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
      <p className="sm:col-span-2 text-xs font-semibold uppercase text-slate-500">Shopify checkout preview</p>
      <button
        type="button"
        onClick={handleAddToCart}
        className="min-h-12 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
        aria-label={`Add ${productTitle} to cart`}
      >
        Add to Cart
      </button>
      <button
        type="button"
        onClick={handleAddToCart}
        className="min-h-12 rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
        aria-label={`Buy ${productTitle} now`}
      >
        Buy Now
      </button>
      <p className="sm:col-span-2 text-sm leading-6 text-slate-600">
        {status ?? "Buttons are shown in preview mode. They will connect to Shopify cart and checkout after Storefront API product data is live."}
      </p>
    </div>
  );
}
