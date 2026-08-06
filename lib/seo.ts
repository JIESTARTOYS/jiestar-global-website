import type { Metadata } from "next";
import type { Product, ProductSummary } from "./data.ts";
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

type BrandCollectionJsonLdInput = {
  brandName: string;
  description: string;
  logo: string;
  brandPath: string;
  pagePath: string;
  products: ProductSummary[];
  positionOffset?: number;
};

const quoteOnlyPrices = new Set(["999", "999.00", "999.0"]);

export const retailShippingCountryCodes = ["US", "CA", "AU", "GB", "DE", "FR", "BE", "ES", "IT", "NL", "PL", "SE"] as const;

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
const organizationId = absoluteUrl("/#organization");
const shippingPolicyUrl = absoluteUrl("/policies/shipping-policy");
const shippingServiceId = `${shippingPolicyUrl}#standard-shipping`;
const returnPolicyUrl = absoluteUrl("/policies/refund-policy");
const returnPolicyId = `${returnPolicyUrl}#return-policy`;

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
    "@id": organizationId,
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

export function createShippingPolicyJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId,
    url: absoluteUrl("/"),
    hasShippingService: {
      "@type": "ShippingService",
      "@id": shippingServiceId,
      name: "JIESTAR Standard International Shipping",
      description:
        "Retail orders are processed in 1–3 business days. Delivery typically takes 7–16 calendar days after dispatch.",
      fulfillmentType: "https://schema.org/FulfillmentTypeDelivery",
      handlingTime: {
        "@type": "ServicePeriod",
        duration: {
          "@type": "QuantitativeValue",
          minValue: 1,
          maxValue: 3,
          unitCode: "DAY",
        },
        businessDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      },
      shippingConditions: {
        "@type": "ShippingConditions",
        shippingDestination: retailShippingCountryCodes.map((countryCode) => ({
          "@type": "DefinedRegion",
          addressCountry: countryCode,
        })),
        transitTime: {
          "@type": "ServicePeriod",
          duration: {
            "@type": "QuantitativeValue",
            minValue: 7,
            maxValue: 16,
            unitCode: "DAY",
          },
        },
      },
    },
  };
}

export function createMerchantReturnPolicyJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId,
    url: absoluteUrl("/"),
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      "@id": returnPolicyId,
      name: "JIESTAR Retail Return Policy",
      merchantReturnLink: returnPolicyUrl,
      applicableCountry: [...retailShippingCountryCodes],
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 14,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
      customerRemorseReturnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
      itemDefectReturnFees: "https://schema.org/FreeReturn",
    },
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
  dateModified?: string;
  image?: string;
  path: string;
};

export function createBlogPostingJsonLd({ title, description, datePublished, dateModified, image, path }: BlogPostingJsonLdInput) {
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

  if (dateModified) {
    schema.dateModified = dateModified;
  }

  if (image) {
    schema.image = absoluteUrl(image);
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

export function createBrandCollectionJsonLd({
  brandName,
  description,
  logo,
  brandPath,
  pagePath,
  products,
  positionOffset = 0,
}: BrandCollectionJsonLdInput) {
  const brandUrl = absoluteUrl(brandPath);
  const pageUrl = absoluteUrl(pagePath);

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${pageUrl}#collection`,
    name: brandName,
    description,
    url: pageUrl,
    publisher: {
      "@id": organizationId,
    },
    about: {
      "@type": "Brand",
      "@id": `${brandUrl}#brand`,
      name: brandName,
      url: brandUrl,
      logo: absoluteUrl(logo),
      description,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: positionOffset + index + 1,
        name: product.title,
        url: absoluteUrl(`/products/${product.handle}`),
      })),
    },
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
        itemCondition: "https://schema.org/NewCondition",
        shippingDetails: {
          "@type": "OfferShippingDetails",
          hasShippingService: {
            "@id": shippingServiceId,
          },
        },
        hasMerchantReturnPolicy: {
          "@id": returnPolicyId,
        },
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
