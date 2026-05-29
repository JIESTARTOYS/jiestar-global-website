#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import html
import json
import re
import sys
import time
from pathlib import Path
from typing import Any

import shopify_sample_import as base_import
import shopify_title_cleanup as title_cleanup
from shopify_cn_pending_prepare import extract_skus


ROOT = Path("/Volumes/ORICO/jiestar电商图/待上架中文详情文件夹")
OUT_DIR = Path("/private/tmp/jiestar-shopify-cn-import")
PRICE = "999"
CATEGORY_ID = "gid://shopify/TaxonomyCategory/tg-5-7-12"
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
REQUIRED_SCOPES = {"read_products", "write_products", "read_files", "write_files"}
PUBLICATION_SCOPES = {"read_publications", "write_publications"}


class ShopifyAdmin(base_import.ShopifyAdmin):
    def access_scopes(self) -> set[str]:
        data = self.graphql(
            """
            query CurrentScopes {
              currentAppInstallation {
                accessScopes {
                  handle
                }
              }
            }
            """
        )
        return {scope["handle"] for scope in data["currentAppInstallation"]["accessScopes"]}

    def publications(self) -> list[dict[str, str]]:
        data = self.graphql(
            """
            query Publications {
              publications(first: 50) {
                nodes {
                  id
                  name
                }
              }
            }
            """
        )
        return data["publications"]["nodes"]

    def update_status_and_category(self, product_id: str) -> None:
        data = self.graphql(
            """
            mutation ProductFinalize($product: ProductUpdateInput!) {
              productUpdate(product: $product) {
                product {
                  id
                  status
                  category {
                    id
                    name
                  }
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """,
            {"product": {"id": product_id, "status": "ACTIVE", "category": CATEGORY_ID}},
        )
        base_import.assert_no_user_errors("productUpdate", data["productUpdate"]["userErrors"])

    def publish_to_publications(self, product_id: str, publication_ids: list[str]) -> None:
        if not publication_ids:
            return

        data = self.graphql(
            """
            mutation PublishProduct($id: ID!, $input: [PublicationInput!]!) {
              publishablePublish(id: $id, input: $input) {
                publishable {
                  ... on Product {
                    id
                  }
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """,
            {"id": product_id, "input": [{"publicationId": publication_id} for publication_id in publication_ids]},
        )
        base_import.assert_no_user_errors("publishablePublish", data["publishablePublish"]["userErrors"])

    def products_index(self) -> tuple[set[str], set[str]]:
        handles: set[str] = set()
        skus: set[str] = set()
        cursor: str | None = None

        while True:
            data = self.graphql(
                """
                query ProductsIndex($first: Int!, $after: String) {
                  products(first: $first, after: $after) {
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                    nodes {
                      handle
                      variants(first: 250) {
                        nodes {
                          sku
                        }
                      }
                    }
                  }
                }
                """,
                {"first": 100, "after": cursor},
            )

            page = data["products"]
            for product in page["nodes"]:
                if product.get("handle"):
                    handles.add(product["handle"])
                for variant in product["variants"]["nodes"]:
                    sku = (variant.get("sku") or "").strip().upper()
                    if sku:
                        skus.add(sku)

            if not page["pageInfo"]["hasNextPage"]:
                break
            cursor = page["pageInfo"]["endCursor"]

        return handles, skus


def contains_cjk(value: str) -> bool:
    return bool(re.search(r"[\u3400-\u9fff]", value))


def safe_english(value: str) -> str:
    value = re.sub(r"\s+", " ", value or "").strip(" .")
    for pattern, replacement in title_cleanup.SENSITIVE_REPLACEMENTS:
        value = pattern.sub(replacement, value)

    value = re.sub(r"\b(lego|disney|marvel|star wars|pokemon|pikachu|minecraft)\b", "", value, flags=re.I)
    value = re.sub(r"\s+", " ", value).strip(" .")
    return value


