#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import html
import json
import re
import time
from collections import Counter
from pathlib import Path
from typing import Any

import shopify_sample_import as base_import
from shopify_iblock_pending_import import ShopifyAdmin, clean, contains_cjk


OUT_DIR = Path("/private/tmp/jiestar-shopify-iblock-fix")
VENDOR = "iBlock"

PACKAGE_SIZE_FIXES = {
    "display-set-building-block-set-ib2201": "Display box: 27.5*18.4*14.5; single box: 9*9*14",
    "display-set-building-block-set-ib2202-1-ib2202-9": "Display box: 28*14.8*28; single box: 9*9*14",
}

PRODUCT_TYPE_FIXES = {
    "special-operations-team-building-block-set": "Military",
    "floral-wish-6-model-building-block-set": "Flower",
}


class IblockFixAdmin(ShopifyAdmin):
    def fetch_products_for_fix(self) -> list[dict[str, Any]]:
        products: list[dict[str, Any]] = []
        cursor: str | None = None
        while True:
            data = self.graphql(
                """
                query IblockPostUploadFix($cursor: String) {
                  products(first: 100, after: $cursor, query: "vendor:iBlock") {
                    pageInfo { hasNextPage endCursor }
                    nodes {
                      id
                      handle
                      title
                      status
                      vendor
                      productType
                      descriptionHtml
                      media(first: 250, sortKey: POSITION) {
                        nodes {
                          id
                          alt
                          mediaContentType
                          ... on MediaImage {
                            image { url width height }
                          }
                        }
                      }
                      metafields(first: 50) {
                        nodes { namespace key value type }
                      }
                      variants(first: 250) {
                        nodes {
                          sku
                          image { id url altText }
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

    def product_update(self, payload: dict[str, Any]) -> None:
        data = self.graphql(
            """
            mutation IblockPostUploadProductUpdate($product: ProductUpdateInput!) {
              productUpdate(product: $product) {
                product { id handle productType }
                userErrors { field message }
              }
            }
            """,
            {"product": payload},
        )
        base_import.assert_no_user_errors("productUpdate", data["productUpdate"]["userErrors"])

    def file_update(self, files: list[dict[str, Any]]) -> None:
        if not files:
            return
        data = self.graphql(
            """
            mutation IblockPostUploadFileUpdate($files: [FileUpdateInput!]!) {
              fileUpdate(files: $files) {
                files { id alt }
                userErrors { field message code }
              }
            }
            """,
            {"files": files},
        )
        base_import.assert_no_user_errors("fileUpdate", data["fileUpdate"]["userErrors"])


def media_filename(alt: str) -> str:
    alt = clean(alt)
    if " - " in alt:
        return clean(alt.rsplit(" - ", 1)[1])
    return alt


def desired_media_alt(product_title: str, current_alt: str) -> str:
    filename = media_filename(current_alt)
    if " SKU image " in current_alt:
        return f"{product_title} SKU image - {filename}"
    return f"{product_title} - {filename}"


DETAIL_ALT_RE = re.compile(r'alt="([^"]*?)\s+details\s+part\s+(\d+)"', re.I)


def desired_description_html(product_title: str, description_html: str) -> str:
    def replace(match: re.Match[str]) -> str:
        return f'alt="{html.escape(product_title, quote=True)} details part {match.group(2)}"'

    return DETAIL_ALT_RE.sub(replace, description_html)


def metafield_input(full_key: str, value: str) -> dict[str, str]:
    namespace, key = full_key.split(".", 1)
    return {
        "namespace": namespace,
        "key": key,
        "type": "single_line_text_field",
        "value": re.sub(r"\\s+", " ", value).strip(),
    }


def current_metafields(product: dict[str, Any]) -> dict[str, str]:
    return {
        f"{node['namespace']}.{node['key']}": node.get("value", "")
        for node in product.get("metafields", {}).get("nodes", [])
    }


def duplicate_media_removals(product: dict[str, Any]) -> list[dict[str, str]]:
    removals: list[dict[str, str]] = []
    seen: set[str] = set()
    variant_urls = {
        clean((variant.get("image") or {}).get("url"))
        for variant in product["variants"]["nodes"]
        if (variant.get("image") or {}).get("url")
    }

    for media in product["media"]["nodes"]:
        alt = clean(media.get("alt"))
        if not alt:
            continue
        image = media.get("image") or {}
        url = clean(image.get("url"))
        key = alt.casefold()
        if key not in seen:
            seen.add(key)
            continue
        if url and url in variant_urls:
            continue
        removals.append(
            {
                "media_id": media["id"],
                "old_alt": alt,
                "url": url,
            }
        )
    return removals


def build_plan(products: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, str]]]:
    rows: list[dict[str, Any]] = []
    manual: list[dict[str, str]] = []

    for product in products:
        handle = product["handle"]
        title = product["title"]
        metafields = current_metafields(product)
        product_payload: dict[str, Any] = {"id": product["id"]}
        reasons: list[str] = []

        expected_type = PRODUCT_TYPE_FIXES.get(handle)
        if expected_type and product.get("productType") != expected_type:
            product_payload["productType"] = expected_type
            product_payload.setdefault("metafields", []).append(metafield_input("custom.series", expected_type))
            reasons.append("product_type")

        expected_package = PACKAGE_SIZE_FIXES.get(handle)
        if expected_package and metafields.get("specs.package_size") != expected_package:
            product_payload.setdefault("metafields", []).append(metafield_input("specs.package_size", expected_package))
            reasons.append("package_size_english")

        description_html = product.get("descriptionHtml") or ""
        new_description = desired_description_html(title, description_html)
        if new_description != description_html:
            product_payload["descriptionHtml"] = new_description
            reasons.append("description_alt")

        file_updates = []
        for media in product["media"]["nodes"]:
            old_alt = clean(media.get("alt"))
            if not old_alt:
                continue
            new_alt = desired_media_alt(title, old_alt)
            if new_alt != old_alt:
                file_updates.append({"id": media["id"], "alt": new_alt})

        removals = duplicate_media_removals(product)
        if removals:
            reasons.append("remove_duplicate_media")

        if file_updates:
            reasons.append("media_alt")

        if product_payload.keys() != {"id"} or file_updates or removals:
            rows.append(
                {
                    "product_id": product["id"],
                    "handle": handle,
                    "title": title,
                    "reasons": reasons,
                    "product_payload": product_payload,
                    "file_updates": file_updates,
                    "duplicate_removals": removals,
                }
            )

        if "building-block-set" in handle:
            manual.append(
                {
                    "handle": handle,
                    "title": title,
                    "manual_review_reason": "handle_still_contains_building-block-set; URL change requires redirect decision",
                    "recommended_action": re.sub(r"-?building-block-set", "", handle).strip("-"),
                }
            )

        if product.get("productType") == "Other" and handle != "display-set-building-block-set-ib2201":
            manual.append(
                {
                    "handle": handle,
                    "title": title,
                    "manual_review_reason": "productType Other remains after automatic fixes",
                    "recommended_action": "review product type",
                }
            )

    return rows, manual


def write_plan(rows: list[dict[str, Any]], manual: list[dict[str, str]]) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    summary_rows = []
    media_rows = []
    removal_rows = []

    for row in rows:
        summary_rows.append(
            {
                "handle": row["handle"],
                "title": row["title"],
                "reasons": ";".join(row["reasons"]),
                "product_update_fields": ";".join(key for key in row["product_payload"] if key != "id"),
                "media_alt_updates": len(row["file_updates"]),
                "duplicate_media_removals": len(row["duplicate_removals"]),
            }
        )
        for update in row["file_updates"]:
            media_rows.append({"handle": row["handle"], "title": row["title"], **update})
        for removal in row["duplicate_removals"]:
            removal_rows.append({"handle": row["handle"], "title": row["title"], **removal})

    outputs = [
        (OUT_DIR / "iblock-fix-plan.csv", summary_rows, ["handle", "title", "reasons", "product_update_fields", "media_alt_updates", "duplicate_media_removals"]),
        (OUT_DIR / "iblock-fix-media-alt-plan.csv", media_rows, ["handle", "title", "id", "alt"]),
        (OUT_DIR / "iblock-fix-duplicate-media-plan.csv", removal_rows, ["handle", "title", "media_id", "old_alt", "url"]),
        (OUT_DIR / "iblock-manual-review-after-fix.csv", manual, ["handle", "title", "manual_review_reason", "recommended_action"]),
    ]
    for path, output_rows, fields in outputs:
        with path.open("w", newline="", encoding="utf-8-sig") as file:
            writer = csv.DictWriter(file, fieldnames=fields)
            writer.writeheader()
            writer.writerows(output_rows)


def apply_plan(admin: IblockFixAdmin, rows: list[dict[str, Any]], batch_size: int) -> list[dict[str, str]]:
    results: list[dict[str, str]] = []
    for index, row in enumerate(rows, start=1):
        result = {
            "handle": row["handle"],
            "title": row["title"],
            "ok": "true",
            "error": "",
            "reasons": ";".join(row["reasons"]),
        }
        try:
            product_payload = row["product_payload"]
            if product_payload.keys() != {"id"}:
                admin.product_update(product_payload)

            file_updates = row["file_updates"]
            for offset in range(0, len(file_updates), batch_size):
                admin.file_update(file_updates[offset : offset + batch_size])
                time.sleep(0.5)

            removal_updates = [
                {"id": removal["media_id"], "referencesToRemove": [row["product_id"]]}
                for removal in row["duplicate_removals"]
            ]
            for offset in range(0, len(removal_updates), batch_size):
                admin.file_update(removal_updates[offset : offset + batch_size])
                time.sleep(0.5)
        except Exception as error:  # noqa: BLE001 - batch should continue and report failures.
            result["ok"] = "false"
            result["error"] = str(error)
        results.append(result)
        if index % 10 == 0:
            print(f"processed {index}/{len(rows)}", flush=True)
    return results


def summarize(rows: list[dict[str, Any]], manual: list[dict[str, str]], products: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "products_seen": len(products),
        "products_with_updates": len(rows),
        "product_updates": sum(1 for row in rows if row["product_payload"].keys() != {"id"}),
        "media_alt_updates": sum(len(row["file_updates"]) for row in rows),
        "duplicate_media_removals": sum(len(row["duplicate_removals"]) for row in rows),
        "manual_review_items": len(manual),
        "reason_counts": dict(Counter(reason for row in rows for reason in row["reasons"])),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Fix narrow post-upload iBlock Shopify issues.")
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--yes", action="store_true")
    parser.add_argument("--batch-size", type=int, default=25)
    args = parser.parse_args()
    if args.apply and not args.yes:
        raise SystemExit("--apply requires --yes")

    admin = IblockFixAdmin()
    products = admin.fetch_products_for_fix()
    rows, manual = build_plan(products)
    write_plan(rows, manual)

    payload: dict[str, Any] = {
        "summary": summarize(rows, manual, products),
        "outputs": {
            "plan_csv": str(OUT_DIR / "iblock-fix-plan.csv"),
            "media_alt_plan_csv": str(OUT_DIR / "iblock-fix-media-alt-plan.csv"),
            "duplicate_media_plan_csv": str(OUT_DIR / "iblock-fix-duplicate-media-plan.csv"),
            "manual_review_csv": str(OUT_DIR / "iblock-manual-review-after-fix.csv"),
        },
        "note": "Only iBlock productType, selected metafields, descriptionHtml alt text, media alt text, and duplicate product media references are changed when --apply is used. Handles are not changed.",
    }

    if args.apply:
        results = apply_plan(admin, rows, batch_size=args.batch_size)
        payload["apply_results"] = {
            "attempted": len(results),
            "ok": sum(1 for row in results if row["ok"] == "true"),
            "failed": sum(1 for row in results if row["ok"] != "true"),
            "rows": results,
        }
        with (OUT_DIR / "iblock-fix-apply-results.csv").open("w", newline="", encoding="utf-8-sig") as file:
            writer = csv.DictWriter(file, fieldnames=["handle", "title", "ok", "error", "reasons"])
            writer.writeheader()
            writer.writerows(results)

    (OUT_DIR / "iblock-fix-result.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
