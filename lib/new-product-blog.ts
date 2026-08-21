import { createHash } from "node:crypto";

export const BLOG_DRAFT_STATE_VERSION = 1;
export const NEW_RELEASE_CATEGORY = "New Releases";

export type PublicProductImage = {
  url: string;
  altText?: string | null;
};

export type PublicProduct = {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  collections: Array<{ handle: string; title: string }>;
  images: PublicProductImage[];
  skus: string[];
  specs: Record<string, string>;
};

export type ProductLedgerStatus =
  | "baseline"
  | "queued"
  | "blocked"
  | "prepared"
  | "drafted"
  | "promoted"
  | "already_covered";

export type ProductLedgerEntry = {
  id: string;
  handle: string;
  skus: string[];
  firstSeenAt: string;
  createdAt: string;
  updatedAt: string;
  fingerprint: string;
  status: ProductLedgerStatus;
  draftIds: string[];
  blockers: string[];
};

export type ProductLedger = {
  version: number;
  initializedAt: string;
  updatedAt: string;
  products: Record<string, ProductLedgerEntry>;
};

export type CatalogSelection = {
  ledger: ProductLedger;
  candidates: PublicProduct[];
  initialRun: boolean;
  counts: Record<ProductLedgerStatus, number>;
};

const IP_RISK_PATTERNS: Array<[RegExp, string]> = [
  [/\bpiranha\s+plant\b/i, "Nintendo/Mario-specific phrase"],
  [/\bwednesdays?\b/i, "Wednesday-specific phrase"],
  [/\bthe\s*thing\b/i, "Wednesday-specific prop phrase"],
  [/\bsky\s+bison\b/i, "Avatar-specific phrase"],
  [/\bsandworm\s+strike\b/i, "Dune-specific phrase"],
  [/\bforbidden\s+forest\b/i, "Harry Potter-adjacent phrase"],
  [/\bcommon\s+room\b/i, "wizard-school-adjacent phrase"],
  [/\bking\s+of\s+(?:the\s+)?lion\b/i, "Lion King-adjacent phrase"],
  [/\bdangers?\s*(?:&|and)\s*dragons\b/i, "Dungeons & Dragons-adjacent phrase"],
  [/\bvan\s+gogh\b/i, "artist name requiring review"],
  [/\bgt[-\s]?r\b/i, "vehicle model mark"],
  [/\b(hogwarts|harry\s+potter|star\s+wars|marvel|disney|pokemon|nintendo)\b/i, "third-party franchise phrase"],
  [/\b(ferrari|lamborghini|mclaren|ford|chevrolet|corvette|land\s+rover|subaru)\b/i, "vehicle brand phrase"],
];