def row_for_sku(rows_by_sku: dict[str, base_import.WorkbookRow], sku: str) -> base_import.WorkbookRow | None:
    return rows_by_sku.get(sku) or rows_by_sku.get(f"{sku}E") or rows_by_sku.get(sku.removesuffix("E"))


def series_phrase(value: str) -> str:
    value = safe_english(value)
    if not value:
        return "Building Block"
    if re.search(r"\bbuilding\s+block\b", value, re.I):
        return value
    return f"{value} Building Block"


def title_for_product(base: str, skus: list[str], rows: list[base_import.WorkbookRow]) -> str:
    if base in title_cleanup.SAFE_TITLE_BY_BASE:
        return title_cleanup.SAFE_TITLE_BY_BASE[base]

    if len(skus) == 1 and len(rows) == 1:
        raw_name = safe_english(rows[0].name_en)
        if raw_name and not contains_cjk(raw_name):
            title = f"JIESTAR {raw_name.title()} Building Block Set"
        else:
            title = f"JIESTAR {series_phrase(rows[0].series_en)} Set {rows[0].sku}"
    elif len(skus) == 1:
        title = f"JIESTAR Building Block Set {skus[0]}"
    elif rows:
        series_values = {safe_english(row.series_en) for row in rows if safe_english(row.series_en)}
        series = next(iter(series_values)) if len(series_values) == 1 else "Building Block"
        title = f"JIESTAR {series_phrase(series)} Set {len(skus)}-Pack"
    else:
        title = f"JIESTAR Building Block Set {len(skus)}-Pack" if len(skus) > 1 else f"JIESTAR Building Block Set {base}"

    title = safe_english(title)
    if contains_cjk(title):
        title = f"JIESTAR Building Block Set {base}"
    return re.sub(r"\s+", " ", title).strip()


def variant_option_name(sku: str, row: base_import.WorkbookRow | None) -> str:
    if not row:
        return sku

    name = safe_english(row.name_en)
    if not name or contains_cjk(name):
        name = safe_english(row.series_en) or "Building Block Set"
    return f"{sku} - {name}"


def image_sort_key(path: Path) -> tuple[int, str]:
    match = re.search(r"-(\d+)(?:\.\w+)$", path.name)
    return (int(match.group(1)) if match else 9999, path.name)


def detail_sort_key(path: Path) -> tuple[int, str]:
    match = re.search(r"-详情-(\d+)(?:\.\w+)$", path.name)
    return (int(match.group(1)) if match else 0, path.name)


def images_for_folder(folder: Path, base: str) -> dict[str, list[Path]]:
    files = sorted(
        [
            path
            for path in folder.iterdir()
            if path.is_file() and path.suffix.lower() in IMAGE_EXTS and not path.name.startswith("._")
        ],
        key=lambda path: path.name,
    )
    white = [path for path in files if re.search(r"-白底\.", path.name, re.I)]
    numbered = [path for path in files if re.search(rf"^{re.escape(base)}-\d+\.", path.name, re.I)]
    sku = [path for path in files if re.search(r"-sku\.", path.name, re.I)]
    detail = [path for path in files if "-详情" in path.name]
    transparent = [path for path in files if "-透明" in path.name]

    return {
        "white": sorted(white, key=lambda path: path.name),
        "numbered": sorted(numbered, key=image_sort_key),
        "sku": sorted(sku, key=lambda path: path.name),
        "detail": sorted(detail, key=detail_sort_key),
        "transparent": sorted(transparent, key=lambda path: path.name),
    }


