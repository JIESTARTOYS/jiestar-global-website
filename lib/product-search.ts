import type { ProductSummary } from "@/lib/data";

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

function productSearchText(product: ProductSummary) {
  return [
    product.title,
    product.sku,
    product.category,
    product.collectionHandle,
    product.series,
    product.pieceCount,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function selectProductSearchResults(
  products: ProductSummary[],
  query: string,
  limit = 5,
) {
  const normalizedQuery = normalizeSearchText(query);

  if (normalizedQuery.length < 2) {
    return [];
  }

  return products
    .filter((product) => productSearchText(product).includes(normalizedQuery))
    .slice(0, limit);
}
