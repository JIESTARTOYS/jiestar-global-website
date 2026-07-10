import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { getBlogPosts, getRelatedBlogPosts, parseMarkdownBlocks } from "./blog.ts";

test("parseMarkdownBlocks keeps H2/H3 headings, lists, paragraphs, and internal links", () => {
  const blocks = parseMarkdownBlocks(`
## Product Categories to Consider

Review the [wholesale building block catalog](/wholesale) before choosing SKUs.

### Buyer checklist

- Product category
- Packaging needs
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
    type: "heading",
    level: 3,
    text: "Buyer checklist",
  });
  assert.deepEqual(blocks[3], {
    type: "list",
    items: ["Product category", "Packaging needs"],
  });
});

test("every blog post has valid dates, readable content, and a local cover image", () => {
  const posts = getBlogPosts();

  assert.equal(posts.length, 16);

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
  }
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
