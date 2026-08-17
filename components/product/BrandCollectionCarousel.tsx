"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import type { MouseEvent, PointerEvent } from "react";
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/Icons";
import { isSubBrandCollectionEnabled, type SubBrand } from "@/lib/sub-brands";

const DRAG_THRESHOLD = 8;

type BrandCollectionCarouselProps = {
  brands: SubBrand[];
};

type LinkedSubBrand = SubBrand & {
  collectionHandle: string;
};

export function BrandCollectionCarousel({ brands }: BrandCollectionCarouselProps) {
  const linkedBrands = brands.filter(
    (brand): brand is LinkedSubBrand =>
      Boolean(brand.collectionHandle && isSubBrandCollectionEnabled(brand.collectionHandle)),
  );
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
          <p className="text-xs font-black uppercase text-red-600">Shop by brand</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Browse JIESTAR Brands</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-500">
          Open brand collection pages to explore JIESTAR and focused sub-brands. Use the filters below to narrow the
          full catalog by product category, price, and piece count.
        </p>
      </div>

      <div className="relative">
        <button
          type="button"
          aria-label="Previous brands"
          onClick={() => scrollByPage(-1)}
          className="pointer-events-none absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/80 text-slate-700 opacity-0 shadow-lg shadow-slate-950/10 backdrop-blur transition hover:bg-white hover:text-slate-950 focus:pointer-events-auto focus:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 group-hover/carousel:pointer-events-auto group-hover/carousel:opacity-100 group-focus-within/carousel:pointer-events-auto group-focus-within/carousel:opacity-100"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Next brands"
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
          {linkedBrands.map((brand) => (
            <Link
              key={brand.name}
              href={`/collections/${brand.collectionHandle}`}
              prefetch={false}
              draggable={false}
              className="group w-[11rem] shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-950/[0.06] sm:w-[12rem] lg:w-[13rem]"
            >
              <div className="relative flex h-36 items-center justify-center overflow-hidden bg-slate-50 p-4 sm:h-40">
                <Image
                  src={brand.image}
                  alt={`${brand.name} sub-brand logo`}
                  fill
                  sizes="13rem"
                  draggable={false}
                  className="object-contain p-4 transition duration-300 group-hover:scale-105"
                />
              </div>
              <div className="grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 p-3">
                <div className="min-w-0">
                  <h3 className="line-clamp-1 text-sm font-black leading-5 text-slate-950 transition group-hover:text-red-600">
                    {brand.name}
                  </h3>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition group-hover:border-red-600 group-hover:bg-red-600 group-hover:text-white">
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
