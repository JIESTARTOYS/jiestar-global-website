import assert from "node:assert/strict";
import test from "node:test";
import { permanentRedirects, robotsRules } from "./seo-routing.ts";

test("legacy index URLs have permanent redirects", () => {
  assert.deepEqual(permanentRedirects, [
    { source: "/Home", destination: "/", permanent: true },
    { source: "/collections/girl", destination: "/products", permanent: true },
  ]);
});

test("robots allows pure catalog pagination while blocking other query URLs", () => {
  assert.deepEqual(robotsRules.allow, ["/", "/products?page=*$", "/collections/*?page=*$"]);
  assert.ok(robotsRules.disallow.includes("/products?page=*&*"));
  assert.ok(robotsRules.disallow.includes("/collections/*?page=*&*"));
  assert.ok(robotsRules.disallow.includes("/*?*"));
  assert.ok(robotsRules.disallow.includes("/*?*&*"));
});
