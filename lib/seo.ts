import type { Metadata } from "next";
import type { Product } from "./data.ts";
import { siteConfig } from "./data.ts";

type SeoInput = {
  title: string;
  description: string;
  path?: string;
  image?: string;
};

type BreadcrumbItem = {
  name: string;
  path: string;
};

type ProductJsonLdOptions = {
  description: string;
  path: string;
};

const quoteOnlyPrices = new Set(["999", "999.00", "999.0"]);

function siteUrl() {
  return siteConfig.url.replace(/\/$/, "");
}

export function absoluteUrl(path = "") {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (!path || path === "/") {
    return `${siteUrl()}/`;
  }

  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

const defaultOgImagePath = "/images/brand/jiestar-logo-color.png";

export function createMetadata({ title, description, path = "", image }: SeoInput): Metadata {
  const canonical = absoluteUrl(path);

  return {
    // Absolute title: page titles already include the brand, so the root
    // layout title template must not append another "| JIESTAR Toys" suffix.
    title: { absolute: title },
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: siteConfig.name,
      type: "website",
      images: [{ url: absoluteUrl(image ?? defaultOgImagePath) }],
    },
  };
}

export function isPlaceholderPrice(price: string) {
  const normalized = price.replace(/[^\d.]/g, "").replace(/\.0+$/, "");

  return quoteOnlyPrices.has(normalized) || quoteOnlyPrices.has(price.trim());
}

export function getDisplayPrice(price: string) {
  if (isPlaceholderPrice(price)) {
    return {
      label: "Request Quote",
      caption: "Wholesale pricing available after inquiry",
      isQuoteOnly: true,
    };
  }

  return {
    label: price,
    caption: "Secure checkout available for direct purchase",
    isQuoteOnly: false,
  };
}

export function createOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "JIESTAR",
    alternateName: [
      "Jie Star",
      "JIE-STAR",
      "JIESTAR Toys",
      "Guangdong Jiexing Toys",
      "Guangdong Jiexing Toys Industrial Co., Ltd.",
    ],
    legalName: "Guangdong Jiexing Toys Industrial Co., Ltd.",
    url: absoluteUrl("/"),
    logo: absoluteUrl("/images/brand/jiestar-logo-color.png"),
    description:
      "JIESTAR is an official building block brand supporting building block sets, wholesale supply, OEM/ODM customization, packaging, and long-term product partnerships.",
  };
}

export function createWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    alternateName: ["JIESTAR", "Jie Star", "JIE-STAR"],
    url: absoluteUrl("/"),
  };
}

type BlogPostingJsonLdInput = {
  title: string;
  description: string;
  datePublished?: string;
  path: string;
};

export function createBlogPostingJsonLd({ title, description, datePublished, path }: BlogPostingJsonLdInput) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    url: absoluteUrl(path),
    mainEntityOfPage: absoluteUrl(path),
    author: {
      "@type": "Organization",
      name: "JIESTAR",
    },
    publisher: {
      "@type": "Organization",
      name: "JIESTAR",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(defaultOgImagePath),
      },
    },
  };

  if (datePublished) {
    schema.datePublished = datePublished;
  }

  return schema;
}

export function createBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function createProductJsonLd(product: Product, options: ProductJsonLdOptions) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    sku: product.sku,
    image: (product.images?.length ? product.images : [{ src: product.image }]).map((image) => absoluteUrl(image.src)),
    description: options.description,
    brand: {
      "@type": "Brand",
      name: "JIESTAR",
    },
  };

  if (!isPlaceholderPrice(product.price)) {
    const price = product.price.replace(/[^\d.]/g, "");

    if (price) {
      schema.offers = {
        "@type": "Offer",
        url: absoluteUrl(options.path),
        priceCurrency: "USD",
        price,
        availability: "https://schema.org/InStock",
      };
    }
  }

  return schema;
}

function categoryDirection(category: string) {
  const normalized = category.toLowerCase();

  if (normalized.includes("train")) {
    return "train model and railway-themed display category";
  }

  if (normalized.includes("flower") || normalized.includes("botanical")) {
    return "botanical display, home decor, and giftable product line";
  }

  if (normalized.includes("architecture") || normalized.includes("building") || normalized.includes("street")) {
    return "architecture and street-scene display model category";
  }

  if (normalized.includes("technic") || normalized.includes("engineering")) {
    return "mechanical-style model and advanced building experience";
  }

  if (normalized.includes("space") || normalized.includes("aircraft") || normalized.includes("ship")) {
    return "themed display model for gift and collector markets";
  }

  if (normalized.includes("mecha") || normalized.includes("robot")) {
    return "action-style display model and e-commerce-friendly category";
  }

  if (normalized.includes("vehicle") || normalized.includes("car")) {
    return "display vehicle model, collector-friendly, and giftable product direction";
  }

  return "retail, display, gift, and collector markets";
}

export function getProductSeoDescription(product: Product) {
  const pieceText = product.pieceCount ? ` The set includes ${product.pieceCount} pieces` : "";
  const categoryText = product.category ? ` and can be presented as part of a broader ${product.category} building block product line` : "";

  return `${product.title} is a JIESTAR building block set designed for ${categoryDirection(product.category)} buyers, collectors, gift shoppers, and retail product planning.${pieceText}${categoryText}. For B2B buyers, this product direction can be discussed for wholesale supply, catalog selection, packaging planning, or related custom cooperation. Please contact JIESTAR for wholesale catalog information, MOQ discussion, and shipping options.`;
}

export function getProductHighlights(product: Product) {
  const direction = categoryDirection(product.category);

  return [
    `JIESTAR ${direction}`,
    "Suitable for retail, display, gift, or collector markets",
    "Wholesale catalog and MOQ discussion available",
    "Packaging and product line planning can be discussed for B2B buyers",
    "Missing-piece support can be discussed with order details",
  ];
}

export function createJsonLdScript(schema: object | object[]) {
  return {
    __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
  };
}
