import { ProductCatalog } from "@/components/product/ProductCatalog";
import { collections } from "@/lib/data";
import { createMetadata } from "@/lib/seo";
import { getShopifyProducts } from "@/lib/shopify";

export const metadata = createMetadata({
  title: "Building Block Sets",
  description:
    "Browse JIESTAR building block sets for collectors, families, retailers, ecommerce sellers, and wholesale buyers.",
  path: "/products",
});

export default async function ProductsPage() {
  const products = await getShopifyProducts();

  return <ProductCatalog products={products} collections={collections} />;
}
