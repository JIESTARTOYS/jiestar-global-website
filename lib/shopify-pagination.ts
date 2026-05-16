type ShopifyPage<T> = {
  nodes: T[];
  hasNextPage: boolean;
  endCursor?: string | null;
};

export async function readShopifyConnectionPages<T>(
  fetchPage: (cursor?: string) => Promise<ShopifyPage<T>>,
) {
  const nodes: T[] = [];
  let cursor: string | undefined;
  let hasNextPage = true;

  while (hasNextPage) {
    const page = await fetchPage(cursor);

    nodes.push(...page.nodes);
    hasNextPage = page.hasNextPage;
    cursor = page.endCursor ?? undefined;
  }

  return nodes;
}
