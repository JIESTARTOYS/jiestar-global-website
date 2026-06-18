import { NextResponse } from "next/server";
import { selectProductSearchResults } from "@/lib/product-search";
import { getShopifyProductSummaries } from "@/lib/shopify";

export const revalidate = 300;

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  const cacheHeaders = {
    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
  };

  if (query.trim().length < 2) {
    return NextResponse.json([], { headers: cacheHeaders });
  }

  try {
    const products = await getShopifyProductSummaries();

    return NextResponse.json(selectProductSearchResults(products, query), {
      headers: cacheHeaders,
    });
  } catch (error) {
    console.warn("[api/products/search]", {
      message: error instanceof Error ? error.message : "Product search lookup failed.",
    });

    return NextResponse.json([], {
      headers: cacheHeaders,
      status: 200,
    });
  }
}
