import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { siteConfig } from "@/lib/data";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "JIESTAR Toys | Building Block Sets, Wholesale & Custom Solutions",
    template: "%s | JIESTAR Toys",
  },
  description:
    "Discover JIESTAR building block sets for collectors, retailers, distributors, and global ecommerce sellers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-[#f6f7f9] text-slate-950">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
