import { collections, products, type Collection, type Product } from "./data";
import { getLocalProductSpecifications } from "./product-specifications";

const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2026-01";
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_STOREFRONT_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const IS_DEVELOPMENT = process.env.NODE_ENV === "development";
const SHOPIFY_FETCH_ATTEMPTS = 3;
const SHOPIFY_RETRY_DELAY_MS = 500;

let cachedShopifyProducts: Product[] | undefined;
let cachedShopifyCollections: Collection[] | undefined;

type ShopifyMoney = {
  amount: string;
  currencyCode: string;
};

type ShopifyProductNode = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  createdAt: string;
  featuredImage?: {
    url: string;
    altText?: string | null;
  } | null;
  collections: {
    edges: Array<{
      node: {
        handle: string;
        title: string;
      };
    }>;
  };
  images: {
    edges: Array<{
      node: {
        url: string;
        altText?: string | null;
      };
    }>;
  };
  priceRange: {
    minVariantPrice: ShopifyMoney;
  };
  metafields: Array<{
    namespace: string;
    key: string;
    value: string;
  } | null>;
  variants: {
    edges: Array<{
      node: {
        id: string;
        sku?: string | null;
      };
    }>;
  };
};

type ShopifyProductsResponse = {
  products: {
    edges: Array<{
      node: ShopifyProductNode;
    }>;
  };
};

type ShopifyCollectionsResponse = {
  collections: {
    edges: Array<{
      node: ShopifyCollectionNode;
    }>;
  };
};

type ShopifyProductResponse = {
  product?: ShopifyProductNode | null;
};

type ShopifyCollectionNode = {
  id: string;
  handle: string;
  title: string;
  description: string;
  image?: {
    url: string;
    altText?: string | null;
  } | null;
  products?: {
    edges: Array<{
      node: ShopifyProductNode;
    }>;
  };
};

type ShopifyCollectionResponse = {
  collection?: ShopifyCollectionNode | null;
};

type ShopifyCartCreateResponse = {
  cartCreate: {
    cart?: {
      checkoutUrl: string;
    } | null;
    userErrors: Array<{ message: string }>;
  };
};

export class ShopifyUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShopifyUnavailableError";
  }
}

function hasShopifyConfig() {
  return Boolean(SHOPIFY_STORE_DOMAIN && SHOPIFY_STOREFRONT_ACCESS_TOKEN);
}

