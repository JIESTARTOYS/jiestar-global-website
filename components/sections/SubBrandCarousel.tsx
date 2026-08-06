"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent, PointerEvent } from "react";
import type { SubBrand } from "@/lib/sub-brands";

const DRAG_THRESHOLD = 8;

type SubBrandCarouselProps = {
  brands: SubBrand[];
  fadeBackground?: "white" | "page";
};

export function SubBrandCarousel({ brands, fadeBackground = "white" }: SubBrandCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ pointerId: -1, startX: 0, scrollLeft: 0, hasDragged: false });
  const cancelClickRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const repeatedBrands = [...brands, ...brands, ...brands];
  const leftFadeClassName =
    fadeBackground === "page"
      ? "bg-gradient-to-r from-[#f6f7f9] via-[#f6f7f9]/85 to-transparent"
      : "bg-gradient-to-r from-white via-white/85 to-transparent";
  const rightFadeClassName =
    fadeBackground === "page"
      ? "bg-gradient-to-l from-[#f6f7f9] via-[#f6f7f9]/85 to-transparent"
      : "bg-gradient-to-l from-white via-white/85 to-transparent";

  const getSegmentWidth = useCallback((viewport: HTMLDivElement) => {
    return viewport.scrollWidth / 3;
  }, []);

  const normalizeScroll = useCallback((viewport: HTMLDivElement) => {
    const segmentWidth = getSegmentWidth(viewport);

    if (segmentWidth <= 0) {
      return;
    }

    if (viewport.scrollLeft < segmentWidth * 0.5) {
      viewport.scrollLeft += segmentWidth;
    }

    if (viewport.scrollLeft > segmentWidth * 1.5) {
      viewport.scrollLeft -= segmentWidth;
    }
  }, [getSegmentWidth]);

  useEffect(() => {
    const viewport = scrollRef.current;

    if (!viewport) {
      return;
    }

    const segmentWidth = getSegmentWidth(viewport);
    viewport.scrollLeft = segmentWidth;
  }, [brands.length, getSegmentWidth]);

  useEffect(() => {
    let frameId = 0;

    function tick() {
      const viewport = scrollRef.current;

      if (viewport && !isPaused && !isDragging) {
        viewport.scrollLeft += 0.45;
        normalizeScroll(viewport);
      }

      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [isDragging, isPaused, normalizeScroll]);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    const viewport = scrollRef.current;

    if (!viewport) {
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: viewport.scrollLeft,
      hasDragged: false,
    };
    cancelClickRef.current = false;
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const viewport = scrollRef.current;
    const dragState = dragRef.current;

    if (!viewport || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;

    if (!dragState.hasDragged && Math.abs(deltaX) > DRAG_THRESHOLD) {
      dragState.hasDragged = true;
      cancelClickRef.current = true;
      setIsDragging(true);

      if (!viewport.hasPointerCapture(event.pointerId)) {
        viewport.setPointerCapture(event.pointerId);
      }
    }

    if (dragState.hasDragged) {
      event.preventDefault();
      viewport.scrollLeft = dragState.scrollLeft - deltaX;
      normalizeScroll(viewport);
    }
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    const viewport = scrollRef.current;
    const dragState = dragRef.current;

    if (!viewport || dragState.pointerId !== event.pointerId) {
      return;
    }


    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    dragRef.current = {
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
    <div
      className="relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-16 sm:w-24 ${leftFadeClassName}`} />
      <div className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-16 sm:w-24 ${rightFadeClassName}`} />

      <div
        ref={scrollRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={(event) => {
          if (isDragging) {
            handlePointerEnd(event);
          }
        }}
        onClickCapture={handleClickCapture}
        onDragStart={(event) => event.preventDefault()}
        onScroll={(event) => normalizeScroll(event.currentTarget)}
        className={`scrollbar-none overflow-x-auto ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        <div className="flex w-max gap-4 py-1">
          {repeatedBrands.map((brand, index) => {
            const isPrimarySegment = index >= brands.length && index < brands.length * 2;

            return (
              <BrandCard key={`${brand.name}-${index}`} brand={brand} isPrimarySegment={isPrimarySegment}>
                <div className="flex h-44 items-center justify-center rounded-md bg-white p-4">
                  <Image
                    src={brand.image}
                    alt={`${brand.name} sub-brand logo`}
                    width={brand.width}
                    height={brand.height}
                    loading={isPrimarySegment ? "eager" : "lazy"}
                    draggable={false}
                    className="h-32 w-auto max-w-[240px] object-contain"
                  />
                </div>
                <h2 className="mt-5 text-base font-semibold text-slate-950">{brand.name}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{brand.description}</p>
              </BrandCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BrandCard({
  brand,
  children,
  isPrimarySegment,
}: {
  brand: SubBrand;
  children: React.ReactNode;
  isPrimarySegment: boolean;
}) {
  const className =
    "block w-64 shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 sm:w-72 sm:p-5";

  if (brand.collectionHandle && brand.isCollectionEnabled !== false) {
    return (
      <Link
        href={`/collections/${brand.collectionHandle}`}
        draggable={false}
        aria-hidden={!isPrimarySegment}
        tabIndex={isPrimarySegment ? undefined : -1}
        className={className}
      >
        {children}
      </Link>
    );
  }

  return (
    <article aria-hidden={!isPrimarySegment} className={className}>
      {children}
    </article>
  );
}
