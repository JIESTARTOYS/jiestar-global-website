#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import os
import re
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import shopify_title_cleanup as jiestar_titles


OUT_DIR = Path("/private/tmp/jiestar-shopify-ip-risk-audit")
API_VERSION_FALLBACK = "2026-01"
BATCH_SIZE = 25

FORCED_DRAFT_SKUS = {"66119"}

GENERIC_REPLACEMENTS = [
    *jiestar_titles.SENSITIVE_REPLACEMENTS,
    (re.compile(r"\bthe\s+botanical\s+garden\s+with\s+van\s+gogh\s+art\s+exhibition\b", re.I), "Botanical Garden Art Gallery"),
    (re.compile(r"\bvan\s+gogh\b", re.I), "Art Exhibition"),
    (re.compile(r"\bgt[-\s]?r\b", re.I), "Performance Sports Car"),
    (re.compile(r"\bdangers?\s*&\s*dragons\b", re.I), "Fantasy"),
    (re.compile(r"\bdangers?\s+and\s+dragons\b", re.I), "Fantasy"),
    (re.compile(r"\bforbidden\s+forest\b", re.I), "Dark Forest"),
    (re.compile(r"\bwizarding\s+world\b", re.I), "Fantasy Wizard"),
    (re.compile(r"\bcommon\s+room\s+house\b", re.I), "Wizard Common Room"),
    (re.compile(r"\bking\s+of\s+lion\b", re.I), "Lion Display Model"),
    (re.compile(r"\bthe\s+king\s+of\s+lion\b", re.I), "Lion Display Model"),
    (re.compile(r"\bpiranha\s+plant\b", re.I), "Carnivorous Plant"),
    (re.compile(r"\bwednesdays?\b", re.I), "Gothic"),
    (re.compile(r"\bthething\b", re.I), "Hand Prop"),
    (re.compile(r"\bthe\s+thing\b", re.I), "Hand Prop"),
    (re.compile(r"\bsandworm\s+strike\b", re.I), "Desert Sandworm"),
    (re.compile(r"\bsky\s+bison\b", re.I), "Fantasy Flying Creature"),
]

HIGH_RISK_PATTERNS = [
    (re.compile(r"\bpiranha\s+plant\b", re.I), "Nintendo/Mario-specific model"),
    (re.compile(r"\bwednesdays?\b", re.I), "Wednesday-specific scene"),
    (re.compile(r"\bthething\b|\bthe\s+thing\b", re.I), "Wednesday-specific prop"),
    (re.compile(r"\bsky\s+bison\b", re.I), "Avatar-specific creature"),
    (re.compile(r"\bsandworm\s+strike\b", re.I), "Dune-specific scene"),
]

REVIEW_PATTERNS = [
    (re.compile(r"\bforbidden\s+forest\b", re.I), "Harry Potter-adjacent phrase"),
    (re.compile(r"\bcommon\s+room\b", re.I), "wizard-school-adjacent phrase"),
    (re.compile(r"\bking\s+of\s+lion\b|\bthe\s+king\s+of\s+lion\b", re.I), "Lion King-adjacent phrasing"),
    (re.compile(r"\bdangers?\s*&\s*dragons\b|\bdangers?\s+and\s+dragons\b", re.I), "Dungeons & Dragons-adjacent phrasing"),
    (re.compile(r"\bvan\s+gogh\b", re.I), "artist name in title"),
    (re.compile(r"\bgt[-\s]?r\b", re.I), "vehicle model mark"),
]


@dataclass
class Product:
    id: str
    handle: str
    title: str
    status: str
    vendor: str
    product_type: str
    skus: list[str]
    image_url: str


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def normalize_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip(" .")


def title_case(value: str) -> str:
    small = {"and", "or", "with", "for", "the", "a", "an", "in", "of"}
    words = []
    for index, word in enumerate(value.split()):
        if word.isupper() and len(word) <= 4:
            words.append(word)
        elif index > 0 and word.lower() in small:
            words.append(word.lower())
        elif "-" in word:
            words.append("-".join(part[:1].upper() + part[1:].lower() for part in word.split("-") if part))
        else:
            words.append(word[:1].upper() + word[1:].lower())
    return " ".join(words)


def brand_prefix(vendor: str) -> str:
    return "Xbert" if vendor.strip().lower() == "xbert" else "JIESTAR"


