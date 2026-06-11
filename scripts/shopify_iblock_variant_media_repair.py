#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import time
from collections import defaultdict
from pathlib import Path
from typing import Any

from shopify_iblock_pending_import import REQUIRED_SCOPES, ShopifyAdmin, build_manifest, clean


OUT_DIR = Path("/private/tmp/jiestar-shopify-iblock-variant-media-repair")
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def natural_key(value: Any) -> list[Any]:
    return [int(part) if part.isdigit() else part.lower() for part in re.split(r"(\d+)", str(value))]


def file_prefix(path: Path) -> str:
    return path.name.split("__", 1)[0].upper() if "__" in path.name else ""


def image_role(path: Path) -> str:
    name = path.name
    lower = name.lower()
    if "详情" in name or "detail" in lower:
        return "detail"
    if "-sku" in lower:
        return "sku"
    if "白底" in name:
        return "white"
    return "main"


def candidate_score(path: Path) -> tuple[int, list[Any]]:
    name = path.name
    lower = name.lower()
    if re.search(r"-sku\.[a-z0-9]+$", lower):
        base = 0
    elif "白底" in name:
        base = 1
    elif image_role(path) == "main":
        base = 2
    elif "-sku" in lower:
        base = 3
    elif "brick4" in lower:
        base = 4
    else:
        base = 5
    return (base, natural_key(name))


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def group_image_files(folder: Path) -> list[Path]:
    if not folder.exists():
        return []
    return sorted(
        [
            path
            for path in folder.iterdir()
            if path.is_file()
            and path.suffix.lower() in IMAGE_EXTS
            and not path.name.startswith("._")
            and image_role(path) != "detail"
        ],
        key=lambda path: natural_key(path.name),
    )


def choose_variant_images(item: dict[str, Any]) -> tuple[dict[str, Path], dict[str, str]]:
    folder = Path(item["folder_path"])
    variants = [variant["sku"].upper() for variant in item["variants"]]
    files = group_image_files(folder)
    candidates_by_sku = {
        sku: sorted([path for path in files if file_prefix(path) == sku], key=candidate_score)
        for sku in variants
    }
    hash_skus: dict[str, set[str]] = defaultdict(set)
    for sku, candidates in candidates_by_sku.items():
        for path in candidates:
            hash_skus[sha256_file(path)].add(sku)

    selected: dict[str, Path] = {}
    issues: dict[str, str] = {}
    for sku, candidates in candidates_by_sku.items():
        if not candidates:
            issues[sku] = "missing_local_variant_image"
            continue
        unique_candidates = [path for path in candidates if len(hash_skus[sha256_file(path)]) == 1]
        selected[sku] = (unique_candidates or candidates)[0]
        if not unique_candidates:
            issues[sku] = "no_unique_variant_image"
    return selected, issues


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fieldnames})


