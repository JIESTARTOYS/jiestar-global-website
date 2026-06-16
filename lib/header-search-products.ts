import type { Product } from "@/lib/data";

export type HeaderSearchProduct = Pick<
  Product,
  "id" | "handle" | "title" | "sku" | "category" | "collectionHandle" | "series"
>;

export function toHeaderSearchProducts(products: Product[]): HeaderSearchProduct[] {
  return products.map(({ id, handle, title, sku, category, collectionHandle, series }) => ({
    id,
    handle,
    title,
    sku,
    category,
    collectionHandle,
    series,
  }));
}
