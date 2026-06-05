"use client";

import { useMemo, useState } from "react";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductVariantPurchase } from "@/components/product/ProductVariantPurchase";
import { ArrowRightIcon, PackageIcon, ShieldIcon, TruckIcon } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/LinkButton";
import type { Product } from "@/lib/data";

export function ProductDetailTop({ product }: { product: Product }) {
  const variants = useMemo(() => product.variants ?? [], [product.variants]);
  const initialVariantId = useMemo(
    () => variants.find((variant) => variant.availableForSale)?.id ?? variants[0]?.id ?? product.variantId,
    [product.variantId, variants],
  );
  const [selectedVariantId, setSelectedVariantId] = useState(initialVariantId);
  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) ??
    variants.find((variant) => variant.availableForSale) ??
    variants[0];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(24rem,0.98fr)] lg:items-start">
      <ProductGallery
        key={selectedVariantId ?? product.id}
        product={product}
        preferredImage={selectedVariant?.image}
      />

      <div className="lg:sticky lg:top-24">
        <p className="text-sm font-black uppercase text-red-600">{product.category}</p>
        <h1 className="mt-3 text-3xl font-black leading-tight tracking-normal text-slate-950 sm:text-4xl">
          {product.title}
        </h1>
        <p className="mt-4 text-base leading-8 text-slate-600">{product.description}</p>

        <ProductVariantPurchase
          product={product}
          selectedVariantId={selectedVariantId}
          onVariantChange={setSelectedVariantId}
        />

        <div className="mt-6 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
          {[
            { title: "Display build", text: "Designed for shelf presence.", icon: PackageIcon },
            {
              title: "Secure checkout",
              text: product.variantId
                ? "Checkout is handled by Shopify."
                : "Checkout preview until Shopify variants are connected.",
              icon: ShieldIcon,
            },
            { title: "Support", text: "Missing piece support available.", icon: TruckIcon },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-3">
                <Icon className="h-5 w-5 text-red-600" />
                <p className="mt-2 font-black text-slate-950">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.text}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-lg border border-red-100 bg-red-50 p-5">
          <p className="text-xs font-black uppercase text-red-600">B2B cooperation</p>
          <h2 className="mt-2 text-lg font-black text-slate-950">Wholesale or custom version?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Interested in wholesale supply, exclusive SKUs, packaging customization, or a custom product line based on this direction?
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/contact" className="px-4">Contact JIESTAR</LinkButton>
            <LinkButton href="/custom-solutions" variant="secondary" className="px-4">
              Custom Solutions
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </LinkButton>
          </div>
        </div>
      </div>
    </div>
  );
}