def index_products_by_sku(products: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    by_sku: dict[str, dict[str, Any]] = {}
    for product in products:
        for variant in product.get("variants", {}).get("nodes", []):
            sku = clean(variant.get("sku")).upper()
            if sku:
                by_sku[sku] = product
    return by_sku


def build_plan(admin: ShopifyAdmin, groups: set[str] | None) -> tuple[list[dict[str, Any]], list[dict[str, str]]]:
    manifest, skipped, _piece_count_gaps, _product_type_plan = build_manifest()
    if skipped:
        raise RuntimeError(f"Local iBlock manifest has skipped rows: {len(skipped)}")
    products = admin.fetch_iblock_products()
    by_sku = index_products_by_sku(products)
    plan: list[dict[str, Any]] = []
    issues: list[dict[str, str]] = []

    for item in manifest:
        if groups and item["folder"] not in groups:
            continue
        if len(item["variants"]) <= 1:
            continue
        selected, local_issues = choose_variant_images(item)
        variant_skus = [variant["sku"].upper() for variant in item["variants"]]
        matched_products = {by_sku[sku]["id"]: by_sku[sku] for sku in variant_skus if sku in by_sku}
        if len(matched_products) != 1:
            issues.append({"upload_group": item["folder"], "issue": "variant_skus_not_in_one_shopify_product", "value": ",".join(sorted(matched_products))})
            continue
        product = next(iter(matched_products.values()))
        fetched = admin.fetch_product(product["id"])
        media_by_alt = {clean(media.get("alt")): media for media in fetched["media"]["nodes"]}
        expected_by_sku = {}
        missing_alts = []
        current_by_sku = {}
        for variant in fetched["variants"]["nodes"]:
            sku = clean(variant.get("sku")).upper()
            current_by_sku[sku] = "; ".join(clean(node.get("alt")) for node in variant.get("media", {}).get("nodes", []))
        for sku, path in selected.items():
            alt = f"{clean(product.get('title')) or item['title']} SKU image - {path.name}"
            expected_by_sku[sku] = alt
            if alt not in media_by_alt:
                missing_alts.append(alt)
        for sku, issue in local_issues.items():
            issues.append({"upload_group": item["folder"], "sku": sku, "issue": issue, "value": selected.get(sku, "")})
        plan.append(
            {
                "upload_group": item["folder"],
                "product_id": product["id"],
                "handle": product.get("handle", ""),
                "title": clean(product.get("title")) or item["title"],
                "item": item,
                "selected": selected,
                "expected_by_sku": expected_by_sku,
                "current_by_sku": current_by_sku,
                "missing_media_count": len(missing_alts),
                "variant_count": len(variant_skus),
            }
        )
    return plan, issues


def apply_row(admin: ShopifyAdmin, row: dict[str, Any]) -> dict[str, Any]:
    product_id = row["product_id"]
    product = admin.fetch_product(product_id)
    existing_alts = {clean(media.get("alt")) for media in product["media"]["nodes"]}
    media_inputs = []
    for path in row["selected"].values():
        alt = f"{row['title']} SKU image - {path.name}"
        if alt not in existing_alts:
            media_inputs.append({"originalSource": admin.stage_upload(path), "alt": alt, "mediaContentType": "IMAGE"})
    if media_inputs:
        admin.product_update_media(product_id, media_inputs)
        time.sleep(8)

    product = admin.fetch_product(product_id)
    media_by_alt = {clean(media.get("alt")): media["id"] for media in product["media"]["nodes"]}
    detach_inputs = []
    attach_inputs = []
    expected_by_sku = row["expected_by_sku"]
    for variant in product["variants"]["nodes"]:
        sku = clean(variant.get("sku")).upper()
        expected_alt = expected_by_sku.get(sku)
        media_id = media_by_alt.get(expected_alt or "")
        if not media_id:
            continue
        current_ids = [node["id"] for node in variant.get("media", {}).get("nodes", []) if node.get("id")]
        if current_ids:
            detach_inputs.append({"variantId": variant["id"], "mediaIds": current_ids})
        attach_inputs.append({"variantId": variant["id"], "mediaIds": [media_id]})
    admin.detach_variant_media(product_id, detach_inputs)
    admin.append_variant_media(product_id, attach_inputs)
    time.sleep(2)

    verified = admin.fetch_product(product_id)
    mismatches = []
    for variant in verified["variants"]["nodes"]:
        sku = clean(variant.get("sku")).upper()
        expected_alt = expected_by_sku.get(sku, "")
        current_alts = [clean(node.get("alt")) for node in variant.get("media", {}).get("nodes", [])]
        if expected_alt not in current_alts:
            mismatches.append(f"{sku}: expected {expected_alt}; current {' | '.join(current_alts)}")
    return {
        "upload_group": row["upload_group"],
        "product_id": product_id,
        "handle": row["handle"],
        "ok": not mismatches,
        "uploaded_media_count": len(media_inputs),
        "variant_count": row["variant_count"],
        "mismatches": "; ".join(mismatches),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Repair iBlock Shopify variant images from local upload-ready SKU candidates.")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--groups", nargs="*", help="Comma-separated upload groups. Defaults to all multi-SKU iBlock groups.")
    args = parser.parse_args()
    if args.dry_run == args.apply:
        parser.error("Choose exactly one of --dry-run or --apply")

    groups = None
    if args.groups:
        groups = {clean(value) for part in args.groups for value in part.split(",") if clean(value)}
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    admin = ShopifyAdmin()
    missing_scopes = sorted(REQUIRED_SCOPES - admin.access_scopes())
    if missing_scopes:
        raise RuntimeError(f"Missing Shopify scopes: {', '.join(missing_scopes)}")
    plan, issues = build_plan(admin, groups)
    plan_rows = []
    for row in plan:
        for sku, alt in row["expected_by_sku"].items():
            plan_rows.append(
                {
                    "upload_group": row["upload_group"],
                    "handle": row["handle"],
                    "sku": sku,
                    "expected_alt": alt,
                    "current_alt": row["current_by_sku"].get(sku, ""),
                    "missing_media_count": row["missing_media_count"],
                    "selected_file": row["selected"].get(sku, ""),
                }
            )
    write_csv(
        OUT_DIR / "iblock-variant-media-repair-plan.csv",
        plan_rows,
        ["upload_group", "handle", "sku", "expected_alt", "current_alt", "missing_media_count", "selected_file"],
    )
    write_csv(OUT_DIR / "iblock-variant-media-repair-issues.csv", issues, ["upload_group", "sku", "issue", "value"])
    results = []
    if args.apply:
        for index, row in enumerate(plan, start=1):
            result = apply_row(admin, row)
            results.append(result)
            write_csv(
                OUT_DIR / "iblock-variant-media-repair-results.csv",
                results,
                ["upload_group", "product_id", "handle", "ok", "uploaded_media_count", "variant_count", "mismatches"],
            )
            print(f"Processed {index}/{len(plan)} {row['upload_group']} ok={result['ok']}", flush=True)
    summary = {
        "mode": "apply" if args.apply else "dry_run",
        "target_products": len(plan),
        "target_variants": len(plan_rows),
        "plan_issues": len(issues),
        "missing_media_total": sum(int(row["missing_media_count"]) for row in plan),
        "applied_ok": sum(1 for row in results if row.get("ok")),
        "applied_failed": sum(1 for row in results if not row.get("ok")),
        "out_dir": str(OUT_DIR),
    }
    (OUT_DIR / "iblock-variant-media-repair-summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
