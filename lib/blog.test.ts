import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  BLOG_SECTIONS,
  BLOG_SECTION_SLUGS,
  groupConsecutiveMarkdownImages,
  getBlogContentDate,
  getBlogPost,
  getBlogPosts,
  getBlogSection,
  getBlogSectionForPost,
  getBlogSectionPosts,
  getExhibitionPosts,
  getRelatedBlogPosts,
  parseMarkdownBlocks,
} from "./blog.ts";

test("parseMarkdownBlocks keeps headings, images, lists, paragraphs, and internal links", () => {
  const blocks = parseMarkdownBlocks(`
## Product Categories to Consider

Review the [wholesale building block catalog](/wholesale) before choosing SKUs.

![JIESTAR exhibition booth](/images/blog/exhibitions/example.avif "A real exhibition photo")

### Buyer checklist

- Product category
- Packaging needs

![Second exhibition view](/images/blog/exhibitions/second-example.avif)
`);

  assert.deepEqual(blocks[0], {
    type: "heading",
    level: 2,
    text: "Product Categories to Consider",
  });
  assert.equal(blocks[1].type, "paragraph");
  assert.deepEqual(blocks[1].children, [
    { type: "text", text: "Review the " },
    { type: "link", text: "wholesale building block catalog", href: "/wholesale" },
    { type: "text", text: " before choosing SKUs." },
  ]);
  assert.deepEqual(blocks[2], {
    type: "image",
    src: "/images/blog/exhibitions/example.avif",
    alt: "JIESTAR exhibition booth",
    caption: "A real exhibition photo",
  });
  assert.deepEqual(blocks[3], {
    type: "heading",
    level: 3,
    text: "Buyer checklist",
  });
  assert.deepEqual(blocks[4], {
    type: "list",
    items: ["Product category", "Packaging needs"],
  });
  assert.deepEqual(blocks[5], {
    type: "image",
    src: "/images/blog/exhibitions/second-example.avif",
    alt: "Second exhibition view",
    caption: undefined,
  });
});

test("parseMarkdownBlocks leaves unsupported image sources as paragraph text", () => {
  const blocks = parseMarkdownBlocks(`
![Remote image](https://example.com/image.jpg)
`);

  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].type, "paragraph");
});

test("groupConsecutiveMarkdownImages pairs adjacent images and preserves their alt text and captions", () => {
  const blocks = parseMarkdownBlocks(`
![First exhibition view](/images/blog/exhibitions/first.avif "First caption")

![Second exhibition view](/images/blog/exhibitions/second.avif "Second caption")

The story continues after the gallery.
`);
  const groupedBlocks = groupConsecutiveMarkdownImages(blocks);

  assert.equal(groupedBlocks.length, 2);
  assert.deepEqual(groupedBlocks[0], {
    type: "imageGroup",
    images: [
      {
        type: "image",
        src: "/images/blog/exhibitions/first.avif",
        alt: "First exhibition view",
        caption: "First caption",
      },
      {
        type: "image",
        src: "/images/blog/exhibitions/second.avif",
        alt: "Second exhibition view",
        caption: "Second caption",
      },
    ],
  });
  assert.equal(groupedBlocks[1].type, "paragraph");
});

test("groupConsecutiveMarkdownImages leaves one image full-width and keeps a third image in order", () => {
  const singleImage = parseMarkdownBlocks(`
![Single exhibition view](/images/blog/exhibitions/single.avif)

Text separates the images.

![Later exhibition view](/images/blog/exhibitions/later.avif)
`);
  const threeImages = parseMarkdownBlocks(`
![First view](/images/blog/exhibitions/first.avif)
![Second view](/images/blog/exhibitions/second.avif)
![Third view](/images/blog/exhibitions/third.avif)
`);

  assert.deepEqual(
    groupConsecutiveMarkdownImages(singleImage).map((block) => block.type),
    ["image", "paragraph", "image"],
  );

  const groupedThreeImages = groupConsecutiveMarkdownImages(threeImages);
  assert.deepEqual(groupedThreeImages.map((block) => block.type), ["imageGroup", "image"]);
  assert.equal(groupedThreeImages[1].type, "image");
  assert.equal(groupedThreeImages[1].type === "image" ? groupedThreeImages[1].src : "", "/images/blog/exhibitions/third.avif");
});

