"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import type { MouseEvent, PointerEvent } from "react";
import type { Collection, Product } from "@/lib/data";
import { getCollectionProductCount, getCollectionsWithProducts } from "@/lib/collection-utils";
import { shouldBypassNextImageOptimization } from "@/lib/images";
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/Icons";

const DRAG_THRESHOLD = 8;

type CategoryCarouselProps = {
  collections: Collection[];
  products: Product[];
};

export function CategoryCarousel({ collections, products }: CategoryCarouselProps) {
  const visibleCollections = getCollectionsWithProducts(collections, products);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef({
    pointerId: -1,
    startX: 0,
    scrollLeft: 0,
    hasDragged: false,
  });
  const cancelClickRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  function scrollByPage(direction: -1 | 1) {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    scroller.scrollBy({
      left: direction * scroller.clientWidth,
      behavior: "smooth",
    });
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: scroller.scrollLeft,
      hasDragged: false,
    };
    cancelClickRef.current = false;
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const scroller = scrollerRef.current;
    const dragState = dragStateRef.current;

    if (!scroller || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;

    if (!dragState.hasDragged && Math.abs(deltaX) > DRAG_THRESHOLD) {
      dragState.hasDragged = true;
      cancelClickRef.current = true;
      setIsDragging(true);

      if (!scroller.hasPointerCapture(event.pointerId)) {
        scroller.setPointerCapture(event.pointerId);
      }
    }

    if (dragState.hasDragged) {
      event.preventDefault();
      scroller.scrollLeft = dragState.scrollLeft - deltaX;
    }
  }

  function stopDragging(event: PointerEvent<HTMLDivElement>) {
    const scroller = scrollerRef.current;
    const dragState = dragStateRef.current;

    if (!scroller || dragState.pointerId !== event.pointerId) {
      return;
    }

    if (scroller.hasPointerCapture(event.pointerId)) {
      scroller.releasePointerCapture(event.pointerId);
    }

    dragStateRef.current = {
      pointerId: -1,
      startX: 0,
      scrollLeft: 0,
      hasDragged: false,
    };
    setIsDragging(false);
  }

  function handleClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (!cancelClickRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    cancelClickRef.current = false;
  }

  return (
    <section className="group/carousel mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.03] sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-red-600">Shop by category</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Browse JIESTAR Collections</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-500">
          Open collection pages or use filters below to narrow the catalog by category, price, and piece count.
        </p>
      </div>

      <div className="relative">
        <button
          type="button"
          aria-label="Previous categories"
          onClick={() => scrollByPage(-1)}
          className="pointer-events-none absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/80 text-slate-700 opacity-0 shadow-lg shadow-slate-950/10 backdrop-blur transition hover:bg-white hover:text-slate-950 focus:pointer-events-auto focus:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 group-hover/carousel:pointer-events-auto group-hover/carousel:opacity-100 group-focus-within/carousel:pointer-events-auto group-focus-within/carousel:opacity-100"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Next categories"
          onClick={() => scrollByPage(1)}
          className="pointer-events-none absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/80 text-slate-700 opacity-0 shadow-lg shadow-slate-950/10 backdrop-blur transition hover:bg-white hover:text-slate-950 focus:pointer-events-auto focus:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 group-hover/carousel:pointer-events-auto group-hover/carousel:opacity-100 group-focus-within/carousel:pointer-events-auto group-focus-within/carousel:opacity-100"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>

        <div
          ref={scrollerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          onClickCapture={handleClickCapture}
          onDragStart={(event) => event.preventDefault()}
          className={
            isDragging
              ? "scrollbar-none flex cursor-grabbing select-none gap-3 overflow-x-auto scroll-auto px-1 pb-1"
              : "scrollbar-none flex cursor-grab gap-3 overflow-x-auto scroll-smooth px-1 pb-1"
          }
        >
          {visibleCollections.map((collection, index) => {
            const count = getCollectionProductCount(collection, products);

            return (
              <Link
                key={collection.handle}
                href={`/collections/${collection.handle}`}
                draggable={false}
                className="group w-[11rem] shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-950/[0.06] sm:w-[12rem] lg:w-[13rem]"
              >
                <div className="relative h-36 overflow-hidden bg-slate-50 sm:h-40">
                  {collection.image ? (
                    <Image
                      src={collection.image}
                      alt={collection.imageAlt ?? `${collection.title} collection`}
                      fill
                      sizes="13rem"
                      draggable={false}
                      unoptimized={shouldBypassNextImageOptimization(collection.image)}
                      priority={index < 6}
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-slate-100 px-3 text-center text-[11px] font-black uppercase leading-4 text-slate-500">
                      Image pending
                    </div>
                  )}
                </div>
                <div className="grid h-[5.25rem] grid-cols-[minmax(0,1fr)_auto] items-end gap-2 p-3">
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-sm font-black leading-5 text-slate-950 transition group-hover:text-red-600">
                      {collection.title}
                    </h3>
                    <p className="mt-1 text-xs font-semibold leading-4 text-slate-500">{count} products</p>
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition group-hover:border-red-600 group-hover:bg-red-600 group-hover:text-white">
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
