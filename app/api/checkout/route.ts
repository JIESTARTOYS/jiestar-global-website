import { NextResponse } from "next/server";
import { createCheckoutUrl } from "@/lib/shopify";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { variantId?: unknown };
    const variantId = typeof body.variantId === "string" ? body.variantId.trim() : "";

    if (!variantId) {
      return NextResponse.json({ error: "Missing Shopify variant ID." }, { status: 400 });
    }

    const checkoutUrl = await createCheckoutUrl(variantId);

    if (!checkoutUrl) {
      return NextResponse.json({ error: "Shopify did not return a checkout URL." }, { status: 502 });
    }

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create Shopify checkout.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
