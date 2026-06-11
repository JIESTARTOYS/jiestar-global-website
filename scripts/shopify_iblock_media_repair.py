#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import time
from copy import deepcopy
from pathlib import Path
from typing import Any

import shopify_sample_import as base_import
from shopify_iblock_pending_import import (
    REQUIRED_SCOPES,
    ShopifyAdmin as BaseIblockAdmin,
    append_variant_media,
    build_manifest,
    clean,
    description_html,
    upload_detail_images_for_item,
)


OUT_DIR = Path("/private/tmp/jiestar-shopify-iblock-media-repair")

DEFAULT_TARGET_GROUPS = [
    "IB1205",
    "IB1206",
    "IB1207",
    "IB1208",
    "IB1209",
    "IB1210",
    "IB1212",
    "IB1301-1",
    "IB1301-2",
    "IB1301-3",
    "IB1301-4",
    "IB1301-5",
    "IB1301-6",
]


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fieldnames})


class ShopifyAdmin(BaseIblockAdmin):
    def fetch_iblock_products_for_repair(self) -> list[dict[str, Any]]:
        products: list[dict[str, Any]] = []
        cursor: str | None = None

        while True:
            data = self.graphql(
                """
                query IblockProductsForMediaRepair($cursor: String) {
                  products(first: 100, after: $cursor, query: "vendor:iBlock") {
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                    nodes {
                      id
                      title
                      handle
                      status
                      vendor
                      productType
                      variants(first: 250) {
                        nodes {
                          id
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
            products.extend(page["nodes"])
            if not page["pageInfo"]["hasNextPage"]:
                break
            cursor = page["pageInfo"]["endCursor"]

        return products


def expected_alts_for_item(item: dict[str, Any]) -> list[str]:
    expected_alts: list[str] = []
    seen: set[str] = set()
    for media_path in item["main_media"]:
        path = Path(media_path)
        alt = f"{item['title']} - {path.name}"
        if alt not in seen:
            expected_alts.append(alt)
            seen.add(alt)
    for media_path in item["sku_images"]:
        path = Path(media_path)
        alt = f"{item['title']} SKU image - {path.name}"
        if alt not in seen:
            expected_alts.append(alt)
            seen.add(alt)
    return expected_alts


def media_inputs_for_repair(admin: ShopifyAdmin, item: dict[str, Any], existing_alts: set[str]) -> tuple[list[dict[str, Any]], list[str]]:
    media_inputs: list[dict[str, Any]] = []
    expected_alts: list[str] = []
    seen: set[str] = set()

    for media_path in item["main_media"]:
        path = Path(media_path)
        alt = f"{item['title']} - {path.name}"
        if alt in seen:
            continue
        seen.add(alt)
        expected_alts.append(alt)
        if alt not in existing_alts:
            media_inputs.append({"originalSource": admin.stage_upload(path), "alt": alt, "mediaContentType": "IMAGE"})

    for media_path in item["sku_images"]:
        path = Path(media_path)
        alt = f"{item['title']} SKU image - {path.name}"
        if alt in seen:
            continue
        seen.add(alt)
        expected_alts.append(alt)
        if alt not in existing_alts:
            media_inputs.append({"originalSource": admin.stage_upload(path), "alt": alt, "mediaContentType": "IMAGE"})

    return media_inputs, expected_alts


def manifest_by_group() -> dict[str, dict[str, Any]]:
    manifest, skipped, _piece_count_gaps, _product_type_plan = build_manifest()
    if skipped:
        skipped_groups = ", ".join(sorted(clean(row.get("upload_group")) for row in skipped if clean(row.get("upload_group")))[:12])
        raise RuntimeError(f"Local iBlock manifest has skipped rows before repair: {skipped_groups}")
    return {item["folder"]: item for item in manifest}


def index_products_by_sku(products: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    by_sku: dict[str, dict[str, Any]] = {}
    for product in products:
        for variant in product.get("variants", {}).get("nodes", []):
            sku = clean(variant.get("sku")).upper()
            if sku:
                by_sku[sku] = product
    return by_sku


def target_groups_from_args(args: argparse.Namespace, available_groups: set[str]) -> list[str]:
    if args.all:
        return sorted(available_groups)
    if args.groups:
        groups = [clean(value) for part in args.groups for value in part.split(",") if clean(value)]
        return groups
    return DEFAULT_TARGET_GROUPS


def build_plan(admin: ShopifyAdmin, target_groups: list[str]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    by_group = manifest_by_group()
    products = admin.fetch_iblock_products_for_repair()
    by_sku = index_products_by_sku(products)
    plan: list[dict[str, Any]] = []
    issues: list[dict[str, Any]] = []

    for group in target_groups:
        item = by_group.get(group)
        if not item:
            issues.append({"upload_group": group, "issue": "missing_local_manifest_group"})
            continue

        variant_skus = [variant["sku"].upper() for variant in item["variants"]]
        matched_products = {by_sku[sku]["id"]: by_sku[sku] for sku in variant_skus if sku in by_sku}
        missing_skus = sorted(set(variant_skus) - set(by_sku))

        if missing_skus:
            issues.append({"upload_group": group, "issue": "missing_shopify_skus", "value": ", ".join(missing_skus)})
            continue
        if len(matched_products) != 1:
            issues.append({"upload_group": group, "issue": "variant_skus_split_across_products", "value": ",".join(sorted(matched_products))})
            continue

        product = next(iter(matched_products.values()))
        repair_item = deepcopy(item)
        repair_item["title"] = clean(product.get("title")) or item["title"]
        fetched = admin.fetch_product(product["id"])
        expected_alts = expected_alts_for_item(repair_item)
        existing_alts = [clean(media.get("alt")) for media in fetched["media"]["nodes"]]
        unexpected_media = [
            media
            for media in fetched["media"]["nodes"]
            if clean(media.get("alt")) not in set(expected_alts)
        ]
        missing_expected = [alt for alt in expected_alts if alt not in set(existing_alts)]

        plan.append(
            {
                "upload_group": group,
                "product_id": product["id"],
                "handle": product.get("handle", ""),
                "title": repair_item["title"],
                "variant_skus": ", ".join(variant_skus),
                "item": repair_item,
                "expected_alts": expected_alts,
                "existing_media_count": len(existing_alts),
                "expected_media_count": len(expected_alts),
                "missing_expected_count": len(missing_expected),
                "delete_media_count": len(unexpected_media),
                "detail_image_count": len(repair_item.get("detail_images", [])),
                "first_expected_alt": expected_alts[0] if expected_alts else "",
                "first_current_alt": existing_alts[0] if existing_alts else "",
            }
        )

    return plan, issues


def delete_unexpected_media(admin: ShopifyAdmin, product_id: str, product: dict[str, Any], expected_alts: set[str]) -> int:
    delete_ids = [
        media["id"]
        for media in product["media"]["nodes"]
        if clean(media.get("alt")) not in expected_alts
    ]
    detach_inputs = []
    for media_id in delete_ids:
        for variant in product["variants"]["nodes"]:
            if any(node["id"] == media_id for node in variant.get("media", {}).get("nodes", [])):
                detach_inputs.append({"variantId": variant["id"], "mediaIds": [media_id]})

    admin.detach_variant_media(product_id, detach_inputs)
    admin.delete_files(delete_ids)
    return len(delete_ids)


def repair_product(admin: ShopifyAdmin, row: dict[str, Any], update_description: bool) -> dict[str, Any]:
    item = row["item"]
    product_id = row["product_id"]

    if update_description:
        detail_urls = upload_detail_images_for_item(admin, item)
        admin.product_update_description(product_id, description_html(item, detail_urls))

    product = admin.fetch_product(product_id)
    existing_alts = {clean(media.get("alt")) for media in product["media"]["nodes"]}
    media_inputs, expected_alts = media_inputs_for_repair(admin, item, existing_alts)

    if media_inputs:
        admin.product_update_media(product_id, media_inputs)
        time.sleep(8)

    product = admin.fetch_product(product_id)
    deleted_count = delete_unexpected_media(admin, product_id, product, set(expected_alts))
    time.sleep(2)
    append_variant_media(admin, product_id)
    admin.reorder_media(product_id, expected_alts)
    time.sleep(4)
    verified = admin.fetch_product(product_id)
    media_alts = [clean(media.get("alt")) for media in verified["media"]["nodes"]]
    return {
        "upload_group": row["upload_group"],
        "product_id": product_id,
        "handle": row["handle"],
        "title": row["title"],
        "ok": media_alts[: len(expected_alts)] == expected_alts,
        "uploaded_media_count": len(media_inputs),
        "deleted_media_count": deleted_count,
        "expected_media_count": len(expected_alts),
        "final_media_count": len(media_alts),
        "first_expected_alt": expected_alts[0] if expected_alts else "",
        "first_final_alt": media_alts[0] if media_alts else "",
        "missing_expected_after": "; ".join(alt for alt in expected_alts if alt not in media_alts),
        "unexpected_after": "; ".join(alt for alt in media_alts if alt not in set(expected_alts)),
    }


def summarize(plan: list[dict[str, Any]], issues: list[dict[str, Any]], apply: bool, results: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    return {
        "mode": "apply" if apply else "dry_run",
        "target_products": len(plan),
        "plan_issues": len(issues),
        "expected_media_total": sum(int(row["expected_media_count"]) for row in plan),
        "missing_expected_total": sum(int(row["missing_expected_count"]) for row in plan),
        "delete_media_total": sum(int(row["delete_media_count"]) for row in plan),
        "detail_image_total": sum(int(row["detail_image_count"]) for row in plan),
        "applied_ok": sum(1 for row in results or [] if row.get("ok")),
        "applied_failed": sum(1 for row in results or [] if not row.get("ok")),
        "out_dir": str(OUT_DIR),
        "plan_csv": str(OUT_DIR / "iblock-media-repair-plan.csv"),
        "issues_csv": str(OUT_DIR / "iblock-media-repair-issues.csv"),
        "results_csv": str(OUT_DIR / "iblock-media-repair-results.csv"),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Replace wrong iBlock Shopify product media from corrected local upload-ready assets.")
    parser.add_argument("--dry-run", action="store_true", help="Write a repair plan without changing Shopify.")
    parser.add_argument("--apply", action="store_true", help="Upload corrected media, rebuild descriptions, delete unexpected old media, and reorder.")
    parser.add_argument("--groups", nargs="*", help="Comma-separated upload groups to repair. Defaults to known affected groups.")
    parser.add_argument("--all", action="store_true", help="Repair all local iBlock product groups.")
    parser.add_argument("--skip-description", action="store_true", help="Do not rebuild descriptionHtml detail images.")
    args = parser.parse_args()

    if args.dry_run == args.apply:
        parser.error("Choose exactly one of --dry-run or --apply")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    available_groups = set(manifest_by_group())
    target_groups = target_groups_from_args(args, available_groups)
    admin = ShopifyAdmin()
    scopes = admin.access_scopes()
    missing_scopes = sorted(REQUIRED_SCOPES - scopes)
    if missing_scopes:
        raise RuntimeError(f"Missing Shopify scopes: {', '.join(missing_scopes)}")

    plan, issues = build_plan(admin, target_groups)
    write_csv(
        OUT_DIR / "iblock-media-repair-plan.csv",
        plan,
        [
            "upload_group",
            "product_id",
            "handle",
            "title",
            "variant_skus",
            "existing_media_count",
            "expected_media_count",
            "missing_expected_count",
            "delete_media_count",
            "detail_image_count",
            "first_expected_alt",
            "first_current_alt",
        ],
    )
    write_csv(OUT_DIR / "iblock-media-repair-issues.csv", issues, ["upload_group", "issue", "value"])
    (OUT_DIR / "iblock-media-repair-plan.json").write_text(json.dumps(plan, ensure_ascii=False, indent=2, default=str), encoding="utf-8")

    results: list[dict[str, Any]] = []
    if args.apply:
        if issues:
            raise RuntimeError(f"Repair plan has {len(issues)} issue(s); fix or narrow --groups before --apply")
        for index, row in enumerate(plan, start=1):
            try:
                result = repair_product(admin, row, update_description=not args.skip_description)
            except Exception as error:  # noqa: BLE001 - keep the batch report complete.
                result = {
                    "upload_group": row["upload_group"],
                    "product_id": row["product_id"],
                    "handle": row["handle"],
                    "title": row["title"],
                    "ok": False,
                    "error": str(error),
                }
            results.append(result)
            write_csv(
                OUT_DIR / "iblock-media-repair-results.csv",
                results,
                [
                    "upload_group",
                    "product_id",
                    "handle",
                    "title",
                    "ok",
                    "uploaded_media_count",
                    "deleted_media_count",
                    "expected_media_count",
                    "final_media_count",
                    "first_expected_alt",
                    "first_final_alt",
                    "missing_expected_after",
                    "unexpected_after",
                    "error",
                ],
            )
            (OUT_DIR / "iblock-media-repair-results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"Processed {index}/{len(plan)} {row['upload_group']} ok={result.get('ok')}", flush=True)

    summary = summarize(plan, issues, args.apply, results)
    (OUT_DIR / "iblock-media-repair-summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
