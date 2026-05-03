import type { Metadata } from "next";
import { siteConfig } from "./data";

type SeoInput = {
  title: string;
  description: string;
  path?: string;
};

export function createMetadata({ title, description, path = "" }: SeoInput): Metadata {
  const canonical = `${siteConfig.url}${path}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: siteConfig.name,
      type: "website",
    },
  };
}
