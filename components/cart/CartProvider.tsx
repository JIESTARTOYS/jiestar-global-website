"use client";

import Image from "next/image";
import Link from "next/link";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ChevronLeftIcon, MinusIcon, PlusIcon, TrashIcon, XIcon } from "@/components/ui/Icons";
import type { Cart } from "@/lib/shopify";

type CartContextValue = {
  cart: Cart | null;
  count: number;
  isOpen: boolean;
  isLoading: boolean;
  removingLineId: string | null;
  message: string | null;
  addItem: (variantId: string) => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
  updateLine: (lineId: string, merchandiseId: string, quantity: number) => Promise<void>;
  removeLine: (lineId: string, merchandiseId: string) => Promise<void>;
};

const CART_STORAGE_KEY = "jiestar-shopify-cart-id";

const CartContext = createContext<CartContextValue | undefined>(undefined);

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function isExpiredResponse(status: number, data: { expired?: boolean }) {
  return status === 404 || data.expired === true;
}

function getSelectedSkuLabel(line: Cart["lines"][number]) {
  const sku = line.sku?.trim();

  if (!sku) {
    return "";
  }

  const variantTitle = line.merchandiseTitle.trim();
  const normalizedVariantTitle = variantTitle.toLowerCase();
  const normalizedSku = sku.toLowerCase();

  if (!variantTitle || normalizedVariantTitle === "default title" || normalizedVariantTitle === normalizedSku) {
    return `SKU ${sku}`;
  }

  const skuPrefixPattern = new RegExp(`^${sku.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-:|/]*\\s*`, "i");
  const variantLabel = variantTitle.replace(skuPrefixPattern, "").trim();

  return variantLabel ? `SKU ${sku} - ${variantLabel}` : `SKU ${sku}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [removingLineId, setRemovingLineId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const clearCart = useCallback(() => {
    localStorage.removeItem(CART_STORAGE_KEY);
    setCart(null);
  }, []);

  const saveCart = useCallback((nextCart: Cart) => {
    localStorage.setItem(CART_STORAGE_KEY, nextCart.id);
    setCart(nextCart);
  }, []);

  const fetchCart = useCallback(async (cartId: string) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/cart?cartId=${encodeURIComponent(cartId)}`);
      const data = (await response.json()) as { cart?: Cart; error?: string; expired?: boolean };

      if (!response.ok || !data.cart) {
        if (isExpiredResponse(response.status, data)) {
          clearCart();
          setMessage("Your previous Shopify cart expired. Add the product again to start a new cart.");
          return;
        }

        throw new Error(data.error ?? "Unable to load Shopify cart.");
      }

      saveCart(data.cart);
    } catch (error) {
      setMessage(getErrorMessage(error, "Unable to load Shopify cart."));
    } finally {
      setIsLoading(false);
    }
  }, [clearCart, saveCart]);

  useEffect(() => {
    const cartId = localStorage.getItem(CART_STORAGE_KEY);

    if (cartId) {
      queueMicrotask(() => {
        void fetchCart(cartId);
      });
    }
  }, [fetchCart]);

  const addItem = useCallback(async (variantId: string) => {
    const cartId = localStorage.getItem(CART_STORAGE_KEY);

    setIsLoading(true);
    setMessage("Adding product to cart...");

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cartId, variantId, quantity: 1 }),
      });
      const data = (await response.json()) as {
        cart?: Cart;
        error?: string;
        replacedExpiredCart?: boolean;
      };

      if (!response.ok || !data.cart) {
        throw new Error(data.error ?? "Unable to add product to cart.");
      }

      saveCart(data.cart);
      setIsOpen(true);
      setMessage(data.replacedExpiredCart ? "Your previous cart expired, so a new Shopify cart was created." : null);
    } catch (error) {
      const nextMessage = getErrorMessage(error, "Unable to add product to cart.");

      setMessage(nextMessage);
      throw new Error(nextMessage);
    } finally {
      setIsLoading(false);
    }
  }, [saveCart]);

  const updateLine = useCallback(async (lineId: string, merchandiseId: string, quantity: number) => {
    const cartId = cart?.id ?? localStorage.getItem(CART_STORAGE_KEY);
    const currentLineId = cart?.lines.find((line) => line.merchandiseId === merchandiseId)?.id ?? lineId;

    if (!cartId) {
      setMessage("Add a product before changing cart quantity.");
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/cart/lines", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cartId, lineId: currentLineId, merchandiseId, quantity }),
      });
      const data = (await response.json()) as { cart?: Cart; error?: string; itemMissing?: boolean };

      if (!response.ok || !data.cart) {
        throw new Error(data.error ?? "Unable to update cart quantity.");
      }

      saveCart(data.cart);

      if (data.itemMissing) {
        setMessage(data.error ?? "That cart item changed. The cart has been refreshed.");
      }
    } catch (error) {
      setMessage(getErrorMessage(error, "Unable to update cart quantity."));
    } finally {
      setIsLoading(false);
    }
  }, [cart?.id, cart?.lines, saveCart]);

  const removeLine = useCallback(async (lineId: string, merchandiseId: string) => {
    const cartId = cart?.id ?? localStorage.getItem(CART_STORAGE_KEY);
    const currentLineId = cart?.lines.find((line) => line.merchandiseId === merchandiseId)?.id ?? lineId;

    if (!cartId) {
      setMessage("Add a product before removing cart items.");
      return;
    }

    setIsLoading(true);
    setRemovingLineId(currentLineId);
    setMessage(null);

    try {
      const response = await fetch("/api/cart/lines", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cartId, lineId: currentLineId, merchandiseId }),
      });
      const data = (await response.json()) as { cart?: Cart; error?: string; itemMissing?: boolean };

      if (!response.ok || !data.cart) {
        throw new Error(data.error ?? "Unable to remove product from cart.");
      }

      if (data.cart.totalQuantity === 0) {
        clearCart();
      } else {
        saveCart(data.cart);
      }

      if (data.itemMissing) {
        setMessage(data.error ?? "That cart item changed. The cart has been refreshed.");
      }
    } catch (error) {
      setMessage(getErrorMessage(error, "Unable to remove product from cart."));
    } finally {
      setIsLoading(false);
      setRemovingLineId(null);
    }
  }, [cart?.id, cart?.lines, clearCart, saveCart]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      count: cart?.totalQuantity ?? 0,
      isOpen,
      isLoading,
      removingLineId,
      message,
      addItem,
      openCart: () => {
        setIsOpen(true);
      },
      closeCart: () => {
        setIsOpen(false);
      },
      updateLine,
      removeLine,
    }),
    [addItem, cart, isLoading, isOpen, message, removeLine, removingLineId, updateLine],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider.");
  }

  return context;
}

