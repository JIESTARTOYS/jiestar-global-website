#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BLOG_DRAFT_STATE_VERSION,
  groupQueuedProducts,
  isProductCovered,
  normalizeSkus,
  parseArticleFrontmatter,
  productFingerprint,
  proposedArticleSlug,
  readinessBlockers,
  selectCatalogCandidates,
  validateDraftArticle,
} from "../lib/new-product-blog.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUTPUT_ROOT = path.join(ROOT, "output", "blog-drafts");
const STATE_RELATIVE_PATH = path.join("_state", "ledger.json");
const DEFAULT_SITE_URL = "https://www.jiestartoys.com";
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const SPEC_KEYS = [
  "difficulty_level",
  "piece_count",
  "recommended_age",
  "finished_model_size",
  "package_size",
];

async function main() {
  const [command = "help", ...argv] = process.argv.slice(2);
  const args = parseArgs(argv);

  if (command === "scan") return scan(args);
  if (command === "finalize") return finalize(args);
  if (command === "promote") return promote(args);
  if (command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

async function scan(args) {
  const outputRoot = resolveOutputRoot(args);
  const now = args.now ? new Date(String(args.now)) : new Date();
  if (Number.isNaN(now.getTime())) throw new Error(`Invalid --now value: ${args.now}`);

  const lookbackDays = positiveInteger(args["lookback-days"] ?? 30, "--lookback-days");
  const maxArticles = positiveInteger(args["max-articles"] ?? 3, "--max-articles");
  const envFile = path.resolve(ROOT, String(args["env-file"] ?? ".env.local"));
  const siteUrl = String(args["site-url"] ?? process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL).replace(/\/$/, "");
  const fixturePath = args.fixture ? path.resolve(ROOT, String(args.fixture)) : null;
  const dryRun = Boolean(args["dry-run"]);

  if (fixturePath) {
    if (!fs.existsSync(fixturePath)) throw new Error(`Fixture not found: ${fixturePath}`);
  } else {
    loadEnvFile(envFile);
  }

  const products = fixturePath
    ? normalizeFixtureProducts(JSON.parse(fs.readFileSync(fixturePath, "utf8")))
    : await fetchPublicCatalog();
  const ledger = readLedger(outputRoot);
  const manifestHistory = readDraftManifestHistory(outputRoot);
  const selection = selectCatalogCandidates({ products, ledger, coverageText: readPublishedBlogText(), now, lookbackDays });
  restoreLedgerFromManifestHistory(selection.ledger, manifestHistory);
  selection.initialRun = selection.initialRun && manifestHistory.length === 0;
  selection.candidates = selection.candidates.filter((product) => selection.ledger.products[product.id]?.status === "queued");

  const resumablePrepared = manifestHistory
    .filter(({ manifest }) =>
      manifest.status === "prepared" &&
      manifest.products?.every((product) => {
        const entry = selection.ledger.products[product.id];
        return entry?.status === "prepared" && entry.fingerprint === product.fingerprint;
      }),
    )
    .slice(0, maxArticles)
    .map(({ draftDir, manifest }) => ({
      draftId: manifest.draftId,
      slug: manifest.slug,
      draftDir,
      productCount: manifest.products.length,
      resumed: true,
    }));

  const blocked = [];
  const ready = [];
  for (const product of selection.candidates) {
    const blockers = readinessBlockers(product);
    if (blockers.length) {
      blocked.push({ product, blockers });
      const entry = selection.ledger.products[product.id];
      entry.status = "blocked";
      entry.blockers = blockers;
    } else {
      ready.push(product);
    }
  }

  const groups = groupQueuedProducts(ready, Math.max(0, maxArticles - resumablePrepared.length), 4);
  const selectedIds = new Set(groups.flat().map((product) => product.id));
  const summary = {
    dry_run: dryRun,
    initial_run: selection.initialRun,
    catalog_products: products.length,
    new_candidates: selection.candidates.length,
    selected_products: selectedIds.size,
    article_groups: resumablePrepared.length + groups.length,
    resumed_drafts: resumablePrepared.length,
    blocked_products: blocked.length,
    queued_for_later: ready.filter((product) => !selectedIds.has(product.id)).length,
    status_counts: ledgerStatusCounts(selection.ledger),
  };

  if (dryRun) {
    printJson({
      ...summary,
      prepared: resumablePrepared,
      groups: groups.map((group) => ({ slug: proposedArticleSlug(group), products: group.map(productSummary) })),
      blocked: blocked.map(({ product, blockers }) => ({ ...productSummary(product), blockers })),
    });
    return;
  }

  const runId = String(args["run-id"] ?? makeRunId(now));
  const finalRunDir = path.join(outputRoot, runId);
  const runDir = path.join(outputRoot, `.tmp-${safeFilename(runId)}-${process.pid}`);
  if (fs.existsSync(finalRunDir)) throw new Error(`Run directory already exists: ${finalRunDir}`);
  if (fs.existsSync(runDir)) throw new Error(`Temporary run directory already exists: ${runDir}`);
  fs.mkdirSync(runDir, { recursive: true });

  const prepared = [...resumablePrepared];
  try {

  for (const item of blocked) {
    const blockedDir = path.join(runDir, "blocked", safeFilename(item.product.handle));
    fs.mkdirSync(blockedDir, { recursive: true });
    atomicWriteJson(path.join(blockedDir, "blocked.json"), {
      product: item.product,
      fingerprint: productFingerprint(item.product),
      blockers: item.blockers,
    });
  }

  for (const originalGroup of groups) {
    const verified = [];
    for (const product of originalGroup) {
      const publicCheck = fixturePath
        ? { ok: true, status: 200, url: `${siteUrl}/products/${product.handle}` }
        : await verifyPublicProductPage(siteUrl, product);
      if (!publicCheck.ok) throw new Error(`Public product page check failed for ${product.handle}: ${publicCheck.status}`);
      verified.push(product);
    }
    if (!verified.length) continue;

    const slug = proposedArticleSlug(verified);
    const draftId = `${runId}:${slug}`;
    const draftDir = path.join(runDir, slug);
    fs.mkdirSync(path.join(draftDir, "images"), { recursive: true });
    fs.mkdirSync(path.join(draftDir, "source-images"), { recursive: true });

    const images = fixturePath
      ? prepareFixtureImages(draftDir, slug, verified)
      : await prepareProductImages(draftDir, slug, verified);
    if (!images.length) {
      throw new Error(`No Shopify image could be downloaded and converted for ${slug}`);
    }

    const candidate = {
      version: 1,
      runId,
      draftId,
      slug,
      date: shanghaiDate(now),
      category: "New Releases",
      products: verified.map((product) => ({ ...product, fingerprint: productFingerprint(product) })),
      images,
      requiredProductLinks: verified.map((product) => `/products/${product.handle}`),
      finalImageDirectory: "/images/blog/new-releases/",
    };
    atomicWriteJson(path.join(draftDir, "candidate.json"), candidate);
    atomicWriteJson(path.join(draftDir, "manifest.json"), {
      version: 1,
      status: "prepared",
      ...candidate,
      preparedAt: new Date().toISOString(),
    });
    fs.writeFileSync(path.join(draftDir, "facts.md"), buildFactsMarkdown(candidate), "utf8");
    fs.writeFileSync(path.join(draftDir, "ARTICLE_INSTRUCTIONS.md"), buildArticleInstructions(candidate), "utf8");
    for (const product of verified) {
      const entry = selection.ledger.products[product.id];
      entry.status = "prepared";
      entry.draftIds = [...new Set([...entry.draftIds, draftId])];
    }
    prepared.push({ draftId, slug, draftDir: path.join(finalRunDir, slug), productCount: verified.length });
  }

  summary.status_counts = ledgerStatusCounts(selection.ledger);

  atomicWriteJson(path.join(runDir, "run.json"), {
    version: 1,
    runId,
    createdAt: new Date().toISOString(),
    ...summary,
    prepared,
    blocked: blocked.map(({ product, blockers }) => ({ ...productSummary(product), blockers })),
  });

  fs.renameSync(runDir, finalRunDir);
  selection.ledger.updatedAt = new Date().toISOString();
  atomicWriteJson(path.join(outputRoot, STATE_RELATIVE_PATH), selection.ledger);

  printJson({ run_id: runId, output: finalRunDir, prepared, ...summary });
  } catch (error) {
    if (fs.existsSync(runDir)) fs.rmSync(runDir, { recursive: true });
    throw error;
  }
}

async function finalize(args) {
  const outputRoot = resolveOutputRoot(args);
  const runId = requiredArg(args, "run-id");
  const runDir = path.join(outputRoot, runId);
  if (!fs.existsSync(runDir)) throw new Error(`Run not found: ${runId}`);

  const ledger = readLedger(outputRoot);
  if (!ledger) throw new Error("Draft ledger is missing; run scan before finalize.");
  const existingSlugs = new Set(
    fs.existsSync(path.join(ROOT, "content", "blog"))
      ? fs.readdirSync(path.join(ROOT, "content", "blog")).filter((name) => name.endsWith(".md")).map((name) => name.replace(/\.md$/, ""))
      : [],
  );

  const manifestPaths = new Set(findFiles(runDir, "manifest.json"));
  const runRecordPath = path.join(runDir, "run.json");
  if (fs.existsSync(runRecordPath)) {
    const runRecord = readJson(runRecordPath);
    for (const item of runRecord.prepared ?? []) {
      const draftDir = path.resolve(String(item.draftDir ?? ""));
      if (isPathInside(outputRoot, draftDir)) {
        const manifestPath = path.join(draftDir, "manifest.json");
        if (fs.existsSync(manifestPath)) manifestPaths.add(manifestPath);
      }
    }
  }

  const results = [];
  for (const manifestPath of manifestPaths) {
    const manifest = readJson(manifestPath);
    if (manifest.status !== "prepared" && manifest.status !== "drafted") continue;
    const draftDir = path.dirname(manifestPath);
    const articlePath = path.join(draftDir, "article.md");
    if (!fs.existsSync(articlePath)) {
      results.push({ draftId: manifest.draftId, status: "invalid", errors: ["missing_article_md"] });
      continue;
    }

    const article = fs.readFileSync(articlePath, "utf8");
    const imageNames = manifest.images.map((image) => image.fileName);
    const errors = validateDraftArticle({
      article,
      slug: manifest.slug,
      products: manifest.products,
      imageNames,
      existingSlugs,
    });

    for (const image of manifest.images) {
      const imagePath = path.join(draftDir, "images", image.fileName);
      if (!fs.existsSync(imagePath)) errors.push(`missing_image:${image.fileName}`);
      else if (sha256File(imagePath) !== image.sha256) errors.push(`image_hash_changed:${image.fileName}`);
    }

    if (errors.length) {
      results.push({ draftId: manifest.draftId, status: "invalid", errors: [...new Set(errors)] });
      continue;
    }

    const review = buildReviewMarkdown(manifest, article);
    const preview = buildPreviewHtml(manifest, article);
    fs.writeFileSync(path.join(draftDir, "review.md"), review, "utf8");
    fs.writeFileSync(path.join(draftDir, "preview.html"), preview, "utf8");
    atomicWriteJson(manifestPath, {
      ...manifest,
      status: "drafted",
      finalizedAt: new Date().toISOString(),
      articleSha256: sha256Text(article),
      validation: { passed: true, errors: [] },
    });
    for (const product of manifest.products) {
      const entry = ledger.products[product.id];
      if (!entry) throw new Error(`Ledger entry missing for ${product.id}`);
      entry.status = "drafted";
      entry.blockers = [];
      entry.draftIds = [...new Set([...entry.draftIds, manifest.draftId])];
    }
    results.push({ draftId: manifest.draftId, status: "drafted", output: draftDir });
  }

  ledger.updatedAt = new Date().toISOString();
  atomicWriteJson(path.join(outputRoot, STATE_RELATIVE_PATH), ledger);
  printJson({ run_id: runId, drafted: results.filter((item) => item.status === "drafted").length, results });
  if (results.some((item) => item.status === "invalid")) process.exitCode = 2;
}

async function promote(args) {
  const outputRoot = resolveOutputRoot(args);
  const draftId = requiredArg(args, "draft-id");
  const apply = Boolean(args.apply);
  const manifestPath = findManifestByDraftId(outputRoot, draftId);
  if (!manifestPath) throw new Error(`Draft not found: ${draftId}`);

  const draftDir = path.dirname(manifestPath);
  const manifest = readJson(manifestPath);
  const recoveringFailedPromotion = manifest.status === "promotion_checks_failed";
  if (manifest.status !== "drafted" && !recoveringFailedPromotion) {
    throw new Error(`Draft must be finalized before promotion; current status is ${manifest.status}`);
  }
  const articlePath = path.join(draftDir, "article.md");
  const article = fs.readFileSync(articlePath, "utf8");
  if (sha256Text(article) !== manifest.articleSha256) throw new Error("Article changed after finalization; finalize it again.");
  for (const image of manifest.images) {
    const imagePath = path.join(draftDir, "images", image.fileName);
    if (!fs.existsSync(imagePath) || sha256File(imagePath) !== image.sha256) {
      throw new Error(`Image changed after finalization: ${image.fileName}`);
    }
  }

  const targetArticle = path.join(ROOT, "content", "blog", `${manifest.slug}.md`);
  const targetImageDir = path.join(ROOT, "public", "images", "blog", "new-releases");
  if (fs.existsSync(targetArticle) && (!recoveringFailedPromotion || sha256File(targetArticle) !== sha256File(articlePath))) {
    throw new Error(`Target article already exists: ${targetArticle}`);
  }
  const publishedCoverage = readPublishedBlogText(recoveringFailedPromotion ? new Set([targetArticle]) : undefined);
  for (const product of manifest.products) {
    if (isProductCovered(product, publishedCoverage)) {
      throw new Error(`Promotion stopped because an existing article already covers ${product.skus.join("/")} or /products/${product.handle}`);
    }
  }

  loadEnvFile(path.resolve(ROOT, String(args["env-file"] ?? ".env.local")));
  const currentProducts = await fetchPublicCatalog();
  const currentById = new Map(currentProducts.map((product) => [product.id, product]));
  const changed = [];
  for (const expected of manifest.products) {
    const current = currentById.get(expected.id);
    if (!current) changed.push(`${expected.handle}:no_longer_public`);
    else if (productFingerprint(current) !== expected.fingerprint) changed.push(`${expected.handle}:facts_changed`);
    else {
      const publicCheck = await verifyPublicProductPage(String(args["site-url"] ?? DEFAULT_SITE_URL).replace(/\/$/, ""), current);
      if (!publicCheck.ok) changed.push(`${expected.handle}:public_page_${publicCheck.status}`);
    }
  }
  if (changed.length) throw new Error(`Promotion stopped because Shopify changed: ${changed.join(", ")}`);

  const copies = [
    { from: articlePath, to: targetArticle },
    ...manifest.images.map((image) => ({
      from: path.join(draftDir, "images", image.fileName),
      to: path.join(targetImageDir, image.fileName),
    })),
  ];
  for (const item of copies) {
    if (!fs.existsSync(item.from)) throw new Error(`Missing source artifact: ${item.from}`);
    if (fs.existsSync(item.to) && (!recoveringFailedPromotion || sha256File(item.from) !== sha256File(item.to))) {
      throw new Error(`Promotion target already exists: ${item.to}`);
    }
  }

  if (!apply) {
    printJson({ dry_run: true, draft_id: draftId, copies, next: "Review the exact draft, then rerun with --apply." });
    return;
  }

  fs.mkdirSync(targetImageDir, { recursive: true });
  for (const item of copies) {
    if (!fs.existsSync(item.to)) fs.copyFileSync(item.from, item.to, fs.constants.COPYFILE_EXCL);
  }

  const checks = ["test", "lint", "build"].map((script) => {
    const result = spawnSync("pnpm", [script], { cwd: ROOT, encoding: "utf8" });
    return {
      script: `pnpm ${script}`,
      passed: result.status === 0,
      exitCode: result.status,
      output: `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim().slice(-6000),
    };
  });
  atomicWriteJson(manifestPath, {
    ...manifest,
    status: checks.every((check) => check.passed) ? "promoted" : "promotion_checks_failed",
    promotedAt: new Date().toISOString(),
    promotionChecks: checks,
    visualCheckRequired: true,
  });

  const ledger = readLedger(outputRoot);
  if (ledger && checks.every((check) => check.passed)) {
    for (const product of manifest.products) {
      if (ledger.products[product.id]) ledger.products[product.id].status = "promoted";
    }
    ledger.updatedAt = new Date().toISOString();
    atomicWriteJson(path.join(outputRoot, STATE_RELATIVE_PATH), ledger);
  }

  printJson({
    dry_run: false,
    draft_id: draftId,
    copied: copies,
    checks,
    visual_check_required: true,
    committed: false,
    pushed: false,
    deployed: false,
  });
  if (checks.some((check) => !check.passed)) process.exitCode = 3;
}

async function fetchPublicCatalog() {
  const domain = requiredEnv("SHOPIFY_STORE_DOMAIN");
  const token = requiredEnv("SHOPIFY_STOREFRONT_ACCESS_TOKEN");
  const version = process.env.SHOPIFY_API_VERSION?.trim() || "2026-01";
  const endpoint = `https://${domain}/api/${version}/graphql.json`;
  const query = `
    query PublicProducts($cursor: String) {
      products(first: 50, after: $cursor, sortKey: CREATED_AT) {
        pageInfo { hasNextPage endCursor }
        edges {
          node {
            id handle title vendor productType description createdAt updatedAt
            collections(first: 20) { edges { node { handle title } } }
            images(first: 8) { edges { node { url altText } } }
            variants(first: 20) { edges { node { sku } } }
            metafields(identifiers: [
              { namespace: "specs", key: "difficulty_level" }
              { namespace: "specs", key: "piece_count" }
              { namespace: "specs", key: "recommended_age" }
              { namespace: "specs", key: "finished_model_size" }
              { namespace: "specs", key: "package_size" }
            ]) { namespace key value }
          }
        }
      }
    }
  `;

  const products = [];
  let cursor = null;
  do {
    const response = await fetchWithTimeout(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query, variables: { cursor } }),
    }, 90_000);
    if (!response.ok) throw new Error(`Shopify Storefront HTTP ${response.status}`);
    const payload = await response.json();
    if (payload.errors?.length) throw new Error(`Shopify Storefront GraphQL error: ${payload.errors.map((error) => error.message).join("; ")}`);
    const connection = payload.data?.products;
    if (!connection?.edges) throw new Error("Shopify Storefront response did not include products.");
    products.push(...connection.edges.map(({ node }) => normalizeShopifyNode(node)));
    cursor = connection.pageInfo?.hasNextPage ? connection.pageInfo.endCursor : null;
  } while (cursor);

  return products;
}

function normalizeShopifyNode(node) {
  const specs = {};
  for (const metafield of node.metafields ?? []) {
    if (metafield?.key && SPEC_KEYS.includes(metafield.key) && metafield.value) specs[metafield.key] = metafield.value;
  }
  return {
    id: String(node.id ?? ""),
    handle: String(node.handle ?? "").trim(),
    title: String(node.title ?? "").trim(),
    vendor: String(node.vendor ?? "JIESTAR").trim() || "JIESTAR",
    productType: String(node.productType ?? "").trim(),
    description: String(node.description ?? "").trim(),
    createdAt: String(node.createdAt ?? ""),
    updatedAt: String(node.updatedAt ?? ""),
    collections: (node.collections?.edges ?? []).map(({ node: collection }) => ({
      handle: String(collection.handle ?? ""),
      title: String(collection.title ?? ""),
    })),
    images: (node.images?.edges ?? []).map(({ node: image }) => ({
      url: String(image.url ?? ""),
      altText: image.altText ? String(image.altText) : null,
    })),
    skus: normalizeSkus((node.variants?.edges ?? []).map(({ node: variant }) => String(variant.sku ?? ""))),
    specs,
  };
}

function normalizeFixtureProducts(raw) {
  const records = Array.isArray(raw) ? raw : raw.products ?? raw.records ?? [];
  return records.map((product) => ({
    id: String(product.id ?? ""),
    handle: String(product.handle ?? ""),
    title: String(product.title ?? ""),
    vendor: String(product.vendor ?? "JIESTAR"),
    productType: String(product.productType ?? ""),
    description: String(product.description ?? ""),
    createdAt: String(product.createdAt ?? ""),
    updatedAt: String(product.updatedAt ?? product.createdAt ?? ""),
    collections: product.collections ?? [],
    images: product.images ?? [],
    skus: normalizeSkus(product.skus ?? []),
    specs: product.specs ?? {},
  }));
}

async function verifyPublicProductPage(siteUrl, product) {
  const url = `${siteUrl}/products/${product.handle}`;
  try {
    const response = await fetchWithTimeout(url, { headers: { "User-Agent": "JIESTAR-New-Product-Blog-Agent/1.0" } }, 30_000);
    if (!response.ok) return { ok: false, status: response.status, url };
    const body = await response.text();
    const visible = body.toLowerCase().includes(product.handle.toLowerCase()) || body.toLowerCase().includes(product.title.toLowerCase().slice(0, 24));
    return { ok: visible, status: visible ? response.status : 422, url };
  } catch (error) {
    return { ok: false, status: "network_error", url, error: error instanceof Error ? error.message : String(error) };
  }
}

async function prepareProductImages(draftDir, slug, products) {
  const picks = selectImageSources(products, 4);
  const prepared = [];
  for (let index = 0; index < picks.length; index += 1) {
    const pick = picks[index];
    const outputIndex = prepared.length;
    const suffix = outputIndex === 0 ? "cover" : `body-${String(outputIndex).padStart(2, "0")}`;
    const fileName = `${slug}-${suffix}.avif`;
    const sourcePath = path.join(draftDir, "source-images", `${String(index + 1).padStart(2, "0")}.source`);
    const targetPath = path.join(draftDir, "images", fileName);
    try {
      const response = await fetchWithTimeout(pick.url, { headers: { "User-Agent": "JIESTAR-New-Product-Blog-Agent/1.0" } }, 60_000);
      if (!response.ok) continue;
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.startsWith("image/")) continue;
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) continue;
      fs.writeFileSync(sourcePath, bytes);
      execFileSync("sips", ["-s", "format", "avif", "-Z", "1800", sourcePath, "--out", targetPath], {
        stdio: "ignore",
      });
      if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).size) continue;
      prepared.push({
        role: outputIndex === 0 ? "cover" : "body",
        fileName,
        sourceUrl: pick.url,
        sourceAlt: pick.altText ?? "",
        productId: pick.productId,
        productHandle: pick.productHandle,
        sha256: sha256File(targetPath),
      });
    } catch {
      // Keep trying remaining official Shopify images. A group is blocked only
      // when none of the selected images can be prepared.
    }
  }
  return prepared;
}

