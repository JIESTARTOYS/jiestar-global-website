#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import os
import time
import urllib.request
from pathlib import Path
from typing import Any, Protocol


OUT_DIR = Path("/private/tmp/jiestar-shopify-small-angle-delist")
PLAN_CSV = OUT_DIR / "small-angle-delist-plan.csv"
SUMMARY_JSON = OUT_DIR / "small-angle-delist-summary.json"
API_VERSION_FALLBACK = "2026-01"
TARGET_VENDOR = "Small Angle"
TARGET_STATUS = "DRAFT"

FIELDNAMES = [
    "product_id",
    "handle",
    "title",
    "vendor",
    "current_status",
    "target_status",
    "online_store_url",
    "total_variants",
    "action",
    "reason",
]


class ShopifyAdminProtocol(Protocol):
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


def shopify_domain() -> str:
    domain = os.environ.get("SHOPIFY_STORE_DOMAIN", "").strip()
    domain = domain.removeprefix("https://").removeprefix("http://").rstrip("/")

    if not domain:
        raise RuntimeError("SHOPIFY_STORE_DOMAIN is required.")

    return domain


class ShopifyAdmin:
    def __init__(self) -> None:
        load_dotenv(Path(".env.local"))
        self.domain = shopify_domain()
        self.api_version = os.environ.get("SHOPIFY_API_VERSION", API_VERSION_FALLBACK)
        self.token = os.environ.get("SHOPIFY_ADMIN_ACCESS_TOKEN", "").strip()

        if not self.token:
            raise RuntimeError("SHOPIFY_ADMIN_ACCESS_TOKEN is required.")

        self.url = f"https://{self.domain}/admin/api/{self.api_version}/graphql.json"

    def graphql(self, query: str, variables: dict[str, Any] | None = None) -> dict[str, Any]:
        payload = json.dumps({"query": query, "variables": variables or {}}).encode("utf-8")
        request = urllib.request.Request(
            self.url,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": self.token,
            },
        )

        with urllib.request.urlopen(request, timeout=60) as response:
            data = json.loads(response.read().decode("utf-8"))

        if data.get("errors"):
            raise RuntimeError(json.dumps(data["errors"], ensure_ascii=False))

        return data["data"]

    def all_products(self) -> list[dict[str, Any]]:
        products: list[dict[str, Any]] = []
        cursor: str | None = None

        while True:
            data = self.graphql(
                """
                query Products($cursor: String) {
                  products(first: 250, after: $cursor, sortKey: TITLE) {
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                    nodes {
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
                """,
                {"cursor": cursor},
            )
            connection = data["products"]
            products.extend(connection["nodes"])

            if not connection["pageInfo"]["hasNextPage"]:
                return products

            cursor = connection["pageInfo"]["endCursor"]

    def product_by_id(self, product_id: str) -> dict[str, Any] | None:
        data = self.graphql(
            """
            query ProductById($id: ID!) {
              node(id: $id) {
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
            """,
            {"id": product_id},
        )

        return data.get("node")

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


def clean(value: Any) -> str:
    return "" if value is None else str(value).strip()


def product_to_row(product: dict[str, Any]) -> dict[str, str]:
    current_status = clean(product.get("status"))
    target_status = TARGET_STATUS if current_status == "ACTIVE" else current_status

    if current_status == "ACTIVE":
        action = "draft_active_small_angle"
        reason = "vendor_exact_small_angle_and_active"
    elif current_status == TARGET_STATUS:
        action = "already_draft"
        reason = "already_not_public"
    else:
        action = "skip_status"
        reason = "small_angle_product_not_active"

    return {
        "product_id": clean(product.get("id")),
        "handle": clean(product.get("handle")),
        "title": clean(product.get("title")),
        "vendor": clean(product.get("vendor")),
        "current_status": current_status,
        "target_status": target_status,
        "online_store_url": clean(product.get("onlineStoreUrl")),
        "total_variants": clean(product.get("totalVariants")),
        "action": action,
        "reason": reason,
    }


