import { ProductCatalog } from "@/components/product/ProductCatalog";
import { buildPaginationHref, getPaginatedItems } from "@/lib/product-pagination";
import { DEFAULT_PRODUCT_SORT } from "@/lib/product-sorting";
import { createMetadata } from "@/lib/seo";
import { getShopifyCollections, getShopifyProductSummaries } from "@/lib/shopify";

export const revalidate = 300;

type PageProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

const productsTitle = "Building Block Sets | JIESTAR Wholesale & Custom Supply";
const productsDescription =
  "Browse JIESTAR building block sets for collectors, retailers, distributors, ecommerce sellers, wholesale catalog planning, and custom product cooperation.";

export async function generateMetadata({ searchParams }: PageProps) {
  const [{ page }, products] = await Promise.all([searchParams, getShopifyProductSummaries()]);
  const currentPage = getPaginatedItems(products, page).currentPage;

  return createMetadata({
    title: currentPage > 1 ? `Building Block Sets - Page ${currentPage} | JIESTAR` : productsTitle,
    description: productsDescription,
    path: buildPaginationHref("/products", currentPage),
  });
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const [{ page }, products, collections] = await Promise.all([
    searchParams,
    getShopifyProductSummaries(),
    getShopifyCollections(),
  ]);

  return (
    <ProductCatalog
      allProducts={products}
      collections={collections}
      selectedPage={page}
      selectedFilters={{
        sort: DEFAULT_PRODUCT_SORT,
      }}
    />
  );
}
