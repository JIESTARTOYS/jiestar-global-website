import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon } from "@/components/ui/Icons";
import {
  BLOG_SECTIONS,
  BLOG_SECTION_SLUGS,
  formatBlogDate,
  getBlogSection,
  getBlogSectionPosts,
  type BlogPost,
} from "@/lib/blog";
import { createMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return BLOG_SECTION_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const section = getBlogSection(slug);

  if (!section) {
    return {};
  }

  const posts = getBlogSectionPosts(section.slug);

  return createMetadata({
    title: `${section.title} | JIESTAR Blog`,
    description: section.description,
    path: `/blog/category/${section.slug}`,
    image: posts[0]?.coverImage,
  });
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const section = getBlogSection(slug);

  if (!section) {
    notFound();
  }

  const posts = getBlogSectionPosts(section.slug);
  const [leadPost, ...archivePosts] = posts;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f7f9]">
      <header className="bg-slate-950 px-5 py-12 text-white sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <nav className="flex items-center gap-2 text-sm text-slate-400" aria-label="Breadcrumb">
            <Link href="/" className="transition hover:text-red-300">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/blog" className="transition hover:text-red-300">
              Blog
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-white">{section.title}</span>
          </nav>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-bold text-red-300">JIESTAR Journal</p>
              <h1 className="mt-4 text-balance text-4xl font-black tracking-normal text-white sm:text-5xl">
                {section.title}
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-slate-300 sm:text-lg">
                {section.description}
              </p>
            </div>
            <p className="text-sm font-semibold text-slate-300">
              {posts.length} {posts.length === 1 ? "article" : "articles"}
            </p>
          </div>

          <nav className="mt-10 flex flex-wrap gap-2 border-t border-white/15 pt-6" aria-label="Journal categories">
            {BLOG_SECTION_SLUGS.map((sectionSlug) => {
              const item = BLOG_SECTIONS[sectionSlug];
              const isCurrent = sectionSlug === section.slug;

              return (
                <Link
                  key={sectionSlug}
                  href={`/blog/category/${sectionSlug}`}
                  aria-current={isCurrent ? "page" : undefined}
                  className={
                    isCurrent
                      ? "rounded-md bg-white px-4 py-2 text-sm font-bold text-slate-950"
                      : "rounded-md border border-white/20 px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-white/50 hover:text-white"
                  }
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        {leadPost ? <LeadArchiveStory post={leadPost} /> : null}

        {archivePosts.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {archivePosts.map((post) => (
              <ArchiveStoryCard key={post.slug} post={post} />
            ))}
          </div>
        ) : null}

        {!posts.length ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
            <h2 className="text-xl font-black text-slate-950">Articles are on the way</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Return to the complete Journal while this section is being prepared.
            </p>
            <Link href="/blog" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-red-600">
              Back to the JIESTAR Blog
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function getPostDisplayDate(post: BlogPost) {
  return post.eventStartDate ? `Event ${formatBlogDate(post.eventStartDate)}` : formatBlogDate(post.date);
}

function LeadArchiveStory({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group grid overflow-hidden rounded-lg border border-slate-200 bg-white lg:grid-cols-[1.12fr_0.88fr]"
    >
      <div className="relative aspect-video min-h-72 overflow-hidden bg-slate-100 lg:aspect-auto lg:min-h-[430px]">
        <Image
          src={post.coverImage}
          alt={post.coverAlt}
          fill
          priority
          sizes="(min-width: 1024px) 58vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
          <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">{post.category}</span>
          <span className="text-slate-500">{getPostDisplayDate(post)}</span>
        </div>
        <h2 className="mt-5 text-balance text-3xl font-black leading-tight text-slate-950 sm:text-4xl">{post.title}</h2>
        <p className="mt-5 text-base leading-7 text-slate-600">{post.description}</p>
        <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-slate-950">
          Read article
          <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:text-red-600" />
        </span>
      </div>
    </Link>
  );
}

function ArchiveStoryCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex min-h-[390px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:border-slate-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Image
          src={post.coverImage}
          alt={post.coverAlt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="text-red-600">{post.category}</span>
          <span className="text-slate-400" aria-hidden="true">
            ·
          </span>
          <span className="text-slate-500">{getPostDisplayDate(post)}</span>
        </div>
        <h2 className="mt-3 text-xl font-black leading-7 text-slate-950">{post.title}</h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{post.description}</p>
        <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-slate-950">
          Read article
          <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:text-red-600" />
        </span>
      </div>
    </Link>
  );
}
