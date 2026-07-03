import type { Metadata } from "next";
import { CartProvider } from "@/components/cart/CartProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { siteConfig } from "@/lib/data";
import { createJsonLdScript, createOrganizationJsonLd, createWebSiteJsonLd } from "@/lib/seo";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" translate="no" className="h-full antialiased" suppressHydrationWarning>
      <body className="notranslate min-h-full bg-[#f6f7f9] text-slate-950">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={createJsonLdScript([createOrganizationJsonLd(), createWebSiteJsonLd()])}
        />
        <CartProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
