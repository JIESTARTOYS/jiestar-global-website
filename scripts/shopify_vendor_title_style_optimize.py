#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from shopify_title_cleanup import ShopifyAdmin, normalize_spaces
from shopify_title_style_optimize import (
    BUILDING_KEYWORDS,
    GENERIC_SET_RE,
    LED_RE,
    MODEL_KEYWORDS,
    PACK_RE,
    TOY_KEYWORDS,
    contains_any,
)


OUT_DIR = Path("/private/tmp/jiestar-shopify-vendor-title-style")
BATCH_SIZE = 25
DEFAULT_VENDORS = ("Xbert", "Zoin", "iBlock")
EXTRA_MODEL_KEYWORDS = [
    "ambulance",
    "bus",
    "chainsword",
    "fire station",
    "rescue",
    "sword",
    "van",
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


class VendorTitleAdmin(ShopifyAdmin):
    def products(self) -> list[Product]:
        products: list[Product] = []
        cursor: str | None = None

        while True:
            data = self.graphql(
                """
                query ProductsForVendorTitleStyle($cursor: String) {
                  products(first: 250, after: $cursor, sortKey: ID) {
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
                      variants(first: 250) {
                        nodes {
                          sku
                        }
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
                    Product(
                        id=node["id"],
                        handle=node["handle"],
                        title=node["title"],
                        status=node["status"],
                        vendor=node.get("vendor") or "",
                        product_type=node.get("productType") or "",
                        skus=[(variant.get("sku") or "").strip() for variant in node["variants"]["nodes"] if variant.get("sku")],
                    )
                )
            if not page["pageInfo"]["hasNextPage"]:
                break
            cursor = page["pageInfo"]["endCursor"]

        return products


def strip_vendor(title: str, vendor: str) -> str:
    title = normalize_spaces(title)
    vendor = normalize_spaces(vendor)
    if vendor:
        title = re.sub(rf"^{re.escape(vendor)}\s+", "", title, flags=re.I)
    return normalize_spaces(title)


def split_suffix_bits(title: str) -> tuple[str, str, str]:
    title = normalize_spaces(title)
    led = ""
    pack = ""

    led_match = LED_RE.search(title)
    if led_match:
        led = " with LED Lights"
        title = normalize_spaces(title[: led_match.start()] + title[led_match.end() :])

    pack_match = PACK_RE.search(title)
    if pack_match:
        pack = f"{int(pack_match.group(1))}-Pack"
        title = normalize_spaces(title[: pack_match.start()] + title[pack_match.end() :])

    title = GENERIC_SET_RE.sub("", title)
    title = normalize_spaces(title)
    return title, pack, led


def title_case_if_needed(core: str) -> str:
    if core.isupper() and len(core) > 4:
        return core.title()
    if core[:1].islower():
        return core.title()
    return core


def classify_suffix(core: str, product_type: str, pack: str) -> str:
    if pack:
        return "Bundle Set"

    scope = normalize_spaces(f"{product_type} {core}")
    if contains_any(scope, TOY_KEYWORDS) or contains_any(scope, ["blind box", "play set"]):
        return "Building Toy Set"
    if contains_any(scope, BUILDING_KEYWORDS):
        return "Building Set"
    if contains_any(scope, MODEL_KEYWORDS) or contains_any(scope, EXTRA_MODEL_KEYWORDS):
        return "Model Kit"
    return "Building Set"


def optimized_title(product: Product, include_draft: bool = False) -> tuple[str | None, str]:
    if product.status == "DRAFT" and not include_draft:
        return None, "skip:draft"
    if not product.vendor:
        return None, "skip:missing-vendor"

    core, pack, led = split_suffix_bits(strip_vendor(product.title, product.vendor))
    core = title_case_if_needed(core)

    if not core:
        return None, "skip:empty-core"

    suffix = classify_suffix(core, product.product_type, pack)

    if suffix == "Model Kit" and core.lower().endswith(" model"):
        core = normalize_spaces(core[:-6])

    pieces = [product.vendor, core, suffix]
    if pack:
        pieces.append(pack)
    new_title = normalize_spaces(" ".join(pieces) + led)
    new_title = re.sub(r"\b(\d+)-Model\s+Model\s+Kit\b", r"\1-Model Kit", new_title)
    new_title = re.sub(r"\b(\d+)-Model\s+Kit\s+Model\s+Kit\b", r"\1-Model Kit", new_title)

    if re.search(r"\bModel\s+Kit\b", product.title, re.I) and not re.search(r"\bModel\s+Kit\b", new_title, re.I):
        return None, "skip:do-not-downgrade-model-kit"

    if new_title == normalize_spaces(product.title):
        return None, "skip:no-change"

    reasons = ["style-optimized"]
    if "Building Block Set" in product.title or "Building Blocks Set" in product.title:
        reasons.append("replace-building-block-set")
    if pack:
        reasons.append("bundle")
    elif suffix == "Model Kit":
        reasons.append("model-kit")
    elif suffix == "Building Toy Set":
        reasons.append("building-toy-set")
    else:
        reasons.append("building-set")

    return new_title, "; ".join(reasons)


def build_plan(products: list[Product], vendors: set[str], include_draft: bool = False) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []

    for product in products:
        if product.vendor not in vendors:
            continue
        new_title, reason = optimized_title(product, include_draft=include_draft)
        if not new_title:
            continue
        rows.append(
            {
                "id": product.id,
                "handle": product.handle,
                "old_title": product.title,
                "new_title": new_title,
                "reason": reason,
                "status": product.status,
                "vendor": product.vendor,
                "product_type": product.product_type,
                "skus": ", ".join(product.skus),
            }
        )

    return rows


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = ["id", "handle", "old_title", "new_title", "reason", "status", "vendor", "product_type", "skus"]
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def summarize(rows: list[dict[str, str]], products: list[Product], vendors: set[str]) -> dict[str, Any]:
    scoped = [product for product in products if product.vendor in vendors]
    return {
        "vendors": sorted(vendors),
        "products_seen": len(scoped),
        "planned_updates": len(rows),
        "active_updates": sum(1 for row in rows if row["status"] == "ACTIVE"),
        "draft_updates": sum(1 for row in rows if row["status"] == "DRAFT"),
        "bundle_set": sum("Bundle Set" in row["new_title"] for row in rows),
        "model_kit": sum("Model Kit" in row["new_title"] for row in rows),
        "building_toy_set": sum("Building Toy Set" in row["new_title"] for row in rows),
        "building_set": sum("Building Set" in row["new_title"] for row in rows),
        "building_block_set_remaining_in_plan": sum("Building Block Set" in row["new_title"] for row in rows),
    }


def apply_updates(admin: VendorTitleAdmin, rows: list[dict[str, str]], batch_size: int) -> list[dict[str, str]]:
    results: list[dict[str, str]] = []

    for index, row in enumerate(rows, start=1):
        result = dict(row)
        try:
            admin.update_title(row["id"], row["new_title"])
            result["ok"] = "true"
            result["error"] = ""
        except Exception as error:  # noqa: BLE001 - batch should continue and report failures.
            result["ok"] = "false"
            result["error"] = str(error)
        results.append(result)

        if index % batch_size == 0:
            print(f"updated {index}/{len(rows)} title rows", flush=True)
            time.sleep(2)

    if rows:
        print(f"updated {len(rows)}/{len(rows)} title rows", flush=True)
    return results


def verify_after(admin: VendorTitleAdmin, planned_rows: list[dict[str, str]]) -> dict[str, Any]:
    products_by_id = {product.id: product for product in admin.products()}
    failures: list[dict[str, str]] = []

    for row in planned_rows:
        product = products_by_id.get(row["id"])
        if not product:
            failures.append({**row, "actual_title": "", "verify_error": "product-missing"})
        elif product.title != row["new_title"]:
            failures.append({**row, "actual_title": product.title, "verify_error": "title-not-updated"})

    return {"checked": len(planned_rows), "failures": failures}


def parse_vendors(value: str) -> set[str]:
    vendors = {normalize_spaces(part) for part in value.split(",") if normalize_spaces(part)}
    if not vendors:
        raise argparse.ArgumentTypeError("at least one vendor is required")
    return vendors


def main() -> int:
    parser = argparse.ArgumentParser(description="Optimize Shopify title style for non-JIESTAR vendors without changing handles or product data.")
    parser.add_argument("--vendors", type=parse_vendors, default=set(DEFAULT_VENDORS), help="Comma-separated vendor list. Default: Xbert,Zoin,iBlock")
    parser.add_argument("--apply", action="store_true", help="Apply title updates through Shopify Admin API.")
    parser.add_argument("--yes", action="store_true", help="Required with --apply.")
    parser.add_argument("--include-draft", action="store_true", help="Also update DRAFT products.")
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE)
    parser.add_argument("--plan-csv", default=str(OUT_DIR / "vendor-title-style-plan.csv"))
    parser.add_argument("--result-json", default=str(OUT_DIR / "vendor-title-style-result.json"))
    args = parser.parse_args()

    if args.apply and not args.yes:
        raise SystemExit("--apply requires --yes")

    admin = VendorTitleAdmin()
    products = admin.products()
    rows = build_plan(products, vendors=args.vendors, include_draft=args.include_draft)
    write_csv(Path(args.plan_csv), rows)

    payload: dict[str, Any] = {
        "plan_csv": args.plan_csv,
        "summary": summarize(rows, products, args.vendors),
        "preview": rows[:40],
        "note": "Only productUpdate(id, title) is used during apply. SKU, price, inventory, media, handle, description, category, status, and metafields are not modified.",
    }

    if args.apply:
        results = apply_updates(admin, rows, batch_size=args.batch_size)
        payload["apply_results"] = {
            "attempted": len(results),
            "ok": sum(1 for row in results if row["ok"] == "true"),
            "failed": sum(1 for row in results if row["ok"] != "true"),
            "rows": results,
        }
        payload["verification"] = verify_after(admin, rows)

    Path(args.result_json).parent.mkdir(parents=True, exist_ok=True)
    Path(args.result_json).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