test("every blog post has valid dates, readable content, and a local cover image", () => {
  const posts = getBlogPosts();

  assert.equal(posts.length, 30);

  for (const post of posts) {
    assert.match(post.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(Number.isNaN(Date.parse(post.date)), false);
    assert.ok(post.content.trim().length > 300);
    assert.ok(post.coverImage.startsWith("/images/"));
    assert.ok(post.coverAlt.trim().length >= 20);
    assert.ok(fs.existsSync(path.join(process.cwd(), "public", post.coverImage)));
    assert.ok(post.readingMinutes >= 1);

    if (post.updatedAt) {
      assert.match(post.updatedAt, /^\d{4}-\d{2}-\d{2}$/);
      assert.equal(Number.isNaN(Date.parse(post.updatedAt)), false);
    }

    const imageBlocks = parseMarkdownBlocks(post.content).filter((block) => block.type === "image");

    for (const imageBlock of imageBlocks) {
      assert.ok(imageBlock.alt.trim().length >= 12);
      assert.ok(imageBlock.src.startsWith("/images/"));
      assert.ok(fs.existsSync(path.join(process.cwd(), "public", imageBlock.src)));
    }
  }
});

test("exhibition posts have complete event metadata and are sorted newest first", () => {
  const exhibitionPosts = getExhibitionPosts();

  assert.equal(exhibitionPosts.length, 8);
  assert.ok(exhibitionPosts.every((post) => post.category === "Exhibitions"));
  assert.ok(exhibitionPosts.every((post) => post.eventName && post.eventEndDate && post.eventLocation));

  for (const post of exhibitionPosts) {
    assert.match(post.eventStartDate ?? "", /^\d{4}-\d{2}-\d{2}$/);
    assert.match(post.eventEndDate ?? "", /^\d{4}-\d{2}-\d{2}$/);
    assert.ok((post.eventStartDate ?? "") <= (post.eventEndDate ?? ""));
  }

  for (let index = 1; index < exhibitionPosts.length; index += 1) {
    assert.ok((exhibitionPosts[index - 1].eventStartDate ?? "") >= (exhibitionPosts[index].eventStartDate ?? ""));
  }
});

test("exhibition stories publish all 18 unique photographs with the intended event assignments", () => {
  const exhibitionPosts = getExhibitionPosts();
  const expectedInlineCounts: Record<string, number> = {
    "jiestar-at-mir-detstva-2023-moscow": 0,
    "jiestar-at-ibte-indonesia-2024": 1,
    "jiestar-at-hong-kong-toys-games-fair-2025": 0,
    "jiestar-at-mir-detstva-2025-moscow": 3,
    "jiestar-at-china-toy-expo-2025-shanghai": 3,
    "jiestar-at-ibte-vietnam-2025": 0,
    "jiestar-at-toy-hobby-china-2026-shenzhen": 1,
    "jiestar-at-mega-show-bangkok-2026": 2,
  };
  const publishedImagePaths = new Set<string>();

  for (const post of exhibitionPosts) {
    const inlineImages = parseMarkdownBlocks(post.content).filter((block) => block.type === "image");

    assert.equal(inlineImages.length, expectedInlineCounts[post.slug]);
    publishedImagePaths.add(post.coverImage);

    for (const image of inlineImages) {
      publishedImagePaths.add(image.src);
    }
  }

  assert.equal(publishedImagePaths.size, 18);
  assert.ok(publishedImagePaths.has("/images/blog/exhibitions/ibte-indonesia-2024-cover.avif"));
  assert.ok(publishedImagePaths.has("/images/blog/exhibitions/ibte-vietnam-2025-cover.avif"));
});

test("exhibition facts keep the corrected Moscow booth and Bangkok sector name", () => {
  const moscow = getBlogPost("jiestar-at-mir-detstva-2025-moscow");
  const bangkok = getBlogPost("jiestar-at-mega-show-bangkok-2026");

  assert.ok(moscow);
  assert.ok(bangkok);
  assert.ok(moscow.content.includes("booth 10A120"));
  assert.ok(moscow.content.includes("10A125 sign belongs to a neighbouring exhibitor"));
  assert.equal(bangkok.title, "JIESTAR at MEGA SHOW Bangkok 2026: Asia Art Toy & IP Show");
  assert.equal(bangkok.eventName, "MEGA SHOW Bangkok 2026 — Asia Art Toy & IP Show");
});

test("related blog posts prioritize the same category and exclude the current post", () => {
  const posts = getBlogPosts();
  const post = posts.find((candidate) => candidate.category === "Building Guides");

  assert.ok(post);
  const related = getRelatedBlogPosts(post, 3);

  assert.equal(related.length, 3);
  assert.ok(related.every((candidate) => candidate.slug !== post.slug));
  assert.equal(related[0].category, post.category);
});

test("blog sections map every article to one of four stable content pillars", () => {
  assert.deepEqual(BLOG_SECTION_SLUGS, [
    "jiestar-news",
    "new-releases",
    "build-and-collect",
    "business-insights",
  ]);
  assert.deepEqual(BLOG_SECTIONS["jiestar-news"].categories, ["Company News", "Exhibitions"]);
  assert.deepEqual(BLOG_SECTIONS["new-releases"].categories, ["New Releases"]);
  assert.deepEqual(BLOG_SECTIONS["build-and-collect"].categories, ["Building Guides"]);
  assert.deepEqual(BLOG_SECTIONS["business-insights"].categories, ["Wholesale Tips", "Custom Solutions"]);
  assert.equal(getBlogSection("unknown-section"), undefined);

  const posts = getBlogPosts();
  const sectionPosts = BLOG_SECTION_SLUGS.flatMap((slug) => getBlogSectionPosts(slug));

  assert.equal(sectionPosts.length, posts.length);
  assert.equal(new Set(sectionPosts.map((post) => post.slug)).size, posts.length);
  assert.ok(posts.every((post) => getBlogSectionForPost(post)));
});

test("JIESTAR News combines company stories and exhibitions using event-aware sorting", () => {
  const posts = getBlogSectionPosts("jiestar-news");

  assert.equal(posts.length, 10);
  assert.equal(posts.filter((post) => post.category === "Exhibitions").length, 9);
  assert.equal(posts.filter((post) => post.category === "Company News").length, 1);
  assert.equal(posts[0].slug, "jiestar-at-mega-show-bangkok-2026");

  for (let index = 1; index < posts.length; index += 1) {
    assert.ok(getBlogContentDate(posts[index - 1]) >= getBlogContentDate(posts[index]));
  }
});

test("related exhibition articles stay within Exhibitions before broader JIESTAR News", () => {
  const post = getBlogPost("jiestar-at-mir-detstva-2025-moscow");

  assert.ok(post);
  const related = getRelatedBlogPosts(post, 3);

  assert.equal(related.length, 3);
  assert.ok(related.every((candidate) => candidate.category === "Exhibitions"));
});

test("new-release feature uses four verified local images and direct product links", () => {
  const post = getBlogPost("new-building-block-sets-jiestar-catalog-2026");

  assert.ok(post);
  assert.equal(post.category, "New Releases");

  const imageBlocks = parseMarkdownBlocks(post.content).filter((block) => block.type === "image");
  assert.equal(imageBlocks.length, 4);
  assert.ok(post.content.includes("/products/guly-w16-engine-model-kit-60556"));
  assert.ok(post.content.includes("/products/guly-1-8-remote-control-drift-stunt-car-model-kit-10659"));
  assert.ok(post.content.includes("/products/x88059-jiestar-impressionist-water-lily-pond-building-set"));
  assert.ok(post.content.includes("/products/x88057-jiestar-wicked-beauty-flower-garden-building-set"));
});

test("new floral release article uses verified local images and live Shopify product links", () => {
  const post = getBlogPost("new-jiestar-floral-building-block-sets-x88054-x88055-x88058");

  assert.ok(post);
  assert.equal(post.category, "New Releases");
  assert.equal(post.coverImage, "/images/blog/new-releases/new-jiestar-floral-building-block-sets-x88054-x88055-x88058-cover.avif");

  const imageBlocks = parseMarkdownBlocks(post.content).filter((block) => block.type === "image");
  assert.equal(imageBlocks.length, 3);
  assert.ok(post.content.includes("/products/x88054-jiestar-eternal-vow-rose-hand-sculpture-building-set"));
  assert.ok(post.content.includes("/products/x88055-jiestar-heartfelt-bloom-flower-arrangement-building-set"));
  assert.ok(post.content.includes("/products/x88058-jiestar-cypress-bouquet-flower-arrangement-building-set"));
});

test("new GULY release article uses three optimized images and live Shopify product links", () => {
  const post = getBlogPost("new-guly-model-kits-80508-10659-60556");

  assert.ok(post);
  assert.equal(post.category, "New Releases");
  assert.equal(
    post.coverImage,
    "/images/blog/new-releases/new-guly-model-kits-80508-10659-60556-cover-v2.avif",
  );

  const imageBlocks = parseMarkdownBlocks(post.content).filter((block) => block.type === "image");
  assert.equal(imageBlocks.length, 3);
  assert.ok(post.content.includes("/products/guly-shadowed-wing-mecha-model-kit-80508"));
  assert.ok(post.content.includes("/products/guly-1-8-remote-control-drift-stunt-car-model-kit-10659"));
  assert.ok(post.content.includes("/products/guly-w16-engine-model-kit-60556"));
});
