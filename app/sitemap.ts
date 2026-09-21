import { getCollectionBuyingContent } from "@/lib/collection-content";
import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/data";
import { BLOG_SECTION_SLUGS, getBlogPosts } from "@/lib/blog";
import { getShopifyCollections, getShopifyProductSummaries } from "@/lib/shopify";
import { getEnabledSubBrandCollectionHandles } from "@/lib/sub-brands";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [collections, products] = await Promise.all([getShopifyCollections(), getShopifyProductSummaries()]);
  const collectionHandles = Array.from(
    new Set([
      ...collections.map((collection) => collection.handle),
      ...getEnabledSubBrandCollectionHandles(),
    ]),
  );
  const staticRoutes = [
    "",
    "/products",
    "/wholesale",
    "/custom-solutions",
    "/about",
    "/quality-safety",
    "/blog",
    "/contact",
    "/business-information",
    "/policies/shipping-policy",
    "/policies/refund-policy",
    "/policies/privacy-policy",
    "/policies/terms-of-service",
    "/support/replacement-parts",
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteConfig.url}${route}`,
      ...(["", "/wholesale", "/custom-solutions", "/about", "/contact", "/business-information", "/policies/terms-of-service", "/policies/privacy-policy", "/policies/refund-policy"].includes(route)
        ? { lastModified: new Date("2026-09-17") }
        : {}),
    })),
    ...BLOG_SECTION_SLUGS.map((slug) => ({
      url: `${siteConfig.url}/blog/category/${slug}`,
    })),
    ...collectionHandles.map((handle) => {
      const content = getCollectionBuyingContent(handle);

      return {
        url: `${siteConfig.url}/collections/${handle}`,
        ...(content ? { lastModified: new Date(content.updatedAt) } : {}),
      };
    }),
    ...products.map((product) => {
      const lastModified = product.updatedAt ?? product.createdAt;

      return {
        url: `${siteConfig.url}/products/${product.handle}`,
        ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
      };
    }),
    ...getBlogPosts().map((post) => ({
      url: `${siteConfig.url}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt ?? post.date),
    })),
  ];
}
