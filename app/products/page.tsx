import { ProductCatalog } from "@/components/product/ProductCatalog";
import { createMetadata } from "@/lib/seo";
import { getShopifyCollections, getShopifyProducts } from "@/lib/shopify";

export const metadata = createMetadata({
  title: "Building Block Sets",
  description:
    "Browse JIESTAR building block sets for collectors, families, retailers, ecommerce sellers, and wholesale buyers.",
  path: "/products",
});

type ProductSearchParams = {
  category?: string | string[];
  pieces?: string | string[];
  price?: string | string[];
  sort?: string | string[];
};

type ProductsPageProps = {
  searchParams: Promise<ProductSearchParams>;
};

function getParamValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const products = await getShopifyProducts();
  const collections = await getShopifyCollections();
  const selectedCategory = getParamValue(params.category);
  const selectedPieces = getParamValue(params.pieces);
  const selectedPrice = getParamValue(params.price);
  const selectedSort = getParamValue(params.sort) ?? "popular";

  return (
    <ProductCatalog
      allProducts={products}
      collections={collections}
      selectedFilters={{
        category: selectedCategory,
        pieces: selectedPieces,
        price: selectedPrice,
        sort: selectedSort,
      }}
    />
  );
}
