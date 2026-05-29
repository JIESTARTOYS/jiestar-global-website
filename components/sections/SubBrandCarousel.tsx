"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export type SubBrand = {
  name: string;
  description: string;
  image: string;
  width: number;
  height: number;
};

type SubBrandCarouselProps = {
  brands: SubBrand[];
  fadeBackground?: "white" | "page";
};

export function SubBrandCarousel({ brands, fadeBackground = "white" }: SubBrandCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startX: 0, scrollLeft: 0 });
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

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const viewport = scrollRef.current;

    if (!viewport) {
      return;
    }

    setIsDragging(true);
    dragRef.current = {
      startX: event.clientX,
      scrollLeft: viewport.scrollLeft,
    };
    viewport.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const viewport = scrollRef.current;

    if (!isDragging || !viewport) {
      return;
    }

    event.preventDefault();
    viewport.scrollLeft = dragRef.current.scrollLeft - (event.clientX - dragRef.current.startX);
    normalizeScroll(viewport);
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    const viewport = scrollRef.current;

    setIsDragging(false);

    if (viewport?.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
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
        onScroll={(event) => normalizeScroll(event.currentTarget)}
        className={`scrollbar-none overflow-x-auto ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        <div className="flex w-max gap-4 py-1">
          {repeatedBrands.map((brand, index) => (
            <article
              key={`${brand.name}-${index}`}
              aria-hidden={index < brands.length || index >= brands.length * 2}
              className="w-64 shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md sm:w-72 sm:p-5"
            >
              <div className="flex h-44 items-center justify-center rounded-md bg-white p-4">
                <Image
                  src={brand.image}
                  alt={`${brand.name} sub-brand logo`}
                  width={brand.width}
                  height={brand.height}
                  draggable={false}
                  className="h-32 w-auto max-w-[240px] object-contain"
                />
              </div>
              <h2 className="mt-5 text-base font-semibold text-slate-950">{brand.name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{brand.description}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
