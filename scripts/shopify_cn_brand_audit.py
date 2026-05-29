#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

import shopify_cn_pending_import as cn_import
import shopify_sample_import as base_import
from shopify_cn_product_audit import ShopifyAdmin


OUT_DIR = Path("/private/tmp/jiestar-shopify-cn-brand-audit")
BRICK4_BRAND_JIESTAR = "52"


class ShopifyAdminWithStatus(ShopifyAdmin):
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
        base_import.assert_no_user_errors("productUpdate", data["productUpdate"]["userErrors"])


def brick4_lookup(sku: str) -> dict[str, Any]:
    url = "https://brick4.com/get/set?" + urllib.parse.urlencode({"s": sku})
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json,text/plain,*/*",
            "User-Agent": "Mozilla/5.0 JIESTAR product audit",
        },
    )

    with urllib.request.urlopen(request, timeout=45) as response:
        payload = json.loads(response.read().decode("utf-8"))

    exact_matches = []
    for item in payload.get("data") or []:
        for setnumber in item.get("setnumber") or []:
            if str(setnumber.get("setnumber", "")).strip().upper() != sku.upper():
                continue

            exact_matches.append(
                {
                    "brick4_set_id": item.get("id", ""),
                    "title": item.get("title", ""),
                    "subtitle": item.get("subtitle", ""),
                    "pcs": item.get("pcs", ""),
                    "theme": item.get("theme", ""),
                    "released": item.get("released", ""),
                    "brand_id": str(setnumber.get("brand", "")),
                    "brandkeyword": setnumber.get("brandkeyword", ""),
                    "url": f"https://brick4.com/set/{item.get('id', '')}/{item.get('title2url', '')}",
                }
            )

    return {
        "sku": sku,
        "exact_matches": exact_matches,
        "has_jiestar": any(match["brand_id"] == BRICK4_BRAND_JIESTAR for match in exact_matches),
        "brands": sorted({match["brand_id"] for match in exact_matches if match["brand_id"]}),
        "brandkeywords": sorted({match["brandkeyword"] for match in exact_matches if match["brandkeyword"]}),
    }


def workbook_has_any_row(rows_by_sku: dict[str, base_import.WorkbookRow], skus: list[str]) -> bool:
    return any(cn_import.row_for_sku(rows_by_sku, sku) is not None for sku in skus)


def build_plan() -> tuple[list[dict[str, str]], dict[str, int]]:
    rows_by_sku = base_import.load_workbook_rows()
    manifest, _ = cn_import.build_manifest()
    admin = ShopifyAdminWithStatus()
    products_by_handle = {product.handle: product for product in admin.products()}
    cache: dict[str, dict[str, Any]] = {}
    rows = []

    for item in manifest:
        product = products_by_handle.get(item["handle"])
        if not product:
            continue

        skus = [variant["sku"] for variant in item["variants"]]
        has_workbook = workbook_has_any_row(rows_by_sku, skus)
        brick4_results = []

        if not has_workbook:
            for sku in skus:
                if sku not in cache:
                    cache[sku] = brick4_lookup(sku)
                    time.sleep(0.15)
                brick4_results.append(cache[sku])

        has_jiestar = any(result["has_jiestar"] for result in brick4_results)
        exact_found = any(result["exact_matches"] for result in brick4_results)
        non_jiestar_hits = [
            match
            for result in brick4_results
            for match in result["exact_matches"]
            if match["brand_id"] != BRICK4_BRAND_JIESTAR
        ]

        action = "keep_excel"
        reason = "excel_row_exists"
        target_status = product.status

        if not has_workbook:
            if has_jiestar:
                action = "keep_brick4_jiestar"
                reason = "brick4_has_jiestar"
            elif exact_found:
                action = "draft_non_jiestar"
                reason = "brick4_exact_match_non_jiestar"
                target_status = "DRAFT"
            else:
                action = "draft_unverified"
                reason = "no_excel_and_no_brick4_exact_match"
                target_status = "DRAFT"

        rows.append(
            {
                "folder": item["base"],
                "handle": product.handle,
                "product_id": product.id,
                "current_status": product.status,
                "target_status": target_status,
                "title": product.title,
                "skus": "|".join(skus),
                "has_workbook_row": "true" if has_workbook else "false",
                "brick4_has_jiestar": "true" if has_jiestar else "false",
                "brick4_exact_found": "true" if exact_found else "false",
                "brick4_non_jiestar_matches": json.dumps(non_jiestar_hits[:8], ensure_ascii=False),
                "action": action,
                "reason": reason,
            }
        )

    summary = {
        "products_checked": len(rows),
        "keep_excel": sum(1 for row in rows if row["action"] == "keep_excel"),
        "keep_brick4_jiestar": sum(1 for row in rows if row["action"] == "keep_brick4_jiestar"),
        "draft_non_jiestar": sum(1 for row in rows if row["action"] == "draft_non_jiestar"),
        "draft_unverified": sum(1 for row in rows if row["action"] == "draft_unverified"),
        "already_draft": sum(1 for row in rows if row["target_status"] == "DRAFT" and row["current_status"] == "DRAFT"),
        "to_update_draft": sum(1 for row in rows if row["target_status"] == "DRAFT" and row["current_status"] != "DRAFT"),
    }
    return rows, summary


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "folder",
        "handle",
        "product_id",
        "current_status",
        "target_status",
        "title",
        "skus",
        "has_workbook_row",
        "brick4_has_jiestar",
        "brick4_exact_found",
        "brick4_non_jiestar_matches",
        "action",
        "reason",
    ]
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def apply_draft(rows: list[dict[str, str]]) -> list[dict[str, Any]]:
    admin = ShopifyAdminWithStatus()
    results = []
    for row in rows:
        if row["target_status"] != "DRAFT" or row["current_status"] == "DRAFT":
            continue

        result = {"folder": row["folder"], "handle": row["handle"], "ok": False}
        try:
            admin.update_status(row["product_id"], "DRAFT")
            result["ok"] = True
        except Exception as error:  # noqa: BLE001 - batch should report all failures.
            result["error"] = str(error)
        results.append(result)
        time.sleep(0.15)
    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit uploaded CN products against workbook rows and Brick4 brand data.")
    parser.add_argument("--apply-draft", action="store_true", help="Set non-JIESTAR/unverified products to DRAFT.")
    parser.add_argument("--yes", action="store_true", help="Required with --apply-draft.")
    parser.add_argument("--plan-csv", default=str(OUT_DIR / "cn-brand-audit-plan.csv"))
    parser.add_argument("--result-json", default=str(OUT_DIR / "cn-brand-audit-result.json"))
    args = parser.parse_args()

    if args.apply_draft and not args.yes:
        raise SystemExit("--apply-draft requires --yes")

    rows, summary = build_plan()
    write_csv(Path(args.plan_csv), rows)
    payload: dict[str, Any] = {
        "summary": summary,
        "plan_csv": args.plan_csv,
        "draft_preview": [row for row in rows if row["target_status"] == "DRAFT"][:50],
    }

    if args.apply_draft:
        results = apply_draft(rows)
        payload["apply_results"] = {
            "attempted": len(results),
            "ok": sum(1 for result in results if result["ok"]),
            "failed": sum(1 for result in results if not result["ok"]),
            "rows": results,
        }

    Path(args.result_json).parent.mkdir(parents=True, exist_ok=True)
    Path(args.result_json).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
