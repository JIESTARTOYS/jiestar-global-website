"use client";

import { useState } from "react";

export function ProductActions({ productTitle }: { productTitle: string }) {
  const [status, setStatus] = useState<string | null>(null);

  function handleAddToCart() {
    setStatus("Cart integration is ready for Shopify variant IDs. This product is using preview data.");
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        onClick={handleAddToCart}
        className="min-h-12 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        aria-label={`Add ${productTitle} to cart`}
      >
        Add to Cart
      </button>
      <button
        type="button"
        onClick={handleAddToCart}
        className="min-h-12 rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-50"
        aria-label={`Buy ${productTitle} now`}
      >
        Buy Now
      </button>
      {status ? <p className="sm:col-span-2 text-sm text-slate-600">{status}</p> : null}
    </div>
  );
}
