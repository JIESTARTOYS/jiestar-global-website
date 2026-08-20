import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, PackageIcon } from "@/components/ui/Icons";
import {
  BLOG_SECTIONS,
  BLOG_SECTION_SLUGS,
  formatBlogDate,
  getBlogSectionPosts,
  type BlogPost,
  type BlogSectionSlug,
} from "@/lib/blog";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Building Block Guides, News & B2B Insights | JIESTAR Blog",
  description:
    "Explore JIESTAR company news, new building block releases, collector guides, wholesale sourcing, and OEM / ODM product-development insights.",
  path: "/blog",
});

function getPostDisplayDate(post: BlogPost) {
  return post.eventStartDate ? `Event ${formatBlogDate(post.eventStartDate)}` : formatBlogDate(post.date);
}

function getSectionHref(slug: BlogSectionSlug) {
  return `/blog/category/${slug}`;
}

export default function BlogPage() {
  const newsPosts = getBlogSectionPosts("jiestar-news");
  const releasePosts = getBlogSectionPosts("new-releases");
  const guidePosts = getBlogSectionPosts("build-and-collect");
  const businessPosts = getBlogSectionPosts("business-insights");
  const wholesalePosts = businessPosts.filter((post) => post.category === "Wholesale Tips");
  const customPosts = businessPosts.filter((post) => post.category === "Custom Solutions");
  const sectionCounts: Record<BlogSectionSlug, number> = {
    "jiestar-news": newsPosts.length,
    "new-releases": releasePosts.length,
    "build-and-collect": guidePosts.length,
    "business-insights": businessPosts.length,
  };
  const [leadNews, ...supportingNews] = newsPosts;
  const [leadRelease, ...additionalReleases] = releasePosts;

  return (
    <div className="overflow-x-hidden bg-[#f6f7f9]">
      <section className="relative overflow-hidden bg-slate-950 px-5 py-14 text-white sm:py-20 lg:px-8">
        <div className="absolute inset-0 opacity-35">
          <Image
            src="/images/site-visuals/showroom/showroom-entrance-overview.webp"
            alt="JIESTAR showroom entrance with building block displays"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/80" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
          <div className="min-w-0">
            <nav className="mb-7 flex items-center gap-2 text-sm text-slate-300" aria-label="Breadcrumb">
              <Link href="/" className="transition hover:text-red-300">
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <span className="font-semibold text-white">Blog</span>
            </nav>
            <p className="text-sm font-bold text-red-300">JIESTAR Knowledge Hub</p>
            <h1 className="mt-4 max-w-3xl text-balance text-4xl font-black tracking-normal text-white sm:text-5xl lg:text-[56px]">
              News, New Releases &amp; Building Insights
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-8 text-slate-300 sm:text-lg">
              Follow JIESTAR in the field, discover recently added building block sets, and find practical guidance for collectors and global business partners.
            </p>
          </div>

          <nav className="grid gap-3 sm:grid-cols-2" aria-label="Blog sections">
            {BLOG_SECTION_SLUGS.map((slug) => {
              const section = BLOG_SECTIONS[slug];

              return (
                <Link
                  key={slug}
                  href={`#${slug}`}
                  className="group flex min-h-28 items-start justify-between gap-4 rounded-lg border border-white/15 bg-slate-950/55 p-5 transition hover:border-red-300/70 hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
                >
                  <span>
                    <span className="block text-base font-black text-white">{section.title}</span>
                    <span className="mt-2 block text-xs leading-5 text-slate-300">{section.description}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-xs font-bold text-red-300">
                    {sectionCounts[slug]}
                    <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </section>

      <main className="px-5 py-12 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <section id="jiestar-news" className="scroll-mt-24" aria-labelledby="jiestar-news-heading">
            <SectionHeading
              id="jiestar-news-heading"
              title={BLOG_SECTIONS["jiestar-news"].title}
              description={BLOG_SECTIONS["jiestar-news"].description}
              href={getSectionHref("jiestar-news")}
            />

            {leadNews ? (
              <div className="mt-7 grid gap-5 lg:grid-cols-[1.28fr_0.72fr]">
                <Link
                  href={`/blog/${leadNews.slug}`}
                  className="group relative min-h-[430px] overflow-hidden rounded-lg bg-slate-950 text-white"
                >
                  <Image
                    src={leadNews.coverImage}
                    alt={leadNews.coverAlt}
                    fill
                    priority
                    sizes="(min-width: 1024px) 64vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                      <span className="rounded-full bg-white px-3 py-1 text-slate-950">{leadNews.category}</span>
                      <span className="text-slate-200">{getPostDisplayDate(leadNews)}</span>
                    </div>
                    <h2 className="mt-4 max-w-3xl text-balance text-2xl font-black leading-tight sm:text-4xl">{leadNews.title}</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">{leadNews.description}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white">
                      Read the story
                      <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>

                <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
                  {supportingNews.slice(0, 3).map((post) => (
                    <CompactStory key={post.slug} post={post} />
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section id="new-releases" className="mt-16 scroll-mt-24" aria-labelledby="new-releases-heading">
            <SectionHeading
              id="new-releases-heading"
              title={BLOG_SECTIONS["new-releases"].title}
              description={BLOG_SECTIONS["new-releases"].description}
              href={getSectionHref("new-releases")}
            />

            {leadRelease ? (
              <>
                <Link
                  href={`/blog/${leadRelease.slug}`}
                  className="group mt-7 grid overflow-hidden rounded-lg bg-red-600 text-white lg:grid-cols-[1.08fr_0.92fr]"
                >
                  <div className="relative aspect-video min-h-72 bg-white lg:aspect-auto lg:min-h-[430px]">
                    <Image
                      src={leadRelease.coverImage}
                      alt={leadRelease.coverAlt}
                      fill
                      sizes="(min-width: 1024px) 55vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                    <p className="text-sm font-bold text-red-100">{formatBlogDate(leadRelease.date)}</p>
                    <h2 className="mt-4 text-balance text-3xl font-black leading-tight sm:text-4xl">{leadRelease.title}</h2>
                    <p className="mt-5 text-base leading-7 text-red-50">{leadRelease.description}</p>
                    <div className="mt-7 flex flex-wrap gap-2 text-xs font-bold text-red-950">
                      {["Mechanical models", "Automotive", "Botanical display", "Four products"].map((label) => (
                        <span key={label} className="rounded-full bg-white/90 px-3 py-1.5">
                          {label}
                        </span>
                      ))}
                    </div>
                    <span className="mt-8 inline-flex items-center gap-2 text-sm font-black text-white">
                      Explore the new additions
                      <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>

                {additionalReleases.length ? (
                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    {additionalReleases.slice(0, 2).map((post) => (
                      <VisualStoryCard key={post.slug} post={post} />
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
          </section>

          <section id="build-and-collect" className="mt-16 scroll-mt-24" aria-labelledby="build-and-collect-heading">
            <SectionHeading
              id="build-and-collect-heading"
              title={BLOG_SECTIONS["build-and-collect"].title}
              description={BLOG_SECTIONS["build-and-collect"].description}
              href={getSectionHref("build-and-collect")}
            />

            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {guidePosts.slice(0, 4).map((post) => (
                <VisualStoryCard key={post.slug} post={post} />
              ))}
            </div>
          </section>

          <section
            id="business-insights"
            className="mt-16 scroll-mt-24 overflow-hidden rounded-lg bg-slate-950 p-6 text-white sm:p-8 lg:p-10"
            aria-labelledby="business-insights-heading"
          >
            <div className="flex flex-col gap-5 border-b border-white/15 pb-7 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 id="business-insights-heading" className="text-3xl font-black tracking-normal sm:text-4xl">
                  {BLOG_SECTIONS["business-insights"].title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  {BLOG_SECTIONS["business-insights"].description}
                </p>
              </div>
              <Link
                href={getSectionHref("business-insights")}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-md border border-white/25 px-4 py-2 text-sm font-bold text-white transition hover:border-white hover:bg-white hover:text-slate-950 lg:self-auto"
              >
                View all business articles
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-8 pt-8 lg:grid-cols-2 lg:gap-12">
              <BusinessColumn title="Wholesale & Sourcing" posts={wholesalePosts.slice(0, 3)} />
              <BusinessColumn title="Custom Product Development" posts={customPosts.slice(0, 3)} />
            </div>
          </section>

          <section className="mt-16 grid gap-5 rounded-lg border border-slate-200 bg-white p-6 sm:p-8 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:p-10">
            <div>
              <PackageIcon className="h-8 w-8 text-red-600" />
              <h2 className="mt-5 text-2xl font-black tracking-normal text-slate-950 sm:text-3xl">
                Need product sourcing or custom development support?
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                JIESTAR works with global partners on wholesale supply, OEM / ODM customization, product co-development, exclusive SKUs, and long-term sub-brand cooperation.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link
                href="/wholesale"
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Wholesale Inquiry
              </Link>
              <Link
                href="/custom-solutions"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-slate-300 px-5 text-sm font-bold text-slate-950 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Custom Solutions
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function SectionHeading({
  id,
  title,
  description,
  href,
}: {
  id: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 id={id} className="text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">
          {title}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
      </div>
      <Link href={href} className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-red-600">
        View all
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}

function CompactStory({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group grid min-h-36 grid-cols-[7rem_1fr] gap-4 p-4 transition hover:bg-slate-50">
      <div className="relative overflow-hidden rounded-md bg-slate-100">
        <Image
          src={post.coverImage}
          alt={post.coverAlt}
          fill
          sizes="112px"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="min-w-0 self-center">
        <p className="text-xs font-bold text-red-600">{post.category}</p>
        <h3 className="mt-2 line-clamp-3 text-base font-black leading-6 text-slate-950">{post.title}</h3>
        <p className="mt-2 text-xs font-semibold text-slate-500">{getPostDisplayDate(post)}</p>
      </div>
    </Link>
  );
}

function VisualStoryCard({ post }: { post: BlogPost }) {
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
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-bold text-red-600">{post.category}</p>
        <h3 className="mt-3 text-lg font-black leading-6 text-slate-950">{post.title}</h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{post.description}</p>
        <span className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs font-semibold text-slate-500">
          <span>{getPostDisplayDate(post)}</span>
          <ArrowRightIcon className="h-4 w-4 text-slate-950 transition group-hover:translate-x-0.5 group-hover:text-red-600" />
        </span>
      </div>
    </Link>
  );
}

function BusinessColumn({ title, posts }: { title: string; posts: BlogPost[] }) {
  return (
    <div>
      <h3 className="text-xl font-black text-white">{title}</h3>
      <div className="mt-5 divide-y divide-white/15 border-y border-white/15">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex items-start justify-between gap-5 py-5">
            <span>
              <span className="block text-xs font-semibold text-red-300">{formatBlogDate(post.date)}</span>
              <span className="mt-2 block text-base font-bold leading-6 text-white transition group-hover:text-red-200">{post.title}</span>
            </span>
            <ArrowRightIcon className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-red-300" />
          </Link>
        ))}
      </div>
    </div>
  );
}
