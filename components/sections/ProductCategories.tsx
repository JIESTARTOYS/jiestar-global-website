"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import type { MouseEvent, PointerEvent } from "react";
import type { Collection, Product } from "@/lib/data";
import { getCollectionProductCount, getCollectionsWithProducts } from "@/lib/collection-utils";
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/Icons";

const DRAG_THRESHOLD = 8;

type ProductCategoriesProps = {
  collections: Collection[];
  products: Product[];
};

export function ProductCategories({ collections, products }: ProductCategoriesProps) {
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
    <section className="bg-[#f6f7f9] px-5 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-black text-slate-950">Featured Categories</h2>
          <Link href="/products" className="hidden items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-red-600 sm:flex">
            Shop all products
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        <div className="group/categories relative">
          <button
            type="button"
            aria-label="Previous categories"
            onClick={() => scrollByPage(-1)}
            className="pointer-events-none absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/85 text-slate-700 opacity-0 shadow-lg shadow-slate-950/10 backdrop-blur transition hover:bg-white hover:text-slate-950 focus:pointer-events-auto focus:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 group-hover/categories:pointer-events-auto group-hover/categories:opacity-100 group-focus-within/categories:pointer-events-auto group-focus-within/categories:opacity-100"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next categories"
            onClick={() => scrollByPage(1)}
            className="pointer-events-none absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/85 text-slate-700 opacity-0 shadow-lg shadow-slate-950/10 backdrop-blur transition hover:bg-white hover:text-slate-950 focus:pointer-events-auto focus:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 group-hover/categories:pointer-events-auto group-hover/categories:opacity-100 group-focus-within/categories:pointer-events-auto group-focus-within/categories:opacity-100"
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
                ? "scrollbar-none -mx-5 flex cursor-grabbing select-none gap-3 overflow-x-auto scroll-auto px-5 pb-2 sm:mx-0 sm:px-1"
                : "scrollbar-none -mx-5 flex cursor-grab gap-3 overflow-x-auto scroll-smooth px-5 pb-2 sm:mx-0 sm:px-1"
            }
          >
            {visibleCollections.map((collection) => {
              const count = getCollectionProductCount(collection, products);

              return (
                <Link
                  key={collection.handle}
                  href={`/collections/${collection.handle}`}
                  draggable={false}
                  className="group w-[42vw] max-w-40 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-950/[0.06] sm:w-[12rem] sm:max-w-none lg:w-[13rem]"
                >
                  <div className="relative aspect-square overflow-hidden bg-slate-50 sm:aspect-[4/3]">
                    {collection.image ? (
                      <Image
                        src={collection.image}
                        alt={collection.imageAlt ?? `${collection.title} collection`}
                        fill
                        sizes="13rem"
                        draggable={false}
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-slate-100 px-3 text-center text-[11px] font-black uppercase leading-4 text-slate-500">
                        Image pending
                      </div>
                    )}
                  </div>
                  <div className="flex min-h-16 items-end justify-between gap-2 p-2.5 sm:min-h-[76px] sm:gap-3 sm:p-3">
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-xs font-black leading-4 text-slate-950 transition group-hover:text-red-600 sm:text-sm sm:leading-5">{collection.title}</h3>
                      <p className="mt-1 text-[11px] font-semibold leading-3.5 text-slate-500 sm:text-xs sm:leading-4">{count} products</p>
                    </div>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition group-hover:border-red-600 group-hover:bg-red-600 group-hover:text-white sm:h-7 sm:w-7">
                      <ArrowRightIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
