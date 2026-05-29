#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from shopify_collection_audit import ShopifyAdmin


OUT_DIR = Path("/private/tmp/jiestar-shopify-duplicate-audit")


@dataclass
class ProductRecord:
    id: str
    handle: str
    title: str
    status: str
    product_type: str
    created_at: str
    updated_at: str
    skus: list[str]


def normalize_sku(sku: str) -> str:
    sku = str(sku or "").strip().upper()
    sku = re.sub(r"\s+", "", sku)
    return sku


def normalize_title(title: str) -> str:
    text = str(title or "").lower()
    text = re.sub(r"\bjiestar\b", "", text)
    text = re.sub(r"\[[^\]]*\]", "", text)
    text = re.sub(r"\([^)]*\)", "", text)
    text = re.sub(r"\bwith led lights?\b", "", text)
    text = re.sub(r"\b\d+\s*-\s*pack\b", "", text)
    text = re.sub(r"\b\d+\s*in\s*1\b", "", text)
    text = re.sub(r"\b(building block set|building set|building toy set|model kit|bundle set|set)\b", "", text)
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def product_admin_url(domain: str, product_id: str) -> str:
    numeric_id = product_id.rsplit("/", 1)[-1]
    return f"https://admin.shopify.com/store/{domain.split('.')[0]}/products/{numeric_id}"


