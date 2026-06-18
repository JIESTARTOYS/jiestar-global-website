import type { ProductSummary } from "./data";
import { sortProductsForCatalog } from "./product-sorting.ts";

export function selectLatestHomeProducts<T extends ProductSummary>(products: T[], limit = 4) {
  return sortProductsForCatalog(products, "newest").slice(0, limit);
}
