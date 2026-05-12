"use client";

import Link from "next/link";

export default function ProductsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="bg-white px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-slate-50 p-8 text-center shadow-sm shadow-slate-950/[0.03]">
        <p className="text-sm font-black uppercase text-red-600">Product data unavailable</p>
        <h1 className="mt-3 text-3xl font-black text-slate-950">The Shopify catalog could not be loaded.</h1>
        <p className="mt-4 text-base leading-8 text-slate-600">
          Product data is managed in Shopify. Check the Vercel server logs for the Shopify data-source diagnostic before redeploying.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-12 items-center justify-center rounded-md bg-red-600 px-6 text-sm font-black text-white transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            Try Again
          </button>
          <Link
            href="/contact"
            className="inline-flex h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-6 text-sm font-black text-slate-950 transition hover:border-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            Contact JIESTAR
          </Link>
        </div>
      </div>
    </div>
  );
}