const UNSUPPORTED_CLAIM_PATTERNS: Array<[RegExp, string]> = [
  [/[$€£]\s*\d|\bUSD\s*\d/i, "price claim"],
  [/\b(?:in stock|available now|ships? within|delivery within)\b/i, "inventory or delivery claim"],
  [/\b(?:certified|certification|compliant with|safety tested)\b/i, "certification or compliance claim"],
  [/\b(?:best[- ]selling|market leader|number one|#1)\b/i, "market-performance claim"],
  [/\b(?:officially licensed|official license|exclusive rights?)\b/i, "licensing or exclusivity claim"],
  [/\b(?:production capacity|monthly capacity|annual capacity)\b/i, "production-capacity claim"],
];

export function productFingerprint(product: PublicProduct) {
  const stable = {
    id: product.id,
    handle: product.handle,
    title: product.title,
    vendor: product.vendor,
    productType: product.productType,
    description: product.description,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    collections: [...product.collections].sort((a, b) => a.handle.localeCompare(b.handle)),
    images: product.images.map((image) => ({ url: image.url, altText: image.altText ?? "" })),
    skus: normalizeSkus(product.skus),
    specs: Object.fromEntries(Object.entries(product.specs).sort(([a], [b]) => a.localeCompare(b))),
  };

  return createHash("sha256").update(JSON.stringify(stable)).digest("hex");
}

export function normalizeSkus(values: string[]) {
  return [...new Set(values.map((value) => value.trim().toUpperCase()).filter(Boolean))].sort();
}

export function productCoverageTokens(product: Pick<PublicProduct, "handle" | "skus">) {
  return [`/products/${product.handle.toLowerCase()}`, ...normalizeSkus(product.skus).map((sku) => sku.toLowerCase())];
}

export function isProductCovered(product: Pick<PublicProduct, "handle" | "skus">, coverageText: string) {
  const haystack = coverageText.toLowerCase();
  const handleToken = `/products/${product.handle.toLowerCase()}`;
  if (haystack.includes(handleToken)) return true;

  return normalizeSkus(product.skus).some((sku) => {
    if (sku.length < 4) return false;
    const token = escapeRegExp(sku.toLowerCase());
    return new RegExp(`(^|[^a-z0-9])${token}([^a-z0-9]|$)`).test(haystack);
  });
}

export function selectCatalogCandidates(args: {
  products: PublicProduct[];
  ledger?: ProductLedger | null;
  coverageText: string;
  now: Date;
  lookbackDays: number;
}): CatalogSelection {
  const nowIso = args.now.toISOString();
  const initialRun = !args.ledger;
  const cutoff = args.now.getTime() - args.lookbackDays * 24 * 60 * 60 * 1000;
  const ledger: ProductLedger = args.ledger
    ? structuredClone(args.ledger)
    : {
        version: BLOG_DRAFT_STATE_VERSION,
        initializedAt: nowIso,
        updatedAt: nowIso,
        products: {},
      };

  if (ledger.version !== BLOG_DRAFT_STATE_VERSION) {
    throw new Error(`Unsupported blog draft ledger version: ${ledger.version}`);
  }

  const candidates: PublicProduct[] = [];

  for (const product of args.products) {
    const fingerprint = productFingerprint(product);
    const existing = ledger.products[product.id];
    const covered = isProductCovered(product, args.coverageText);
    const createdTime = Date.parse(product.createdAt);
    let status: ProductLedgerStatus;

    if (covered && existing?.status !== "drafted" && existing?.status !== "promoted") {
      status = "already_covered";
    } else if (!existing) {
      status = initialRun && (!Number.isFinite(createdTime) || createdTime < cutoff) ? "baseline" : "queued";
    } else if (existing.status === "blocked" && existing.fingerprint !== fingerprint) {
      status = "queued";
    } else {
      status = existing.status;
    }

    const entry: ProductLedgerEntry = {
      id: product.id,
      handle: product.handle,
      skus: normalizeSkus(product.skus),
      firstSeenAt: existing?.firstSeenAt ?? nowIso,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      fingerprint,
      status,
      draftIds: existing?.draftIds ?? [],
      blockers: status === "queued" ? [] : existing?.blockers ?? [],
    };

    ledger.products[product.id] = entry;
    if (status === "queued") {
      candidates.push(product);
    }
  }

  ledger.updatedAt = nowIso;
  candidates.sort((a, b) => {
    const aSeen = ledger.products[a.id]?.firstSeenAt ?? a.createdAt;
    const bSeen = ledger.products[b.id]?.firstSeenAt ?? b.createdAt;
    return aSeen.localeCompare(bSeen) || a.id.localeCompare(b.id);
  });

  return {
    ledger,
    candidates,
    initialRun,
    counts: countStatuses(ledger),
  };
}

export function readinessBlockers(product: PublicProduct) {
  const blockers: string[] = [];
  const skus = normalizeSkus(product.skus);
  const evidence = `${product.title}\n${product.description}`;

  if (!product.id.trim()) blockers.push("missing_product_id");
  if (!/^[a-z0-9][a-z0-9-]+$/i.test(product.handle)) blockers.push("invalid_handle");
  if (skus.length !== 1) blockers.push(skus.length ? "multiple_distinct_skus" : "missing_sku");
  if (product.title.trim().length < 6 || /[\u3400-\u9fff]/.test(product.title)) blockers.push("missing_english_title");
  if (!product.images.some((image) => /^https:\/\//i.test(image.url))) blockers.push("missing_public_image");

  for (const [pattern, label] of IP_RISK_PATTERNS) {
    if (pattern.test(evidence)) blockers.push(`ip_review:${label}`);
  }

  return [...new Set(blockers)];
}

export function groupQueuedProducts(products: PublicProduct[], maxArticles = 3, maxGroupSize = 4) {
  if (maxArticles < 1 || maxGroupSize < 1) return [];

  const grouped = new Map<string, PublicProduct[]>();
  for (const product of products) {
    const series = product.productType.trim() || product.collections[0]?.handle || "other";
    const key = `${product.vendor.trim().toLowerCase() || "jiestar"}|${series.toLowerCase()}`;
    grouped.set(key, [...(grouped.get(key) ?? []), product]);
  }

  const result: PublicProduct[][] = [];
  for (const productsInSeries of grouped.values()) {
    for (let index = 0; index < productsInSeries.length; index += maxGroupSize) {
      result.push(productsInSeries.slice(index, index + maxGroupSize));
    }
  }

  return result.slice(0, maxArticles);
}

export function proposedArticleSlug(products: PublicProduct[]) {
  const vendor = slugify(products[0]?.vendor || "jiestar");
  const series = slugify(products[0]?.productType || products[0]?.collections[0]?.title || "building-block-sets");
  const skus = products.flatMap((product) => normalizeSkus(product.skus)).map(slugify).filter(Boolean);
  const raw = ["new", vendor, series, ...skus].filter(Boolean).join("-");
  return raw.slice(0, 110).replace(/-+$/g, "");
}

export function parseArticleFrontmatter(article: string) {
  const match = article.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { fields: {} as Record<string, string>, body: "" };

  const fields = Object.fromEntries(
    match[1]
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [key, ...rest] = line.split(":");
        return [key.trim(), rest.join(":").trim().replace(/^"|"$/g, "")];
      }),
  );

  return { fields, body: match[2].trim() };
}

export function validateDraftArticle(args: {
  article: string;
  slug: string;
  products: PublicProduct[];
  imageNames: string[];
  existingSlugs?: Set<string>;
}) {
  const errors: string[] = [];
  const { fields, body } = parseArticleFrontmatter(args.article);
  const expectedCover = `/images/blog/new-releases/${args.slug}-cover.avif`;

  if (!Object.keys(fields).length) errors.push("missing_frontmatter");
  if ((fields.title ?? "").trim().length < 12) errors.push("title_too_short");
  if ((fields.description ?? "").trim().length < 40) errors.push("description_too_short");
  if (fields.category !== NEW_RELEASE_CATEGORY) errors.push("category_must_be_new_releases");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.date ?? "")) errors.push("invalid_date");
  if (fields.coverImage !== expectedCover) errors.push("unexpected_cover_image");
  if ((fields.coverAlt ?? "").trim().length < 20) errors.push("cover_alt_too_short");
  if (body.length < 600) errors.push("article_body_too_short");
  if (args.existingSlugs?.has(args.slug)) errors.push("duplicate_slug");

  for (const product of args.products) {
    if (!body.includes(`/products/${product.handle}`)) errors.push(`missing_product_link:${product.handle}`);
  }

  const imagePattern = /^!\[([^\]]+)\]\((\/images\/[^\s)]+)(?:\s+"[^"]*")?\)$/gm;
  const referencedImages: string[] = [];
  let imageMatch: RegExpExecArray | null;
  while ((imageMatch = imagePattern.exec(body))) {
    if (imageMatch[1].trim().length < 12) errors.push(`image_alt_too_short:${imageMatch[2]}`);
    referencedImages.push(imageMatch[2]);
  }

  if (/!\[[^\]]*\]\(https?:\/\//i.test(body)) errors.push("remote_image_not_allowed");
  if (/^#\s+/m.test(body)) errors.push("h1_not_supported");
  if (/^>\s+/m.test(body)) errors.push("blockquote_not_supported");
  if (/<(?:script|iframe|table|div|img)\b/i.test(body)) errors.push("html_not_supported");
  if (/^\|.*\|\s*$/m.test(body)) errors.push("markdown_table_not_supported");

  const expectedBodyImages = args.imageNames
    .filter((name) => !name.endsWith("-cover.avif"))
    .map((name) => `/images/blog/new-releases/${name}`);
  for (const imagePath of referencedImages) {
    if (!expectedBodyImages.includes(imagePath)) errors.push(`unexpected_body_image:${imagePath}`);
  }
  if (!referencedImages.length && expectedBodyImages.length) errors.push("missing_body_images");

  for (const [pattern, label] of UNSUPPORTED_CLAIM_PATTERNS) {
    if (pattern.test(body)) errors.push(`unsupported_claim:${label}`);
  }

  return [...new Set(errors)];
}

function countStatuses(ledger: ProductLedger) {
  const counts: Record<ProductLedgerStatus, number> = {
    baseline: 0,
    queued: 0,
    blocked: 0,
    prepared: 0,
    drafted: 0,
    promoted: 0,
    already_covered: 0,
  };
  for (const entry of Object.values(ledger.products)) counts[entry.status] += 1;
  return counts;
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
