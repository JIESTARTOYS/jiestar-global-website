#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import html
import json
import re
import subprocess
import time
from collections import Counter
from pathlib import Path
from typing import Any

import shopify_sample_import as base_import
from shopify_cn_pending_import import ShopifyAdmin, recover_partial_product, repair_existing_product


CATALOG_CSV = Path("/Volumes/ORICO/积域资料/Zoin-上架前整理/reports/zoin-catalog-ready.csv")
IMAGE_ROOT = Path("/Volumes/ORICO/积域资料/Zoin-上架前整理/images")
SOURCE_ASSET_ROOT = Path("/Volumes/ORICO/积域资料/积域-产品资料.rar/积域-产品资料/集域产品图")
OUT_DIR = Path("/private/tmp/jiestar-shopify-zoin-import")
VENDOR = "Zoin"
STATUS = "ACTIVE"
PRICE = "999"
PRODUCT_TYPE_DEFAULT = "Building Block Sets"
CATEGORY_ID = "gid://shopify/TaxonomyCategory/tg-5-7-12"
CATEGORY_NAME = "Interlocking Blocks"
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
IGNORED_FILE_NAMES = {".DS_Store", "Thumbs.db"}
REQUIRED_SCOPES = {"read_products", "write_products", "read_files", "write_files"}
PUBLICATION_SCOPES = {"read_publications", "write_publications"}
DETAIL_SLICE_MAX_HEIGHT = 7000
DETAIL_SLICE_MAX_BYTES = 8 * 1024 * 1024
MEDIA_OPTIMIZE_BYTES = 2_500_000
MEDIA_OPTIMIZE_MAX_DIMENSION = 2000
FIELD_OVERRIDES = {
    "GT101": {
        "shopify_title": "Zoin Theatre Mask Display Building Block Set",
        "handle": "zoin-theatre-mask-display-building-block-set",
        "name_en": "Theatre Mask Display",
    },
    "GT103": {
        "shopify_title": "Zoin Moonlit Art Studio Building Block Set",
        "handle": "zoin-moonlit-art-studio-building-block-set",
        "name_en": "Moonlit Art Studio",
    },
}


