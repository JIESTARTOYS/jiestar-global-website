import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  groupQueuedProducts,
  isProductCovered,
  productFingerprint,
  proposedArticleSlug,
  readinessBlockers,
  selectCatalogCandidates,
  validateDraftArticle,
  type ProductLedger,
  type PublicProduct,
} from "./new-product-blog.ts";

function product(overrides: Partial<PublicProduct> = {}): PublicProduct {
  const sku = overrides.skus?.[0] ?? "X88060";
  return {
    id: overrides.id ?? `gid://shopify/Product/${sku}`,
    handle: overrides.handle ?? `jiestar-display-set-${sku.toLowerCase()}`,
    title: overrides.title ?? `JIESTAR Botanical Display Building Set ${sku}`,
    vendor: overrides.vendor ?? "JIESTAR",
    productType: overrides.productType ?? "Flowers & Botanical",
    description:
      overrides.description ??
      "A layered botanical building block display with a stable base, shaped leaves, and a finished composition designed for shelf presentation.",
    createdAt: overrides.createdAt ?? "2026-08-15T04:00:00Z",
    updatedAt: overrides.updatedAt ?? "2026-08-15T04:00:00Z",
    collections: overrides.collections ?? [{ handle: "flowers-botanical", title: "Flowers & Botanical" }],
    images: overrides.images ?? [{ url: `https://cdn.shopify.com/${sku}.jpg`, altText: `${sku} botanical display set` }],
    skus: overrides.skus ?? [sku],
    specs: overrides.specs ?? { piece_count: "820", recommended_age: "8+" },
  };
}

test("initial selection queues only recent uncovered products and baselines older products", () => {
  const recent = product();
  const old = product({ id: "gid://shopify/Product/old", handle: "old-set", skus: ["OLD100"], createdAt: "2026-06-01T00:00:00Z" });
  const covered = product({ id: "gid://shopify/Product/covered", handle: "covered-set", skus: ["COV100"] });
  const result = selectCatalogCandidates({
    products: [recent, old, covered],
    ledger: null,
    coverageText: "Read our article at /products/covered-set.",
    now: new Date("2026-08-21T02:00:00Z"),
    lookbackDays: 30,
  });

  assert.equal(result.initialRun, true);
  assert.deepEqual(result.candidates.map((item) => item.id), [recent.id]);
  assert.equal(result.ledger.products[old.id].status, "baseline");
  assert.equal(result.ledger.products[covered.id].status, "already_covered");
});

test("SKU coverage requires token boundaries instead of matching IDs or image version numbers", () => {
  const item = product({ handle: "xbert-dice-set", skus: ["66188"] });

  assert.equal(isProductCovered(item, "gid://shopify/Product/10159285829881 https://cdn.example.test/image.jpg?v=1785566188"), false);
  assert.equal(isProductCovered(item, "This article covers SKU 66188 and its display format."), true);
  assert.equal(isProductCovered(item, "Read /products/xbert-dice-set for details."), true);
});

test("later runs queue a previously unseen public product even when its Shopify createdAt is old", () => {
  const baselineProduct = product({ id: "gid://shopify/Product/base", handle: "base-set", skus: ["BASE1"], createdAt: "2026-01-01T00:00:00Z" });
  const initial = selectCatalogCandidates({
    products: [baselineProduct],
    ledger: null,
    coverageText: "",
    now: new Date("2026-08-21T02:00:00Z"),
    lookbackDays: 30,
  });
  const newlyPublic = product({ id: "gid://shopify/Product/new-public", handle: "new-public-set", skus: ["NEW1"], createdAt: "2025-12-01T00:00:00Z" });
  const later = selectCatalogCandidates({
    products: [baselineProduct, newlyPublic],
    ledger: initial.ledger,
    coverageText: "",
    now: new Date("2026-08-24T02:00:00Z"),
    lookbackDays: 30,
  });

  assert.equal(later.initialRun, false);
  assert.deepEqual(later.candidates.map((item) => item.id), [newlyPublic.id]);
});

