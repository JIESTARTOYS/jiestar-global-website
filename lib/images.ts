export function isShopifyImage(src?: string) {
  return Boolean(src?.startsWith("https://cdn.shopify.com/"));
}

export function shouldBypassNextImageOptimization(src?: string) {
  return isShopifyImage(src);
}
