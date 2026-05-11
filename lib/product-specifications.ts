import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export type LocalProductSpecifications = {
  name: string;
  sku: string;
  handle: string;
  recommendedAge: string;
  series: string;
  releaseDate: string;
  pieceCount: string;
  packageSize: string;
  finishedSize: string;
};

const PRODUCT_CONTENT_DIR = path.join(
  process.cwd(),
  "content/products/first-batch-2026-05-08",
);

const FIELD_MAP: Record<string, keyof LocalProductSpecifications> = {
  "名称": "name",
  "sku": "sku",
  "建议年龄": "recommendedAge",
  "系列": "series",
  "发布日期": "releaseDate",
  "零件数": "pieceCount",
  "包装尺寸": "packageSize",
  "成品": "finishedSize",
};

let localProductSpecificationIndexes:
  | {
      bySku: Map<string, LocalProductSpecifications>;
      byHandle: Map<string, LocalProductSpecifications>;
      byTitle: Map<string, LocalProductSpecifications>;
    }
  | undefined;

function normalizeSku(sku: string) {
  return sku.trim().toUpperCase();
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripSkuPrefix(slug: string) {
  return slug.replace(/^(?:jj)?[0-9]{4,5}-/i, "");
}

function normalizeHandle(handle: string) {
  return slugify(handle).replace(/-\d+$/g, "");
}

function normalizeSpecValue(value: string, fallback: string) {
  const trimmed = value.trim();

  if (!trimmed || trimmed === "--") {
    return fallback;
  }

  return trimmed;
}

function readMarkdownFiles(directory: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return readMarkdownFiles(entryPath);
    }

    return entry.isFile() && entry.name.endsWith(".md") ? [entryPath] : [];
  });
}

function parseProductSpecFile(filePath: string): LocalProductSpecifications | undefined {
  const spec: Partial<LocalProductSpecifications> = {};
  const content = readFileSync(filePath, "utf8");
  const productDirectory = path.basename(path.dirname(filePath));
  const handle = stripSkuPrefix(productDirectory);

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^(\S+)\s+(.+)$/);

    if (!match) {
      continue;
    }

    const key = FIELD_MAP[match[1]];

    if (key) {
      spec[key] = match[2].trim();
    }
  }

  if (!spec.sku) {
    return undefined;
  }

  return {
    name: normalizeSpecValue(spec.name ?? "", "JIESTAR Building Block Set"),
    sku: spec.sku.trim(),
    handle,
    recommendedAge: normalizeSpecValue(spec.recommendedAge ?? "", "See product package"),
    series: normalizeSpecValue(spec.series ?? "", "Building Block Sets"),
    releaseDate: normalizeSpecValue(spec.releaseDate ?? "", "See product package"),
    pieceCount: normalizeSpecValue(spec.pieceCount ?? "", "See product package"),
    packageSize: normalizeSpecValue(spec.packageSize ?? "", "See product package"),
    finishedSize: normalizeSpecValue(spec.finishedSize ?? "", "Variable"),
  };
}

function getLocalProductSpecificationIndexes() {
  if (process.env.NODE_ENV === "development") {
    localProductSpecificationIndexes = undefined;
  }

  if (!localProductSpecificationIndexes) {
    localProductSpecificationIndexes = {
      bySku: new Map<string, LocalProductSpecifications>(),
      byHandle: new Map<string, LocalProductSpecifications>(),
      byTitle: new Map<string, LocalProductSpecifications>(),
    };

    for (const filePath of readMarkdownFiles(PRODUCT_CONTENT_DIR)) {
      const specs = parseProductSpecFile(filePath);

      if (!specs) {
        continue;
      }

      localProductSpecificationIndexes.bySku.set(normalizeSku(specs.sku), specs);
      localProductSpecificationIndexes.byHandle.set(normalizeHandle(specs.handle), specs);
      localProductSpecificationIndexes.byTitle.set(slugify(specs.name), specs);
    }
  }

  return localProductSpecificationIndexes;
}

export function getLocalProductSpecifications({
  sku,
  handle,
  title,
}: {
  sku?: string | null;
  handle?: string | null;
  title?: string | null;
}) {
  const indexes = getLocalProductSpecificationIndexes();

  if (sku) {
    const specs = indexes.bySku.get(normalizeSku(sku));

    if (specs) {
      return specs;
    }
  }

  if (handle) {
    const specs = indexes.byHandle.get(normalizeHandle(handle));

    if (specs) {
      return specs;
    }
  }

  if (title) {
    return indexes.byTitle.get(slugify(title));
  }

  return undefined;
}
