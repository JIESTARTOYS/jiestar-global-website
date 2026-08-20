import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SafeAnalytics } from "@/components/analytics/SafeAnalytics";
import { LocalizedFooter } from "@/components/layout/LocalizedFooter";
import { LocalizedHeader } from "@/components/layout/LocalizedHeader";
import { siteConfig } from "@/lib/data";
import { isPrefixedLocale, prefixedLocales } from "@/lib/i18n/routing";
import { createJsonLdScript, createOrganizationJsonLd, createWebSiteJsonLd } from "@/lib/seo";
import "../../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "JIESTAR | Bloques de construcción, venta mayorista y OEM/ODM",
    template: "%s | JIESTAR",
  },
  description:
    "JIESTAR ofrece bloques de construcción, suministro mayorista y soluciones OEM/ODM para socios internacionales.",
};

export function generateStaticParams() {
  return prefixedLocales.map((locale) => ({ locale }));
}

export default async function LocalizedRootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!isPrefixedLocale(locale)) {
    notFound();
  }

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full bg-[#f6f7f9] text-slate-950">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={createJsonLdScript([
            createOrganizationJsonLd(),
            createWebSiteJsonLd(),
          ])}
        />
        <LocalizedHeader locale={locale} />
        <main>{children}</main>
        <LocalizedFooter locale={locale} />
        <SafeAnalytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
