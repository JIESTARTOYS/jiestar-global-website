import { ProductCatalog } from "@/components/product/ProductCatalog";
import { DEFAULT_PRODUCT_SORT } from "@/lib/product-sorting";
import { createMetadata } from "@/lib/seo";
import { getShopifyCollections, getShopifyProductSummaries } from "@/lib/shopify";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "Building Block Sets | JIESTAR Wholesale & Custom Supply",
  description:
    "Browse JIESTAR building block sets for collectors, retailers, distributors, ecommerce sellers, wholesale catalog planning, and custom product cooperation.",
  path: "/products",
});

export default async function ProductsPage() {
  const products = await getShopifyProductSummaries();
  const collections = await getShopifyCollections();

  return (
    <ProductCatalog
      allProducts={products}
      collections={collections}
      selectedFilters={{
        sort: DEFAULT_PRODUCT_SORT,
      }}
    />
  );
}
