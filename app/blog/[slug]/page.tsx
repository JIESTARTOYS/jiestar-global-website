import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BLOG_SECTIONS,
  formatBlogDate,
  getBlogPost,
  getBlogPosts,
  getBlogSectionForPost,
  getRelatedBlogPosts,
  parseMarkdownBlocks,
  type MarkdownInline,
} from "@/lib/blog";
import { createBlogPostingJsonLd, createBreadcrumbJsonLd, createJsonLdScript, createMetadata } from "@/lib/seo";

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
    title: `${post.title} | JIESTAR`,
    description: post.description,
    path: `/blog/${slug}`,
    image: post.coverImage,
  });
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }
  const blocks = parseMarkdownBlocks(post.content);
  const relatedPosts = getRelatedBlogPosts(post, 3);
  const sectionSlug = getBlogSectionForPost(post);
  const section = sectionSlug ? BLOG_SECTIONS[sectionSlug] : undefined;
  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    ...(section ? [{ name: section.title, path: `/blog/category/${section.slug}` }] : []),
    { name: post.title, path: `/blog/${post.slug}` },
  ]);
  const blogPostingJsonLd = createBlogPostingJsonLd({
    title: post.title,
    description: post.description,
    datePublished: post.date || undefined,
    dateModified: post.updatedAt,
    image: post.coverImage,
    path: `/blog/${post.slug}`,
  });

  return (
    <article className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={createJsonLdScript([breadcrumbJsonLd, blogPostingJsonLd])} />
      <header className="bg-slate-50 px-5 pb-12 pt-12 lg:px-8 lg:pb-16 lg:pt-16">
        <div className="mx-auto max-w-5xl">
          <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
            <Link href="/" className="transition hover:text-red-600">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/blog" className="transition hover:text-red-600">Blog</Link>
            <span aria-hidden="true">/</span>
            {section ? (
              <Link href={`/blog/category/${section.slug}`} className="truncate font-semibold text-slate-800 transition hover:text-red-600">
                {section.title}
              </Link>
            ) : (
              <span className="truncate font-semibold text-slate-800">{post.category}</span>
            )}
          </nav>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-bold uppercase tracking-normal">
            <span className="rounded-full bg-red-50 px-3 py-1.5 text-red-700">{post.category}</span>
            <time dateTime={post.date} className="text-slate-500">Published {formatBlogDate(post.date)}</time>
            {post.updatedAt ? <time dateTime={post.updatedAt} className="text-slate-500">Updated {formatBlogDate(post.updatedAt)}</time> : null}
            <span className="text-slate-400">{post.readingMinutes} min read</span>
          </div>
          <h1 className="mt-6 max-w-4xl text-balance text-4xl font-black leading-tight tracking-normal text-slate-950 sm:text-5xl lg:text-[56px]">
            {post.title}
          </h1>
          <p className="mt-6 max-w-3xl text-pretty text-lg leading-8 text-slate-600">{post.description}</p>
          {post.eventStartDate && post.eventEndDate && post.eventLocation ? (
            <dl className="mt-8 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-6">
              <div>
                <dt className="text-xs font-bold uppercase tracking-normal text-red-600">Event dates</dt>
                <dd className="mt-2 text-sm font-semibold leading-6 text-slate-900">
                  <time dateTime={post.eventStartDate}>{formatBlogDate(post.eventStartDate)}</time>
                  <span aria-hidden="true"> – </span>
                  <time dateTime={post.eventEndDate}>{formatBlogDate(post.eventEndDate)}</time>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-normal text-red-600">Event location</dt>
                <dd className="mt-2 text-sm font-semibold leading-6 text-slate-900">{post.eventLocation}</dd>
              </div>
            </dl>
          ) : null}
          <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-lg bg-slate-200">
            <Image
              src={post.coverImage}
              alt={post.coverAlt}
              fill
              priority
              sizes="(min-width: 1024px) 1024px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-12 lg:py-16">
        <div className="space-y-6 text-base leading-8 text-slate-700">
          {blocks.map((block, index) => {
            if (block.type === "heading") {
              const HeadingTag = block.level === 2 ? "h2" : "h3";

              return (
                <HeadingTag
                  key={`${block.text}-${index}`}
                  className={block.level === 2 ? "pt-5 text-2xl font-semibold leading-8 text-slate-950" : "pt-2 text-xl font-semibold leading-7 text-slate-950"}
                >
                  {block.text}
                </HeadingTag>
              );
            }

            if (block.type === "list") {
              return (
                <ul key={`list-${index}`} className="grid gap-2 pl-5">
                  {block.items.map((item) => (
                    <li key={item} className="list-disc">{item}</li>
                  ))}
                </ul>
              );
            }

            if (block.type === "image") {
              return (
                <figure key={`${block.src}-${index}`} className="py-3">
                  <div className="relative aspect-[3/2] overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                    <Image
                      src={block.src}
                      alt={block.alt}
                      fill
                      sizes="(min-width: 768px) 768px, 100vw"
                      className="object-cover"
                    />
                  </div>
                  {block.caption ? (
                    <figcaption className="mt-3 text-center text-sm leading-6 text-slate-500">
                      {block.caption}
                    </figcaption>
                  ) : null}
                </figure>
              );
            }

            return (
              <p key={`paragraph-${index}`}>
                {renderInlineMarkdown(block.children)}
              </p>
            );
          })}
        </div>
        <div className="mt-12 rounded-lg bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-950">Explore JIESTAR</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Browse building block sets or contact JIESTAR for wholesale supply, OEM / ODM customization, product co-development, and sub-brand partnerships.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href="/products" className="text-sm font-semibold text-slate-950 underline">View Products</Link>
            <Link href="/wholesale" className="text-sm font-semibold text-slate-950 underline">Wholesale Building Blocks</Link>
            <Link href="/custom-solutions" className="text-sm font-semibold text-slate-950 underline">Custom Solutions</Link>
            <Link href="/contact" className="text-sm font-semibold text-slate-950 underline">Contact Sales</Link>
          </div>
        </div>
      </div>

      <section className="border-t border-slate-200 bg-slate-50 px-5 py-12 lg:px-8 lg:py-16" aria-labelledby="related-articles-heading">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-red-600">Continue reading</p>
              <h2 id="related-articles-heading" className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">Related articles</h2>
            </div>
            <Link
              href={section ? `/blog/category/${section.slug}` : "/blog"}
              className="hidden text-sm font-bold text-slate-600 transition hover:text-red-600 sm:block"
            >
              {section ? `View all ${section.title}` : "View all articles"}
            </Link>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {relatedPosts.map((relatedPost) => (
              <Link key={relatedPost.slug} href={`/blog/${relatedPost.slug}`} className="group overflow-hidden rounded-lg bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="relative aspect-[4/3] bg-slate-200">
                  <Image
                    src={relatedPost.coverImage}
                    alt={relatedPost.coverAlt}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs font-bold text-red-600">{relatedPost.category}</p>
                  <h3 className="mt-2 text-lg font-black leading-6 text-slate-950 group-hover:text-red-700">{relatedPost.title}</h3>
                  <p className="mt-3 text-xs font-semibold text-slate-400">
                    {relatedPost.eventStartDate ? `Event ${formatBlogDate(relatedPost.eventStartDate)}` : formatBlogDate(relatedPost.date)}
                    {" · "}
                    {relatedPost.readingMinutes} min read
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}

function renderInlineMarkdown(children: MarkdownInline[]) {
  return children.map((child, index) => {
    if (child.type === "link") {
      return (
        <Link
          key={`${child.href}-${child.text}-${index}`}
          href={child.href}
          className="font-semibold text-red-600 underline decoration-red-200 underline-offset-4 transition hover:text-red-700"
        >
          {child.text}
        </Link>
      );
    }

    return child.text;
  });
}
