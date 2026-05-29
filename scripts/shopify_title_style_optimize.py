#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import re
import time
from pathlib import Path
from typing import Any

from shopify_title_cleanup import Product, ShopifyAdmin, normalize_spaces


OUT_DIR = Path("/private/tmp/jiestar-shopify-title-style")
BATCH_SIZE = 25

PACK_RE = re.compile(r"\b(\d+)\s*-\s*Pack\b", re.I)
LED_RE = re.compile(r"\s+with\s+LED\s+Lights\b", re.I)
GENERIC_SET_RE = re.compile(
    r"\s+(?:Building\s+Block\s+Set|Building\s+Blocks\s+Set|Block\s+Set|Building\s+Set|Model\s+Kit|Building\s+Toy\s+Set|Bundle\s+Set)\b",
    re.I,
)

MODEL_KEYWORDS = [
    "aircraft",
    "airplane",
    "amphibious",
    "armored",
    "artillery",
    "auto-9",
    "bike",
    "blaster",
    "bomber",
    "boat",
    "bulldozer",
    "car",
    "carrier",
    "cement mixer",
    "coupe",
    "crane",
    "crawler",
    "dozer",
    "drilling platform",
    "drone",
    "dt v10",
    "engine",
    "excavator",
    "fighter",
    "forklift",
    "gt2",
    "helicopter",
    "harvester",
    "hypercar",
    "hypersport",
    "jet",
    "liner",
    "loader",
    "locomotive",
    "mecha",
    "mechanical",
    "missile",
    "model",
    "motorcycle",
    "off-road",
    "patrol boat",
    "plane",
    "racer",
    "racing",
    "railway express",
    "rescue boat",
    "r8",
    "rifle",
    "robot",
    "sailboat",
    "shotgun",
    "ship",
    "shuttle",
    "sports car",
    "stf12",
    "submarine",
    "supercar",
    "suv",
    "tank",
    "tractor",
    "train",
    "transport",
    "truck",
    "vehicle",
    "warship",
]

TOY_KEYWORDS = [
    "activity table",
    "baby",
    "baby walker",
    "basketball hoop",
    "biting tiger",
    "cash register",
    "climbing monkey",
    "foot piano",
    "game room",
    "giraffe",
    "hammer ball",
    "hand drum",
    "interactive game",
    "musical activity",
    "musical instrument",
    "piano",
    "projection piano",
    "rocking chair",
    "toy mall",
    "play house",
    "study table",
    "xylophone",
]

BUILDING_KEYWORDS = [
    "bakery",
    "bank",
    "bar",
    "book shop",
    "book store",
    "cabin",
    "cafe",
    "castle",
    "cottage",
    "courtyard",
    "farm",
    "flower",
    "garden",
    "general store",
    "hall",
    "hospital",
    "hotel",
    "house",
    "library",
    "mall",
    "mine",
    "office",
    "plaza",
    "restaurant",
    "shop",
    "shopping",
    "station",
    "store",
    "street",
    "tower",
    "townhouse",
]


def strip_brand(title: str) -> str:
    title = normalize_spaces(title)
    title = re.sub(r"^jie\s*star\s+", "", title, flags=re.I)
    title = re.sub(r"^jiestar\s+", "", title, flags=re.I)
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


def contains_any(value: str, keywords: list[str]) -> bool:
    lower = value.lower()
    return any(keyword in lower for keyword in keywords)


def classify_title(core: str, pack: str) -> str:
    if pack:
        return "Bundle Set"

    if contains_any(core, TOY_KEYWORDS):
        return "Building Toy Set"

    if contains_any(core, BUILDING_KEYWORDS):
        return "Building Set"

    if contains_any(core, MODEL_KEYWORDS):
        return "Model Kit"

    return "Building Set"


def title_case_if_needed(core: str) -> str:
    if core.isupper() and len(core) > 4:
        return core.title()
    if core[:1].islower():
        return core.title()
    return core


