#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))

import shopify_sample_import as base_import
from shopify_collection_audit import ShopifyAdmin


OUT_DIR = Path("/private/tmp/jiestar-shopify-metafield-audit")
DIFFICULTY_DEFAULT = "See product package"
CHECK_KEYS = [
    "specs.piece_count",
    "specs.recommended_age",
    "specs.finished_model_size",
    "specs.package_size",
    "specs.difficulty_level",
    "custom.series",
]


def normalize_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def normalize_sku(value: str) -> str:
    sku = str(value or "").strip().upper()
    sku = re.sub(r"\s+", "", sku)
    return sku[:-2] if sku.endswith(".0") else sku


def workbook_rows_with_fallbacks() -> dict[str, base_import.WorkbookRow]:
    rows = base_import.load_workbook_rows()
    output: dict[str, base_import.WorkbookRow] = {}
    for sku, row in rows.items():
        normalized = normalize_sku(sku)
        output[normalized] = row
        # Baby product sheet often uses E suffix while some Shopify variants omit it.
        if re.fullmatch(r"\d+E", normalized):
            output.setdefault(normalized[:-1], row)
    return output


def expected_metafields(rows: list[base_import.WorkbookRow | None], require_complete: bool) -> tuple[dict[str, str], list[str]]:
    reasons: list[str] = []
    usable_rows = [row for row in rows if row]
    if require_complete and len(usable_rows) != len(rows):
        reasons.append("partial_or_missing_workbook_rows")

    piece_counts = [base_import.parse_piece_count(row.notes) for row in usable_rows if base_import.parse_piece_count(row.notes)]
    ages = sorted({normalize_spaces(row.age) for row in usable_rows if normalize_spaces(row.age)})
    finished_sizes = [normalize_spaces(row.finished_size) for row in usable_rows if normalize_spaces(row.finished_size)]
    package_sizes = sorted({normalize_spaces(row.package_size) for row in usable_rows if normalize_spaces(row.package_size)})
    series_values = sorted({normalize_spaces(row.series_en) for row in usable_rows if normalize_spaces(row.series_en)})

    expected = {
        "specs.piece_count": str(sum(int(count) for count in piece_counts)) if piece_counts else "",
        "specs.recommended_age": ", ".join(ages),
        "specs.finished_model_size": " / ".join(finished_sizes),
        "specs.package_size": ", ".join(package_sizes),
        "specs.difficulty_level": DIFFICULTY_DEFAULT,
        "custom.series": series_values[0] if len(series_values) == 1 else "",
    }
    return {key: value for key, value in expected.items() if value}, reasons


def fetch_products(admin: ShopifyAdmin) -> list[dict[str, Any]]:
    products: list[dict[str, Any]] = []
    cursor = None
    while True:
        data = admin.graphql(
            """
            query ProductsForMetafieldAudit($cursor: String) {
              products(first: 250, after: $cursor, sortKey: TITLE) {
                pageInfo { hasNextPage endCursor }
                nodes {
                  id
                  handle
                  title
                  status
                  productType
                  variants(first: 100) {
                    nodes { sku }
                  }
                  metafields(first: 100) {
                    nodes {
                      namespace
                      key
                      type
                      value
                    }
                  }
                }
              }
            }
            """,
            {"cursor": cursor},
        )
        page = data["products"]
        products.extend(page["nodes"])
        if not page["pageInfo"]["hasNextPage"]:
            break
        cursor = page["pageInfo"]["endCursor"]
    return products


def audit_rows() -> list[dict[str, str]]:
    workbook = workbook_rows_with_fallbacks()
    admin = ShopifyAdmin()
    products = fetch_products(admin)
    rows: list[dict[str, str]] = []

    for product in products:
        skus = [normalize_sku(variant.get("sku") or "") for variant in product["variants"]["nodes"] if normalize_sku(variant.get("sku") or "")]
        matched_rows = [workbook.get(sku) for sku in skus]
        missing_skus = [sku for sku, row in zip(skus, matched_rows) if not row]
        expected, expected_reasons = expected_metafields(matched_rows, require_complete=len(skus) > 1)
        current = {
            f"{node['namespace']}.{node['key']}": normalize_spaces(node.get("value") or "")
            for node in product["metafields"]["nodes"]
        }
        current_types = {
            f"{node['namespace']}.{node['key']}": node.get("type") or ""
            for node in product["metafields"]["nodes"]
        }

        missing_keys = [key for key in CHECK_KEYS if key in expected and not current.get(key)]
        changed_keys = [key for key in CHECK_KEYS if key in expected and current.get(key) and current.get(key) != expected[key]]
        empty_keys = [key for key in CHECK_KEYS if key in current and not current.get(key)]
        clear_keys = [key for key in CHECK_KEYS if key in current and key not in expected and current.get(key)]
        type_issues = []
        if current.get("specs.piece_count") and current_types.get("specs.piece_count") != "number_integer":
            type_issues.append("specs.piece_count")
        if current.get("specs.piece_count") and not re.fullmatch(r"\d+", current["specs.piece_count"]):
            type_issues.append("specs.piece_count_value")

        if not skus:
            action = "manual_no_sku"
        elif not any(matched_rows):
            action = "manual_no_workbook_match"
        elif expected_reasons:
            action = "partial_workbook_match"
        elif missing_keys or changed_keys or empty_keys or type_issues:
            action = "metafield_issue"
        else:
            action = "ok"

        rows.append(
            {
                "action": action,
                "product_id": product["id"],
                "handle": product["handle"],
                "title": product["title"],
                "status": product["status"],
                "product_type": product.get("productType") or "",
                "skus": "|".join(skus),
                "missing_skus_in_workbook": "|".join(missing_skus),
                "workbook_sheets": "|".join(sorted({row.sheet for row in matched_rows if row})),
                "expected_reasons": "|".join(expected_reasons),
                "missing_keys": "|".join(missing_keys),
                "changed_keys": "|".join(changed_keys),
                "empty_keys": "|".join(empty_keys),
                "clear_keys": "|".join(clear_keys),
                "type_issues": "|".join(type_issues),
                "current_metafields": json.dumps({key: current.get(key, "") for key in CHECK_KEYS if key in current}, ensure_ascii=False, sort_keys=True),
                "expected_metafields": json.dumps(expected, ensure_ascii=False, sort_keys=True),
            }
        )

    return rows


def write_outputs(rows: list[dict[str, str]]) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    plan_csv = OUT_DIR / "metafield-audit-plan.csv"
    result_json = OUT_DIR / "metafield-audit-summary.json"
    with plan_csv.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    action_counts = Counter(row["action"] for row in rows)
    active_action_counts = Counter(row["action"] for row in rows if row["status"] == "ACTIVE")
    issue_rows = [row for row in rows if row["status"] == "ACTIVE" and row["action"] not in {"ok"}]
    summary = {
        "products_checked": len(rows),
        "active_products": sum(1 for row in rows if row["status"] == "ACTIVE"),
        "draft_products": sum(1 for row in rows if row["status"] == "DRAFT"),
        "action_counts": dict(action_counts),
        "active_action_counts": dict(active_action_counts),
        "plan_csv": str(plan_csv),
        "issue_preview": issue_rows[:100],
    }
    result_json.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


def main() -> int:
    rows = audit_rows()
    write_outputs(rows)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
