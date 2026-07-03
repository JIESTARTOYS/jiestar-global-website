#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import time
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Protocol


OUT_DIR = Path("/private/tmp/jiestar-shopify-draft-unpriced-active-products")
PRICE_OUT_DIR = Path("/private/tmp/jiestar-shopify-price-update")
SHIPPING_OUT_DIR = Path("/private/tmp/jiestar-shopify-shipping-update")
DEFAULT_FULL_REPORT = PRICE_OUT_DIR / "price-update-full-report.csv"
DEFAULT_UNMATCHED_REPORT = PRICE_OUT_DIR / "price-update-unmatched-active.csv"
DEFAULT_SHIPPING_UNMATCHED_REPORT = SHIPPING_OUT_DIR / "shipping-unmatched-active.csv"
API_VERSION_FALLBACK = "2026-01"
TARGET_VENDOR = "JieStar"
TARGET_STATUS = "DRAFT"
ACTIVE_STATUS = "ACTIVE"

PRODUCT_PLAN_CSV = "draft-unpriced-products-plan.csv"
VARIANT_DETAIL_CSV = "draft-unpriced-variant-detail.csv"
MIXED_PRODUCTS_CSV = "draft-unpriced-mixed-products.csv"
HIDDEN_PRICED_SIBLINGS_CSV = "draft-unpriced-hidden-priced-siblings.csv"
SHIPPING_REMOVED_CSV = "shipping-unmatched-removed-by-draft.csv"
SHIPPING_REMAINING_CSV = "shipping-unmatched-remaining-after-draft.csv"
SUMMARY_JSON = "draft-unpriced-summary.json"
APPLY_RESULT_JSON = "draft-unpriced-apply-result.json"

PRODUCT_FIELDS = [
    "action",
    "reason",
    "product_unresolved_type",
    "product_id",
    "handle",
    "title",
    "vendor",
    "current_status",
    "target_status",
    "online_store_url",
    "active_variant_count_in_price_report",
    "unmatched_variant_count",
    "priced_sibling_variant_count",
    "missing_skus",
]

VARIANT_FIELDS = [
    "row_type",
    "will_be_hidden_by_product_draft",
    "product_unresolved_type",
    "product_id",
    "variant_id",
    "handle",
    "product_title",
    "vendor",
    "variant_title",
    "sku",
    "current_price",
    "current_compare_at_price",
    "target_price",
    "target_compare_at_price",
    "price_report_action",
    "price_report_reason",
    "pricing_status",
    "pricing_brand",
    "pricing_source_file",
    "online_store_url",
]


class ShopifyAdminProtocol(Protocol):
    def products_by_ids(self, product_ids: list[str]) -> dict[str, dict[str, Any]]:
        ...

    def product_by_id(self, product_id: str) -> dict[str, Any] | None:
        ...

    def update_status(self, product_id: str, status: str) -> None:
        ...


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def clean(value: Any) -> str:
    return "" if value is None else str(value).strip()


def now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        return [{key: clean(value) for key, value in row.items()} for row in csv.DictReader(file)]


