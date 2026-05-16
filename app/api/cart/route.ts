import { NextResponse } from "next/server";
import { addCartLine, createCart, getCart } from "@/lib/shopify";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to update Shopify cart.";
}

function isExpiredCartError(message: string) {
  const normalized = message.toLowerCase();

  return normalized.includes("cart does not exist") || normalized.includes("invalid id");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cartId = searchParams.get("cartId")?.trim();

    if (!cartId) {
      return NextResponse.json({ error: "Missing Shopify cart ID." }, { status: 400 });
    }

    const cart = await getCart(cartId);

    if (!cart) {
      return NextResponse.json({ error: "Shopify cart was not found.", expired: true }, { status: 404 });
    }

    return NextResponse.json({ cart });
  } catch (error) {
    const message = getErrorMessage(error);

    return NextResponse.json({ error: message, expired: isExpiredCartError(message) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      cartId?: unknown;
      variantId?: unknown;
      quantity?: unknown;
    };
    const cartId = typeof body.cartId === "string" ? body.cartId.trim() : "";
    const variantId = typeof body.variantId === "string" ? body.variantId.trim() : "";
    const quantity = typeof body.quantity === "number" && body.quantity > 0 ? Math.floor(body.quantity) : 1;

    if (!variantId) {
      return NextResponse.json({ error: "Missing Shopify variant ID." }, { status: 400 });
    }

    try {
      if (cartId) {
        const existingCart = await getCart(cartId);

        if (existingCart && existingCart.totalQuantity > 0) {
          const cart = await addCartLine(cartId, variantId, quantity);

          return NextResponse.json({ cart });
        }
      }

      const cart = await createCart(variantId, quantity);

      return NextResponse.json({ cart });
    } catch (error) {
      const message = getErrorMessage(error);

      if (!cartId || !isExpiredCartError(message)) {
        throw error;
      }

      const cart = await createCart(variantId, quantity);

      return NextResponse.json({ cart, replacedExpiredCart: true });
    }
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
