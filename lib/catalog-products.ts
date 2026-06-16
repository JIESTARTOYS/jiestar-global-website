import type { Product } from "@/lib/data";

export function toCatalogProducts(products: Product[]): Product[] {
  return products.map((product) => ({
    ...product,
    images: product.images?.slice(0, 2),
    descriptionHtml: undefined,
    variants: undefined,
  }));
}