def build_plan(products: list[dict[str, Any]]) -> tuple[list[dict[str, str]], dict[str, int]]:
    rows = [product_to_row(product) for product in products if clean(product.get("vendor")) == TARGET_VENDOR]
    summary = {
        "products_seen": len(products),
        "small_angle_products": len(rows),
        "active_to_draft": sum(1 for row in rows if row["action"] == "draft_active_small_angle"),
        "already_draft": sum(1 for row in rows if row["action"] == "already_draft"),
        "other_small_angle_statuses": sum(1 for row in rows if row["action"] == "skip_status"),
        "non_small_angle_targets": sum(1 for row in rows if row["vendor"] != TARGET_VENDOR),
    }

    return rows, summary


def write_plan_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(rows)


def read_plan_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8", newline="") as file:
        return list(csv.DictReader(file))


def apply_approved_plan(admin: ShopifyAdminProtocol, approved_report: Path) -> dict[str, Any]:
    rows = read_plan_csv(approved_report)
    target_rows = [row for row in rows if row.get("action") == "draft_active_small_angle"]
    results: list[dict[str, Any]] = []

    for row in target_rows:
        product_id = row["product_id"]
        result = {
            "product_id": product_id,
            "handle": row.get("handle", ""),
            "status": "pending",
        }

        try:
            current = admin.product_by_id(product_id)

            if not current:
                result.update({"status": "skipped", "reason": "product_not_found"})
            elif clean(current.get("vendor")) != TARGET_VENDOR:
                result.update({"status": "skipped", "reason": "vendor_changed", "current_vendor": clean(current.get("vendor"))})
            elif clean(current.get("status")) != "ACTIVE":
                result.update({"status": "skipped", "reason": "status_changed", "current_status": clean(current.get("status"))})
            else:
                admin.update_status(product_id, TARGET_STATUS)
                result.update({"status": "ok", "target_status": TARGET_STATUS})
        except Exception as error:  # noqa: BLE001 - batch should report all failures.
            result.update({"status": "failed", "error": str(error)})

        results.append(result)
        time.sleep(0.15)

    return {
        "approved_report": str(approved_report),
        "attempted": len(target_rows),
        "ok": sum(1 for result in results if result["status"] == "ok"),
        "skipped": sum(1 for result in results if result["status"] == "skipped"),
        "failed": sum(1 for result in results if result["status"] == "failed"),
        "rows": results,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Draft all ACTIVE Shopify products whose vendor is exactly Small Angle.")
    parser.add_argument("--plan-csv", default=str(PLAN_CSV))
    parser.add_argument("--summary-json", default=str(SUMMARY_JSON))
    parser.add_argument("--apply", action="store_true", help="Apply the approved CSV plan.")
    parser.add_argument("--yes", action="store_true", help="Required with --apply.")
    parser.add_argument("--input-approved-report", help="CSV generated and approved from a dry-run.")
    args = parser.parse_args()

    if args.apply and not args.yes:
        raise SystemExit("--apply requires --yes")

    if args.apply and not args.input_approved_report:
        raise SystemExit("--apply requires --input-approved-report")

    admin = ShopifyAdmin()
    products = admin.all_products()
    rows, summary = build_plan(products)
    write_plan_csv(Path(args.plan_csv), rows)

    payload: dict[str, Any] = {
        "summary": summary,
        "plan_csv": args.plan_csv,
        "draft_preview": [row for row in rows if row["action"] == "draft_active_small_angle"][:50],
        "note": "Dry-run only unless --apply --yes --input-approved-report is provided. Apply only changes product status to DRAFT.",
    }

    if args.apply:
        payload["apply_results"] = apply_approved_plan(admin, Path(args.input_approved_report))

    Path(args.summary_json).parent.mkdir(parents=True, exist_ok=True)
    Path(args.summary_json).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(payload, ensure_ascii=False, indent=2))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
