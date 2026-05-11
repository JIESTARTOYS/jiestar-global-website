import { products, type Product } from "./data";
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
  featuredImage?: {
    url: string;
    altText?: string | null;
  } | null;
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

type ShopifyProductResponse = {
  product?: ShopifyProductNode | null;
};

type ShopifyCartCreateResponse = {
  cartCreate: {
    cart?: {
      checkoutUrl: string;
    } | null;
    userErrors: Array<{ message: string }>;
  };
};

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

function mapShopifyProduct(node: ShopifyProductNode): Product {
  const variant = node.variants.edges[0]?.node;
  const localSpecs = getLocalProductSpecifications({
    sku: variant?.sku,
    handle: node.handle,
    title: node.title,
  });
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

  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    category: localSpecs?.series ?? "Building Block Sets",
    collectionHandle: "new-arrivals",
    price: formatPrice(node.priceRange.minVariantPrice),
    image: images[0].src,
    imageAlt: images[0].alt,
    images,
    description: node.description,
    descriptionHtml: node.descriptionHtml,
    sellingPoint: node.description.slice(0, 120) || "A JIESTAR building block set for global builders.",
    sku: variant?.sku ?? "Contact for SKU",
    variantId: variant?.id,
    pieceCount: localSpecs?.pieceCount ?? "See product package",
    recommendedAge: localSpecs?.recommendedAge ?? "See product package",
    difficulty: "See product package",
    finishedSize: localSpecs?.finishedSize ?? "See product package",
    packageSize: localSpecs?.packageSize ?? "See product package",
    material: "ABS plastic",
    shipping: "Ships through Shopify checkout based on destination.",
    series: localSpecs?.series,
    releaseDate: localSpecs?.releaseDate,
  };
}

const productFragment = `
  fragment ProductFields on Product {
    id
    handle
    title
    description
    descriptionHtml
    featuredImage {
      url
      altText
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

export async function getShopifyProducts(): Promise<Product[]> {
  if (!hasShopifyConfig()) {
    return products;
  }

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
}

export async function getShopifyProduct(handle: string): Promise<Product | undefined> {
  if (!hasShopifyConfig()) {
    return products.find((product) => product.handle === handle);
  }

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