test("drafted products do not requeue and blocked products retry only after facts change", () => {
  const item = product();
  const base = selectCatalogCandidates({ products: [item], ledger: null, coverageText: "", now: new Date("2026-08-21T02:00:00Z"), lookbackDays: 30 });
  const ledger = structuredClone(base.ledger) as ProductLedger;
  ledger.products[item.id].status = "drafted";
  assert.equal(
    selectCatalogCandidates({ products: [item], ledger, coverageText: "", now: new Date("2026-08-22T02:00:00Z"), lookbackDays: 30 }).candidates.length,
    0,
  );

  ledger.products[item.id].status = "blocked";
  ledger.products[item.id].fingerprint = productFingerprint(item);
  assert.equal(
    selectCatalogCandidates({ products: [item], ledger, coverageText: "", now: new Date("2026-08-22T02:00:00Z"), lookbackDays: 30 }).candidates.length,
    0,
  );
  const changed = { ...item, description: `${item.description} Updated public detail.` };
  assert.equal(
    selectCatalogCandidates({ products: [changed], ledger, coverageText: "", now: new Date("2026-08-22T02:00:00Z"), lookbackDays: 30 }).candidates.length,
    1,
  );
});

test("same vendor and series are grouped in sets of four with a three-article cap", () => {
  const items = Array.from({ length: 14 }, (_, index) =>
    product({
      id: `gid://shopify/Product/${index}`,
      handle: `botanical-${index}`,
      skus: [`BOT${index}`],
    }),
  );
  const groups = groupQueuedProducts(items, 3, 4);

  assert.deepEqual(groups.map((group) => group.length), [4, 4, 4]);
  assert.match(proposedArticleSlug(groups[0]), /^new-jiestar-flowers-botanical-/);
});

test("readiness blocks missing evidence and sensitive third-party phrases", () => {
  assert.deepEqual(readinessBlockers(product()), []);
  const blockers = readinessBlockers(
    product({
      title: "JIESTAR Hogwarts Castle",
      skus: ["A1", "A2"],
      images: [],
    }),
  );
  assert.ok(blockers.includes("multiple_distinct_skus"));
  assert.ok(blockers.includes("missing_public_image"));
  assert.ok(blockers.some((blocker) => blocker.startsWith("ip_review:")));
});

test("draft validation accepts the repository contract and rejects unsupported claims", () => {
  const item = product();
  const slug = proposedArticleSlug([item]);
  const bodyParagraph =
    "This botanical building set uses a layered composition with shaped leaves and a stable display base. The current public product materials present it as a shelf-oriented model for builders who enjoy decorative subjects and detailed assembly. ";
  const article = `---
title: "A New Botanical Building Set for Decorative Displays"
description: "Explore a newly listed botanical building set with a layered arrangement and shelf-ready display direction."
category: "New Releases"
date: "2026-08-21"
coverImage: "/images/blog/new-releases/${slug}-cover.avif"
coverAlt: "Layered JIESTAR botanical building block display with green leaves"
---

${bodyParagraph.repeat(3)}

## A closer look at the model

${bodyParagraph.repeat(2)} See the [${item.title}](/products/${item.handle}) for the current public product information.

![JIESTAR botanical building set arranged as a decorative shelf display](/images/blog/new-releases/${slug}-body-01.avif "The public product image shows the finished botanical composition.")

## Explore current JIESTAR options

Browse the [product catalog](/products), discuss current ranges through [Wholesale](/wholesale), explore [Custom Solutions](/custom-solutions), or [contact JIESTAR](/contact) with the SKU.
`;
  const imageNames = [`${slug}-cover.avif`, `${slug}-body-01.avif`];

  assert.deepEqual(validateDraftArticle({ article, slug, products: [item], imageNames }), []);
  assert.ok(
    validateDraftArticle({ article: article.replace("current public product information", "available now for $99"), slug, products: [item], imageNames }).some((error) =>
      error.startsWith("unsupported_claim:"),
    ),
  );
});

