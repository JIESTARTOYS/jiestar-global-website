import { ProductCatalog } from "@/components/product/ProductCatalog";
import { toCatalogProducts } from "@/lib/catalog-products";
import { DEFAULT_PRODUCT_SORT } from "@/lib/product-sorting";
import { createMetadata } from "@/lib/seo";
import { getShopifyCollections, getShopifyProducts } from "@/lib/shopify";

export const metadata = createMetadata({
  title: "Building Block Sets",
  description:
    "Browse JIESTAR building block sets for collectors, families, retailers, ecommerce sellers, and wholesale buyers.",
  path: "/products",
});

type ProductSearchParams = {
  q?: string | string[];
  category?: string | string[];
  pieces?: string | string[];
  price?: string | string[];
  sort?: string | string[];
  page?: string | string[];
};

type ProductsPageProps = {
  searchParams: Promise<ProductSearchParams>;
};

function getParamValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const products = toCatalogProducts(await getShopifyProducts());
  const collections = await getShopifyCollections();
  const selectedQuery = getParamValue(params.q);
  const selectedCategory = getParamValue(params.category);
  const selectedPieces = getParamValue(params.pieces);
  const selectedPrice = getParamValue(params.price);
  const selectedSort = getParamValue(params.sort) ?? DEFAULT_PRODUCT_SORT;
  const selectedPage = getParamValue(params.page);

  return (
    <ProductCatalog
      allProducts={products}
      collections={collections}
      selectedFilters={{
        query: selectedQuery,
        category: selectedCategory,
        pieces: selectedPieces,
        price: selectedPrice,
        sort: selectedSort,
      }}
      selectedPage={selectedPage}
    />
  );
}
