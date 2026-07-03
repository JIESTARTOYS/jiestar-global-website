#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any


OUT_DIR = Path("/private/tmp/jiestar-shopify-active-health-fix")
API_VERSION_FALLBACK = "2026-01"
INTERLOCKING_BLOCKS_ID = "gid://shopify/TaxonomyCategory/tg-5-7-12"
VENDOR = "JieStar"

SKU_FIX_BY_HANDLE = {
    "music-club-1": "57029",
    "steam-train-1": "JJ9245",
}


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


class ShopifyAdmin:
    def __init__(self) -> None:
        load_dotenv(Path(".env.local"))
        self.domain = os.environ.get("SHOPIFY_STORE_DOMAIN", "").strip()
        self.version = os.environ.get("SHOPIFY_API_VERSION", API_VERSION_FALLBACK).strip() or API_VERSION_FALLBACK
        self.token = os.environ.get("SHOPIFY_ADMIN_ACCESS_TOKEN", "").strip()
        if not self.domain:
            raise RuntimeError("Missing SHOPIFY_STORE_DOMAIN in .env.local")
        if not self.token:
            raise RuntimeError("Missing SHOPIFY_ADMIN_ACCESS_TOKEN in .env.local")
        self.endpoint = f"https://{self.domain}/admin/api/{self.version}/graphql.json"

    def graphql(self, query: str, variables: dict[str, Any] | None = None) -> dict[str, Any]:
        request = urllib.request.Request(
            self.endpoint,
            data=json.dumps({"query": query, "variables": variables or {}}).encode("utf-8"),
            method="POST",
            headers={"Content-Type": "application/json", "X-Shopify-Access-Token": self.token},
        )
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            body = error.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"Shopify HTTP {error.code}: {body[:1200]}") from error
        if payload.get("errors"):
            raise RuntimeError(f"Shopify GraphQL errors: {json.dumps(payload['errors'], ensure_ascii=False)}")
        return payload["data"]

    def products(self) -> list[dict[str, Any]]:
        query = """
        query ActiveProductsForFix($cursor: String) {
          products(first: 100, after: $cursor, query: "status:active", sortKey: TITLE) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              handle
              title
              vendor
              category {
                id
                fullName
              }
              media(first: 100, sortKey: POSITION) {
                nodes {
                  id
                  alt
                  mediaContentType
                }
              }
              variants(first: 100) {
                nodes {
                  id
                  title
                  sku
                  price
                  image {
                    id
                    url
                  }
                  media(first: 10) {
                    nodes {
                      id
                    }
                  }
                  inventoryItem {
                    tracked
                  }
                }
              }
              metafields(first: 100, namespace: "specs") {
                nodes {
                  namespace
                  key
                  value
                  type
                }
              }
            }
          }
        }
        """
        products: list[dict[str, Any]] = []
        cursor = None
        while True:
            data = self.graphql(query, {"cursor": cursor})
            page = data["products"]
            products.extend(page["nodes"])
            if not page["pageInfo"]["hasNextPage"]:
                break
            cursor = page["pageInfo"]["endCursor"]
        return products

    def product_update(self, product_input: dict[str, Any]) -> list[dict[str, Any]]:
        data = self.graphql(
            """
            mutation ProductUpdate($product: ProductUpdateInput!) {
              productUpdate(product: $product) {
                product {
                  id
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """,
            {"product": product_input},
        )
        return data["productUpdate"]["userErrors"]

    def variants_bulk_update(self, product_id: str, variants: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not variants:
            return []
        data = self.graphql(
            """
            mutation ProductVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
              productVariantsBulkUpdate(productId: $productId, variants: $variants, allowPartialUpdates: true) {
                product {
                  id
                }
                productVariants {
                  id
                  sku
                  price
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """,
            {"productId": product_id, "variants": variants},
        )
        return data["productVariantsBulkUpdate"]["userErrors"]

    def append_variant_media(self, product_id: str, variant_media: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not variant_media:
            return []
        data = self.graphql(
            """
            mutation ProductVariantAppendMedia($productId: ID!, $variantMedia: [ProductVariantAppendMediaInput!]!) {
              productVariantAppendMedia(productId: $productId, variantMedia: $variantMedia) {
                product {
                  id
                }
                productVariants {
                  id
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """,
            {"productId": product_id, "variantMedia": variant_media},
        )
        return [
            error
            for error in data["productVariantAppendMedia"]["userErrors"]
            if error.get("message") != "The given variant already has attached media."
        ]


def metafields_by_key(product: dict[str, Any]) -> dict[str, str]:
    return {item["key"]: item.get("value", "") for item in product.get("metafields", {}).get("nodes", [])}


def preferred_media_by_sku(product: dict[str, Any]) -> dict[str, str]:
    output: dict[str, str] = {}
    media_nodes = product.get("media", {}).get("nodes", [])
    for media in media_nodes:
        alt = media.get("alt") or ""
        match = re.search(r"SKU image - ([A-Z]*\d{4,6})(?:-sku)?\.", alt, re.I)
        if match:
            output[match.group(1).upper()] = media["id"]
    return output


def fallback_media_id(product: dict[str, Any]) -> str:
    media_nodes = [m for m in product.get("media", {}).get("nodes", []) if m.get("mediaContentType") == "IMAGE"]
    if not media_nodes:
        return ""
    white = next((m for m in media_nodes if "白底" in (m.get("alt") or "")), None)
    return (white or media_nodes[0])["id"]


def build_plan(products: list[dict[str, Any]]) -> list[dict[str, Any]]:
    plan: list[dict[str, Any]] = []
    for product in products:
        product_updates: dict[str, Any] = {"id": product["id"]}
        product_reasons: list[str] = []

        if product.get("vendor") != VENDOR:
            product_updates["vendor"] = VENDOR
            product_reasons.append("vendor")

        if (product.get("category") or {}).get("id") != INTERLOCKING_BLOCKS_ID:
            product_updates["category"] = INTERLOCKING_BLOCKS_ID
            product_reasons.append("category")

        variant_updates = []
        for variant in product["variants"]["nodes"]:
            update = {"id": variant["id"]}
            reasons = []

            fixed_sku = SKU_FIX_BY_HANDLE.get(product["handle"])
            if fixed_sku and not (variant.get("sku") or "").strip():
                update["inventoryItem"] = {"sku": fixed_sku}
                reasons.append("sku")

            if reasons:
                variant_updates.append({"input": update, "reasons": reasons, "sku": fixed_sku or variant.get("sku") or ""})

        media_by_sku = preferred_media_by_sku(product)
        fallback_id = fallback_media_id(product)
        variant_media = []
        for variant in product["variants"]["nodes"]:
            existing_media = variant.get("image") or (variant.get("media", {}).get("nodes") or [])
            if existing_media:
                continue
            if len(product["variants"]["nodes"]) <= 1:
                continue
            sku = (variant.get("sku") or "").upper()
            media_id = media_by_sku.get(sku) or fallback_id
            if media_id:
                variant_media.append({"variantId": variant["id"], "mediaIds": [media_id], "sku": sku})

        fields = metafields_by_key(product)
        metafields = []
        if "package_size" not in fields or not fields["package_size"]:
            metafields.append(
                {
                    "namespace": "specs",
                    "key": "package_size",
                    "type": "single_line_text_field",
                    "value": "See product package",
                }
            )
        if "recommended_age" not in fields or not fields["recommended_age"]:
            metafields.append(
                {
                    "namespace": "specs",
                    "key": "recommended_age",
                    "type": "single_line_text_field",
                    "value": "See product package",
                }
            )

        if metafields:
            product_updates["metafields"] = metafields
            product_reasons.append("metafields_text_fallback")

        if product_reasons or variant_updates or variant_media:
            plan.append(
                {
                    "product_id": product["id"],
                    "handle": product["handle"],
                    "title": product["title"],
                    "product_updates": product_updates if product_reasons else {},
                    "product_reasons": "|".join(product_reasons),
                    "variant_updates": variant_updates,
                    "variant_media": variant_media,
                }
            )
    return plan


def write_plan(plan: list[dict[str, Any]], path: Path) -> None:
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(
            file,
            fieldnames=[
                "handle",
                "title",
                "product_reasons",
                "variant_update_count",
                "variant_media_count",
                "variant_updates",
                "variant_media_skus",
            ],
        )
        writer.writeheader()
        for item in plan:
            writer.writerow(
                {
                    "handle": item["handle"],
                    "title": item["title"],
                    "product_reasons": item["product_reasons"],
                    "variant_update_count": len(item["variant_updates"]),
                    "variant_media_count": len(item["variant_media"]),
                    "variant_updates": json.dumps(item["variant_updates"], ensure_ascii=False),
                    "variant_media_skus": "|".join(row["sku"] for row in item["variant_media"]),
                }
            )


def apply_plan(admin: ShopifyAdmin, plan: list[dict[str, Any]]) -> list[dict[str, Any]]:
    results = []
    for item in plan:
        product_errors = []
        variant_errors = []
        media_errors = []

        if item["product_updates"]:
            product_errors = admin.product_update(item["product_updates"])

        variant_inputs = [row["input"] for row in item["variant_updates"]]
        if variant_inputs:
            variant_errors = admin.variants_bulk_update(item["product_id"], variant_inputs)

        variant_media_inputs = [{k: v for k, v in row.items() if k != "sku"} for row in item["variant_media"]]
        if variant_media_inputs:
            media_errors = admin.append_variant_media(item["product_id"], variant_media_inputs)

        results.append(
            {
                "handle": item["handle"],
                "title": item["title"],
                "product_reasons": item["product_reasons"],
                "variant_update_count": len(item["variant_updates"]),
                "variant_media_count": len(item["variant_media"]),
                "product_errors": product_errors,
                "variant_errors": variant_errors,
                "media_errors": media_errors,
                "ok": not product_errors and not variant_errors and not media_errors,
            }
        )
    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="Fix deterministic active Shopify product health issues.")
    parser.add_argument("--apply", action="store_true", help="Apply the fix plan to Shopify.")
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    admin = ShopifyAdmin()
    products = admin.products()
    plan = build_plan(products)
    write_plan(plan, OUT_DIR / "active-health-fix-plan.csv")
    (OUT_DIR / "active-health-fix-plan.json").write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")

    summary: dict[str, Any] = {
        "products_seen": len(products),
        "products_in_plan": len(plan),
        "product_update_count": sum(1 for item in plan if item["product_updates"]),
        "variant_update_count": sum(len(item["variant_updates"]) for item in plan),
        "variant_media_count": sum(len(item["variant_media"]) for item in plan),
        "applied": args.apply,
    }

    if args.apply:
        results = apply_plan(admin, plan)
        (OUT_DIR / "active-health-fix-result.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
        summary["ok_count"] = sum(1 for item in results if item["ok"])
        summary["error_count"] = sum(1 for item in results if not item["ok"])

    (OUT_DIR / "active-health-fix-summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(1)