function prepareFixtureImages(draftDir, slug, products) {
  const picks = selectImageSources(products, 4);
  return picks.map((pick, index) => {
    const suffix = index === 0 ? "cover" : `body-${String(index).padStart(2, "0")}`;
    const fileName = `${slug}-${suffix}.avif`;
    const targetPath = path.join(draftDir, "images", fileName);
    fs.writeFileSync(targetPath, `fixture-image:${pick.url}\n`, "utf8");
    return {
      role: index === 0 ? "cover" : "body",
      fileName,
      sourceUrl: pick.url,
      sourceAlt: pick.altText ?? "",
      productId: pick.productId,
      productHandle: pick.productHandle,
      sha256: sha256File(targetPath),
    };
  });
}

function selectImageSources(products, limit) {
  const picks = [];
  const seen = new Set();
  const add = (product, image) => {
    if (!image?.url || seen.has(image.url) || picks.length >= limit) return;
    seen.add(image.url);
    picks.push({ ...image, productId: product.id, productHandle: product.handle });
  };
  for (const product of products) add(product, product.images[0]);
  for (let imageIndex = 1; picks.length < limit && imageIndex < 8; imageIndex += 1) {
    for (const product of products) add(product, product.images[imageIndex]);
  }
  return picks;
}

function buildFactsMarkdown(candidate) {
  const lines = [
    `# Verified Shopify facts for ${candidate.slug}`,
    "",
    "Use only the facts below. Missing values must be omitted, not guessed.",
    "Do not quote price, stock, shipping time, certification, licensing, sales, capacity, MOQ, or availability.",
    "",
  ];
  for (const product of candidate.products) {
    lines.push(`## ${product.title}`, "", `- SKU: ${product.skus.join(", ")}`, `- Vendor: ${product.vendor}`, `- Product type: ${product.productType || "Not provided"}`, `- Public path: /products/${product.handle}`, `- Created at: ${product.createdAt}`, `- Updated at: ${product.updatedAt}`);
    if (product.collections.length) lines.push(`- Collections: ${product.collections.map((item) => item.title).join(", ")}`);
    for (const [key, value] of Object.entries(product.specs)) lines.push(`- ${key}: ${value}`);
    lines.push("", "### Shopify description", "", product.description || "No public description supplied.", "");
  }
  return `${lines.join("\n")}\n`;
}