def optimized_title(product: Product, include_draft: bool = False) -> tuple[str | None, str]:
    if product.status == "DRAFT" and not include_draft:
        return None, "skip:draft"

    old_title = product.title
    core, pack, led = split_suffix_bits(strip_brand(old_title))
    core = title_case_if_needed(core)

    if not core:
        return None, "skip:empty-core"

    suffix = classify_title(core, pack)

    if suffix == "Model Kit" and core.lower().endswith(" model"):
        core = normalize_spaces(core[:-6])

    pieces = ["JIESTAR", core, suffix]

    if pack:
        pieces.append(pack)

    new_title = normalize_spaces(" ".join(pieces) + led)
    new_title = re.sub(r"\bDt V10\b", "DT V10", new_title)
    new_title = re.sub(r"\bStf12\b", "STF12", new_title)

    if new_title == normalize_spaces(old_title):
        return None, "skip:no-change"

    reasons = ["style-optimized"]

    if not old_title.upper().startswith("JIESTAR "):
        reasons.append("add-brand-prefix")

    if "Building Block Set" in old_title or "Building Blocks Set" in old_title:
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


def build_plan(products: list[Product], include_draft: bool = False) -> list[dict[str, str]]:
    rows = []

    for product in products:
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
            }
        )

    return rows


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = ["id", "handle", "old_title", "new_title", "reason", "status", "vendor"]

    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def summarize(rows: list[dict[str, str]], products: list[Product]) -> dict[str, int]:
    return {
        "products_seen": len(products),
        "planned_updates": len(rows),
        "active_updates": sum(1 for row in rows if row["status"] == "ACTIVE"),
        "draft_updates": sum(1 for row in rows if row["status"] == "DRAFT"),
        "bundle_set": sum("Bundle Set" in row["new_title"] for row in rows),
        "model_kit": sum("Model Kit" in row["new_title"] for row in rows),
        "building_toy_set": sum("Building Toy Set" in row["new_title"] for row in rows),
        "building_set": sum("Building Set" in row["new_title"] for row in rows),
        "add_brand_prefix": sum("add-brand-prefix" in row["reason"] for row in rows),
    }


def apply_updates(admin: ShopifyAdmin, rows: list[dict[str, str]], batch_size: int) -> list[dict[str, str]]:
    results = []

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


def verify_after(admin: ShopifyAdmin, planned_rows: list[dict[str, str]]) -> dict[str, Any]:
    products_by_id = {product.id: product for product in admin.products()}
    failures = []

    for row in planned_rows:
        product = products_by_id.get(row["id"])

        if not product:
            failures.append({**row, "verify_error": "product-missing"})
        elif product.title != row["new_title"]:
            failures.append({**row, "actual_title": product.title, "verify_error": "title-not-updated"})

    return {"checked": len(planned_rows), "failures": failures}


def main() -> int:
    parser = argparse.ArgumentParser(description="Optimize Shopify product title style without changing handles or product data.")
    parser.add_argument("--apply", action="store_true", help="Apply title updates through Shopify Admin API.")
    parser.add_argument("--yes", action="store_true", help="Required with --apply.")
    parser.add_argument("--include-draft", action="store_true", help="Also update DRAFT products.")
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE)
    parser.add_argument("--plan-csv", default=str(OUT_DIR / "title-style-plan.csv"))
    parser.add_argument("--result-json", default=str(OUT_DIR / "title-style-result.json"))
    args = parser.parse_args()

    if args.apply and not args.yes:
        raise SystemExit("--apply requires --yes")

    admin = ShopifyAdmin()
    products = admin.products()
    rows = build_plan(products, include_draft=args.include_draft)
    write_csv(Path(args.plan_csv), rows)

    payload: dict[str, Any] = {
        "plan_csv": args.plan_csv,
        "summary": summarize(rows, products),
        "preview": rows[:40],
        "note": "Only productUpdate(id, title) is used during apply. SKU, price, inventory, media, handle, description, category, and status are not modified.",
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

    write_json(Path(args.result_json), payload)
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
