import { ProductCatalog } from "@/components/product/ProductCatalog";
import type { Product } from "@/lib/data";
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

function priceNumber(price: string) {
  return Number(price.replace(/[^0-9.]/g, "")) || 0;
}

function pieceCountNumber(pieceCount: string) {
  return Number(pieceCount.replace(/[^0-9]/g, "")) || 0;
}

function filterByPieceCount(product: Product, range?: string) {
  const count = pieceCountNumber(product.pieceCount);

  if (!range || !count) {
    return true;
  }

  if (range === "under-500") {
    return count < 500;
  }

  if (range === "500-1000") {
    return count >= 500 && count <= 1000;
  }

  if (range === "1000-2000") {
    return count >= 1000 && count <= 2000;
  }

  if (range === "2000-plus") {
    return count >= 2000;
  }

  return true;
}

function filterByPrice(product: Product, range?: string) {
  const price = priceNumber(product.price);

  if (!range || !price) {
    return true;
  }

  if (range === "under-50") {
    return price < 50;
  }

  if (range === "50-100") {
    return price >= 50 && price <= 100;
  }

  if (range === "100-150") {
    return price > 100 && price <= 150;
  }

  if (range === "150-plus") {
    return price > 150;
  }

  return true;
}

function sortProducts(products: Product[], sort?: string) {
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

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const products = await getShopifyProducts();
  const collections = await getShopifyCollections();
  const selectedCategory = getParamValue(params.category);
  const selectedPieces = getParamValue(params.pieces);
  const selectedPrice = getParamValue(params.price);
  const selectedSort = getParamValue(params.sort) ?? "popular";
  const filteredProducts = sortProducts(
    products.filter((product) => {
      const matchesCategory =
        !selectedCategory ||
        product.collectionHandle === selectedCategory ||
        product.category.toLowerCase() === selectedCategory.toLowerCase();

      return (
        matchesCategory &&
        filterByPieceCount(product, selectedPieces) &&
        filterByPrice(product, selectedPrice)
      );
    }),
    selectedSort,
  );

  return (
    <ProductCatalog
      allProducts={products}
      products={filteredProducts}
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
