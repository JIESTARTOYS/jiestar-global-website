#!/usr/bin/env python3
from __future__ import annotations

import csv
import html
import json
import os
import re
import sys
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


OUT_DIR = Path("/private/tmp/jiestar-shopify-active-health")
API_VERSION_FALLBACK = "2026-01"
EXPECTED_VENDOR = "JieStar"
EXPECTED_PRICE = "999.00"
INTERLOCKING_BLOCKS_ID = "gid://shopify/TaxonomyCategory/tg-5-7-12"

SENSITIVE_TITLE_TERMS = [
    "hogwarts",
    "harry potter",
    "diagon alley",
    "mclaren",
    "lamborghini",
    "ferrari",
    "porsche",
    "bugatti",
    "koenigsegg",
    "land rover",
    "defender",
    "ford",
    "mustang",
    "shelby",
    "disney",
    "marvel",
    "spider-man",
    "spiderman",
    "batman",
    "star wars",
    "millennium falcon",
    "transformers",
    "ultraman",
    "sherlock",
]


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def urlopen_with_retries(request: urllib.request.Request, timeout: int = 90) -> Any:
    last_error: Exception | None = None
    for _ in range(4):
        try:
            return urllib.request.urlopen(request, timeout=timeout)
        except (TimeoutError, urllib.error.URLError) as error:
            last_error = error
    raise RuntimeError(f"Request failed after retries: {last_error}")


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
            with urlopen_with_retries(request, timeout=120) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            body = error.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"Shopify HTTP {error.code}: {body[:1200]}") from error
        if payload.get("errors"):
            raise RuntimeError(f"Shopify GraphQL errors: {json.dumps(payload['errors'], ensure_ascii=False)}")
        return payload["data"]


def strip_html(value: str) -> str:
    value = re.sub(r"<(script|style).*?</\1>", "", value or "", flags=re.I | re.S)
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def has_chinese(value: str) -> bool:
    return bool(re.search(r"[\u4e00-\u9fff]", value or ""))


def core_metafields(node: dict[str, Any]) -> dict[str, str]:
    fields: dict[str, str] = {}
    for item in node.get("metafields", {}).get("nodes", []):
        namespace = item.get("namespace") or ""
        key = item.get("key") or ""
        if namespace == "specs":
            fields[key] = item.get("value") or ""
    return fields


