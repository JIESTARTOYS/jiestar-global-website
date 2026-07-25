export function applyShopifyCheckoutDomain(checkoutUrl: string, checkoutDomain?: string) {
  const domain = checkoutDomain?.trim();

  if (!domain) {
    return checkoutUrl;
  }

  try {
    const checkout = new URL(checkoutUrl);
    const target = new URL(domain.includes("://") ? domain : `https://${domain}`);

    if (
      target.protocol !== "https:" ||
      target.username ||
      target.password ||
      target.pathname !== "/" ||
      target.search ||
      target.hash
    ) {
      return checkoutUrl;
    }

    checkout.protocol = target.protocol;
    checkout.host = target.host;

    return checkout.toString();
  } catch {
    return checkoutUrl;
  }
}
