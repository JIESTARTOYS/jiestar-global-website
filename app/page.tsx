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
import { createMetadata } from "@/lib/seo";
import { getShopifyCollections, getShopifyProducts } from "@/lib/shopify";

export const metadata = createMetadata({
  title: "JIESTAR Toys | Building Block Sets, Wholesale & Custom Solutions",
  description:
    "Discover JIESTAR building block sets for collectors, retailers, distributors, and global ecommerce sellers. Explore factory-direct products, wholesale support, OEM/ODM customization, product co-development, and sub-brand partnerships.",
  path: "/",
});

export default async function Home() {
  const products = await getShopifyProducts();
  const collections = await getShopifyCollections();

  return (
    <>
      <HomeHero />
      <ProductCategories collections={collections} products={products} />
      <FeaturedProducts products={products} />
      <HomeBrandPortfolio />
      <B2BCooperation />
      <CustomSolutions />
      <QualitySafety />
      <BrandStory />
      <BrandStrength productCount={products.length} />
      <FinalCTA />
      <BlogPreview />
    </>
  );
}
