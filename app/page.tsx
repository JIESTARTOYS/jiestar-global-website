import { B2BCooperation } from "@/components/sections/B2BCooperation";
import { BlogPreview } from "@/components/sections/BlogPreview";
import { BrandStory } from "@/components/sections/BrandStory";
import { BrandStrength } from "@/components/sections/BrandStrength";
import { CustomSolutions } from "@/components/sections/CustomSolutions";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { HomeBrandPortfolio } from "@/components/sections/HomeBrandPortfolio";
import { HomeHero } from "@/components/sections/HomeHero";
import { ProductCategories } from "@/components/sections/ProductCategories";
import { QualitySafety } from "@/components/sections/QualitySafety";
import { getCollectionProductCount, getCollectionsWithProducts } from "@/lib/collection-utils";
import { createMetadata } from "@/lib/seo";
import { getShopifyCollections, getShopifyProductSummaries } from "@/lib/shopify";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "JIESTAR Official | Building Block Sets, Wholesale & Custom OEM/ODM Solutions",
  description:
    "JIESTAR is the official building block brand of Guangdong Jiexing Toys, supporting global buyers with building block sets, wholesale supply, OEM/ODM customization, packaging, and long-term product cooperation.",
  path: "/",
});

export default async function Home() {
  const [products, collections] = await Promise.all([
    getShopifyProductSummaries(),
    getShopifyCollections(),
  ]);
  const productCategories = getCollectionsWithProducts(collections, products).map((collection) => ({
    handle: collection.handle,
    title: collection.title,
    image: collection.image,
    imageAlt: collection.imageAlt,
    productCount: getCollectionProductCount(collection, products),
  }));

  return (
    <>
      <HomeHero />
      <ProductCategories categories={productCategories} />
      <FeaturedProducts products={products} />
      <HomeBrandPortfolio />
      <B2BCooperation />
      <CustomSolutions />
      <QualitySafety />
      <BrandStory />
      <BrandStrength />
      <FinalCTA />
      <BlogPreview />
    </>
  );
}
