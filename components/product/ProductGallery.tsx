"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon, XIcon, ZoomInIcon } from "@/components/ui/Icons";
import type { Product } from "@/lib/data";

const galleryControlClass =
  "flex h-12 w-12 items-center justify-center rounded-full bg-stone-100/95 text-slate-950 shadow-md shadow-slate-950/15 transition hover:bg-red-600 hover:text-white hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600";

type ProductGalleryImage = {
  src: string;
  alt: string;
};

export function ProductGallery({
  product,
  preferredImage,
}: {
  product: Product;
  preferredImage?: ProductGalleryImage;
}) {
  const images = useMemo(() => {
    const productImages = product.images?.length
      ? product.images
      : [{ src: product.image, alt: product.imageAlt }];

    if (!preferredImage || productImages.some((image) => image.src === preferredImage.src)) {
      return productImages;
    }

    return [preferredImage, ...productImages];
  }, [preferredImage, product.image, product.imageAlt, product.images]);
  const preferredImageIndex = preferredImage
    ? images.findIndex((image) => image.src === preferredImage.src)
    : -1;
  const [activeIndex, setActiveIndex] = useState(preferredImageIndex >= 0 ? preferredImageIndex : 0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const activeImage = images[activeIndex] ?? images[0];
  const activeImageFailed = Boolean(failedImages[activeImage.src]);
  const activeImagePosition = Math.max(
    0,
    images.findIndex((image) => image.src === activeImage.src),
  );
  const activeImageNumber = activeImagePosition + 1;

  useEffect(() => {
    if (!isZoomOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsZoomOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZoomOpen]);

  function markImageFailed(src: string) {
    setFailedImages((current) => ({ ...current, [src]: true }));
  }

  function showPreviousImage() {
    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  }

  function showNextImage() {
    setActiveIndex((current) => (current + 1) % images.length);
  }

  return (
    <>
      <div className="grid gap-4">
        <div className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm shadow-slate-950/[0.04]">
          {activeImageFailed ? (
            <div className="flex h-full items-center justify-center px-8 text-center">
              <div>
                <p className="text-sm font-black uppercase text-slate-500">Image temporarily unavailable</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Product media is loading from Shopify CDN. Try another image or refresh shortly.
                </p>
              </div>
            </div>
          ) : (
            <Image
              key={activeImage.src}
              src={activeImage.src}
              alt={activeImage.alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-contain"
              priority
              onError={() => markImageFailed(activeImage.src)}
            />
          )}

          {images.length > 1 ? (
            <>
              <button
                type="button"
                aria-label={`Show previous ${product.title} image`}
                onClick={showPreviousImage}
                className={`absolute left-3 top-1/2 z-10 -translate-y-1/2 sm:left-4 ${galleryControlClass}`}
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
              <button
                type="button"
                aria-label={`Show next ${product.title} image`}
                onClick={showNextImage}
                className={`absolute right-3 top-1/2 z-10 -translate-y-1/2 sm:right-4 ${galleryControlClass}`}
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            </>
          ) : null}

          <button
            type="button"
            aria-label={`View ${product.title} image ${activeImageNumber} larger`}
            onClick={() => setIsZoomOpen(true)}
            className="absolute right-3 top-3 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-transparent text-white transition hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 sm:right-4 sm:top-4"
          >
            <ZoomInIcon className="h-8 w-8 drop-shadow-[0_2px_4px_rgba(15,23,42,0.7)]" />
          </button>
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
                  {failedImages[image.src] ? (
                    <span className="flex h-full items-center justify-center px-2 text-center text-[10px] font-black uppercase leading-4 text-slate-400">
                      Image pending
                    </span>
                  ) : (
                    <Image
                      src={image.src}
                      alt=""
                      fill
                      sizes="96px"
                      className="pointer-events-none object-contain p-1.5"
                      loading="lazy"
                      onError={() => markImageFailed(image.src)}
                    />
                  )}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {isZoomOpen ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${product.title} image preview`}
        >
          <button
            type="button"
            className="absolute inset-0 cursor-zoom-out"
            aria-label="Close image preview"
            onClick={() => setIsZoomOpen(false)}
          />
          <div className="relative h-full max-h-[min(88vh,900px)] w-full max-w-6xl">
            <button
              type="button"
              aria-label="Close image preview"
              onClick={() => setIsZoomOpen(false)}
              className={`absolute right-0 top-0 z-20 -translate-y-2 translate-x-2 sm:-translate-y-3 sm:translate-x-3 ${galleryControlClass}`}
            >
              <XIcon className="h-5 w-5" />
            </button>
            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label={`Show previous ${product.title} image in preview`}
                  onClick={showPreviousImage}
                  className={`absolute left-0 top-1/2 z-20 -translate-x-2 -translate-y-1/2 sm:-translate-x-4 ${galleryControlClass}`}
                >
                  <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  aria-label={`Show next ${product.title} image in preview`}
                  onClick={showNextImage}
                  className={`absolute right-0 top-1/2 z-20 -translate-y-1/2 translate-x-2 sm:translate-x-4 ${galleryControlClass}`}
                >
                  <ChevronRightIcon className="h-6 w-6" />
                </button>
              </>
            ) : null}
            {activeImageFailed ? (
              <div className="flex h-full items-center justify-center rounded-lg bg-white px-8 text-center">
                <div>
                  <p className="text-sm font-black uppercase text-slate-500">Image temporarily unavailable</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Product media is loading from Shopify CDN. Try another image or refresh shortly.
                  </p>
                </div>
              </div>
            ) : (
              <Image
                key={`zoom-${activeImage.src}`}
                src={activeImage.src}
                alt={activeImage.alt}
                fill
                sizes="100vw"
                className="object-contain"
                onError={() => markImageFailed(activeImage.src)}
              />
            )}
            {images.length > 1 ? (
              <div className="absolute bottom-0 left-1/2 z-20 flex -translate-x-1/2 translate-y-3 items-center gap-2 rounded-full bg-white/95 px-2.5 py-1.5 text-xs font-black text-slate-950 shadow-lg shadow-slate-950/20 sm:translate-y-4">
                <button
                  type="button"
                  aria-label={`Show previous ${product.title} image in preview`}
                  onClick={showPreviousImage}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-950 transition hover:bg-red-600 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <span
                  key={`${activeImage.src}-${activeImageNumber}`}
                  className="min-w-10 text-center text-[12px] leading-none tabular-nums"
                  aria-live="polite"
                >
                  {activeImageNumber}/{images.length}
                </span>
                <button
                  type="button"
                  aria-label={`Show next ${product.title} image in preview`}
                  onClick={showNextImage}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-950 transition hover:bg-red-600 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
