import type { MetadataRoute } from "next";
import { collections, products, siteConfig } from "@/lib/data";
import { getBlogPosts } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/products",
    "/wholesale",
    "/custom-solutions",
    "/about",
    "/quality-safety",
    "/blog",
    "/contact",
    "/policies/shipping-policy",
    "/policies/refund-policy",
    "/policies/privacy-policy",
    "/policies/terms-of-service",
    "/support/replacement-parts",
  ];

  return [
    ...staticRoutes.map((route) => ({ url: `${siteConfig.url}${route}`, lastModified: new Date() })),
    ...collections.map((collection) => ({
      url: `${siteConfig.url}/collections/${collection.handle}`,
      lastModified: new Date(),
    })),
    ...products.map((product) => ({
      url: `${siteConfig.url}/products/${product.handle}`,
      lastModified: new Date(),
    })),
    ...getBlogPosts().map((post) => ({
      url: `${siteConfig.url}/blog/${post.slug}`,
      lastModified: new Date(post.date),
    })),
  ];
}
