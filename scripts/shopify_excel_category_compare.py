#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pandas as pd

from shopify_collection_audit import ShopifyAdmin, website_primary_collection


EXCEL_PATH = Path("/Volumes/ORICO/jiestar电商图/杰星整理表.xlsx")
OUT_DIR = Path("/private/tmp/jiestar-shopify-category-excel-compare")


CATEGORY_TO_SHOPIFY = {
    "Aerospace": "Space",
    "Amusement Park": "Fairground",
    "Diving": "Ocean & Underwater",
    "Gun Model": "Gun",
    "Motorcycle": "Car Model",
    "Ocean": "Ocean & Underwater",
    "Pirate": "Pirates",
    "Ship": "Ship Model",
    "Train": "Trains",
    "Underwater": "Ocean & Underwater",
}


@dataclass
class ExcelRow:
    sku: str
    sheet: str
    series_en: str
    shopify_category: str
    product_name_en: str
    source: str


def normalize_sku(value: Any) -> str:
    text = str(value or "").strip().upper()
    if not text or text == "NAN":
        return ""
    text = re.sub(r"\s+", "", text)
    if text.endswith(".0") and text[:-2].isdigit():
        text = text[:-2]
    return text


def normalize_category(value: str) -> str:
    value = str(value or "").strip()
    if not value:
        return ""
    return CATEGORY_TO_SHOPIFY.get(value, value)


def excel_catalog(path: Path) -> dict[str, list[ExcelRow]]:
    catalog: dict[str, list[ExcelRow]] = {}
    workbook = pd.ExcelFile(path)

    for sheet_name in workbook.sheet_names:
        df = pd.read_excel(path, sheet_name=sheet_name)
        if "货号" not in df.columns:
            continue

        has_series = "Series (EN)" in df.columns
        name_col = "Product Name (EN)" if "Product Name (EN)" in df.columns else "Name (EN)" if "Name (EN)" in df.columns else ""

        for _, row in df.iterrows():
            sku = normalize_sku(row.get("货号"))
            if not sku:
                continue

            series_en = ""
            if has_series:
                series_en = str(row.get("Series (EN)") or "").strip()
                if series_en.upper() == "NAN":
                    series_en = ""

            product_name_en = str(row.get(name_col) or "").strip() if name_col else ""
            if product_name_en.upper() == "NAN":
                product_name_en = ""

            excel_row = ExcelRow(
                sku=sku,
                sheet=sheet_name,
                series_en=series_en,
                shopify_category=normalize_category(series_en),
                product_name_en=product_name_en,
                source="exact",
            )
            catalog.setdefault(sku, []).append(excel_row)

            # Some baby-series SKUs include an E suffix in Excel, while the Shopify SKU/title may omit it.
            if re.fullmatch(r"\d+E", sku):
                fallback = sku[:-1]
                catalog.setdefault(fallback, []).append(
                    ExcelRow(
                        sku=sku,
                        sheet=sheet_name,
                        series_en=series_en,
                        shopify_category=normalize_category(series_en),
                        product_name_en=product_name_en,
                        source="stripped_e_fallback",
                    )
                )

    return catalog


def compare() -> tuple[list[dict[str, str]], dict[str, Any]]:
    catalog = excel_catalog(EXCEL_PATH)
    admin = ShopifyAdmin()
    products = admin.products()
    rows: list[dict[str, str]] = []

    for product in products:
        matched: list[ExcelRow] = []
        missing_skus: list[str] = []
        for sku in product.skus:
            normalized_sku = normalize_sku(sku)
            matches = catalog.get(normalized_sku, [])
            if matches:
                matched.extend(matches)
            else:
                missing_skus.append(normalized_sku)

        excel_categories = sorted({row.shopify_category for row in matched if row.shopify_category})
        excel_series = sorted({row.series_en for row in matched if row.series_en})
        excel_sheets = sorted({row.sheet for row in matched})
        excel_names = sorted({row.product_name_en for row in matched if row.product_name_en})
        match_sources = sorted({row.source for row in matched})
        current_normalized = normalize_category(product.product_type)

        if product.status == "DRAFT":
            action = "skip_draft"
        elif not matched:
            action = "no_excel_match"
        elif not excel_categories:
            action = "excel_no_category"
        elif len(excel_categories) == 1 and current_normalized == excel_categories[0]:
            action = "ok"
        elif len(excel_categories) > 1 and current_normalized in excel_categories:
            action = "ok_multi_sku"
        elif len(excel_categories) == 1:
            action = "mismatch"
        else:
            action = "multi_sku_mismatch"

        rows.append(
            {
                "action": action,
                "product_id": product.id,
                "handle": product.handle,
                "title": product.title,
                "status": product.status,
                "shopify_product_type": product.product_type,
                "shopify_product_type_normalized": current_normalized,
                "shopify_primary_collection": website_primary_collection(product),
                "skus": "|".join(product.skus),
                "missing_skus_in_excel": "|".join(missing_skus),
                "excel_series_en": "|".join(excel_series),
                "excel_shopify_categories": "|".join(excel_categories),
                "excel_sheets": "|".join(excel_sheets),
                "excel_product_names_en": "|".join(excel_names[:8]),
                "match_sources": "|".join(match_sources),
            }
        )

    active_rows = [row for row in rows if row["status"] == "ACTIVE"]
    action_counts: dict[str, int] = {}
    active_action_counts: dict[str, int] = {}
    for row in rows:
        action_counts[row["action"]] = action_counts.get(row["action"], 0) + 1
    for row in active_rows:
        active_action_counts[row["action"]] = active_action_counts.get(row["action"], 0) + 1

    summary = {
        "excel_path": str(EXCEL_PATH),
        "excel_sku_keys": len(catalog),
        "products_checked": len(rows),
        "active_products": len(active_rows),
        "draft_products": sum(1 for row in rows if row["status"] == "DRAFT"),
        "action_counts": action_counts,
        "active_action_counts": active_action_counts,
    }
    return rows, summary


def write_outputs(rows: list[dict[str, str]], summary: dict[str, Any]) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    csv_path = OUT_DIR / "category-excel-compare.csv"
    json_path = OUT_DIR / "category-excel-compare-summary.json"

    with csv_path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    problem_rows = [row for row in rows if row["status"] == "ACTIVE" and row["action"] not in {"ok", "ok_multi_sku"}]
    summary = {
        **summary,
        "csv_path": str(csv_path),
        "problem_preview": problem_rows[:80],
    }
    json_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


def main() -> int:
    rows, summary = compare()
    write_outputs(rows, summary)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