function buildArticleInstructions(candidate) {
  const bodyImages = candidate.images.filter((image) => image.role === "body");
  return `# Article task\n\nRead \`facts.md\`, \`candidate.json\`, the prepared images, \`agents/blog-content-agent.md\`, and \`lib/blog.ts\`. Write only \`article.md\` in this directory.\n\nRequired frontmatter:\n\n\`\`\`yaml\n---\ntitle: "Natural English title"\ndescription: "Factual description of at least 40 characters"\ncategory: "New Releases"\ndate: "${candidate.date}"\ncoverImage: "/images/blog/new-releases/${candidate.slug}-cover.avif"\ncoverAlt: "Accurate English cover alt text of at least 20 characters"\n---\n\`\`\`\n\nRequired product links:\n${candidate.requiredProductLinks.map((link) => `- ${link}`).join("\n")}\n\nAvailable body images:\n${bodyImages.map((image) => `- /images/blog/new-releases/${image.fileName}`).join("\n") || "- None"}\n\nUse H2/H3, paragraphs, lists, local images, and Markdown links only. Do not include prices, stock, certification, licensing, delivery, capacity, rankings, or unsupported commercial claims. End with restrained links to /products, /wholesale, /custom-solutions, and /contact. Do not modify manifest.json or any tracked repository file.\n`;
}

