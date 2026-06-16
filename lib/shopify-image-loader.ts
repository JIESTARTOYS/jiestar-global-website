type ImageLoaderParams = {
  src: string;
  width: number;
  quality?: number;
};

/**
 * Global next/image loader (configured via `images.loaderFile` in next.config).
 *
 * Runs for every <Image> on the site, in both Server and Client Components, so we
 * can request correctly-sized images instead of full-resolution originals without
 * passing a function prop across the RSC boundary.
 *
 * - Shopify CDN: resize on the fly via the `width` query param.
 * - Unsplash: resize via its `w` / `q` params.
 * - Local/static assets: served as-is (already small, no resizer available).
 *
 * Shopify width is capped at MAX_SHOPIFY_WIDTH: source images are ~800-1024px, so
 * `fill` images that would otherwise request the 3840px srcset candidate (a slow,
 * upscaled, rarely-cached variant) are funneled down to a small set of cacheable
 * sizes. This is what keeps deep catalog pages and the gallery fast.
 */
const MAX_SHOPIFY_WIDTH = 768;

export default function imageLoader({ src, width, quality }: ImageLoaderParams) {
  if (src.startsWith("https://cdn.shopify.com/")) {
    try {
      const url = new URL(src);
      url.searchParams.set("width", String(Math.min(width, MAX_SHOPIFY_WIDTH)));

      if (quality) {
        url.searchParams.set("quality", String(quality));
      }

      return url.toString();
    } catch {
      return src;
    }
  }

  if (src.startsWith("https://images.unsplash.com/")) {
    try {
      const url = new URL(src);
      url.searchParams.set("w", String(width));
      url.searchParams.set("q", String(quality ?? 75));
      url.searchParams.set("auto", "format");

      return url.toString();
    } catch {
      return src;
    }
  }

  return src;
}