def safe_title(product: Product) -> tuple[str, list[str]]:
    new_title = product.title
    reasons: list[str] = []
    for pattern, replacement in GENERIC_REPLACEMENTS:
        if pattern.search(new_title):
            reasons.append(f"replace:{pattern.pattern}")
            new_title = pattern.sub(replacement, new_title)
    new_title = re.sub(r"\b(building\s+block\s+set|building\s+set|model\s+kit|set)\b", "", new_title, flags=re.I)
    new_title = re.sub(r"^(JIESTAR|Xbert)\b", "", new_title, flags=re.I)
    new_title = re.sub(r"[^A-Za-z0-9+'& -]+", " ", new_title)
    new_title = title_case(normalize_spaces(new_title))
    if not new_title:
        new_title = "Display Model"
    new_title = normalize_spaces(f"{brand_prefix(product.vendor)} {new_title} Building Block Set")
    return new_title, reasons


def remaining_sensitive_hits(value: str) -> list[str]:
    patterns = [*jiestar_titles.SENSITIVE_PATTERNS, *(item[0] for item in HIGH_RISK_PATTERNS), *(item[0] for item in REVIEW_PATTERNS)]
    hits: list[str] = []
    for pattern in patterns:
        match = pattern.search(value)
        if match:
            hits.append(match.group(0))
    return sorted(set(hits), key=str.lower)


def product_admin_url(domain: str, product_id: str) -> str:
    return f"https://admin.shopify.com/store/{domain.split('.')[0]}/products/{product_id.rsplit('/', 1)[-1]}"


def classify(product: Product, domain: str) -> dict[str, str]:
    high_hits = [reason for pattern, reason in HIGH_RISK_PATTERNS if pattern.search(product.title)]
    review_hits = [reason for pattern, reason in REVIEW_PATTERNS if pattern.search(product.title)]
    forced = sorted(set(product.skus) & FORCED_DRAFT_SKUS)
    new_title, replacement_reasons = safe_title(product)
    remaining_hits = remaining_sensitive_hits(new_title)
    title_changed = normalize_spaces(new_title).lower() != normalize_spaces(product.title).lower()

    action = "none"
    decision = "no_risk_detected"
    reason = ""

    if forced:
        action = "draft"
        decision = "cannot_avoid_by_title"
        reason = f"forced_draft_sku:{'|'.join(forced)}"
    elif high_hits:
        action = "draft"
        decision = "cannot_avoid_by_title"
        reason = "|".join(high_hits)
    elif remaining_hits:
        action = "draft"
        decision = "cannot_confirm_safe_title"
        reason = "remaining_sensitive_after_rename:" + "|".join(remaining_hits)
    elif title_changed and (review_hits or replacement_reasons):
        action = "rename"
        decision = "avoid_by_generic_title"
        reason = "|".join([*review_hits, *replacement_reasons])

    if product.status != "ACTIVE" and action == "draft":
        action = "none"
        decision = "already_not_active"
        reason = reason or "already_draft"

    return {
        "action": action,
        "decision": decision,
        "reason": reason,
        "product_id": product.id,
        "status": product.status,
        "vendor": product.vendor,
        "skus": "|".join(product.skus),
        "current_title": product.title,
        "proposed_title": new_title if action == "rename" else "",
        "handle": product.handle,
        "product_type": product.product_type,
        "image_url": product.image_url,
        "admin_url": product_admin_url(domain, product.id),
    }


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
            with urlopen_with_retries(request, timeout=90) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            body = error.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"Shopify HTTP {error.code}: {body[:1200]}") from error
        if payload.get("errors"):
            raise RuntimeError(f"Shopify GraphQL errors: {json.dumps(payload['errors'], ensure_ascii=False)}")
        return payload["data"]

    def products(self, vendor: str | None = None) -> list[Product]:
        products: list[Product] = []
        cursor = None
        query_filter = f"vendor:{vendor}" if vendor else ""
        while True:
            data = self.graphql(
                """
                query ProductsForIpRisk($cursor: String, $query: String) {
                  products(first: 250, after: $cursor, sortKey: TITLE, query: $query) {
                    pageInfo { hasNextPage endCursor }
                    nodes {
                      id
                      handle
                      title
                      status
                      vendor
                      productType
                      featuredMedia {
                        preview { image { url } }
                      }
                      variants(first: 100) {
                        nodes { sku }
                      }
                    }
                  }
                }
                """,
                {"cursor": cursor, "query": query_filter},
            )
            page = data["products"]
            for node in page["nodes"]:
                products.append(
                    Product(
                        id=node["id"],
                        handle=node["handle"],
                        title=node["title"],
                        status=node["status"],
                        vendor=node.get("vendor") or "",
                        product_type=node.get("productType") or "",
                        skus=[(variant.get("sku") or "").strip().upper() for variant in node["variants"]["nodes"] if (variant.get("sku") or "").strip()],
                        image_url=(((node.get("featuredMedia") or {}).get("preview") or {}).get("image") or {}).get("url") or "",
                    )
                )
            if not page["pageInfo"]["hasNextPage"]:
                break
            cursor = page["pageInfo"]["endCursor"]
        return products

    def update_product(self, product_id: str, *, title: str | None = None, status: str | None = None) -> None:
        product: dict[str, str] = {"id": product_id}
        if title:
            product["title"] = title
        if status:
            product["status"] = status
        data = self.graphql(
            """
            mutation IpRiskProductUpdate($product: ProductUpdateInput!) {
              productUpdate(product: $product) {
                product { id title status }
                userErrors { field message }
              }
            }
            """,
            {"product": product},
        )
        errors = data["productUpdate"]["userErrors"]
        if errors:
            raise RuntimeError(f"productUpdate userErrors: {errors}")