test("CLI fixture scan, finalize, and repeat scan are persistent and idempotent", () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), "jiestar-blog-agent-test-"));
  const fixture = path.resolve("tests/fixtures/new-product-blog-products.json");
  const script = path.resolve("scripts/new_product_blog_agent.mjs");
  const run = (...args: string[]) =>
    JSON.parse(
      execFileSync(process.execPath, [script, ...args], {
        cwd: process.cwd(),
        encoding: "utf8",
      }),
    );

  const first = run(
    "scan",
    "--fixture",
    fixture,
    "--output-root",
    outputRoot,
    "--now",
    "2026-08-21T02:00:00Z",
    "--run-id",
    "fixture-first",
  );
  assert.equal(first.initial_run, true);
  assert.equal(first.prepared.length, 1);

  const prepared = first.prepared[0];
  const resumed = run(
    "scan",
    "--fixture",
    fixture,
    "--output-root",
    outputRoot,
    "--now",
    "2026-08-21T03:00:00Z",
    "--dry-run",
  );
  assert.equal(resumed.resumed_drafts, 1);
  assert.equal(resumed.prepared[0].draftId, prepared.draftId);
  assert.equal(resumed.groups.length, 0);

  const candidate = JSON.parse(fs.readFileSync(path.join(prepared.draftDir, "candidate.json"), "utf8"));
  assert.equal(candidate.images[0].role, "cover");
  assert.equal(candidate.images[0].fileName, `${candidate.slug}-cover.avif`);
  const paragraph =
    "These two botanical building sets use different arrangements and colour directions while keeping the finished composition focused on decorative display. The public Shopify materials provide the product identity and structured specifications used in this review-only article. ";
  const article = `---
title: "Two New Botanical Building Sets for Decorative Display"
description: "Compare two newly listed botanical building sets with distinct display arrangements and current public product details."
category: "New Releases"
date: "2026-08-21"
coverImage: "/images/blog/new-releases/${candidate.slug}-cover.avif"
coverAlt: "Two layered botanical building block arrangements prepared for decorative display"
---

${paragraph.repeat(3)}

## Two display directions

${paragraph.repeat(2)}

${candidate.products.map((item: PublicProduct) => `Explore [${item.title}](/products/${item.handle}) using its current public product page.`).join("\n\n")}

![Two JIESTAR botanical building sets with layered flowers and display bases](/images/blog/new-releases/${candidate.images[1].fileName} "The public product images show the finished display arrangements.")

## Current catalog and business enquiries

Browse the [product catalog](/products), review options through [Wholesale](/wholesale), discuss [Custom Solutions](/custom-solutions), or [contact JIESTAR](/contact) with the relevant SKU.
`;
  fs.writeFileSync(path.join(prepared.draftDir, "article.md"), article, "utf8");

  const finalized = run("finalize", "--output-root", outputRoot, "--run-id", "fixture-first");
  assert.equal(finalized.drafted, 1);
  assert.ok(fs.existsSync(path.join(prepared.draftDir, "review.md")));
  assert.ok(fs.existsSync(path.join(prepared.draftDir, "preview.html")));
  const review = fs.readFileSync(path.join(prepared.draftDir, "review.md"), "utf8");
  assert.match(review, /## 英文博客正文/);
  assert.match(review, /## Two display directions/);
  assert.match(review, /Current catalog and business enquiries/);

  fs.rmSync(path.join(outputRoot, "_state", "ledger.json"));

  const second = run(
    "scan",
    "--fixture",
    fixture,
    "--output-root",
    outputRoot,
    "--now",
    "2026-08-22T02:00:00Z",
    "--dry-run",
  );
  assert.equal(second.initial_run, false);
  assert.equal(second.new_candidates, 0);
  assert.equal(second.status_counts.drafted, 2);
});
