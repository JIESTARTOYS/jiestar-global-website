"use client";

import { useState } from "react";
import Image from "next/image";
import type { Product } from "@/lib/data";

export function ProductGallery({ product }: { product: Product }) {
  const images = product.images?.length
    ? product.images
    : [{ src: product.image, alt: product.imageAlt }];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  return (
    <div className="grid gap-4">
      <div className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm shadow-slate-950/[0.04]">
        <span className="absolute left-4 top-4 z-10 rounded-md bg-slate-950 px-3 py-1.5 text-xs font-black uppercase text-white">
          Product Preview
        </span>
        <Image
          key={activeImage.src}
          src={activeImage.src}
          alt={activeImage.alt}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-contain"
          priority
        />
      </div>

      {images.length > 1 ? (
        <div className="scrollbar-none -mx-1 flex gap-3 overflow-x-auto px-1 pb-1" aria-label="Product images">
          {images.map((image, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={`${image.src}-${index}`}
                type="button"
                aria-label={`Show ${product.title} image ${index + 1}`}
                aria-current={isActive ? "true" : undefined}
                onClick={() => setActiveIndex(() => index)}
                className={
                  isActive
                    ? "relative h-20 w-20 shrink-0 overflow-hidden rounded-md border-2 border-red-600 bg-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 sm:h-24 sm:w-24"
                    : "relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white opacity-75 shadow-sm transition hover:border-slate-300 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 sm:h-24 sm:w-24"
                }
              >
                <Image
                  src={image.src}
                  alt=""
                  fill
                  sizes="96px"
                  className="pointer-events-none object-contain p-1.5"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