def build_manifest() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    rows_by_sku = base_import.load_workbook_rows()
    manifest: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []

    for folder in sorted(path for path in ROOT.iterdir() if path.is_dir() and not path.name.startswith(".")):
        base = folder.name
        skus = extract_skus(base)

        if not skus:
            skipped.append({"folder": base, "reason": "no_sku"})
            continue

        rows = [row_for_sku(rows_by_sku, sku) for sku in skus]
        workbook_rows = [row for row in rows if row]
        title = title_for_product(base, skus, workbook_rows)
        handle = base_import.slugify(f"{base}-{title}")
        images = images_for_folder(folder, base)
        main_media = images["white"][:1] + images["numbered"]

        if not main_media:
            skipped.append({"folder": base, "reason": "missing_main_media", "skus": skus})
            continue

        primary = workbook_rows[0] if workbook_rows else None
        piece_counts = [base_import.parse_piece_count(row.notes) for row in workbook_rows if base_import.parse_piece_count(row.notes)]
        piece_count_total = str(sum(int(count) for count in piece_counts)) if piece_counts else ""
        ages = sorted({row.age for row in workbook_rows if row.age})
        finished_sizes = [row.finished_size for row in workbook_rows if row.finished_size]
        package_sizes = sorted({row.package_size for row in workbook_rows if row.package_size})

        manifest.append(
            {
                "folder": base,
                "folder_path": str(folder),
                "base": base,
                "handle": handle,
                "title": title,
                "vendor": "JieStar",
                "status": "ACTIVE",
                "product_type": (primary.series_en if primary else "") or "Building Block Sets",
                "price": PRICE,
                "variants": [
                    {
                        "sku": sku,
                        "option_name": variant_option_name(sku, row),
                        "title_source": row.name_en if row else "",
                        "series": row.series_en if row else "",
                        "age": row.age if row else "",
                        "piece_count": base_import.parse_piece_count(row.notes) if row else "",
                        "package_size": row.package_size if row else "",
                        "finished_size": row.finished_size if row else "",
                    }
                    for sku, row in zip(skus, rows)
                ],
                "metafields": {
                    "specs.piece_count": piece_count_total,
                    "specs.recommended_age": ", ".join(ages),
                    "specs.finished_model_size": " / ".join(finished_sizes),
                    "specs.package_size": ", ".join(package_sizes),
                    "specs.difficulty_level": "See product package",
                    "custom.series": primary.series_en if primary else "",
                },
                "main_media": [str(path) for path in main_media],
                "sku_images": [str(path) for path in images["sku"]],
                "detail_images": [str(path) for path in images["detail"]],
                "transparent_images": [str(path) for path in images["transparent"]],
                "missing": {
                    "white": not bool(images["white"]),
                    "detail": not bool(images["detail"]),
                    "sku_images": len(images["sku"]) < len(skus),
                    "workbook_rows": len(workbook_rows) < len(skus),
                },
            }
        )

    return manifest, skipped


def write_manifest(manifest: list[dict[str, Any]], skipped: list[dict[str, Any]], name: str = "cn-pending") -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / f"{name}-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT_DIR / f"{name}-skipped.json").write_text(json.dumps(skipped, ensure_ascii=False, indent=2), encoding="utf-8")

    with (OUT_DIR / f"{name}-manifest.csv").open("w", encoding="utf-8", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["folder", "handle", "title", "variant_skus", "main_media_count", "sku_image_count", "detail_count", "missing"])

        for item in manifest:
            writer.writerow(
                [
                    item["folder"],
                    item["handle"],
                    item["title"],
                    ", ".join(variant["sku"] for variant in item["variants"]),
                    len(item["main_media"]),
                    len(item["sku_images"]),
                    len(item["detail_images"]),
                    json.dumps(item["missing"], ensure_ascii=False),
                ]
            )