function buildReviewMarkdown(manifest, article) {
  const { fields, body } = parseArticleFrontmatter(article);
  return `# 新品博客待审核\n\n- 草稿 ID：${manifest.draftId}\n- 英文标题：${fields.title}\n- 分类：New Releases\n- 商品：${manifest.products.map((product) => `${product.skus.join("/")} ${product.title}`).join("；")}\n- Shopify 产品链接：${manifest.products.map((product) => `/products/${product.handle}`).join("；")}\n- 图片：${manifest.images.map((image) => image.fileName).join("；")}\n- 状态：已通过本地草稿契约校验，尚未晋级到官网内容目录。\n\n## 英文博客正文\n\n${body.trim()}\n\n## 审核重点\n\n- 核对标题、SKU、产品结构和图片是否对应。\n- 核对所有规格是否确实来自 Shopify 当前公开资料。\n- 检查是否存在第三方品牌、IP、授权或认证风险。\n- 确认文章语气和 B2B CTA 后，再人工运行 promote dry-run。\n\n## 未执行\n\n未修改 Shopify，未提交 Git，未推送，未部署，未发布。\n`;
}

function buildPreviewHtml(manifest, article) {
  const { fields, body } = parseArticleFrontmatter(article);
  const imageBase = `./images/`;
  const rendered = body
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (/^##\s+/.test(trimmed)) return `<h2>${escapeHtml(trimmed.replace(/^##\s+/, ""))}</h2>`;
      if (/^###\s+/.test(trimmed)) return `<h3>${escapeHtml(trimmed.replace(/^###\s+/, ""))}</h3>`;
      const image = trimmed.match(/^!\[([^\]]+)\]\(\/images\/blog\/new-releases\/([^\s)]+)(?:\s+"([^"]*)")?\)$/);
      if (image) return `<figure><img src="${imageBase}${escapeHtml(image[2])}" alt="${escapeHtml(image[1])}">${image[3] ? `<figcaption>${escapeHtml(image[3])}</figcaption>` : ""}</figure>`;
      if (/^-\s+/m.test(trimmed)) return `<ul>${trimmed.split("\n").map((line) => `<li>${renderInline(line.replace(/^-\s+/, ""))}</li>`).join("")}</ul>`;
      return `<p>${renderInline(trimmed.replace(/\n/g, " "))}</p>`;
    })
    .join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(fields.title ?? manifest.slug)}</title><style>body{margin:0;background:#f4f5f7;color:#17202a;font:17px/1.65 system-ui,sans-serif}main{max-width:860px;margin:auto;background:#fff;padding:48px 7vw;min-height:100vh}h1{font-size:clamp(2rem,5vw,3.5rem);line-height:1.08}h2{margin-top:2.2em}img{width:100%;height:auto;border-radius:12px}figure{margin:2rem 0}figcaption{color:#667085;font-size:.9rem}a{color:#1259a7}</style></head><body><main><p><strong>REVIEW-ONLY DRAFT</strong></p><h1>${escapeHtml(fields.title ?? manifest.slug)}</h1><p>${escapeHtml(fields.description ?? "")}</p><img src="./images/${manifest.slug}-cover.avif" alt="${escapeHtml(fields.coverAlt ?? "")}">${rendered}</main></body></html>\n`;
}

