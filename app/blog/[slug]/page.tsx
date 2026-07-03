import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPost, getBlogPosts, parseMarkdownBlocks, type MarkdownInline } from "@/lib/blog";
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
  });
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }
  const blocks = parseMarkdownBlocks(post.content);
  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ]);
  const blogPostingJsonLd = createBlogPostingJsonLd({
    title: post.title,
    description: post.description,
    datePublished: post.date || undefined,
    path: `/blog/${post.slug}`,
  });

  return (
    <article className="bg-white px-5 py-16 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={createJsonLdScript([breadcrumbJsonLd, blogPostingJsonLd])} />
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{post.category}</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-normal text-slate-950">{post.title}</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">{post.description}</p>
        <div className="mt-10 space-y-6 text-base leading-8 text-slate-700">
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
