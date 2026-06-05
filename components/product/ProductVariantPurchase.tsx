"use client";

import { useMemo, useState } from "react";
import type { Product, ProductVariant } from "@/lib/data";
import { ProductActions } from "@/components/product/ProductActions";

function getVariantLabel(variant: ProductVariant) {
  const optionLabel = variant.selectedOptions
    .map((option) => option.value.trim())
    .filter(Boolean)
    .join(" / ");
  const title = variant.title.trim();

  if (optionLabel && optionLabel.toLowerCase() !== "default title") {
    return optionLabel;
  }

  if (title && title.toLowerCase() !== "default title") {
    return title;
  }

  return variant.sku || "Default SKU";
}

function getVariantCaption(variant: ProductVariant) {
  const sku = variant.sku.trim();

  return sku ? `SKU ${sku}` : getVariantLabel(variant);
}

function getProductVariants(product: Product): ProductVariant[] {
  if (product.variants?.length) {
    return product.variants;
  }

  if (!product.variantId) {
    return [];
  }

  return [
    {
      id: product.variantId,
      sku: product.sku,
      title: product.sku,
      price: product.price,
      availableForSale: true,
      selectedOptions: [],
    },
  ];
}

export function ProductVariantPurchase({
  product,
  selectedVariantId: controlledSelectedVariantId,
  onVariantChange,
}: {
  product: Product;
  selectedVariantId?: string;
  onVariantChange?: (variantId: string) => void;
}) {
  const variants = useMemo(() => getProductVariants(product), [product]);
  const initialVariantId = variants.find((variant) => variant.availableForSale)?.id ?? variants[0]?.id;
  const [uncontrolledSelectedVariantId, setUncontrolledSelectedVariantId] = useState(initialVariantId);
  const selectedVariantId = controlledSelectedVariantId ?? uncontrolledSelectedVariantId;
  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) ??
    variants.find((variant) => variant.availableForSale) ??
    variants[0];
  const hasMultipleVariants = variants.length > 1;
  const currentPrice = selectedVariant?.price ?? product.price;
  const currentSku = selectedVariant?.sku || product.sku;
  const currentVariantLabel = selectedVariant ? getVariantLabel(selectedVariant) : undefined;

  function selectVariant(variantId: string) {
    setUncontrolledSelectedVariantId(variantId);
    onVariantChange?.(variantId);
  }

  return (
    <div className="mt-4">
      <p className="text-2xl font-semibold text-slate-950">{currentPrice}</p>

      {hasMultipleVariants ? (
        <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.03]">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase text-slate-500">Choose SKU</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{currentSku}</p>
            </div>
            <p className="text-xs font-medium text-slate-500">
              {variants.filter((variant) => variant.availableForSale).length} available / {variants.length} total
            </p>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {variants.map((variant) => {
              const isSelected = variant.id === selectedVariant?.id;
              const label = getVariantLabel(variant);

              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => selectVariant(variant.id)}
                  disabled={!variant.availableForSale}
                  aria-pressed={isSelected}
                  className={
                    isSelected
                      ? "flex min-h-14 items-center justify-between gap-3 rounded-md border-2 border-red-600 bg-red-50 px-3 py-2 text-left text-sm font-black text-slate-950 shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                      : "flex min-h-14 items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50/60 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                  }
                >
                  <span className="min-w-0">
                    <span className="block truncate">{label}</span>
                    <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">
                      {variant.sku || "SKU pending"}
                    </span>
                  </span>
                  <span className={variant.availableForSale ? "shrink-0 text-xs text-slate-500" : "shrink-0 text-xs text-slate-400"}>
                    {variant.availableForSale ? variant.price : "Unavailable"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : selectedVariant ? (
        <p className="mt-2 text-sm font-semibold text-slate-500">{getVariantCaption(selectedVariant)}</p>
      ) : (
        <p className="mt-2 text-sm font-semibold text-slate-500">SKU pending</p>
      )}

      <div className="mt-6">
        <ProductActions
          productTitle={product.title}
          variantId={selectedVariant?.id ?? product.variantId}
          variantLabel={currentVariantLabel}
          availableForSale={selectedVariant?.availableForSale}
        />
      </div>
    </div>
  );
}
