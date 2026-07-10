import Link from "next/link";
import Image from "next/image";
import { formatBlogDate, getBlogPosts } from "@/lib/blog";
import { ArrowRightIcon } from "@/components/ui/Icons";

export function BlogPreview() {
  const posts = getBlogPosts().slice(0, 3);

  return (
    <section className="bg-[#f6f7f9] px-5 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-slate-950">Inspiration & Ideas</h2>
          <Link href="/blog" className="hidden items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-red-600 sm:flex">
            View all articles
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="grid overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:grid-cols-[0.8fr_1fr] md:grid-cols-1">
              <div className="relative min-h-40 bg-slate-100">
                <Image
                  src={post.coverImage}
                  alt={post.coverAlt}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <p className="text-xs font-black uppercase tracking-normal text-slate-400">{post.category}</p>
                <h3 className="mt-2 text-base font-black leading-6 text-slate-950">{post.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{post.description}</p>
                <p className="mt-4 text-xs font-semibold text-slate-400">
                  {formatBlogDate(post.date)} · {post.readingMinutes} min read
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
