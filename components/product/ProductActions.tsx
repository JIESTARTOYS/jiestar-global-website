"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { CartIcon, ShieldIcon } from "@/components/ui/Icons";
import { getBrowserPathname, trackCommerceEvent } from "@/lib/analytics";

type ProductActionsProps = {
  productTitle: string;
  productHandle: string;
  variantId?: string;
  variantLabel?: string;
  availableForSale?: boolean;
};

export function ProductActions({
  productTitle,
  productHandle,
  variantId,
  variantLabel,
  availableForSale = true,
}: ProductActionsProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const { addItem } = useCart();
  const isUnavailable = availableForSale === false;

  async function handleAddToCart() {
    if (isUnavailable) {
      setStatus("This SKU is currently unavailable. Choose another SKU or contact us for availability.");
      return;
    }

    if (!variantId) {
      setStatus("Online checkout is not available for this item right now. Contact JIESTAR for availability or business support.");
      return;
    }

    setIsAdding(true);
    setStatus("Adding this product to your Shopify cart...");

    try {
      await addItem(variantId);
      trackCommerceEvent("Add to Cart", {
        sourcePath: getBrowserPathname(),
        productHandle,
      });
      setStatus("Added to cart. Review your cart drawer or continue browsing.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to add product to cart.");
    } finally {
      setIsAdding(false);
    }
  }

  async function handleBuyNow() {
    if (isUnavailable) {
      setStatus("This SKU is currently unavailable. Choose another SKU or contact us for availability.");
      return;
    }

    if (!variantId) {
      setStatus("Online checkout is not available for this item right now. Contact JIESTAR for availability or business support.");
      return;
    }

    setIsBuying(true);
    setStatus("Creating a secure Shopify checkout...");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ variantId }),
      });

      const data = (await response.json()) as { checkoutUrl?: string; error?: string };

      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error ?? "Unable to create Shopify checkout.");
      }

      trackCommerceEvent("Begin Checkout", {
        sourcePath: getBrowserPathname(),
        productHandle,
        checkoutType: "buy_now",
        cartQuantity: 1,
      });
      window.location.href = data.checkoutUrl;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to create Shopify checkout.");
      setIsBuying(false);
    }
  }

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm shadow-slate-950/[0.03] sm:grid-cols-2">
      <div className="flex items-start gap-2 sm:col-span-2">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-slate-700">
          <ShieldIcon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-xs font-black uppercase text-slate-500">
            {isUnavailable ? "SKU currently unavailable" : variantId ? "Secure Shopify checkout" : "Online checkout unavailable"}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {isUnavailable
              ? "Choose an available SKU before adding this product to cart or opening checkout."
              : variantId
              ? "Buy Now opens Shopify checkout for payment, order processing, and customer notifications."
              : "Contact JIESTAR for availability, wholesale supply, or custom project support."}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isAdding || isUnavailable}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-red-600 px-5 py-3 text-sm font-black text-white shadow-sm shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        aria-label={`Add ${[productTitle, variantLabel].filter(Boolean).join(" ")} to cart`}
      >
        <CartIcon className="h-4 w-4" />
        {isUnavailable ? "Unavailable" : isAdding ? "Adding..." : "Add to Cart"}
      </button>
      <button
        type="button"
        onClick={handleBuyNow}
        disabled={isBuying || isUnavailable}
        className="min-h-12 rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
        aria-label={`Buy ${[productTitle, variantLabel].filter(Boolean).join(" ")} now`}
      >
        {isUnavailable ? "Unavailable" : isBuying ? "Opening Checkout..." : "Buy Now"}
      </button>
      <p
        role="status"
        aria-live="polite"
        className="rounded-md bg-white px-3 py-2 text-sm leading-6 text-slate-600 sm:col-span-2"
      >
        {status ??
          (isUnavailable
            ? "This SKU is not available for checkout right now."
            : variantId
            ? "Add this product to your cart or continue directly through secure Shopify checkout."
            : "Online checkout is not available for this item right now. Contact JIESTAR for availability or business support.")}
      </p>
    </div>
  );
}
