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

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

function productSearchText(product: HeaderSearchProduct) {
  return [
    product.title,
    product.sku,
    product.category,
    product.collectionHandle,
    product.series,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function searchHeaderProducts(products: Product[], query: string, limit = 5): HeaderSearchProduct[] {
  const normalizedQuery = normalizeSearchText(query);

  if (normalizedQuery.length < 2) {
    return [];
  }

  return toHeaderSearchProducts(products)
    .filter((product) => productSearchText(product).includes(normalizedQuery))
    .slice(0, limit);
}