function getShopifyConfigState() {
  return {
    hasStoreDomain: Boolean(SHOPIFY_STORE_DOMAIN),
    hasStorefrontAccessToken: Boolean(SHOPIFY_STOREFRONT_ACCESS_TOKEN),
    hasApiVersion: Boolean(SHOPIFY_API_VERSION),
    apiVersion: SHOPIFY_API_VERSION,
    isVercel: Boolean(process.env.VERCEL),
    nodeEnv: process.env.NODE_ENV ?? "unknown",
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function logShopifyDataSource(
  operation: string,
  source: "shopify" | "cache" | "fallback" | "error",
  details?: Record<string, unknown>,
) {
  const payload = {
    operation,
    source,
    ...getShopifyConfigState(),
    ...details,
  };

  if (source === "shopify" || source === "cache") {
    console.info("[shopify:data-source]", payload);
    return;
  }

  console.warn("[shopify:data-source]", payload);
}

function getShopifyConfigError(operation: string) {
  const message = "Shopify environment variables are not configured.";

  logShopifyDataSource(operation, IS_DEVELOPMENT ? "fallback" : "error", {
    reason: "env_missing",
    message,
  });

  return new ShopifyUnavailableError(message);
}

function getShopifyRequestError(operation: string, error: unknown) {
  const message = getErrorMessage(error, "Shopify request failed.");

  logShopifyDataSource(operation, IS_DEVELOPMENT ? "fallback" : "error", {
    reason: "request_failed",
    message,
  });

  return new ShopifyUnavailableError(message);
}

function shouldUseLocalFallback() {
  return IS_DEVELOPMENT;
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetriableStatus(status: number) {
  return status === 429 || status >= 500;
}

async function shopifyFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!hasShopifyConfig()) {
    throw new Error("Shopify environment variables are not configured.");
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= SHOPIFY_FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(
        `https://${SHOPIFY_STORE_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? "",
          },
          body: JSON.stringify({ query, variables }),
          next: { revalidate: 300 },
        },
      );

      if (!response.ok) {
        const error = new Error(`Shopify request failed with status ${response.status}`);

        if (attempt < SHOPIFY_FETCH_ATTEMPTS && isRetriableStatus(response.status)) {
          lastError = error;
          await wait(SHOPIFY_RETRY_DELAY_MS * attempt);
          continue;
        }

        throw error;
      }

      const json = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };

      if (json.errors?.length) {
        throw new Error(json.errors.map((error) => error.message).join(", "));
      }

      if (!json.data) {
        throw new Error("Shopify response did not include data.");
      }

      return json.data;
    } catch (error) {
      lastError = error;

      if (attempt < SHOPIFY_FETCH_ATTEMPTS) {
        await wait(SHOPIFY_RETRY_DELAY_MS * attempt);
        continue;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Shopify request failed.");
}

function formatPrice(money: ShopifyMoney) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: money.currencyCode,
  }).format(Number(money.amount));
}

function getMetafieldValue(
  metafields: ShopifyProductNode["metafields"],
  namespace: string,
  key: string,
) {
  return metafields.find((metafield) => metafield?.namespace === namespace && metafield.key === key)?.value;
}

function formatPieceCount(value?: string) {
  if (!value) {
    return "See product package";
  }

  return value.toLowerCase().includes("pcs") ? value : `${value} pcs`;
}

function pickPrimaryCollection(node: ShopifyProductNode) {
  const shopifyCollections = node.collections.edges.map(({ node: collection }) => collection);
  const configuredCollection =
    shopifyCollections.find((collection) =>
      collections.some((localCollection) => localCollection.handle === collection.handle),
    ) ?? shopifyCollections[0];

  return configuredCollection;
}

function mapShopifyProduct(node: ShopifyProductNode): Product {
  const variant = node.variants.edges[0]?.node;
  const localSpecs = getLocalProductSpecifications({
    sku: variant?.sku,
    handle: node.handle,
    title: node.title,
  });
  const difficultyLevel = getMetafieldValue(node.metafields, "specs", "difficulty_level");
  const pieceCount = getMetafieldValue(node.metafields, "specs", "piece_count");
  const recommendedAge = getMetafieldValue(node.metafields, "specs", "recommended_age");
  const finishedSize = getMetafieldValue(node.metafields, "specs", "finished_model_size");
  const packageSize = getMetafieldValue(node.metafields, "specs", "package_size");
  const productImages = node.images.edges.map(({ node: image }) => ({
    src: image.url,
    alt: image.altText ?? `${node.title} product image`,
  }));
  const fallbackImage = {
    src:
      node.featuredImage?.url ??
      "https://images.unsplash.com/photo-1560961911-ba7ef651a56c?auto=format&fit=crop&w=1200&q=80",
    alt: node.featuredImage?.altText ?? `${node.title} product image`,
  };
  const images = productImages.length ? productImages : [fallbackImage];
  const primaryCollection = pickPrimaryCollection(node);

  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    category: primaryCollection?.title ?? localSpecs?.series ?? "Building Block Sets",
    collectionHandle: primaryCollection?.handle ?? "new-arrivals",
    price: formatPrice(node.priceRange.minVariantPrice),
    image: images[0].src,
    imageAlt: images[0].alt,
    images,
    description: node.description,
    descriptionHtml: node.descriptionHtml,
    sellingPoint: node.description.slice(0, 120) || "A JIESTAR building block set for global builders.",
    sku: variant?.sku ?? "Contact for SKU",
    variantId: variant?.id,
    pieceCount: formatPieceCount(pieceCount),
    recommendedAge: recommendedAge ?? "See product package",
    difficulty: difficultyLevel ?? "See product package",
    finishedSize: finishedSize ?? "See product package",
    packageSize: packageSize ?? "See product package",
    material: "ABS plastic",
    shipping: "Calculated at checkout.",
    series: localSpecs?.series,
    releaseDate: localSpecs?.releaseDate,
    createdAt: node.createdAt,
  };
}

function mapShopifyCollection(node: ShopifyCollectionNode): Collection {
  return {
    handle: node.handle,
    title: node.title,
    description: node.description || "Explore JIESTAR building block sets in this collection.",
    image: node.image?.url,
    imageAlt: node.image?.altText ?? `${node.title} collection`,
  };
}

function getLocalCollectionProducts(handle: string) {
  const collection = collections.find((item) => item.handle === handle);

  if (!collection) {
    return undefined;
  }

  return {
    collection,
    products: products.filter((product) => product.collectionHandle === handle),
  };
}

function getCachedCatalogCollection(handle: string) {
  if (!cachedShopifyCollections || !cachedShopifyProducts) {
    return undefined;
  }

  const collection = cachedShopifyCollections.find((item) => item.handle === handle);

  if (!collection) {
    return undefined;
  }

  return {
    collection,
    products: cachedShopifyProducts.filter((product) => product.collectionHandle === handle),
  };
}

function getCachedCatalogProduct(handle: string) {
  return cachedShopifyProducts?.find((product) => product.handle === handle);
}

const productFragment = `
  fragment ProductFields on Product {
    id
    handle
    title
    description
    descriptionHtml
    createdAt
    featuredImage {
      url
      altText
    }
    collections(first: 5) {
      edges {
        node {
          handle
          title
        }
      }
    }
    images(first: 12) {
      edges {
        node {
          url
          altText
        }
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    metafields(identifiers: [
      { namespace: "specs", key: "difficulty_level" }
      { namespace: "specs", key: "piece_count" }
      { namespace: "specs", key: "recommended_age" }
      { namespace: "specs", key: "finished_model_size" }
      { namespace: "specs", key: "package_size" }
    ]) {
      namespace
      key
      value
    }
    variants(first: 1) {
      edges {
        node {
          id
          sku
        }
      }
    }
  }
`;

const collectionSummaryFragment = `
  fragment CollectionSummaryFields on Collection {
    id
    handle
    title
    description
    image {
      url
      altText
    }
  }
`;

const collectionFragment = `
  fragment CollectionFields on Collection {
    ...CollectionSummaryFields
    products(first: 24) {
      edges {
        node {
          ...ProductFields
        }
      }
    }
  }
`;

export async function getShopifyProducts(): Promise<Product[]> {
  if (!hasShopifyConfig()) {
    const error = getShopifyConfigError("getShopifyProducts");

    if (shouldUseLocalFallback()) {
      return products;
    }

    throw error;
  }

  try {
    const data = await shopifyFetch<ShopifyProductsResponse>(
      `
        ${productFragment}
        query Products {
          products(first: 24) {
            edges {
              node {
                ...ProductFields
              }
            }
          }
        }
      `,
    );

    const shopifyProducts = data.products.edges.map(({ node }) => mapShopifyProduct(node));
    cachedShopifyProducts = shopifyProducts;
    logShopifyDataSource("getShopifyProducts", "shopify", { count: shopifyProducts.length });

    return shopifyProducts;
  } catch (error) {
    const shopifyError = getShopifyRequestError("getShopifyProducts", error);

    if (cachedShopifyProducts?.length) {
      logShopifyDataSource("getShopifyProducts", "cache", {
        count: cachedShopifyProducts.length,
        reason: "request_failed",
      });
      return cachedShopifyProducts;
    }

    if (shouldUseLocalFallback()) {
      return products;
    }

    throw shopifyError;
  }
}

export async function getShopifyCollections(): Promise<Collection[]> {
  if (!hasShopifyConfig()) {
    const error = getShopifyConfigError("getShopifyCollections");

    if (shouldUseLocalFallback()) {
      return collections;
    }

    throw error;
  }

  try {
    const data = await shopifyFetch<ShopifyCollectionsResponse>(
      `
        ${collectionSummaryFragment}
        query Collections {
          collections(first: 30) {
            edges {
              node {
                ...CollectionSummaryFields
              }
            }
          }
        }
      `,
    );

    const shopifyCollections = data.collections.edges.map(({ node }) => mapShopifyCollection(node));
    cachedShopifyCollections = shopifyCollections;
    logShopifyDataSource("getShopifyCollections", "shopify", { count: shopifyCollections.length });

    return shopifyCollections;
  } catch (error) {
    const shopifyError = getShopifyRequestError("getShopifyCollections", error);

    if (cachedShopifyCollections?.length) {
      logShopifyDataSource("getShopifyCollections", "cache", {
        count: cachedShopifyCollections.length,
        reason: "request_failed",
      });
      return cachedShopifyCollections;
    }

    if (shouldUseLocalFallback()) {
      return collections;
    }

    throw shopifyError;
  }
}

export async function getShopifyProduct(handle: string): Promise<Product | undefined> {
  if (!hasShopifyConfig()) {
    const error = getShopifyConfigError("getShopifyProduct");

    if (shouldUseLocalFallback()) {
      return products.find((product) => product.handle === handle);
    }

    throw error;
  }

  const cachedProduct = getCachedCatalogProduct(handle);

  if (cachedProduct) {
    logShopifyDataSource("getShopifyProduct", "cache", {
      found: true,
      handle,
      reason: "memory_catalog",
    });

    return cachedProduct;
  }

  try {
    const data = await shopifyFetch<ShopifyProductResponse>(
      `
        ${productFragment}
        query Product($handle: String!) {
          product(handle: $handle) {
            ...ProductFields
          }
        }
      `,
      { handle },
    );

    const product = data.product ? mapShopifyProduct(data.product) : undefined;
    logShopifyDataSource("getShopifyProduct", "shopify", {
      found: Boolean(product),
      handle,
    });

    return product;
  } catch (error) {
    const localProduct = products.find((product) => product.handle === handle);

    const shopifyError = getShopifyRequestError("getShopifyProduct", error);

    if (shouldUseLocalFallback() && localProduct) {
      return localProduct;
    }

    throw shopifyError;
  }
}

export async function getShopifyCollection(
  handle: string,
): Promise<{ collection: Collection; products: Product[] } | undefined> {
  if (!hasShopifyConfig()) {
    const error = getShopifyConfigError("getShopifyCollection");

    if (shouldUseLocalFallback()) {
      return getLocalCollectionProducts(handle);
    }

    throw error;
  }

  const cachedCatalogCollection = getCachedCatalogCollection(handle);

  if (cachedCatalogCollection) {
    logShopifyDataSource("getShopifyCollection", "cache", {
      found: true,
      handle,
      productCount: cachedCatalogCollection.products.length,
      reason: "memory_catalog",
    });

    return cachedCatalogCollection;
  }

  try {
    const [shopifyCollections, shopifyProducts] = await Promise.all([
      getShopifyCollections(),
      getShopifyProducts(),
    ]);
    const collection = shopifyCollections.find((item) => item.handle === handle);

    if (collection) {
      const collectionProducts = shopifyProducts.filter((product) => product.collectionHandle === handle);
      logShopifyDataSource("getShopifyCollection", "cache", {
        found: true,
        handle,
        productCount: collectionProducts.length,
        reason: "catalog_data",
      });

      return {
        collection,
        products: collectionProducts,
      };
    }
  } catch {
    // Fall through to the direct collection query below.
  }

  try {
    const data = await shopifyFetch<ShopifyCollectionResponse>(
      `
        ${productFragment}
        ${collectionSummaryFragment}
        ${collectionFragment}
        query Collection($handle: String!) {
          collection(handle: $handle) {
            ...CollectionFields
          }
        }
      `,
      { handle },
    );

    if (!data.collection) {
      logShopifyDataSource("getShopifyCollection", "shopify", { found: false, handle });
      return shouldUseLocalFallback() ? getLocalCollectionProducts(handle) : undefined;
    }

    const collectionProducts = data.collection.products?.edges.map(({ node }) => mapShopifyProduct(node)) ?? [];
    logShopifyDataSource("getShopifyCollection", "shopify", {
      found: true,
      handle,
      productCount: collectionProducts.length,
    });

    return {
      collection: mapShopifyCollection(data.collection),
      products: collectionProducts,
    };
  } catch (error) {
    const shopifyError = getShopifyRequestError("getShopifyCollection", error);

    if (shouldUseLocalFallback()) {
      const localCollectionProducts = getLocalCollectionProducts(handle);

      if (localCollectionProducts) {
        return localCollectionProducts;
      }
    }

    throw shopifyError;
  }
}

export async function createCheckoutUrl(variantId: string) {
  const data = await shopifyFetch<ShopifyCartCreateResponse>(
    `
      mutation CartCreate($lines: [CartLineInput!]!) {
        cartCreate(input: { lines: $lines }) {
          cart {
            checkoutUrl
          }
          userErrors {
            message
          }
        }
      }
    `,
    {
      lines: [{ merchandiseId: variantId, quantity: 1 }],
    },
  );

  const error = data.cartCreate.userErrors[0];
  if (error) {
    throw new Error(error.message);
  }

  return data.cartCreate.cart?.checkoutUrl;
}
