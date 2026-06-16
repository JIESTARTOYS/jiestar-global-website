import type { Metadata } from "next";
import { CartProvider } from "@/components/cart/CartProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { siteConfig } from "@/lib/data";
import { toHeaderSearchProducts } from "@/lib/header-search-products";
import { getShopifyProducts } from "@/lib/shopify";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "JIESTAR Toys | Building Block Sets, Wholesale & Custom Solutions",
    template: "%s | JIESTAR Toys",
  },
  description:
    "Discover JIESTAR building block sets for collectors, retailers, distributors, and global ecommerce sellers.",
  other: {
    google: "notranslate",
  },
};

async function getHeaderSearchProducts() {
  try {
    return toHeaderSearchProducts(await getShopifyProducts());
  } catch (error) {
    console.warn("[header-search:products]", {
      message: error instanceof Error ? error.message : "Product suggestions lookup failed.",
    });

    return [];
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const searchProducts = await getHeaderSearchProducts();

  return (
    <html lang="en" translate="no" className="h-full antialiased" suppressHydrationWarning>
      <body className="notranslate min-h-full bg-[#f6f7f9] text-slate-950">
        <CartProvider>
          <Header searchProducts={searchProducts} />
          <main>{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
