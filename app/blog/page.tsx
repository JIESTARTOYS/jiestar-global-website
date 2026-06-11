import Link from "next/link";
import Image from "next/image";
import { getBlogPosts } from "@/lib/blog";
import { createMetadata } from "@/lib/seo";
import { ArrowRightIcon, FactoryIcon, PackageIcon, SearchIcon, SparkIcon } from "@/components/ui/Icons";
import { HeroBannerButton } from "@/components/ui/HeroBannerButton";

export const metadata = createMetadata({
  title: "Building Guides & Business Insights",
  description:
    "Read JIESTAR guides about building block sets, wholesale sourcing, OEM / ODM customization, and product co-development.",
  path: "/blog",
});

export default function BlogPage() {
  const posts = getBlogPosts();
  const [featuredPost, ...latestPosts] = posts;
  const categories = Array.from(new Set(posts.map((post) => post.category)));
  const articleImages = [
    "/images/site-visuals/blog-buying-guide.png",
    "/images/site-visuals/blog-wholesale-guide.png",
    "/images/site-visuals/blog-custom-guide.png",
  ];

  return (
    <div className="overflow-x-hidden bg-[#f6f7f9]">
      <section className="relative overflow-hidden bg-slate-950 px-5 py-16 text-white sm:py-20 lg:px-8">
        <div className="absolute inset-0 opacity-35">
          <Image
            src="/images/site-visuals/blog-knowledge-hub.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/75" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div className="min-w-0">
            <nav className="mb-8 flex items-center gap-2 text-sm text-slate-300" aria-label="Breadcrumb">
              <Link href="/" className="transition hover:text-red-300">
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <span className="font-semibold text-white">Blog</span>
            </nav>
            <p className="text-xs font-bold uppercase tracking-normal text-red-300">JIESTAR Knowledge Hub</p>
            <h1 className="mt-4 max-w-3xl break-words text-4xl font-black tracking-normal text-white sm:text-5xl lg:text-[56px]">
              Building Guides & Business Insights
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Practical articles for collectors, retailers, distributors, and custom product partners choosing or developing building block sets.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <HeroBannerButton href="#latest-articles">
                Latest Articles
              </HeroBannerButton>
              <HeroBannerButton href="/custom-solutions" variant="secondary">
                Start Project
              </HeroBannerButton>
            </div>
          </div>

          <div className="grid min-w-0 gap-2 rounded-lg border border-white/10 bg-white/[0.07] p-2 shadow-2xl shadow-black/20 backdrop-blur sm:grid-cols-3 sm:gap-3 sm:p-4 lg:p-5">
            {[
              { label: "Buying guides", value: "DTC", icon: SearchIcon },
              { label: "Wholesale insight", value: "B2B", icon: FactoryIcon },
              { label: "Custom solutions", value: "OEM / ODM", icon: SparkIcon },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.08] p-3 shadow-sm sm:block sm:p-4">
                  <Icon className="h-4 w-4 shrink-0 text-red-300 sm:h-5 sm:w-5" />
                  <div className="min-w-0">
                    <p className="break-words text-base font-black leading-tight text-white sm:mt-5 sm:text-xl">{item.value}</p>
                    <p className="mt-1 text-xs leading-4 text-slate-300 sm:text-sm sm:leading-5">{item.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <main className="px-5 py-12 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          {featuredPost ? (
            <section aria-labelledby="featured-article">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-normal text-red-600">Featured Article</p>
                  <h2 id="featured-article" className="mt-2 text-2xl font-black tracking-normal text-slate-950 sm:text-3xl">
                    Start with the most useful guide
                  </h2>
                </div>
                <p className="hidden text-sm font-semibold text-slate-500 sm:block">{posts.length} articles</p>
              </div>

              <Link
                href={`/blog/${featuredPost.slug}`}
                className="group grid overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md lg:grid-cols-[0.95fr_1.05fr]"
              >
                <div className="relative min-h-72 bg-slate-100 lg:min-h-[420px]">
                  <Image
                    src={articleImages[0]}
                    alt={`${featuredPost.title} article cover`}
                    fill
                    priority
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-normal">
                      <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">{featuredPost.category}</span>
                      <span className="text-slate-400">{featuredPost.date}</span>
                    </div>
                    <h3 className="mt-5 text-3xl font-black leading-tight tracking-normal text-slate-950 sm:text-4xl">
                      {featuredPost.title}
                    </h3>
                    <p className="mt-4 text-base leading-7 text-slate-600">{featuredPost.description}</p>
                  </div>
                  <div className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-slate-950 transition group-hover:text-red-600">
                    Read featured guide
                    <ArrowRightIcon className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            </section>
          ) : null}

          <section id="latest-articles" className="mt-14" aria-labelledby="latest-articles-heading">
            <div className="flex flex-col gap-5 border-y border-slate-200 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-normal text-red-600">Browse Topics</p>
                <h2 id="latest-articles-heading" className="mt-2 text-2xl font-black tracking-normal text-slate-950 sm:text-3xl">
                  Latest articles
                </h2>
              </div>
              <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:px-0">
                <span className="shrink-0 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white">All</span>
                {categories.map((category) => (
                  <span key={category} className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">
                    {category}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {(latestPosts.length ? latestPosts : posts).map((post, index) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex min-h-[430px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] bg-slate-100">
                    <Image
                      src={articleImages[(index + 1) % articleImages.length]}
                      alt={`${post.title} article cover`}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-normal">
                      <span className="text-red-600">{post.category}</span>
                      <span className="text-slate-300">/</span>
                      <span className="text-slate-400">{post.date}</span>
                    </div>
                    <h3 className="mt-4 text-xl font-black leading-7 tracking-normal text-slate-950">{post.title}</h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{post.description}</p>
                    <div className="mt-auto flex items-center gap-2 pt-6 text-sm font-bold text-slate-950 transition group-hover:text-red-600">
                      Read article
                      <ArrowRightIcon className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-14 grid gap-5 rounded-lg bg-slate-950 p-6 text-white sm:p-8 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:p-10">
            <div>
              <PackageIcon className="h-8 w-8 text-red-500" />
              <h2 className="mt-5 text-2xl font-black tracking-normal sm:text-3xl">Need product sourcing or custom development support?</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                JIESTAR works with global partners on wholesale supply, OEM / ODM customization, product co-development, exclusive SKUs, and long-term sub-brand cooperation.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link
                href="/wholesale"
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-white px-5 text-sm font-bold text-slate-950 transition hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                Wholesale Inquiry
              </Link>
              <Link
                href="/custom-solutions"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/30 px-5 text-sm font-bold text-white transition hover:border-white hover:bg-white hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-950"
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