def fetch_products(admin: ShopifyAdmin) -> list[ProductRecord]:
    products: list[ProductRecord] = []
    cursor = None

    while True:
        data = admin.graphql(
            """
            query ProductsForDuplicateAudit($cursor: String) {
              products(first: 250, after: $cursor, sortKey: TITLE) {
                pageInfo { hasNextPage endCursor }
                nodes {
                  id
                  handle
                  title
                  status
                  productType
                  createdAt
                  updatedAt
                  variants(first: 100) {
                    nodes { sku }
                  }
                }
              }
            }
            """,
            {"cursor": cursor},
        )
        page = data["products"]
        for node in page["nodes"]:
            products.append(
                ProductRecord(
                    id=node["id"],
                    handle=node["handle"],
                    title=node["title"],
                    status=node["status"],
                    product_type=node.get("productType") or "",
                    created_at=node.get("createdAt") or "",
                    updated_at=node.get("updatedAt") or "",
                    skus=[normalize_sku(variant.get("sku") or "") for variant in node["variants"]["nodes"] if normalize_sku(variant.get("sku") or "")],
                )
            )
        if not page["pageInfo"]["hasNextPage"]:
            break
        cursor = page["pageInfo"]["endCursor"]

    return products


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    admin = ShopifyAdmin()
    products = fetch_products(admin)

    by_sku: dict[str, list[ProductRecord]] = defaultdict(list)
    by_sku_set: dict[str, list[ProductRecord]] = defaultdict(list)
    by_title: dict[str, list[ProductRecord]] = defaultdict(list)

    for product in products:
        for sku in sorted(set(product.skus)):
            by_sku[sku].append(product)
        sku_set = "|".join(sorted(set(product.skus)))
        if sku_set:
            by_sku_set[sku_set].append(product)
        title_key = normalize_title(product.title)
        if title_key:
            by_title[title_key].append(product)

    duplicate_sku_rows: list[dict[str, str]] = []
    for sku, group in sorted(by_sku.items()):
        if len(group) < 2:
            continue
        active_count = sum(1 for product in group if product.status == "ACTIVE")
        for product in sorted(group, key=lambda item: (item.status != "ACTIVE", item.created_at, item.handle)):
            duplicate_sku_rows.append(
                {
                    "duplicate_type": "same_sku",
                    "sku": sku,
                    "group_product_count": str(len(group)),
                    "group_active_count": str(active_count),
                    "status": product.status,
                    "title": product.title,
                    "handle": product.handle,
                    "product_type": product.product_type,
                    "all_skus": "|".join(product.skus),
                    "created_at": product.created_at,
                    "updated_at": product.updated_at,
                    "admin_url": product_admin_url(admin.domain, product.id),
                }
            )

    duplicate_sku_set_rows: list[dict[str, str]] = []
    for sku_set, group in sorted(by_sku_set.items()):
        if len(group) < 2:
            continue
        active_count = sum(1 for product in group if product.status == "ACTIVE")
        for product in sorted(group, key=lambda item: (item.status != "ACTIVE", item.created_at, item.handle)):
            duplicate_sku_set_rows.append(
                {
                    "duplicate_type": "same_sku_set",
                    "sku_set": sku_set,
                    "group_product_count": str(len(group)),
                    "group_active_count": str(active_count),
                    "status": product.status,
                    "title": product.title,
                    "handle": product.handle,
                    "product_type": product.product_type,
                    "created_at": product.created_at,
                    "updated_at": product.updated_at,
                    "admin_url": product_admin_url(admin.domain, product.id),
                }
            )

    duplicate_title_rows: list[dict[str, str]] = []
    for title_key, group in sorted(by_title.items()):
        if len(group) < 2:
            continue
        active_count = sum(1 for product in group if product.status == "ACTIVE")
        for product in sorted(group, key=lambda item: (item.status != "ACTIVE", item.created_at, item.handle)):
            duplicate_title_rows.append(
                {
                    "duplicate_type": "similar_title",
                    "normalized_title": title_key,
                    "group_product_count": str(len(group)),
                    "group_active_count": str(active_count),
                    "status": product.status,
                    "title": product.title,
                    "handle": product.handle,
                    "product_type": product.product_type,
                    "all_skus": "|".join(product.skus),
                    "created_at": product.created_at,
                    "updated_at": product.updated_at,
                    "admin_url": product_admin_url(admin.domain, product.id),
                }
            )

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sku_path = OUT_DIR / "duplicate-skus.csv"
    sku_set_path = OUT_DIR / "duplicate-sku-sets.csv"
    title_path = OUT_DIR / "duplicate-similar-titles.csv"
    result_path = OUT_DIR / "duplicate-audit-summary.json"
    write_csv(sku_path, duplicate_sku_rows)
    write_csv(sku_set_path, duplicate_sku_set_rows)
    write_csv(title_path, duplicate_title_rows)

    summary: dict[str, Any] = {
        "products_checked": len(products),
        "active_products": sum(1 for product in products if product.status == "ACTIVE"),
        "draft_products": sum(1 for product in products if product.status == "DRAFT"),
        "duplicate_sku_groups": sum(1 for group in by_sku.values() if len(group) >= 2),
        "duplicate_sku_rows": len(duplicate_sku_rows),
        "duplicate_sku_groups_with_2plus_active": sum(1 for group in by_sku.values() if sum(1 for product in group if product.status == "ACTIVE") >= 2),
        "duplicate_sku_set_groups": sum(1 for group in by_sku_set.values() if len(group) >= 2),
        "duplicate_sku_set_rows": len(duplicate_sku_set_rows),
        "duplicate_sku_set_groups_with_2plus_active": sum(1 for group in by_sku_set.values() if sum(1 for product in group if product.status == "ACTIVE") >= 2),
        "similar_title_groups": sum(1 for group in by_title.values() if len(group) >= 2),
        "similar_title_rows": len(duplicate_title_rows),
        "similar_title_groups_with_2plus_active": sum(1 for group in by_title.values() if sum(1 for product in group if product.status == "ACTIVE") >= 2),
        "files": {
            "duplicate_skus": str(sku_path),
            "duplicate_sku_sets": str(sku_set_path),
            "duplicate_similar_titles": str(title_path),
            "summary": str(result_path),
        },
        "duplicate_sku_preview": duplicate_sku_rows[:80],
        "duplicate_sku_set_preview": duplicate_sku_set_rows[:80],
        "similar_title_preview": duplicate_title_rows[:80],
    }
    result_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