function renderInline(value) {
  return escapeHtml(value).replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function readPublishedBlogText(excludedFiles = new Set()) {
  return findFiles(path.join(ROOT, "content", "blog"), null, (name) => name.endsWith(".md"))
    .filter((file) => !excludedFiles.has(file))
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");
}

function readDraftManifestHistory(outputRoot) {
  const history = [];
  for (const manifestPath of findFiles(outputRoot, "manifest.json")) {
    if (manifestPath.split(path.sep).some((segment) => segment.startsWith(".tmp-"))) continue;
    try {
      const manifest = readJson(manifestPath);
      if (!manifest.draftId || !manifest.slug || !Array.isArray(manifest.products)) continue;
      history.push({ manifestPath, draftDir: path.dirname(manifestPath), manifest });
    } catch {
      // Ignore malformed historical artifacts; they do not prove coverage.
    }
  }
  return history.sort((a, b) => String(a.manifest.preparedAt ?? "").localeCompare(String(b.manifest.preparedAt ?? "")));
}

function restoreLedgerFromManifestHistory(ledger, history) {
  const statusRank = { prepared: 1, drafted: 2, promoted: 3 };
  for (const { manifest } of history) {
    const restoredStatus = manifest.status === "promoted"
      ? "promoted"
      : manifest.status === "drafted" || manifest.status === "promotion_checks_failed"
        ? "drafted"
        : manifest.status === "prepared"
          ? "prepared"
          : null;
    if (!restoredStatus) continue;

    for (const product of manifest.products) {
      const expectedFingerprint = String(product.fingerprint ?? productFingerprint(product));
      const existing = ledger.products[product.id];
      if (restoredStatus === "prepared" && existing && existing.fingerprint !== expectedFingerprint) continue;
      const shouldRestore = !existing || (statusRank[restoredStatus] ?? 0) >= (statusRank[existing.status] ?? 0);
      ledger.products[product.id] = {
        id: product.id,
        handle: product.handle,
        skus: normalizeSkus(product.skus ?? []),
        firstSeenAt: existing?.firstSeenAt ?? manifest.preparedAt ?? new Date().toISOString(),
        createdAt: product.createdAt ?? existing?.createdAt ?? "",
        updatedAt: product.updatedAt ?? existing?.updatedAt ?? "",
        fingerprint: existing?.fingerprint ?? expectedFingerprint,
        status: shouldRestore ? restoredStatus : existing.status,
        draftIds: [...new Set([...(existing?.draftIds ?? []), manifest.draftId])],
        blockers: shouldRestore ? [] : existing?.blockers ?? [],
      };
    }
  }
  ledger.updatedAt = new Date().toISOString();
}

function ledgerStatusCounts(ledger) {
  const counts = { baseline: 0, queued: 0, blocked: 0, prepared: 0, drafted: 0, promoted: 0, already_covered: 0 };
  for (const entry of Object.values(ledger.products)) counts[entry.status] = (counts[entry.status] ?? 0) + 1;
  return counts;
}

function isPathInside(root, candidate) {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function readLedger(outputRoot) {
  const statePath = path.join(outputRoot, STATE_RELATIVE_PATH);
  if (!fs.existsSync(statePath)) return null;
  const ledger = readJson(statePath);
  if (ledger.version !== BLOG_DRAFT_STATE_VERSION || !ledger.products) throw new Error(`Invalid draft ledger: ${statePath}`);
  return ledger;
}

function findManifestByDraftId(outputRoot, draftId) {
  for (const file of findFiles(outputRoot, "manifest.json")) {
    try {
      if (readJson(file).draftId === draftId) return file;
    } catch {
      // Ignore unrelated or partial output files; the selected draft must have
      // one valid manifest to be promotable.
    }
  }
  return null;
}

function findFiles(root, exactName = null, predicate = null) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...findFiles(fullPath, exactName, predicate));
    else if ((!exactName || entry.name === exactName) && (!predicate || predicate(entry.name))) files.push(fullPath);
  }
  return files;
}