def clean(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def apply_field_overrides(row: dict[str, str]) -> dict[str, str]:
    output = dict(row)
    sku = clean(output.get("sku")).upper()
    output.update(FIELD_OVERRIDES.get(sku, {}))
    return output


def contains_cjk(value: str) -> bool:
    return bool(re.search(r"[\u3400-\u9fff]", value or ""))


def read_catalog_rows() -> list[dict[str, str]]:
    if not CATALOG_CSV.exists():
        raise FileNotFoundError(f"Missing catalog CSV: {CATALOG_CSV}")

    with CATALOG_CSV.open(encoding="utf-8-sig", newline="") as file:
        rows = [dict(row) for row in csv.DictReader(file)]

    return rows


def natural_image_key(path: Path) -> tuple[int, str]:
    match = re.search(r"-(\d+)(?:-[^.]+)?\.\w+$", path.name)
    return (int(match.group(1)) if match else 9999, path.name.lower())


def detail_image_key(path: Path) -> tuple[int, str]:
    match = re.search(r"-详情(?:-|_)?(\d+)?", path.name)
    number = int(match.group(1)) if match and match.group(1) else 0
    return (number, path.name.lower())


def sliced_detail_key(path: Path) -> tuple[int, str]:
    match = re.search(r"[_-](\d{1,3})(?:\.\w+)$", path.name)
    return (int(match.group(1)) if match else 9999, path.name.lower())


def is_ignored_file(path: Path) -> bool:
    return path.name.startswith("._") or path.name in IGNORED_FILE_NAMES


def image_files(folder: Path) -> list[Path]:
    if not folder.exists():
        return []

    return sorted(
        [
            path
            for path in folder.iterdir()
            if path.is_file() and path.suffix.lower() in IMAGE_EXTS and not is_ignored_file(path)
        ],
        key=lambda path: path.name.lower(),
    )


def image_dimensions(path: Path) -> tuple[int, int]:
    try:
        output = subprocess.check_output(
            ["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(path)],
            text=True,
            stderr=subprocess.DEVNULL,
        )
    except Exception:  # noqa: BLE001 - optimization is a best-effort upload aid.
        return 0, 0

    width = re.search(r"pixelWidth:\s*(\d+)", output)
    height = re.search(r"pixelHeight:\s*(\d+)", output)
    return (int(width.group(1)), int(height.group(1))) if width and height else (0, 0)


def optimize_media_path(path: Path, sku: str) -> Path:
    if path.stat().st_size <= MEDIA_OPTIMIZE_BYTES:
        return path

    output_dir = OUT_DIR / "optimized-media" / sku
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{path.stem}-upload.jpg"

    if output_path.exists() and output_path.stat().st_size > 0:
        return output_path

    subprocess.check_call(
        [
            "sips",
            "-s",
            "format",
            "jpeg",
            "-s",
            "formatOptions",
            "85",
            "-Z",
            str(MEDIA_OPTIMIZE_MAX_DIMENSION),
            str(path),
            "--out",
            str(output_path),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return output_path


def detail_upload_paths(path: Path, sku: str) -> list[Path]:
    width, height = image_dimensions(path)

    if not width or not height:
        return base_import.detail_image_paths(path)

    if height <= DETAIL_SLICE_MAX_HEIGHT and path.stat().st_size <= DETAIL_SLICE_MAX_BYTES:
        return [optimize_media_path(path, sku)]

    output_dir = OUT_DIR / "detail-slices" / sku / path.stem
    output_dir.mkdir(parents=True, exist_ok=True)
    paths = []

    for index, top in enumerate(range(0, height, DETAIL_SLICE_MAX_HEIGHT), start=1):
        crop_height = min(DETAIL_SLICE_MAX_HEIGHT, height - top)
        output_path = output_dir / f"{path.stem}-part-{index:02d}.jpg"

        if not output_path.exists() or output_path.stat().st_size == 0:
            subprocess.check_call(
                [
                    "sips",
                    "-s",
                    "format",
                    "jpeg",
                    "-s",
                    "formatOptions",
                    "85",
                    "-c",
                    str(crop_height),
                    str(width),
                    "--cropOffset",
                    str(top),
                    "0",
                    str(path),
                    "--out",
                    str(output_path),
                ],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )

        paths.append(output_path)

    return paths


def image_buckets(folder: Path, sku: str) -> dict[str, list[Path]]:
    files = image_files(folder)
    white = [path for path in files if "-白底" in path.name]
    detail = [path for path in files if "-详情" in path.name]
    main = [
        path
        for path in files
        if path not in white
        and path not in detail
        and re.search(rf"^{re.escape(sku)}-\d+(?:-[^.]+)?\.\w+$", path.name, re.I)
    ]

    return {
        "white": sorted(white, key=lambda path: path.name.lower()),
        "main": sorted(main, key=natural_image_key),
        "detail": sorted(detail, key=detail_image_key),
    }


def source_sliced_detail_images(sku: str) -> list[Path]:
    if not SOURCE_ASSET_ROOT.exists():
        return []

    candidates = []
    for folder in SOURCE_ASSET_ROOT.rglob("*"):
        if not folder.is_dir():
            continue
        folder_text = folder.as_posix()
        if sku not in folder_text:
            continue
        if not re.search(r"详情|切片|detail|slice", folder_text, re.I):
            continue

        files = [
            path
            for path in folder.iterdir()
            if path.is_file()
            and path.suffix.lower() in IMAGE_EXTS
            and not is_ignored_file(path)
            and re.search(r"[_-]\d{1,3}\.\w+$", path.name)
            and "画板" not in path.name
        ]

        if files:
            candidates.append(sorted(files, key=sliced_detail_key))

    if not candidates:
        return []

    return max(candidates, key=len)


def preferred_detail_images(sku: str, local_detail_images: list[Path]) -> list[Path]:
    oversized = [
        path
        for path in local_detail_images
        if path.stat().st_size > DETAIL_SLICE_MAX_BYTES
    ]

    if not oversized:
        return local_detail_images

    source_slices = source_sliced_detail_images(sku)
    return source_slices or local_detail_images


def non_empty_metafields(row: dict[str, str]) -> dict[str, str]:
    metafields = {
        "specs.piece_count": clean(row.get("specs_piece_count")),
        "specs.recommended_age": clean(row.get("specs_recommended_age")),
        "specs.finished_model_size": clean(row.get("specs_finished_model_size")),
        "specs.package_size": clean(row.get("specs_package_size")),
        "specs.difficulty_level": clean(row.get("specs_difficulty_level")) or "See product package",
        "custom.series": clean(row.get("custom_series")) or clean(row.get("series_en")),
    }
    return {key: value for key, value in metafields.items() if value}


def variant_option_name(row: dict[str, str]) -> str:
    sku = clean(row.get("sku")).upper()
    name = clean(row.get("name_en")) or clean(row.get("custom_series")) or PRODUCT_TYPE_DEFAULT
    return f"{sku} - {name}"


def row_issues(row: dict[str, str]) -> list[str]:
    issues = []
    sku = clean(row.get("sku")).upper()
    title = clean(row.get("shopify_title"))
    handle = clean(row.get("handle"))

    if not sku:
        issues.append("missing_sku")
    if clean(row.get("vendor")) != VENDOR:
        issues.append("vendor_not_zoin")
    if not title.startswith(f"{VENDOR} "):
        issues.append("title_not_zoin")
    if contains_cjk(title):
        issues.append("title_contains_chinese")
    if not handle:
        issues.append("missing_handle")
    if clean(row.get("price")) != PRICE:
        issues.append("price_not_999")
    if clean(row.get("status_recommendation")) != "READY_TO_CREATE":
        issues.append("status_not_ready_to_create")
    if clean(row.get("upload_readiness")) != "READY_FOR_REVIEW":
        issues.append("upload_readiness_not_ready")
    if clean(row.get("category")) != CATEGORY_NAME:
        issues.append("category_not_interlocking_blocks")

    return issues


def build_manifest() -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    rows = read_catalog_rows()
    duplicate_values = {
        field: sorted([value for value, count in Counter(clean(row.get(field)) for row in rows).items() if value and count > 1])
        for field in ("sku", "handle", "shopify_title")
    }
    manifest: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []
    piece_count_gaps: list[dict[str, Any]] = []

    for row in rows:
        row = apply_field_overrides(row)
        sku = clean(row.get("sku")).upper()
        folder = IMAGE_ROOT / sku
        images = image_buckets(folder, sku)
        main_media = [optimize_media_path(path, sku) for path in images["white"][:1] + images["main"]]
        detail_images = preferred_detail_images(sku, images["detail"])
        issues = row_issues(row)

        if duplicate_values["sku"].count(sku):
            issues.append("duplicate_sku_in_catalog")
        if duplicate_values["handle"].count(clean(row.get("handle"))):
            issues.append("duplicate_handle_in_catalog")
        if not folder.exists():
            issues.append("missing_image_folder")
        if not images["white"]:
            issues.append("missing_white_image")
        if not main_media:
            issues.append("missing_main_media")
        if not detail_images:
            issues.append("missing_detail_image")

        if not clean(row.get("specs_piece_count")):
            piece_count_gaps.append(
                {
                    "sku": sku,
                    "title": clean(row.get("shopify_title")),
                    "reason": "missing_piece_count",
                    "brick4_url": clean(row.get("brick4_url")),
                    "brick4_exact_match": clean(row.get("brick4_exact_match")),
                }
            )

        if issues:
            skipped.append({"sku": sku, "folder": str(folder), "handle": clean(row.get("handle")), "issues": issues})
            continue

        manifest.append(
            {
                "folder": sku,
                "folder_path": str(folder),
                "base": sku,
                "handle": clean(row.get("handle")),
                "title": clean(row.get("shopify_title")),
                "vendor": VENDOR,
                "status": STATUS,
                "product_type": clean(row.get("product_type")) or PRODUCT_TYPE_DEFAULT,
                "category": CATEGORY_ID,
                "price": PRICE,
                "variants": [
                    {
                        "sku": sku,
                        "option_name": variant_option_name(row),
                        "title_source": clean(row.get("name_en")),
                        "series": clean(row.get("series_en")),
                        "age": clean(row.get("specs_recommended_age")),
                        "piece_count": clean(row.get("specs_piece_count")),
                        "package_size": clean(row.get("specs_package_size")),
                        "finished_size": clean(row.get("specs_finished_model_size")),
                    }
                ],
                "metafields": non_empty_metafields(row),
                "main_media": [str(path) for path in main_media],
                "sku_images": [],
                "detail_images": [str(path) for path in detail_images],
                "transparent_images": [],
                "missing": {
                    "white": not bool(images["white"]),
                    "main": not bool(main_media),
                    "detail": not bool(images["detail"]),
                    "piece_count": not bool(clean(row.get("specs_piece_count"))),
                },
                "source_row": row,
            }
        )

    return manifest, skipped, piece_count_gaps


def write_manifest(
    manifest: list[dict[str, Any]],
    skipped: list[dict[str, Any]],
    piece_count_gaps: list[dict[str, Any]],
    name: str = "zoin-pending",
) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / f"{name}-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT_DIR / f"{name}-skipped.json").write_text(json.dumps(skipped, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT_DIR / f"{name}-piece-count-gaps.json").write_text(
        json.dumps(piece_count_gaps, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    with (OUT_DIR / f"{name}-manifest.csv").open("w", encoding="utf-8", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(
            [
                "sku",
                "handle",
                "title",
                "vendor",
                "status",
                "price",
                "product_type",
                "main_media_count",
                "detail_count",
                "has_white_first",
                "missing_piece_count",
            ]
        )

        for item in manifest:
            first_media = Path(item["main_media"][0]).name if item["main_media"] else ""
            writer.writerow(
                [
                    item["base"],
                    item["handle"],
                    item["title"],
                    item["vendor"],
                    item["status"],
                    item["price"],
                    item["product_type"],
                    len(item["main_media"]),
                    len(item["detail_images"]),
                    "-白底" in first_media,
                    item["missing"]["piece_count"],
                ]
            )

    with (OUT_DIR / f"{name}-piece-count-gaps.csv").open("w", encoding="utf-8", newline="") as file:
        fieldnames = ["sku", "title", "reason", "brick4_url", "brick4_exact_match"]
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(piece_count_gaps)


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
            skipped.append(
                {"folder": item["folder"], "handle": item["handle"], "reason": "existing_sku", "skus": matched_skus}
            )
        else:
            todo.append(item)

    return todo, skipped


def upload_detail_images_for_item(admin: ShopifyAdmin, item: dict[str, Any]) -> list[str]:
    urls = []

    for detail_index, source in enumerate(item.get("detail_images", []), start=1):
        for part_index, path in enumerate(detail_upload_paths(Path(source), item["base"]), start=1):
            part = f" part {part_index}" if part_index > 1 else ""
            urls.append(admin.file_create(path, f"{item['title']} details {detail_index}{part}"))

    return urls


def description_html(item: dict[str, Any], detail_urls: list[str]) -> str:
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

            detail_urls = upload_detail_images_for_item(admin, item)
            product = admin.product_set(item, description_html(item, detail_urls))
            product_id = product["id"]
            base_import.sync_product_assets(admin, item, product_id, update_description=False)
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


def source_summary(
    manifest: list[dict[str, Any]],
    local_skipped: list[dict[str, Any]],
    existing_skipped: list[dict[str, Any]],
    todo: list[dict[str, Any]],
    piece_count_gaps: list[dict[str, Any]],
) -> dict[str, Any]:
    source_rows = read_catalog_rows()
    all_manifestish = manifest + todo
    return {
        "source_manifest_json": str(OUT_DIR / "zoin-source-manifest.json"),
        "manifest_json": str(OUT_DIR / "zoin-pending-manifest.json"),
        "skipped_json": str(OUT_DIR / "zoin-pending-skipped.json"),
        "piece_count_gaps_csv": str(OUT_DIR / "zoin-pending-piece-count-gaps.csv"),
        "source_products": len(source_rows),
        "valid_source_products": len(manifest),
        "todo_products": len(todo),
        "skipped": len(local_skipped) + len(existing_skipped),
        "local_skipped": len(local_skipped),
        "existing_or_skipped": len(existing_skipped),
        "missing_images": sum(
            1
            for item in all_manifestish
            if item["missing"]["white"] or item["missing"]["main"] or item["missing"]["detail"]
        ),
        "missing_piece_count": len(piece_count_gaps),
        "vendor_not_zoin": sum(1 for row in source_rows if clean(row.get("vendor")) != VENDOR),
        "titles_not_zoin": sum(1 for row in source_rows if not clean(row.get("shopify_title")).startswith(f"{VENDOR} ")),
        "price_not_999": sum(1 for row in source_rows if clean(row.get("price")) != PRICE),
        "titles_with_chinese": sum(1 for row in source_rows if contains_cjk(clean(row.get("shopify_title")))),
        "not_ready_for_review": sum(1 for row in source_rows if clean(row.get("upload_readiness")) != "READY_FOR_REVIEW"),
    }


def run_auto(batch_size: int) -> dict[str, Any]:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    runs = []
    started_at = time.strftime("%Y%m%d-%H%M%S")

    while True:
        manifest, local_skipped, piece_count_gaps = build_manifest()
        write_manifest(manifest, local_skipped, piece_count_gaps, name="zoin-source")
        admin = ShopifyAdmin()
        todo, existing_skipped = filter_existing(admin, manifest)
        write_manifest(todo, local_skipped + existing_skipped, piece_count_gaps)

        remaining = len(todo)
        print(
            json.dumps(
                {
                    "remaining": remaining,
                    "skipped": len(local_skipped) + len(existing_skipped),
                    "missing_images": sum(
                        1
                        for item in todo
                        if item["missing"]["white"] or item["missing"]["main"] or item["missing"]["detail"]
                    ),
                    "missing_piece_count": len(piece_count_gaps),
                },
                ensure_ascii=False,
            ),
            flush=True,
        )

        if remaining == 0:
            break

        report_name = f"zoin-auto-{started_at}-batch-{len(runs) + 1:03d}-size-{batch_size}"
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


def fetch_zoin_products(admin: ShopifyAdmin) -> list[dict[str, Any]]:
    products: list[dict[str, Any]] = []
    cursor: str | None = None

    while True:
        data = admin.graphql(
            """
            query ZoinProducts($first: Int!, $after: String) {
              products(first: $first, after: $after, query: "vendor:Zoin") {
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
                  descriptionHtml
                  category {
                    id
                    name
                  }
                  media(first: 250, sortKey: POSITION) {
                    nodes {
                      id
                      alt
                    }
                  }
                  metafields(first: 20) {
                    nodes {
                      namespace
                      key
                      value
                    }
                  }
                  variants(first: 250) {
                    nodes {
                      id
                      title
                      price
                      sku
                      image {
                        id
                      }
                    }
                  }
                }
              }
            }
            """,
            {"first": 100, "after": cursor},
        )
        page = data["products"]
        products.extend(page["nodes"])
        if not page["pageInfo"]["hasNextPage"]:
            break
        cursor = page["pageInfo"]["endCursor"]

    return products


def fetch_all_sku_counts(admin: ShopifyAdmin) -> Counter[str]:
    counts: Counter[str] = Counter()
    cursor: str | None = None

    while True:
        data = admin.graphql(
            """
            query AllProductSkus($first: Int!, $after: String) {
              products(first: $first, after: $after) {
                pageInfo {
                  hasNextPage
                  endCursor
                }
                nodes {
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
            for variant in product["variants"]["nodes"]:
                sku = clean(variant.get("sku")).upper()
                if sku:
                    counts[sku] += 1
        if not page["pageInfo"]["hasNextPage"]:
            break
        cursor = page["pageInfo"]["endCursor"]

    return counts


def post_upload_audit(admin: ShopifyAdmin | None = None) -> dict[str, Any]:
    admin = admin or ShopifyAdmin()
    manifest, local_skipped, piece_count_gaps = build_manifest()
    manifest_by_sku = {item["base"]: item for item in manifest}
    products = fetch_zoin_products(admin)
    sku_counts = fetch_all_sku_counts(admin)
    shopify_by_sku: dict[str, dict[str, Any]] = {}
    issues: list[dict[str, Any]] = []

    for product in products:
        for variant in product["variants"]["nodes"]:
            sku = clean(variant.get("sku")).upper()
            if sku:
                shopify_by_sku[sku] = product

    for sku, item in manifest_by_sku.items():
        product = shopify_by_sku.get(sku)
        if not product:
            issues.append({"sku": sku, "handle": item["handle"], "issue": "missing_shopify_product"})
            continue

        variant = next((node for node in product["variants"]["nodes"] if clean(node.get("sku")).upper() == sku), {})
        media_nodes = product["media"]["nodes"]
        description_html = product.get("descriptionHtml") or ""
        category = product.get("category") or {}
        actual_first_alt = media_nodes[0].get("alt") if media_nodes else ""
        metafields = {
            f"{node['namespace']}.{node['key']}": node.get("value", "")
            for node in product.get("metafields", {}).get("nodes", [])
        }

        checks = [
            ("vendor_not_zoin", product.get("vendor") != VENDOR, product.get("vendor")),
            ("status_not_active", product.get("status") != STATUS, product.get("status")),
            ("price_not_999", clean(variant.get("price")) not in {PRICE, f"{PRICE}.0", f"{PRICE}.00"}, variant.get("price")),
            ("handle_mismatch", product.get("handle") != item["handle"], product.get("handle")),
            ("title_mismatch", product.get("title") != item["title"], product.get("title")),
            ("title_not_zoin", not clean(product.get("title")).startswith(f"{VENDOR} "), product.get("title")),
            ("title_contains_chinese", contains_cjk(clean(product.get("title"))), product.get("title")),
            ("product_type_mismatch", product.get("productType") != item["product_type"], product.get("productType")),
            ("category_mismatch", category.get("id") != CATEGORY_ID, category),
            ("missing_media", not media_nodes, len(media_nodes)),
            ("first_media_not_white", "-白底" not in (actual_first_alt or ""), actual_first_alt),
            ("missing_detail_description", "<img " not in description_html, "no_img_tag"),
            ("duplicate_sku", sku_counts[sku] > 1, sku_counts[sku]),
        ]

        for key, failed, value in checks:
            if failed:
                issues.append({"sku": sku, "handle": item["handle"], "issue": key, "value": value})

        for metafield_key, expected in item["metafields"].items():
            if metafield_key == "specs.piece_count":
                continue
            if clean(metafields.get(metafield_key)) != expected:
                issues.append(
                    {
                        "sku": sku,
                        "handle": item["handle"],
                        "issue": f"metafield_mismatch:{metafield_key}",
                        "value": metafields.get(metafield_key, ""),
                        "expected": expected,
                    }
                )

    expected_skus = set(manifest_by_sku)
    extra_skus = sorted(set(shopify_by_sku) - expected_skus)
    for sku in extra_skus:
        product = shopify_by_sku[sku]
        issues.append({"sku": sku, "handle": product.get("handle"), "issue": "extra_zoin_sku_not_in_manifest"})

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with (OUT_DIR / "zoin-post-upload-audit.csv").open("w", encoding="utf-8", newline="") as file:
        fieldnames = ["sku", "handle", "issue", "value", "expected"]
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        for issue in issues:
            writer.writerow({field: issue.get(field, "") for field in fieldnames})

    summary = {
        "source_products": len(read_catalog_rows()),
        "valid_source_products": len(manifest),
        "local_skipped": len(local_skipped),
        "shopify_zoin_products": len(products),
        "manifest_skus_found": len(set(shopify_by_sku) & set(manifest_by_sku)),
        "manifest_skus_missing": sorted(set(manifest_by_sku) - set(shopify_by_sku)),
        "extra_zoin_skus": extra_skus,
        "missing_piece_count": len(piece_count_gaps),
        "issues_count": len(issues),
        "issues_csv": str(OUT_DIR / "zoin-post-upload-audit.csv"),
    }
    (OUT_DIR / "zoin-post-upload-audit.json").write_text(
        json.dumps({"summary": summary, "issues": issues}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return summary


def main() -> int:
    parser = argparse.ArgumentParser(description="Import Zoin catalog-ready products to Shopify.")
    parser.add_argument("--dry-run", action="store_true", help="Generate manifest and skip existing Shopify products.")
    parser.add_argument("--create-batch", action="store_true", help="Create one batch of products.")
    parser.add_argument("--auto", action="store_true", help="Create repeated batches until no pending products remain.")
    parser.add_argument("--audit", action="store_true", help="Run read-only manifest/Shopify overlap audit.")
    parser.add_argument("--post-upload-audit", action="store_true", help="Run read-only post-upload Shopify audit.")
    parser.add_argument("--offset", type=int, default=0)
    parser.add_argument("--batch-size", type=int, default=10)
    args = parser.parse_args()

    if not (args.dry_run or args.create_batch or args.auto or args.audit or args.post_upload_audit):
        parser.error("Choose --dry-run, --create-batch, --auto, --audit, or --post-upload-audit")

    if args.batch_size < 1 or args.batch_size > 25:
        parser.error("--batch-size must be between 1 and 25")

    if args.auto:
        print(json.dumps(run_auto(args.batch_size), ensure_ascii=False, indent=2))
        return 0

    if args.post_upload_audit:
        print(json.dumps(post_upload_audit(), ensure_ascii=False, indent=2))
        return 0

    manifest, local_skipped, piece_count_gaps = build_manifest()
    write_manifest(manifest, local_skipped, piece_count_gaps, name="zoin-source")
    admin = ShopifyAdmin()
    todo, existing_skipped = filter_existing(admin, manifest)
    write_manifest(todo, local_skipped + existing_skipped, piece_count_gaps)
    summary = source_summary(manifest, local_skipped, existing_skipped, todo, piece_count_gaps)

    if args.audit:
        summary["post_upload_audit"] = post_upload_audit(admin)

    print(json.dumps(summary, ensure_ascii=False, indent=2))

    if args.create_batch:
        report_name = f"zoin-batch-{time.strftime('%Y%m%d-%H%M%S')}-offset-{args.offset}-size-{args.batch_size}"
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
