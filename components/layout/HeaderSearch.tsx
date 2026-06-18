"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductSummary } from "@/lib/data";
import { SearchIcon } from "@/components/ui/Icons";

type HeaderSearchProps = {
  className?: string;
  autoFocusSignal?: number;
};

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

export function HeaderSearch({ className = "h-11 w-64", autoFocusSignal }: HeaderSearchProps) {
  const router = useRouter();
  const searchId = useId();
  const listboxId = useId();
  const containerRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ProductSummary[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const normalizedQuery = useMemo(() => normalizeSearchText(query), [query]);

  const showSuggestions = isOpen && suggestions.length > 0;

  useEffect(() => {
    function closeOnOutsidePointer(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("mousedown", closeOnOutsidePointer);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsidePointer);
    };
  }, []);

  useEffect(() => {
    if (autoFocusSignal === undefined) {
      return;
    }

    inputRef.current?.focus();
  }, [autoFocusSignal]);

  useEffect(() => {
    if (normalizedQuery.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(normalizedQuery)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          setSuggestions([]);
          return;
        }

        const results = (await response.json()) as ProductSummary[];
        setSuggestions(results);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setSuggestions([]);
        }
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [normalizedQuery]);

  function goToProduct(product: ProductSummary) {
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    router.push(`/products/${product.handle}`);
  }

  return (
    <form
      ref={containerRef}
      action="/products"
      role="search"
      className={`relative flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm text-slate-500 shadow-sm transition focus-within:border-red-300 focus-within:ring-2 focus-within:ring-red-100 hover:border-slate-300 ${className}`}
      onSubmit={(event) => {
        const activeSuggestion = activeIndex >= 0 ? suggestions[activeIndex] : undefined;

        if (activeSuggestion) {
          event.preventDefault();
          goToProduct(activeSuggestion);
        }
      }}
    >
      <label htmlFor={searchId} className="sr-only">
        Search products
      </label>
      <input
        ref={inputRef}
        id={searchId}
        name="q"
        type="search"
        value={query}
        placeholder="Search products..."
        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-activedescendant={showSuggestions && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
        onChange={(event) => {
          const nextQuery = event.target.value;

          setQuery(nextQuery);
          setIsOpen(true);
          setActiveIndex(-1);

          if (normalizeSearchText(nextQuery).length < 2) {
            setSuggestions([]);
          }
        }}
        onFocus={() => {
          setIsOpen(true);
        }}
        onKeyDown={(event) => {
          if (!suggestions.length) {
            return;
          }

          if (event.key === "ArrowDown") {
            event.preventDefault();
            setIsOpen(true);
            setActiveIndex((currentIndex) => (currentIndex + 1) % suggestions.length);
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            setIsOpen(true);
            setActiveIndex((currentIndex) => (currentIndex <= 0 ? suggestions.length - 1 : currentIndex - 1));
          }

          if (event.key === "Escape") {
            event.preventDefault();
            setIsOpen(false);
            setActiveIndex(-1);
          }
        }}
      />
      <button type="submit" aria-label="Search products" className="rounded-sm p-1 text-slate-700 transition hover:text-red-600">
        <SearchIcon className="h-4 w-4" />
      </button>

      {showSuggestions ? (
        <div className="absolute left-0 top-[calc(100%+0.75rem)] z-50 w-full rounded-lg border border-slate-200 bg-white py-2 text-left shadow-xl shadow-slate-950/15">
          <div className="absolute -top-2 left-8 h-4 w-4 rotate-45 border-l border-t border-slate-200 bg-white" />
          <ul id={listboxId} role="listbox" aria-label="Product suggestions" className="relative">
            {suggestions.map((product, index) => {
              const isActive = activeIndex === index;

              return (
                <li key={product.id} id={`${listboxId}-${index}`} role="option" aria-selected={isActive}>
                  <button
                    type="button"
                    className={`block w-full px-4 py-3 text-left transition ${
                      isActive ? "bg-red-50 text-red-700" : "text-slate-900 hover:bg-slate-50 hover:text-red-600"
                    }`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => goToProduct(product)}
                  >
                    <span className="block truncate text-sm font-black">{product.title}</span>
                    <span className="mt-1 block truncate text-xs font-semibold text-slate-500">
                      {[product.sku, product.category].filter(Boolean).join(" / ")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </form>
  );
}

export function HeaderMobileSearch() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [focusSignal, setFocusSignal] = useState(0);

  useEffect(() => {
    function closeOnOutsidePointer(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsidePointer);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsidePointer);
    };
  }, []);

  function toggleSearch() {
    const nextIsOpen = !isOpen;

    setIsOpen(nextIsOpen);

    if (nextIsOpen) {
      setFocusSignal((currentSignal) => currentSignal + 1);
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative lg:hidden"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setIsOpen(false);
        }
      }}
    >
      <button
        type="button"
        aria-label={isOpen ? "Close product search" : "Open product search"}
        aria-expanded={isOpen}
        aria-controls="mobile-header-search"
        className="rounded-md p-2 text-slate-800 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-red-200"
        onClick={toggleSearch}
      >
        <SearchIcon className="h-5 w-5" />
      </button>

      {isOpen ? (
        <div
          id="mobile-header-search"
          className="fixed left-0 right-0 top-24 z-50 border-b border-slate-200 bg-white px-4 py-3 shadow-lg shadow-slate-950/10"
        >
          <div className="mx-auto max-w-7xl">
            <HeaderSearch className="h-12 w-full" autoFocusSignal={focusSignal} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