function loadEnvFile(file) {
  if (!fs.existsSync(file)) throw new Error(`Environment file not found: ${file}`);
  for (const rawLine of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const index = line.indexOf("=");
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

function requiredEnv(key) {
  const value = process.env[key]?.trim();
  if (!value) throw new Error(`Missing ${key}; configure it in the selected env file.`);
  return value;
}

async function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function atomicWriteJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  fs.renameSync(temporary, file);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) args[key] = true;
    else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function requiredArg(args, key) {
  const value = args[key];
  if (!value || value === true) throw new Error(`Missing --${key}`);
  return String(value);
}

function positiveInteger(value, label) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${label} must be a positive integer.`);
  return parsed;
}

function resolveOutputRoot(args) {
  return path.resolve(ROOT, String(args["output-root"] ?? DEFAULT_OUTPUT_ROOT));
}

function makeRunId(now) {
  return `${shanghaiDate(now)}-${now.toISOString().replace(/[-:.TZ]/g, "").slice(8, 14)}`;
}

function shanghaiDate(date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function safeFilename(value) {
  return value.replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";
}

function productSummary(product) {
  return { id: product.id, handle: product.handle, skus: normalizeSkus(product.skus), title: product.title, vendor: product.vendor, productType: product.productType };
}

function sha256File(file) {
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function printHelp() {
  process.stdout.write(`JIESTAR new-product blog agent\n\nCommands:\n  scan [--dry-run] [--lookback-days 30] [--max-articles 3] [--env-file .env.local]\n  finalize --run-id <run-id>\n  promote --draft-id <run-id:slug> [--apply] [--env-file .env.local]\n\nThe scheduled task may call scan and finalize only. Promote always requires a separate human-authorized run.\n`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`new-product-blog-agent: ${message}\n`);
  process.exitCode = 1;
});