def fetch_active_products(admin: ShopifyAdmin) -> list[dict[str, Any]]:
    query = """
    query ActiveProductHealth($cursor: String) {
      products(first: 250, after: $cursor, query: "status:active", sortKey: TITLE) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          handle
          title
          status
          vendor
          productType
          descriptionHtml
          onlineStoreUrl
          category {
            id
            name
            fullName
          }
          featuredMedia {
            mediaContentType
            ... on MediaImage {
              id
              image {
                url
                altText
              }
            }
          }
          media(first: 100) {
            nodes {
              mediaContentType
              ... on MediaImage {
                id
                image {
                  url
                  altText
                }
              }
            }
          }
          variants(first: 100) {
            nodes {
              id
              title
              sku
              price
              inventoryItem {
                tracked
              }
              image {
                url
              }
            }
          }
          resourcePublications(first: 20) {
            nodes {
              isPublished
              publication {
                id
                name
              }
            }
          }
          metafields(first: 100) {
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
        data = admin.graphql(query, {"cursor": cursor})
        page = data["products"]
        products.extend(page["nodes"])
        if not page["pageInfo"]["hasNextPage"]:
            break
        cursor = page["pageInfo"]["endCursor"]
    return products


def add_issue(
    issues: list[dict[str, str]],
    product: dict[str, Any],
    severity: str,
    issue: str,
    detail: str,
) -> None:
    issues.append(
        {
            "severity": severity,
            "issue": issue,
            "handle": product.get("handle") or "",
            "title": product.get("title") or "",
            "product_id": product.get("id") or "",
            "detail": detail,
        }
    )


def audit_products(products: list[dict[str, Any]]) -> tuple[list[dict[str, str]], dict[str, Any]]:
    issues: list[dict[str, str]] = []
    sku_to_products: dict[str, list[dict[str, str]]] = defaultdict(list)
    title_norm_to_products: dict[str, list[dict[str, str]]] = defaultdict(list)

    for product in products:
        title = product.get("title") or ""
        handle = product.get("handle") or ""
        variants = product.get("variants", {}).get("nodes", [])
        media = product.get("media", {}).get("nodes", [])
        image_media = [item for item in media if item.get("mediaContentType") == "IMAGE"]
        description = product.get("descriptionHtml") or ""
        description_text = strip_html(description)
        metafields = core_metafields(product)
        category = product.get("category") or {}
        publications = product.get("resourcePublications", {}).get("nodes", [])
        published_names = [p.get("publication", {}).get("name", "") for p in publications if p.get("isPublished")]

        if product.get("vendor") != EXPECTED_VENDOR:
            add_issue(issues, product, "warning", "vendor_not_jiestar", product.get("vendor") or "")

        if has_chinese(title):
            add_issue(issues, product, "critical", "title_contains_chinese", title)

        lowered_title = title.lower()
        hits = [term for term in SENSITIVE_TITLE_TERMS if term in lowered_title]
        if hits:
            add_issue(issues, product, "critical", "title_sensitive_term", ", ".join(hits))

        if "building block set" in lowered_title:
            add_issue(issues, product, "warning", "title_still_mechanical", "contains Building Block Set")

        if not image_media:
            add_issue(issues, product, "critical", "missing_product_media", "no image media")

        if not product.get("featuredMedia"):
            add_issue(issues, product, "critical", "missing_featured_media", "no featured media")

        if not published_names:
            add_issue(issues, product, "critical", "not_published_to_channel", "no published sales channel found")

        if category.get("id") != INTERLOCKING_BLOCKS_ID:
            detail = category.get("fullName") or category.get("name") or "missing"
            add_issue(issues, product, "warning", "category_not_interlocking_blocks", detail)

        if "<img" not in description.lower():
            add_issue(issues, product, "warning", "description_missing_detail_image", "description has no image tag")

        if description_text:
            add_issue(issues, product, "warning", "description_has_non_image_text", description_text[:260])

        for key in ["piece_count", "recommended_age", "finished_model_size", "package_size"]:
            value = metafields.get(key, "")
            if not value:
                add_issue(issues, product, "warning", f"missing_metafield_{key}", "")
            elif has_chinese(value):
                add_issue(issues, product, "critical", f"metafield_{key}_contains_chinese", value)

        piece_count = metafields.get("piece_count", "")
        if piece_count and not re.fullmatch(r"\d+(?:\s*/\s*\d+)*", piece_count):
            add_issue(issues, product, "warning", "metafield_piece_count_non_numeric", piece_count)

        age = metafields.get("recommended_age", "")
        if age and not re.search(r"\d", age):
            add_issue(issues, product, "warning", "metafield_age_has_no_digit", age)

        for variant in variants:
            sku = (variant.get("sku") or "").strip()
            if not sku:
                add_issue(issues, product, "critical", "variant_missing_sku", variant.get("title") or "")
            else:
                sku_to_products[sku.upper()].append({"handle": handle, "title": title})

            if str(variant.get("price") or "") != EXPECTED_PRICE:
                add_issue(issues, product, "critical", "variant_price_not_999", f"{sku}: {variant.get('price')}")

            tracked = (variant.get("inventoryItem") or {}).get("tracked")
            if tracked:
                add_issue(issues, product, "critical", "inventory_tracking_enabled", sku)

            if len(variants) > 1 and not variant.get("image"):
                add_issue(issues, product, "warning", "multi_variant_missing_variant_image", sku or variant.get("title") or "")

        normalized_title = re.sub(r"[^a-z0-9]+", " ", lowered_title)
        normalized_title = re.sub(r"\b(jie ?star|jiestar|building|block|set|kit|model|toy|pack)\b", " ", normalized_title)
        normalized_title = re.sub(r"\s+", " ", normalized_title).strip()
        if normalized_title:
            title_norm_to_products[normalized_title].append({"handle": handle, "title": title})

    for sku, rows in sku_to_products.items():
        handles = sorted({row["handle"] for row in rows})
        if len(handles) > 1:
            first_product = {"handle": handles[0], "title": rows[0]["title"], "id": ""}
            add_issue(
                issues,
                first_product,
                "warning",
                "duplicate_or_bundle_overlap_sku",
                f"{sku}: " + " | ".join(handles),
            )

    for normalized, rows in title_norm_to_products.items():
        handles = sorted({row["handle"] for row in rows})
        if len(handles) > 1:
            first_product = {"handle": handles[0], "title": rows[0]["title"], "id": ""}
            add_issue(
                issues,
                first_product,
                "warning",
                "similar_title_group",
                normalized + ": " + " | ".join(handles[:8]),
            )

    counts = Counter(issue["issue"] for issue in issues)
    severity_counts = Counter(issue["severity"] for issue in issues)
    summary = {
        "active_products_checked": len(products),
        "total_issue_rows": len(issues),
        "severity_counts": dict(sorted(severity_counts.items())),
        "issue_counts": dict(sorted(counts.items())),
    }
    return issues, summary


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    admin = ShopifyAdmin()
    products = fetch_active_products(admin)
    issues, summary = audit_products(products)

    product_path = OUT_DIR / "active-products.json"
    product_path.write_text(json.dumps(products, ensure_ascii=False, indent=2), encoding="utf-8")

    issue_path = OUT_DIR / "active-health-issues.csv"
    with issue_path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=["severity", "issue", "handle", "title", "product_id", "detail"])
        writer.writeheader()
        writer.writerows(issues)

    summary_path = OUT_DIR / "active-health-summary.json"
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print(f"issues_csv={issue_path}")
    print(f"summary_json={summary_path}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(1)