def filter_existing(admin: ShopifyAdmin, manifest: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    existing_handles, existing_skus = admin.products_index()
    todo = []
    skipped = []

    for item in manifest:
        item_skus = {variant["sku"].upper() for variant in item["variants"]}
        matched_skus = sorted(item_skus & existing_skus)

        if item["handle"] in existing_handles:
            skipped.append({"folder": item["folder"], "handle": item["handle"], "reason": "existing_handle"})
        elif matched_skus:
            skipped.append({"folder": item["folder"], "handle": item["handle"], "reason": "existing_sku", "skus": matched_skus})
        else:
            todo.append(item)

    return todo, skipped


def detail_image_paths(path: Path) -> list[Path]:
    return base_import.detail_image_paths(path)


def upload_detail_images(admin: ShopifyAdmin, item: dict[str, Any]) -> list[str]:
    urls = []

    for detail_index, source in enumerate(item.get("detail_images", []), start=1):
        for part_index, path in enumerate(detail_image_paths(Path(source)), start=1):
            part = f" part {part_index}" if part_index > 1 else ""
            urls.append(admin.file_create(path, f"{item['title']} details {detail_index}{part}"))

    return urls


def build_description_html(item: dict[str, Any], detail_urls: list[str]) -> str:
    return "\n".join(
        f'<p><img src="{html.escape(url)}" alt="{html.escape(item["title"])} details part {index}" /></p>'
        for index, url in enumerate(detail_urls, start=1)
    )


def create_batch(manifest: list[dict[str, Any]], offset: int, batch_size: int, report_name: str) -> list[dict[str, Any]]:
    admin = ShopifyAdmin()
    scopes = admin.access_scopes()
    missing_scopes = sorted(REQUIRED_SCOPES - scopes)

    if missing_scopes:
        raise RuntimeError(f"Missing Shopify scopes: {', '.join(missing_scopes)}")

    publication_ids: list[str] = []
    if PUBLICATION_SCOPES <= scopes:
        publication_ids = [publication["id"] for publication in admin.publications()]

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    batch = manifest[offset : offset + batch_size]
    results = []

    for index, item in enumerate(batch, start=1):
        result = {"manifest": item, "ok": False}

        try:
            existing = admin.product_by_handle(item["handle"])
            if existing:
                verified = repair_existing_product(admin, item, existing["id"], publication_ids)
                result.update({"ok": True, "existing": True, "product": verified})
                results.append(result)
                continue

            detail_urls = upload_detail_images(admin, item)
            product = admin.product_set(item, build_description_html(item, detail_urls))
            product_id = product["id"]
            verified = base_import.sync_product_assets(admin, item, product_id, update_description=False)
            admin.update_status_and_category(product_id)
            admin.publish_to_publications(product_id, publication_ids)
            verified = admin.fetch_product(product_id)
            result.update({"ok": True, "existing": False, "product": verified})
        except Exception as error:  # noqa: BLE001 - batch uploads should continue and report failures.
            result["error"] = str(error)
            recovered = recover_partial_product(admin, item, publication_ids)

            if recovered:
                result.update({"ok": True, "recovered": True, "product": recovered})

        results.append(result)
        (OUT_DIR / f"{report_name}.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Processed {offset + index}: {item['folder']} ok={result['ok']}", flush=True)

    return results


def repair_existing_product(
    admin: ShopifyAdmin,
    item: dict[str, Any],
    product_id: str,
    publication_ids: list[str],
) -> dict[str, Any]:
    product = admin.fetch_product(product_id)

    if not (product.get("descriptionHtml") or "") and item.get("detail_images"):
        detail_urls = upload_detail_images(admin, item)
        admin.product_update_description(product_id, build_description_html(item, detail_urls))

    verified = base_import.sync_product_assets(admin, item, product_id, update_description=False)
    admin.update_status_and_category(product_id)
    admin.publish_to_publications(product_id, publication_ids)
    return admin.fetch_product(product_id)


def recover_partial_product(
    admin: ShopifyAdmin,
    item: dict[str, Any],
    publication_ids: list[str],
) -> dict[str, Any] | None:
    try:
        existing = admin.product_by_handle(item["handle"])

        if not existing:
            return None

        return repair_existing_product(admin, item, existing["id"], publication_ids)
    except Exception as repair_error:  # noqa: BLE001 - keep original failure and add repair context.
        print(f"Repair failed for {item['folder']}: {repair_error}", flush=True)
        return None


def run_auto(batch_size: int) -> dict[str, Any]:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    runs = []
    started_at = time.strftime("%Y%m%d-%H%M%S")

    while True:
        manifest, local_skipped = build_manifest()
        admin = ShopifyAdmin()
        todo, existing_skipped = filter_existing(admin, manifest)
        write_manifest(todo, local_skipped + existing_skipped)

        remaining = len(todo)
        print(
            json.dumps(
                {
                    "remaining": remaining,
                    "skipped": len(local_skipped) + len(existing_skipped),
                    "missing_detail": sum(1 for item in todo if item["missing"]["detail"]),
                },
                ensure_ascii=False,
            ),
            flush=True,
        )

        if remaining == 0:
            break

        report_name = f"cn-auto-{started_at}-batch-{len(runs) + 1:03d}-size-{batch_size}"
        created = create_batch(todo, 0, batch_size, report_name)
        run = {
            "batch": len(runs) + 1,
            "report": str(OUT_DIR / f"{report_name}.json"),
            "processed": len(created),
            "ok": sum(1 for row in created if row.get("ok")),
            "failed": sum(1 for row in created if not row.get("ok")),
            "failed_folders": [row["manifest"]["folder"] for row in created if not row.get("ok")],
        }
        runs.append(run)
        (OUT_DIR / f"auto-{started_at}-summary.json").write_text(
            json.dumps({"runs": runs}, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print(json.dumps(run, ensure_ascii=False), flush=True)

        if run["failed"] == len(created):
            print("All products in this batch failed; stopping to avoid a tight retry loop.", flush=True)
            break

    summary = {"started_at": started_at, "runs": runs}
    (OUT_DIR / f"auto-{started_at}-summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    return summary


def main() -> int:
    parser = argparse.ArgumentParser(description="Import normalized Chinese pending folders to Shopify.")
    parser.add_argument("--dry-run", action="store_true", help="Generate manifest and skip existing Shopify products.")
    parser.add_argument("--create-batch", action="store_true", help="Create one batch of products.")
    parser.add_argument("--auto", action="store_true", help="Create repeated batches until no pending products remain.")
    parser.add_argument("--offset", type=int, default=0)
    parser.add_argument("--batch-size", type=int, default=10)
    args = parser.parse_args()

    if not (args.dry_run or args.create_batch or args.auto):
        parser.error("Choose --dry-run, --create-batch, or --auto")

    if args.auto:
        if args.batch_size < 1 or args.batch_size > 25:
            parser.error("--batch-size must be between 1 and 25")

        print(json.dumps(run_auto(args.batch_size), ensure_ascii=False, indent=2))
        return 0

    manifest, local_skipped = build_manifest()
    admin = ShopifyAdmin()
    todo, existing_skipped = filter_existing(admin, manifest)
    write_manifest(todo, local_skipped + existing_skipped)

    summary = {
        "manifest_json": str(OUT_DIR / "cn-pending-manifest.json"),
        "skipped_json": str(OUT_DIR / "cn-pending-skipped.json"),
        "source_products": len(manifest),
        "todo_products": len(todo),
        "skipped": len(local_skipped) + len(existing_skipped),
        "missing_detail": sum(1 for item in todo if item["missing"]["detail"]),
        "missing_workbook_rows": sum(1 for item in todo if item["missing"]["workbook_rows"]),
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))

    if args.create_batch:
        if args.batch_size < 1 or args.batch_size > 25:
            parser.error("--batch-size must be between 1 and 25")

        report_name = f"cn-batch-{time.strftime('%Y%m%d-%H%M%S')}-offset-{args.offset}-size-{args.batch_size}"
        created = create_batch(todo, args.offset, args.batch_size, report_name)
        print(
            json.dumps(
                {
                    "processed": len(created),
                    "ok": sum(1 for row in created if row.get("ok")),
                    "failed": sum(1 for row in created if not row.get("ok")),
                    "report": str(OUT_DIR / f"{report_name}.json"),
                    "next_offset": args.offset + args.batch_size,
                },
                ensure_ascii=False,
                indent=2,
            )
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
