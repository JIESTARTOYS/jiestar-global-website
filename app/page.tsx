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
import { getShopifyCollections, getShopifyProductSummaries } from "@/lib/shopify";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "JIESTAR Official | Building Block Sets, Wholesale & Custom OEM/ODM Solutions",
  description:
    "Shop JIESTAR building block sets and explore wholesale or OEM/ODM cooperation through the brand's authorized international website and sales operator.",
  path: "/",
});

export default async function Home() {
  const products = await getShopifyProductSummaries();
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
      <BrandStrength />
      <FinalCTA />
      <BlogPreview />
    </>
  );
}