function CartDrawer() {
  const { cart, closeCart, isLoading, isOpen, message, removeLine, removingLineId, updateLine } = useCart();

  return (
    <div
      className={`fixed inset-0 z-[80] ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-slate-950/45 transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`}
        aria-label="Close cart drawer"
        onClick={closeCart}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl shadow-slate-950/20 transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Shopping cart"
        aria-live="polite"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase text-slate-500">Shopify cart</p>
            <h2 className="text-xl font-black text-slate-950">Your cart</h2>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="flex h-10 w-10 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            aria-label="Close cart"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {message ? (
            <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
              {message}
            </p>
          ) : null}

          {!cart || cart.lines.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
              <p className="text-lg font-black text-slate-950">Your cart is empty</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Add a Shopify-connected product to start a secure checkout.
              </p>
              <Link
                href="/products"
                onClick={closeCart}
                className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-md bg-red-600 px-4 text-sm font-black text-white transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Browse products
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {cart.lines.map((line) => {
                const selectedSkuLabel = getSelectedSkuLabel(line);

                return (
                  <article key={line.id} className="grid grid-cols-[88px_1fr] gap-3 rounded-lg border border-slate-200 p-3">
                    <Link href={`/products/${line.productHandle}`} onClick={closeCart} className="block">
                      <div className="relative aspect-square overflow-hidden rounded-md bg-slate-100">
                        {line.image ? (
                          <Image
                            src={line.image}
                            alt={line.imageAlt ?? line.productTitle}
                            fill
                            sizes="88px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center px-2 text-center text-[11px] font-bold text-slate-400">
                            No image
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="min-w-0">
                      <div className="flex items-start gap-2">
                        <Link href={`/products/${line.productHandle}`} onClick={closeCart} className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 text-sm font-black leading-5 text-slate-950 hover:text-red-600">
                            {line.productTitle}
                          </h3>
                        </Link>
                        <button
                          type="button"
                          onClick={() => void removeLine(line.id, line.merchandiseId)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-45"
                          aria-label={`Remove ${line.productTitle} from cart`}
                          aria-busy={removingLineId === line.id}
                          disabled={isLoading}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      {selectedSkuLabel ? (
                        <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">{selectedSkuLabel}</p>
                      ) : null}
                      <p className="mt-1 text-xs font-semibold text-slate-500">{line.price}</p>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex h-9 items-center rounded-md border border-slate-200 bg-white">
                          <button
                            type="button"
                            onClick={() => void updateLine(line.id, line.merchandiseId, Math.max(1, line.quantity - 1))}
                            className="flex h-9 w-9 items-center justify-center text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:text-slate-300"
                            aria-label={`Decrease ${line.productTitle} quantity`}
                            disabled={isLoading || line.quantity <= 1}
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          <span className="min-w-8 text-center text-sm font-black text-slate-950">{line.quantity}</span>
                          <button
                            type="button"
                            onClick={() => void updateLine(line.id, line.merchandiseId, line.quantity + 1)}
                            className="flex h-9 w-9 items-center justify-center text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:text-slate-300"
                            aria-label={`Increase ${line.productTitle} quantity`}
                            disabled={isLoading}
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm font-black text-slate-950">{line.lineTotal}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white px-5 py-4">
          <div className="mb-4 flex items-center justify-between text-sm">
            <span className="font-bold text-slate-600">Subtotal</span>
            <span className="font-black text-slate-950">{cart?.subtotal ?? "$0.00"}</span>
          </div>
          <a
            href={cart?.checkoutUrl ?? undefined}
            className={`flex min-h-12 w-full items-center justify-center rounded-md px-5 text-sm font-black text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 ${
              cart?.checkoutUrl && cart.totalQuantity > 0 && !isLoading
                ? "bg-red-600 hover:bg-red-700"
                : "pointer-events-none bg-slate-300"
            }`}
            aria-disabled={!cart?.checkoutUrl || cart.totalQuantity === 0 || isLoading}
          >
            {isLoading ? "Updating cart..." : "Continue to Shopify Checkout"}
          </a>
          <p className="mt-3 text-center text-xs leading-5 text-slate-500">
            Shipping, payment, order records, and customer notifications are handled by Shopify.
          </p>
        </div>
      </aside>
    </div>
  );
}
