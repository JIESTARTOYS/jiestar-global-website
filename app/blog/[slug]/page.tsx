import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPost, getBlogPosts } from "@/lib/blog";
import { createMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {};
  }

  return createMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${slug}`,
  });
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="bg-white px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{post.category}</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-normal text-slate-950">{post.title}</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">{post.description}</p>
        <div className="mt-10 space-y-6 text-base leading-8 text-slate-700">
          {post.content
            .split("\n")
            .filter((paragraph) => paragraph.trim())
            .map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
        </div>
        <div className="mt-12 rounded-lg bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-950">Explore JIESTAR</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Browse building block sets or contact JIESTAR for wholesale supply, OEM / ODM customization, product co-development, and sub-brand partnerships.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href="/products" className="text-sm font-semibold text-slate-950 underline">View Products</Link>
            <Link href="/custom-solutions" className="text-sm font-semibold text-slate-950 underline">Custom Solutions</Link>
          </div>
        </div>
      </div>
    </article>
  );
}
