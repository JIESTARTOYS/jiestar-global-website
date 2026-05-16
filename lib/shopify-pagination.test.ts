import assert from "node:assert/strict";
import test from "node:test";
import { readShopifyConnectionPages } from "./shopify-pagination.ts";

test("readShopifyConnectionPages follows cursors until the connection ends", async () => {
  const cursors: Array<string | undefined> = [];

  const nodes = await readShopifyConnectionPages(async (cursor) => {
    cursors.push(cursor);

    if (!cursor) {
      return {
        nodes: ["first-product"],
        hasNextPage: true,
        endCursor: "cursor-1",
      };
    }

    return {
      nodes: ["second-product"],
      hasNextPage: false,
      endCursor: null,
    };
  });

  assert.deepEqual(nodes, ["first-product", "second-product"]);
  assert.deepEqual(cursors, [undefined, "cursor-1"]);
});