def urlopen_with_retries(request: urllib.request.Request, timeout: int, attempts: int = 3):
    last_error: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            return urllib.request.urlopen(request, timeout=timeout)
        except Exception as error:  # noqa: BLE001
            last_error = error
            if attempt >= attempts:
                break
            time.sleep(1.5 * attempt)
    raise last_error or RuntimeError("request failed")


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "action",
        "decision",
        "reason",
        "status",
        "vendor",
        "skus",
        "current_title",
        "proposed_title",
        "handle",
        "product_type",
        "admin_url",
        "image_url",
        "product_id",
    ]
    for extra in ("applied_index", "applied_action"):
        if any(extra in row for row in rows):
            fieldnames.append(extra)
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def build_plan(admin: ShopifyAdmin, vendors: list[str]) -> list[dict[str, str]]:
    products: list[Product] = []
    for vendor in vendors:
        products.extend(admin.products(vendor))
    by_id = {product.id: product for product in products}
    return [classify(product, admin.domain) for product in sorted(by_id.values(), key=lambda item: (item.vendor, item.title))]


def apply_plan(admin: ShopifyAdmin, rows: list[dict[str, str]], batch_size: int) -> list[dict[str, str]]:
    actionable = [row for row in rows if row["action"] in {"rename", "draft"}]
    result_rows: list[dict[str, str]] = []
    for index, row in enumerate(actionable, start=1):
        if row["action"] == "rename":
            admin.update_product(row["product_id"], title=row["proposed_title"])
        elif row["action"] == "draft":
            admin.update_product(row["product_id"], status="DRAFT")
        result = dict(row)
        result["applied_index"] = str(index)
        result["applied_action"] = row["action"]
        result_rows.append(result)
        if index % batch_size == 0:
            time.sleep(2)
    return result_rows


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit Shopify product titles for avoidable and non-avoidable IP risk.")
    parser.add_argument("--vendors", nargs="+", default=["Xbert", "JIESTAR"], help="Vendors to audit.")
    parser.add_argument("--apply", action="store_true", help="Apply generic title rewrites and draft high-risk products.")
    parser.add_argument("--yes", action="store_true", help="Confirm apply mode.")
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE)
    args = parser.parse_args()

    admin = ShopifyAdmin()
    rows = build_plan(admin, args.vendors)
    risky_rows = [row for row in rows if row["action"] != "none"]
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    plan_csv = OUT_DIR / "ip-risk-plan.csv"
    risky_csv = OUT_DIR / "ip-risk-actionable.csv"
    write_csv(plan_csv, rows)
    write_csv(risky_csv, risky_rows)

    summary: dict[str, Any] = {
        "vendors": args.vendors,
        "products_checked": len(rows),
        "active_products_checked": sum(1 for row in rows if row["status"] == "ACTIVE"),
        "rename_count": sum(1 for row in rows if row["action"] == "rename"),
        "draft_count": sum(1 for row in rows if row["action"] == "draft"),
        "actionable_count": len(risky_rows),
        "plan_csv": str(plan_csv),
        "actionable_csv": str(risky_csv),
    }

    if args.apply:
        if not args.yes:
            raise RuntimeError("--apply requires --yes")
        result_rows = apply_plan(admin, rows, args.batch_size)
        result_csv = OUT_DIR / "ip-risk-apply-result.csv"
        write_csv(result_csv, result_rows)
        summary["applied_count"] = len(result_rows)
        summary["result_csv"] = str(result_csv)

    summary_path = OUT_DIR / "ip-risk-summary.json"
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
