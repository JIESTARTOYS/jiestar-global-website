const SHOPIFY_CUSTOMER_ACCOUNT_URL = process.env.SHOPIFY_CUSTOMER_ACCOUNT_URL;
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;

function cleanEnvValue(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed || undefined;
}

function normalizeStoreDomain(domain: string) {
  return domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

export function getCustomerAccountUrl() {
  const configuredUrl = cleanEnvValue(SHOPIFY_CUSTOMER_ACCOUNT_URL);

  if (configuredUrl) {
    return configuredUrl;
  }

  const storeDomain = cleanEnvValue(SHOPIFY_STORE_DOMAIN);

  if (!storeDomain) {
    return undefined;
  }

  return `https://${normalizeStoreDomain(storeDomain)}/account`;
}
