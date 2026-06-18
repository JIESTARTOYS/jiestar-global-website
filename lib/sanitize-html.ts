const BLOCKED_CONTENT_TAGS = ["script", "style", "iframe", "object", "embed", "form", "input", "button", "textarea"];
const SHOPIFY_CDN_IMAGE_PREFIX = "https://cdn.shopify.com/";
const SHOPIFY_DETAIL_IMAGE_WIDTH = 960;
const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "br",
  "div",
  "em",
  "h2",
  "h3",
  "h4",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "span",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "ul",
]);
const VOID_TAGS = new Set(["br", "img"]);
const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(["href", "title"]),
  img: new Set(["alt", "decoding", "height", "loading", "src", "title", "width"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan"]),
};

function escapeAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isSafeUrl(value: string) {
  const normalized = value.replace(/[\u0000-\u001f\u007f\s]+/g, "").toLowerCase();

  return (
    normalized.startsWith("https://") ||
    normalized.startsWith("http://") ||
    normalized.startsWith("mailto:") ||
    normalized.startsWith("tel:") ||
    normalized.startsWith("/") ||
    normalized.startsWith("#")
  );
}

function getSlimShopifyImageUrl(value: string) {
  if (!value.startsWith(SHOPIFY_CDN_IMAGE_PREFIX)) {
    return value;
  }

  try {
    const url = new URL(value);
    url.searchParams.set("width", String(SHOPIFY_DETAIL_IMAGE_WIDTH));

    return url.toString();
  } catch {
    return value;
  }
}

function sanitizeAttributes(tagName: string, attributeText: string) {
  const allowedAttributes = ALLOWED_ATTRIBUTES[tagName];

  if (!allowedAttributes) {
    return "";
  }

  const attributes: Array<[string, string]> = [];
  const attributePattern = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match: RegExpExecArray | null;

  while ((match = attributePattern.exec(attributeText))) {
    const name = match[1].toLowerCase();
    let value = match[2] ?? match[3] ?? match[4] ?? "";

    if (!allowedAttributes.has(name) || name.startsWith("on")) {
      continue;
    }

    if ((name === "href" || name === "src") && !isSafeUrl(value)) {
      continue;
    }

    if (tagName === "img" && name === "src") {
      value = getSlimShopifyImageUrl(value);
    }

    attributes.push([name, value]);
  }

  if (tagName === "img") {
    if (!attributes.some(([name]) => name === "loading")) {
      attributes.push(["loading", "lazy"]);
    }

    if (!attributes.some(([name]) => name === "decoding")) {
      attributes.push(["decoding", "async"]);
    }
  }

  return attributes.length
    ? ` ${attributes.map(([name, value]) => `${name}="${escapeAttribute(value)}"`).join(" ")}`
    : "";
}

export function sanitizeShopifyHtml(html: string) {
  let sanitized = html;

  for (const tagName of BLOCKED_CONTENT_TAGS) {
    sanitized = sanitized.replace(new RegExp(`<${tagName}\\b[^>]*>[\\s\\S]*?<\\/${tagName}>`, "gi"), "");
    sanitized = sanitized.replace(new RegExp(`<${tagName}\\b[^>]*\\/?>`, "gi"), "");
  }

  return sanitized
    .replace(/<\s*(\/?)\s*([a-zA-Z][\w:-]*)([^>]*)>/g, (_match, slash: string, rawTagName: string, attributeText: string) => {
      const tagName = rawTagName.toLowerCase();

      if (!ALLOWED_TAGS.has(tagName)) {
        return "";
      }

      if (slash) {
        return VOID_TAGS.has(tagName) ? "" : `</${tagName}>`;
      }

      return `<${tagName}${sanitizeAttributes(tagName, attributeText)}>`;
    })
    .trim();
}
