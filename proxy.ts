import { NextResponse, type NextRequest } from "next/server";

import { isValidProductHandle } from "@/lib/product-handle";

const PRODUCT_PATH_PREFIX = "/products/";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!pathname.startsWith(PRODUCT_PATH_PREFIX)) {
    return NextResponse.next();
  }

  const handle = pathname.slice(PRODUCT_PATH_PREFIX.length);

  if (handle.includes("/") || !isValidProductHandle(handle)) {
    return NextResponse.redirect(new URL("/products", request.url), 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/products/:path*"],
};
