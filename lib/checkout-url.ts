export function rewriteCheckoutUrl(checkoutUrl: string, checkoutDomain?: string) {
  const domain = checkoutDomain?.trim();

  if (!domain) {
    return checkoutUrl;
  }

  try {
    const checkout = new URL(checkoutUrl);
    const configuredDomain = new URL(domain.includes("://") ? domain : `https://${domain}`);

    if (configuredDomain.protocol !== "https:" || !configuredDomain.hostname) {
      return checkoutUrl;
    }

    checkout.protocol = "https:";
    checkout.host = configuredDomain.host;

    return checkout.toString();
  } catch {
    return checkoutUrl;
  }
}
