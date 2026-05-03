import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getBlogPosts } from "@/lib/blog";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Building Guides & Business Insights",
  description:
    "Read JIESTAR guides about building block sets, wholesale sourcing, OEM / ODM customization, and product co-development.",
  path: "/blog",
});

export default function BlogPage() {
  const posts = getBlogPosts();

  return (
    <div className="bg-slate-50 px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          title="Building Guides & Business Insights"
          description="Long-term SEO content for DTC customers, collectors, retailers, distributors, and custom product partners."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="rounded-lg border border-slate-200 bg-white p-6 hover:border-slate-400">
              <p className="text-sm font-semibold text-slate-500">{post.category}</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">{post.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{post.description}</p>
              <p className="mt-5 text-sm font-semibold text-slate-950">Read article</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
