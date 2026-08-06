import assert from "node:assert/strict";
import test from "node:test";
import { excludeUsWarehouseCollection, isUsWarehouseEligible } from "./us-warehouse.ts";

test("U.S. warehouse eligibility follows collection membership", () => {
  assert.equal(isUsWarehouseEligible([{ handle: "cars" }, { handle: "us-warehouse" }]), true);
  assert.equal(isUsWarehouseEligible([{ handle: "cars" }]), false);
});

test("the U.S. warehouse collection cannot replace the product's primary category", () => {
  assert.deepEqual(
    excludeUsWarehouseCollection([
      { handle: "us-warehouse", title: "U.S. Warehouse" },
      { handle: "cars", title: "Cars" },
    ]),
    [{ handle: "cars", title: "Cars" }],
  );
});

test("empty collection membership is not eligible", () => {
  assert.equal(isUsWarehouseEligible([]), false);
});
