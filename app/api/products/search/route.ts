import { NextResponse } from "next/server";
import { searchHeaderProducts } from "@/lib/header-search-products";
import { getShopifyProducts } from "@/lib/shopify";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  if (query.trim().length < 2) {
    return NextResponse.json({ products: [] });
  }

  try {
    const products = await getShopifyProducts();

    return NextResponse.json({ products: searchHeaderProducts(products, query) });
  } catch (error) {
    console.warn("[product-search:products]", {
      message: error instanceof Error ? error.message : "Product search lookup failed.",
    });

    return NextResponse.json({ products: [] }, { status: 503 });
  }
}
