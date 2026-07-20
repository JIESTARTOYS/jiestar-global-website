import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/data";
import { robotsRules } from "@/lib/seo-routing";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: robotsRules,
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
