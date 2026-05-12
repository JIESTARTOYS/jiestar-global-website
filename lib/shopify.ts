import { collections, products, type Collection, type Product } from "./data";
import { getLocalProductSpecifications } from "./product-specifications";

const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2026-01";
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_STOREFRONT_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

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

async function shopifyFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!hasShopifyConfig()) {
    throw new Error("Shopify environment variables are not configured.");
  }

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
    throw new Error(`Shopify request failed with status ${response.status}`);
  }

  const json = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };

  if (json.errors?.length) {
    throw new Error(json.errors.map((error) => error.message).join(", "));
  }

  if (!json.data) {
    throw new Error("Shopify response did not include data.");
  }

  return json.data;
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
    return products;
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

    return data.products.edges.map(({ node }) => mapShopifyProduct(node));
  } catch {
    return products;
  }
}

export async function getShopifyCollections(): Promise<Collection[]> {
  if (!hasShopifyConfig()) {
    return collections;
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

    return data.collections.edges.map(({ node }) => mapShopifyCollection(node));
  } catch {
    return collections;
  }
}

export async function getShopifyProduct(handle: string): Promise<Product | undefined> {
  if (!hasShopifyConfig()) {
    return products.find((product) => product.handle === handle);
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

    return data.product ? mapShopifyProduct(data.product) : undefined;
  } catch (error) {
    const localProduct = products.find((product) => product.handle === handle);

    if (localProduct) {
      return localProduct;
    }

    const message = error instanceof Error ? error.message : "Shopify product request failed.";
    throw new ShopifyUnavailableError(message);
  }
}

export async function getShopifyCollection(
  handle: string,
): Promise<{ collection: Collection; products: Product[] } | undefined> {
  if (!hasShopifyConfig()) {
    return getLocalCollectionProducts(handle);
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
      return getLocalCollectionProducts(handle);
    }

    return {
      collection: mapShopifyCollection(data.collection),
      products: data.collection.products?.edges.map(({ node }) => mapShopifyProduct(node)) ?? [],
    };
  } catch {
    return getLocalCollectionProducts(handle);
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
