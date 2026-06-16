import type { Product } from "@/lib/data";

export const DEFAULT_PRODUCT_SORT = "newest";

export function priceNumber(price: string) {
  return Number(price.replace(/[^0-9.]/g, "")) || 0;
}

export function sortProductsForCatalog(products: Product[], sort = DEFAULT_PRODUCT_SORT) {
  const sortedProducts = [...products];

  if (sort === "price-asc") {
    return sortedProducts.sort((a, b) => priceNumber(a.price) - priceNumber(b.price));
  }

  if (sort === "price-desc") {
    return sortedProducts.sort((a, b) => priceNumber(b.price) - priceNumber(a.price));
  }

  if (sort === "newest") {
    return sortedProducts.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      return bTime - aTime;
    });
  }

  return sortedProducts;
}
