import assert from "node:assert/strict";
import test from "node:test";
import { parseMarkdownBlocks } from "./blog.ts";

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
