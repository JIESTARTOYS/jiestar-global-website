import Image from "next/image";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { collections, getCollection, getProductsByCollection } from "@/lib/data";
import { createMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ handle: string }>;
};

export function generateStaticParams() {
  return collections.map((collection) => ({ handle: collection.handle }));
}

export async function generateMetadata({ params }: PageProps) {
  const { handle } = await params;
  const collection = getCollection(handle);

  if (!collection) {
    return {};
  }

  return createMetadata({
    title: `${collection.title} Building Block Sets`,
    description: collection.description,
    path: `/collections/${handle}`,
  });
}

export default async function CollectionPage({ params }: PageProps) {
  const { handle } = await params;
  const collection = getCollection(handle);

  if (!collection) {
    notFound();
  }

  const products = getProductsByCollection(handle);

  return (
    <div className="bg-slate-50 px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <SectionHeader title={`${collection.title} Building Block Sets`} description={collection.description} />
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-slate-100">
            <Image
              src={collection.image}
              alt={`${collection.title} collection banner`}
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
        <div className="mt-10">
          <ProductGrid products={products} />
        </div>
      </div>
    </div>
  );
}
