import { NextResponse } from "next/server";
import { getCart, removeCartLine, updateCartLine } from "@/lib/shopify";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to update Shopify cart.";
}

function readCartLineBody(body: { cartId?: unknown; lineId?: unknown }) {
  const cartId = typeof body.cartId === "string" ? body.cartId.trim() : "";
  const lineId = typeof body.lineId === "string" ? body.lineId.trim() : "";

  if (!cartId) {
    return { error: "Missing Shopify cart ID." };
  }

  if (!lineId) {
    return { error: "Missing Shopify cart line ID." };
  }

  return { cartId, lineId };
}

function readOptionalMerchandiseId(body: { merchandiseId?: unknown }) {
  return typeof body.merchandiseId === "string" ? body.merchandiseId.trim() : "";
}

function isMissingLineError(message: string) {
  const normalized = message.toLowerCase();

  return normalized.includes("line") && normalized.includes("does not exist");
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      cartId?: unknown;
      lineId?: unknown;
      merchandiseId?: unknown;
      quantity?: unknown;
    };
    const parsed = readCartLineBody(body);

    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const quantity = typeof body.quantity === "number" ? Math.floor(body.quantity) : Number.NaN;

    if (!Number.isFinite(quantity) || quantity < 1) {
      return NextResponse.json({ error: "Cart line quantity must be at least 1." }, { status: 400 });
    }

    try {
      const cart = await updateCartLine(parsed.cartId, parsed.lineId, quantity);

      return NextResponse.json({ cart });
    } catch (error) {
      const message = getErrorMessage(error);
      const merchandiseId = readOptionalMerchandiseId(body);

      if (!merchandiseId || !isMissingLineError(message)) {
        throw error;
      }

      const currentCart = await getCart(parsed.cartId);

      if (!currentCart) {
        return NextResponse.json(
          { error: "Shopify cart was not found.", expired: true },
          { status: 404 },
        );
      }

      const currentLine = currentCart.lines.find((line) => line.merchandiseId === merchandiseId);

      if (!currentLine) {
        return NextResponse.json({
          cart: currentCart,
          itemMissing: true,
          error: "That cart item is no longer available. The cart has been refreshed.",
        });
      }

      const cart = await updateCartLine(parsed.cartId, currentLine.id, quantity);

      return NextResponse.json({ cart });
    }
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { cartId?: unknown; lineId?: unknown; merchandiseId?: unknown };
    const parsed = readCartLineBody(body);

    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    try {
      const cart = await removeCartLine(parsed.cartId, parsed.lineId);

      return NextResponse.json({ cart });
    } catch (error) {
      const message = getErrorMessage(error);
      const merchandiseId = readOptionalMerchandiseId(body);

      if (!merchandiseId || !isMissingLineError(message)) {
        throw error;
      }

      const currentCart = await getCart(parsed.cartId);

      if (!currentCart) {
        return NextResponse.json(
          { error: "Shopify cart was not found.", expired: true },
          { status: 404 },
        );
      }

      const currentLine = currentCart.lines.find((line) => line.merchandiseId === merchandiseId);

      if (!currentLine) {
        return NextResponse.json({
          cart: currentCart,
          itemMissing: true,
          error: "That cart item is no longer available. The cart has been refreshed.",
        });
      }

      const cart = await removeCartLine(parsed.cartId, currentLine.id);

      return NextResponse.json({ cart });
    }
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
