import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("brand collection hero renders logos inside a fill-based display stage", () => {
  const pageSource = readFileSync("app/collections/[handle]/page.tsx", "utf8");
  const brandLogoBranch = pageSource.match(/\{subBrand \? \([\s\S]*?\) : collection\.image \?/);

  assert.ok(brandLogoBranch, "Expected a dedicated sub-brand logo branch in collection hero");
  assert.match(brandLogoBranch[0], /<div\s+className="relative[^"]*"/);
  assert.match(brandLogoBranch[0], /<Image[\s\S]*src=\{subBrand\.image\}[\s\S]*\sfill[\s\S]*object-contain/);
  assert.doesNotMatch(brandLogoBranch[0], /width=\{subBrand\.width\}|height=\{subBrand\.height\}/);
});