def write_csv(path: Path, rows: list[dict[str, str]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def write_passthrough_csv(path: Path, rows: list[dict[str, str]]) -> None:
    if rows:
        fieldnames = list(rows[0].keys())
    else:
        fieldnames = ["note"]
        rows = [{"note": ""}]
    write_csv(path, rows, fieldnames)


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
        body = json.dumps({"query": query, "variables": variables or {}}).encode("utf-8")
        for attempt in range(6):
            request = urllib.request.Request(
                self.endpoint,
                data=body,
                method="POST",
                headers={"Content-Type": "application/json", "X-Shopify-Access-Token": self.token},
            )
            try:
                with urllib.request.urlopen(request, timeout=120) as response:
                    payload = json.loads(response.read().decode("utf-8"))
            except urllib.error.HTTPError as error:
                error_body = error.read().decode("utf-8", errors="ignore")
                if error.code in {429, 500, 502, 503, 504} and attempt < 5:
                    time.sleep(min(30, 2**attempt))
                    continue
                raise RuntimeError(f"Shopify HTTP {error.code}: {error_body[:1200]}") from error

            errors = payload.get("errors")
            if errors:
                error_text = json.dumps(errors, ensure_ascii=False)
                retryable = any(
                    isinstance(error, dict)
                    and (
                        str(error.get("extensions", {}).get("code", "")).upper() == "THROTTLED"
                        or "throttl" in str(error).lower()
                        or "timeout" in str(error).lower()
                    )
                    for error in errors
                )
                if retryable and attempt < 5:
                    time.sleep(min(30, 2**attempt))
                    continue
                raise RuntimeError(f"Shopify GraphQL errors: {error_text}")
            return payload["data"]
        raise RuntimeError("Shopify GraphQL retry limit exceeded")

    def products_by_ids(self, product_ids: list[str]) -> dict[str, dict[str, Any]]:
        products: dict[str, dict[str, Any]] = {}
        query = """
        query ProductsByIds($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Product {
              id
              handle
              title
              vendor
              status
              onlineStoreUrl
              totalVariants
            }
          }
        }
        """
        for idx in range(0, len(product_ids), 100):
            data = self.graphql(query, {"ids": product_ids[idx : idx + 100]})
            for node in data.get("nodes", []):
                if node and node.get("id"):
                    products[node["id"]] = node
        return products

    def product_by_id(self, product_id: str) -> dict[str, Any] | None:
        return self.products_by_ids([product_id]).get(product_id)

    def update_status(self, product_id: str, status: str) -> None:
        data = self.graphql(
            """
            mutation UpdateProductStatus($product: ProductUpdateInput!) {
              productUpdate(product: $product) {
                product {
                  id
                  status
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """,
            {"product": {"id": product_id, "status": status}},
        )
        user_errors = data["productUpdate"]["userErrors"]
        if user_errors:
            raise RuntimeError(json.dumps(user_errors, ensure_ascii=False))


def index_by_product(rows: list[dict[str, str]]) -> dict[str, list[dict[str, str]]]:
    grouped: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        product_id = row.get("product_id", "")
        if product_id:
            grouped[product_id].append(row)
    return grouped


def product_report_value(
    product: dict[str, Any] | None,
    fallback_rows: list[dict[str, str]],
    key: str,
    fallback_key: str | None = None,
) -> str:
    if product:
        value = clean(product.get(key))
        if value:
            return value
    row_key = fallback_key or key
    for row in fallback_rows:
        value = clean(row.get(row_key))
        if value:
            return value
    return ""


def build_reports(
    full_rows: list[dict[str, str]],
    unmatched_rows: list[dict[str, str]],
    shipping_unmatched_rows: list[dict[str, str]],
    products_by_id: dict[str, dict[str, Any]],
) -> tuple[list[dict[str, str]], list[dict[str, str]], list[dict[str, str]], list[dict[str, str]], list[dict[str, str]], dict[str, Any]]:
    full_by_product = index_by_product(full_rows)
    unmatched_by_product = index_by_product(
        [row for row in unmatched_rows if row.get("skip_reason") == "unmatched_active_sku"]
    )
    product_ids = sorted(unmatched_by_product)

    product_rows: list[dict[str, str]] = []
    variant_rows: list[dict[str, str]] = []
    hidden_siblings: list[dict[str, str]] = []

    for product_id in product_ids:
        product = products_by_id.get(product_id)
        full_product_rows = full_by_product.get(product_id, [])
        missing_rows = unmatched_by_product[product_id]
        unresolved_type = (
            "full_unresolved_product"
            if len(missing_rows) == len(full_product_rows)
            else "mixed_unresolved_product"
        )

        live_vendor = product_report_value(product, full_product_rows, "vendor")
        live_status = product_report_value(product, full_product_rows, "status", "product_status")
        if not product:
            action = "skip_product_not_found"
            reason = "product_not_found_in_shopify"
            target_status = ""
        elif live_vendor != TARGET_VENDOR:
            action = "skip_vendor_not_jiestar"
            reason = "live_vendor_changed_or_not_target_vendor"
            target_status = live_status
        elif live_status != ACTIVE_STATUS:
            action = "skip_not_active"
            reason = "live_product_status_not_active"
            target_status = live_status
        else:
            action = "draft_unpriced_product"
            reason = "unmatched_active_sku_in_latest_price_report"
            target_status = TARGET_STATUS

        product_row = {
            "action": action,
            "reason": reason,
            "product_unresolved_type": unresolved_type,
            "product_id": product_id,
            "handle": product_report_value(product, full_product_rows, "handle"),
            "title": product_report_value(product, full_product_rows, "title", "product_title"),
            "vendor": live_vendor,
            "current_status": live_status,
            "target_status": target_status,
            "online_store_url": product_report_value(product, full_product_rows, "onlineStoreUrl", "online_store_url"),
            "active_variant_count_in_price_report": str(len(full_product_rows)),
            "unmatched_variant_count": str(len(missing_rows)),
            "priced_sibling_variant_count": str(len(full_product_rows) - len(missing_rows)),
            "missing_skus": ", ".join(row.get("sku", "") for row in missing_rows if row.get("sku")),
        }
        product_rows.append(product_row)

        for row in full_product_rows:
            is_missing = row.get("skip_reason") == "unmatched_active_sku"
            row_type = "missing_price_variant" if is_missing else "priced_sibling_temporarily_hidden"
            variant_row = {
                "row_type": row_type,
                "will_be_hidden_by_product_draft": "Yes" if action == "draft_unpriced_product" else "No",
                "product_unresolved_type": unresolved_type,
                "product_id": product_id,
                "variant_id": row.get("variant_id", ""),
                "handle": row.get("handle", ""),
                "product_title": row.get("product_title", ""),
                "vendor": row.get("vendor", ""),
                "variant_title": row.get("variant_title", ""),
                "sku": row.get("sku", ""),
                "current_price": row.get("current_price", ""),
                "current_compare_at_price": row.get("current_compare_at_price", ""),
                "target_price": row.get("target_price", ""),
                "target_compare_at_price": row.get("target_compare_at_price", ""),
                "price_report_action": row.get("action", ""),
                "price_report_reason": row.get("skip_reason", ""),
                "pricing_status": row.get("pricing_status", ""),
                "pricing_brand": row.get("pricing_brand", ""),
                "pricing_source_file": row.get("pricing_source_file", ""),
                "online_store_url": row.get("online_store_url", ""),
            }
            variant_rows.append(variant_row)
            if row_type == "priced_sibling_temporarily_hidden" and action == "draft_unpriced_product":
                hidden_siblings.append(variant_row)

    draft_product_ids = {row["product_id"] for row in product_rows if row["action"] == "draft_unpriced_product"}
    shipping_removed = [row for row in shipping_unmatched_rows if row.get("product_id", "") in draft_product_ids]
    shipping_remaining = [row for row in shipping_unmatched_rows if row.get("product_id", "") not in draft_product_ids]
    mixed_products = [row for row in product_rows if row["product_unresolved_type"] == "mixed_unresolved_product"]

    product_action_counts = Counter(row["action"] for row in product_rows)
    product_type_counts = Counter(row["product_unresolved_type"] for row in product_rows)
    variant_type_counts = Counter(row["row_type"] for row in variant_rows if row["will_be_hidden_by_product_draft"] == "Yes")
    summary = {
        "generated_at": now_iso(),
        "target_vendor": TARGET_VENDOR,
        "target_status": TARGET_STATUS,
        "price_full_report_rows": len(full_rows),
        "price_unmatched_variant_count": len(unmatched_rows),
        "candidate_product_count": len(product_rows),
        "draft_product_count": product_action_counts.get("draft_unpriced_product", 0),
        "full_unresolved_product_count": product_type_counts.get("full_unresolved_product", 0),
        "mixed_unresolved_product_count": product_type_counts.get("mixed_unresolved_product", 0),
        "active_variant_count_on_draft_products": sum(
            int(row["active_variant_count_in_price_report"])
            for row in product_rows
            if row["action"] == "draft_unpriced_product"
        ),
        "unmatched_variant_count_on_draft_products": variant_type_counts.get("missing_price_variant", 0),
        "priced_sibling_variant_count_on_draft_products": variant_type_counts.get("priced_sibling_temporarily_hidden", 0),
        "shipping_unmatched_before_count": len(shipping_unmatched_rows),
        "shipping_unmatched_removed_by_draft_count": len(shipping_removed),
        "shipping_unmatched_remaining_after_draft_count": len(shipping_remaining),
        "product_action_counts": dict(sorted(product_action_counts.items())),
        "product_unresolved_type_counts": dict(sorted(product_type_counts.items())),
        "shipping_remaining_vendor_counts": dict(sorted(Counter(row.get("vendor", "") for row in shipping_remaining).items())),
    }
    return product_rows, variant_rows, mixed_products, hidden_siblings, shipping_remaining, shipping_removed, summary


def approved_product_ids(path: Path) -> set[str]:
    rows = read_csv(path)
    required = {"product_id", "action", "target_status"}
    if not required.issubset(rows[0].keys() if rows else set()):
        raise RuntimeError(f"Approved report missing required columns: {sorted(required)}")
    return {
        row["product_id"]
        for row in rows
        if row.get("action") == "draft_unpriced_product" and row.get("target_status") == TARGET_STATUS
    }


def apply_approved_plan(
    admin: ShopifyAdminProtocol,
    current_product_rows: list[dict[str, str]],
    approved_report: Path,
) -> dict[str, Any]:
    approved_ids = approved_product_ids(approved_report)
    current_ids = {row["product_id"] for row in current_product_rows if row["action"] == "draft_unpriced_product"}
    extra = approved_ids - current_ids
    missing = current_ids - approved_ids
    if extra or missing:
        raise RuntimeError(
            "Approved report does not match current dry-run candidates: "
            f"extra={len(extra)}, missing={len(missing)}"
        )

    current_by_id = {row["product_id"]: row for row in current_product_rows}
    results: list[dict[str, Any]] = []
    for product_id in sorted(approved_ids):
        plan_row = current_by_id[product_id]
        result: dict[str, Any] = {
            "product_id": product_id,
            "handle": plan_row.get("handle", ""),
            "title": plan_row.get("title", ""),
            "status": "pending",
        }
        try:
            product = admin.product_by_id(product_id)
            if not product:
                result.update({"status": "skipped", "reason": "product_not_found"})
            elif clean(product.get("vendor")) != TARGET_VENDOR:
                result.update({"status": "skipped", "reason": "vendor_changed", "current_vendor": clean(product.get("vendor"))})
            elif clean(product.get("status")) != ACTIVE_STATUS:
                result.update({"status": "skipped", "reason": "status_changed", "current_status": clean(product.get("status"))})
            else:
                admin.update_status(product_id, TARGET_STATUS)
                result.update({"status": "ok", "target_status": TARGET_STATUS})
        except Exception as error:  # noqa: BLE001 - keep batch evidence for every attempted product.
            result.update({"status": "failed", "error": str(error)})
        results.append(result)
        time.sleep(0.15)

    return {
        "approved_report": str(approved_report),
        "attempted": len(results),
        "ok": sum(1 for result in results if result["status"] == "ok"),
        "skipped": sum(1 for result in results if result["status"] == "skipped"),
        "failed": sum(1 for result in results if result["status"] == "failed"),
        "rows": results,
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Draft Shopify ACTIVE products that contain variants missing pricing-model matches."
    )
    parser.add_argument("--full-report", type=Path, default=DEFAULT_FULL_REPORT)
    parser.add_argument("--unmatched-report", type=Path, default=DEFAULT_UNMATCHED_REPORT)
    parser.add_argument("--shipping-unmatched-report", type=Path, default=DEFAULT_SHIPPING_UNMATCHED_REPORT)
    parser.add_argument("--out-dir", type=Path, default=OUT_DIR)
    parser.add_argument("--apply", action="store_true", help="Apply product status=DRAFT for the approved dry-run plan.")
    parser.add_argument("--yes", action="store_true", help="Required with --apply.")
    parser.add_argument("--input-approved-report", type=Path, help="Required with --apply. Use reviewed draft-unpriced-products-plan.csv.")
    args = parser.parse_args()

    if args.apply and (not args.yes or not args.input_approved_report):
        raise RuntimeError("--apply requires --yes and --input-approved-report")
    for path in [args.full_report, args.unmatched_report, args.shipping_unmatched_report]:
        if not path.exists():
            raise RuntimeError(f"Missing required report: {path}")

    args.out_dir.mkdir(parents=True, exist_ok=True)
    full_rows = read_csv(args.full_report)
    unmatched_rows = read_csv(args.unmatched_report)
    shipping_unmatched_rows = read_csv(args.shipping_unmatched_report)
    candidate_ids = sorted({row["product_id"] for row in unmatched_rows if row.get("product_id")})

    admin = ShopifyAdmin()
    live_products = admin.products_by_ids(candidate_ids)
    product_rows, variant_rows, mixed_rows, hidden_rows, shipping_remaining, shipping_removed, summary = build_reports(
        full_rows,
        unmatched_rows,
        shipping_unmatched_rows,
        live_products,
    )

    write_csv(args.out_dir / PRODUCT_PLAN_CSV, product_rows, PRODUCT_FIELDS)
    write_csv(args.out_dir / VARIANT_DETAIL_CSV, variant_rows, VARIANT_FIELDS)
    write_csv(args.out_dir / MIXED_PRODUCTS_CSV, mixed_rows, PRODUCT_FIELDS)
    write_csv(args.out_dir / HIDDEN_PRICED_SIBLINGS_CSV, hidden_rows, VARIANT_FIELDS)
    write_passthrough_csv(args.out_dir / SHIPPING_REMOVED_CSV, shipping_removed)
    write_passthrough_csv(args.out_dir / SHIPPING_REMAINING_CSV, shipping_remaining)

    apply_results: dict[str, Any] | None = None
    if args.apply:
        apply_results = apply_approved_plan(admin, product_rows, args.input_approved_report)
        (args.out_dir / APPLY_RESULT_JSON).write_text(json.dumps(apply_results, ensure_ascii=False, indent=2), encoding="utf-8")
        summary["apply_results"] = {
            "attempted": apply_results["attempted"],
            "ok": apply_results["ok"],
            "skipped": apply_results["skipped"],
            "failed": apply_results["failed"],
        }

    summary.update(
        {
            "applied": args.apply,
            "source_reports": {
                "full_report": str(args.full_report),
                "unmatched_report": str(args.unmatched_report),
                "shipping_unmatched_report": str(args.shipping_unmatched_report),
            },
            "reports": {
                "product_plan": str(args.out_dir / PRODUCT_PLAN_CSV),
                "variant_detail": str(args.out_dir / VARIANT_DETAIL_CSV),
                "mixed_products": str(args.out_dir / MIXED_PRODUCTS_CSV),
                "hidden_priced_siblings": str(args.out_dir / HIDDEN_PRICED_SIBLINGS_CSV),
                "shipping_removed_by_draft": str(args.out_dir / SHIPPING_REMOVED_CSV),
                "shipping_remaining_after_draft": str(args.out_dir / SHIPPING_REMAINING_CSV),
            },
            "note": "Dry-run only unless --apply --yes --input-approved-report is provided. Apply only changes Shopify product status to DRAFT.",
        }
    )
    (args.out_dir / SUMMARY_JSON).write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(1)
