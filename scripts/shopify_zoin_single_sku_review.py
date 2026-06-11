#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import html
import json
import re
import time
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont, ImageStat

import shopify_sample_import as base_import
import shopify_zoin_pending_import as zoin_import


CATALOG_CSV = Path("/Volumes/ORICO/积域资料/Zoin-上架前整理/reports/zoin-catalog-ready.csv")
IMAGE_ROOT = Path("/Volumes/ORICO/积域资料/Zoin-上架前整理/images")
OUT_DIR = Path("/private/tmp/jiestar-shopify-zoin-import/zoin-single-sku-review")
VENDOR = "Zoin"
PRICE = "999"
DRAFT_STATUS = "DRAFT"
CATEGORY_ID = "gid://shopify/TaxonomyCategory/tg-5-7-12"
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
MIN_COLOR_MAIN_IMAGES = 3
MAX_COLOR_MAIN_IMAGES = 8
DETAIL_SLICE_MAX_HEIGHT = 7000
DETAIL_SLICE_MAX_WIDTH = 2000
DETAIL_SLICE_MAX_BYTES = 8 * 1024 * 1024
PREFERRED_MAIN_SUFFIXES = {
    "GT201": ["-白底-08.jpg", "-白底.jpg", "-1.jpg", "-2.jpg"],
    "GT202": ["-白底-02.jpg", "-白底-07.jpg", "-3.jpg"],
    "GT203": ["-白底-03.jpg", "-白底-06.jpg"],
    "GT204": ["-白底-04.jpg", "-白底-05.jpg"],
    "GT112": ["-白底-05.jpg", "-白底-10.png", "-白底-14.png", "-白底-19.png", "-白底-23.png", "-1.jpg"],
    "GT113": ["-白底-03.jpg", "-白底-07.jpg", "-白底-12.png", "-白底-16.png", "-白底-21.png", "-白底-25.png", "-3.jpg"],
    "GT114": ["-白底-02.jpg", "-白底-06.jpg", "-白底-11.png", "-白底-15.png", "-白底-20.png", "-白底-24.png", "-2.jpg"],
    "GT115": ["-白底-04.jpg", "-白底-08.jpg", "-白底-13.png", "-白底-17.png", "-白底-22.png", "-白底-26.png"],
    "GK401": ["-白底-02.png", "-2.png", "-3.jpg"],
    "GK402": ["-白底.png", "-1.png", "-3.jpg"],
    "GK508": ["-白底-02.jpg", "-白底-03.jpg", "-白底-04.jpg", "-白底-05.jpg", "-1.jpg", "-2.jpg", "-3.jpg"],
    "GK509": ["-白底-06.jpg", "-白底-07.jpg", "-白底-08.jpg", "-白底-09.jpg", "-白底-10.jpg"],
    "GK510": ["-白底-11.jpg", "-白底-12.jpg", "-白底-13.jpg", "-白底-14.jpg", "-白底-15.jpg"],
    "GK602": ["-白底-02.png", "-白底-03.png", "-1.png"],
    "GK603": ["-白底-04.png", "-白底-05.png", "-2.png"],
    "GK604": ["-白底-07.png", "-白底-08.png"],
    "GK605": ["-白底-09.png", "-白底-10.png"],
    "GK403": ["-白底-02.png", "-白底.png", "-1.png"],
    "GK404": ["-白底-03.png", "-白底-04.png", "-2.png"],
    "GK406": ["-白底-05.png", "-白底-06.png"],
    "GK407": ["-白底-07.png", "-白底-08.png"],
    "GT101": ["-白底.png", "-1.png"],
    "GT102": ["-白底-02.png", "-2.png"],
    "GT103": ["-白底-03.png", "-3.png"],
    "GT104": ["-白底-04.png"],
}
PREFERRED_DETAIL_SUFFIXES = {
    "GK403": ["-详情-04.jpg", "-详情-05.jpg"],
    "GK404": ["-详情-02.jpg", "-详情-06.jpg", "-详情-07.jpg"],
    "GK406": ["-详情-08.jpg", "-详情-09.jpg"],
    "GK407": ["-详情-10.jpg", "-详情-11.jpg"],
    "GT101": ["-详情-05.jpg", "-详情-06.jpg"],
    "GT102": ["-详情-09.jpg", "-详情-10.jpg"],
    "GT103": ["-详情-01.jpg", "-详情-03.jpg", "-详情-04.jpg"],
    "GT104": ["-详情-07.jpg", "-详情-08.jpg"],
    "GT201": ["-详情-02.jpg"],
    "GT202": ["-详情-04.jpg", "-详情-06.jpg"],
    "GT203": ["-详情-03.jpg"],
    "GT204": ["-详情-05.jpg"],
    "GT112": ["-详情-03.jpg"],
    "GT113": ["-详情-04.jpg"],
    "GT114": ["-详情-02.jpg", "-详情-05.jpg"],
    "GT115": ["-详情-04.jpg"],
}


def clean(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def read_rows() -> list[dict[str, str]]:
    with CATALOG_CSV.open(encoding="utf-8-sig", newline="") as file:
        return [zoin_import.apply_field_overrides(dict(row)) for row in csv.DictReader(file)]


def ignored(path: Path) -> bool:
    return path.name.startswith("._") or path.name in {".DS_Store", "Thumbs.db"}


def natural_key(path: Path) -> tuple[int, str]:
    match = re.search(r"-(\d+)(?:-[^.]+)?\.\w+$", path.name)
    return (int(match.group(1)) if match else 9999, path.name.lower())


def detail_key(path: Path) -> tuple[int, str]:
    match = re.search(r"(?:详情|detail)(?:-|_)?(?:local-|brick4-)?(\d+)?", path.name, re.I)
    return (int(match.group(1)) if match and match.group(1) else 0, path.name.lower())


def images_for_sku(sku: str) -> dict[str, list[Path]]:
    folder = IMAGE_ROOT / sku
    if not folder.exists():
        return {"white": [], "main": [], "detail": []}
    files = sorted(
        [
            path
            for path in folder.iterdir()
            if path.is_file() and path.suffix.lower() in IMAGE_EXTS and not ignored(path)
        ],
        key=lambda path: path.name.lower(),
    )
    white = [path for path in files if re.search(r"白底|white", path.name, re.I)]
    detail = [path for path in files if re.search(r"详情|detail", path.name, re.I)]
    main = [
        path
        for path in files
        if path not in white
        and path not in detail
        and re.search(rf"^{re.escape(sku)}-\d+(?:-[^.]+)?\.\w+$", path.name, re.I)
    ]
    return {
        "white": sorted(white, key=lambda path: path.name.lower()),
        "main": sorted(main, key=natural_key),
        "detail": sorted(detail, key=detail_key),
    }


def color_crop_score(image: Image.Image) -> float:
    resized = image.resize((96, 96), Image.Resampling.LANCZOS).convert("RGB")
    hsv = resized.convert("HSV")
    sat_stat = ImageStat.Stat(hsv.getchannel("S"))
    rgb_stat = ImageStat.Stat(resized)
    whiteish = 0
    pixels = resized.load()
    for y in range(96):
        for x in range(96):
            red, green, blue = pixels[x, y]
            if red > 235 and green > 235 and blue > 235:
                whiteish += 1
    white_ratio = whiteish / (96 * 96)
    color_score = sat_stat.mean[0] + sat_stat.stddev[0]
    contrast_score = sum(rgb_stat.stddev) / 3
    return color_score + contrast_score - white_ratio * 90


def detail_main_crop_paths(sku: str, detail_images: list[Path], needed: int) -> list[Path]:
    if needed <= 0:
        return []
    output_dir = OUT_DIR / "detail-main-crops" / sku
    output_dir.mkdir(parents=True, exist_ok=True)
    candidates: list[tuple[float, Path, tuple[int, int, int, int]]] = []
    for path in detail_images[:8]:
        try:
            with Image.open(path) as raw:
                image = raw.convert("RGB")
                width, height = image.size
                side = min(width, height)
                if side < 400:
                    continue
                xs = sorted({0, max(0, (width - side) // 2), max(0, width - side)})
                ys = sorted({0, max(0, (height - side) // 3), max(0, (height - side) // 2), max(0, height - side)})
                for left in xs:
                    for top in ys:
                        box = (left, top, left + side, top + side)
                        crop = image.crop(box)
                        candidates.append((color_crop_score(crop), path, box))
        except Exception:
            continue
    crops: list[Path] = []
    used_sources: set[Path] = set()
    for _, source, box in sorted(candidates, key=lambda row: row[0], reverse=True):
        if len(crops) >= needed:
            break
        if source in used_sources and len(candidates) > needed:
            continue
        output_path = output_dir / f"{sku}-detail-main-crop-{len(crops) + 1:02d}.jpg"
        with Image.open(source) as raw:
            crop = raw.convert("RGB").crop(box).resize((800, 800), Image.Resampling.LANCZOS)
            crop.save(output_path, quality=90)
        crops.append(output_path)
        used_sources.add(source)
    return crops


def preferred_main_media_paths(sku: str, images: dict[str, list[Path]], detail_paths: list[Path]) -> list[Path]:
    suffixes = PREFERRED_MAIN_SUFFIXES.get(sku)
    if not suffixes:
        color_main = images["main"][:MAX_COLOR_MAIN_IMAGES]
        if len(color_main) < MIN_COLOR_MAIN_IMAGES:
            color_main = color_main + detail_main_crop_paths(sku, detail_paths, MIN_COLOR_MAIN_IMAGES - len(color_main))
        return images["white"][:1] + color_main[:MAX_COLOR_MAIN_IMAGES]

    selected: list[Path] = []
    for suffix in suffixes:
        path = IMAGE_ROOT / sku / f"{sku}{suffix}"
        if path.exists() and path.is_file():
            selected.append(path)
    selected_names = {path.name for path in selected}
    color_count = max(0, len(selected) - 1)
    if color_count < MIN_COLOR_MAIN_IMAGES:
        selected.extend(detail_main_crop_paths(sku, detail_paths, MIN_COLOR_MAIN_IMAGES - color_count))
    return selected[: 1 + MAX_COLOR_MAIN_IMAGES]


def preferred_detail_paths(sku: str, images: dict[str, list[Path]]) -> list[Path]:
    suffixes = PREFERRED_DETAIL_SUFFIXES.get(sku)
    if not suffixes:
        return images["detail"]
    paths = []
    for suffix in suffixes:
        path = IMAGE_ROOT / sku / f"{sku}{suffix}"
        if path.exists() and path.is_file():
            paths.append(path)
    return paths or images["detail"]


def safe_detail_upload_paths(path: Path, sku: str) -> list[Path]:
    try:
        with Image.open(path) as raw:
            width, height = raw.size
            if height <= DETAIL_SLICE_MAX_HEIGHT and path.stat().st_size <= DETAIL_SLICE_MAX_BYTES:
                return [zoin_import.optimize_media_path(path, sku)]

            output_dir = OUT_DIR / "safe-detail-slices" / sku / path.stem
            output_dir.mkdir(parents=True, exist_ok=True)
            paths = []
            for index, top in enumerate(range(0, height, DETAIL_SLICE_MAX_HEIGHT), start=1):
                bottom = min(top + DETAIL_SLICE_MAX_HEIGHT, height)
                output_path = output_dir / f"{path.stem}-safe-part-{index:02d}.jpg"
                if not output_path.exists() or output_path.stat().st_size == 0:
                    crop = raw.convert("RGB").crop((0, top, width, bottom))
                    if crop.width > DETAIL_SLICE_MAX_WIDTH:
                        new_height = max(1, int(crop.height * DETAIL_SLICE_MAX_WIDTH / crop.width))
                        crop = crop.resize((DETAIL_SLICE_MAX_WIDTH, new_height), Image.Resampling.LANCZOS)
                    crop.save(output_path, quality=86)
                paths.append(output_path)
            return paths
    except Exception:
        return zoin_import.detail_upload_paths(path, sku)


def metafields_for_row(row: dict[str, str]) -> dict[str, str]:
    values = {
        "specs.piece_count": clean(row.get("specs_piece_count")),
        "specs.recommended_age": clean(row.get("specs_recommended_age")),
        "specs.finished_model_size": clean(row.get("specs_finished_model_size")),
        "specs.package_size": clean(row.get("specs_package_size")),
        "specs.difficulty_level": clean(row.get("specs_difficulty_level")) or "See product package",
        "custom.series": clean(row.get("custom_series")) or clean(row.get("series_en")),
    }
    return {key: value for key, value in values.items() if value}


def option_name(row: dict[str, str]) -> str:
    sku = clean(row.get("sku")).upper()
    name = clean(row.get("name_en")) or clean(row.get("custom_series")) or clean(row.get("product_type")) or "Building Block Set"
    return f"{sku} - {name}"


def item_for_row(row: dict[str, str]) -> dict[str, Any]:
    sku = clean(row.get("sku")).upper()
    images = images_for_sku(sku)
    detail_paths = preferred_detail_paths(sku, images)
    preferred_media = preferred_main_media_paths(sku, images, detail_paths)
    main_media = [str(path) for path in preferred_media]
    detail_images = [str(path) for path in detail_paths]
    return {
        "folder": sku,
        "folder_path": str(IMAGE_ROOT / sku),
        "base": sku,
        "handle": clean(row.get("handle")),
        "title": clean(row.get("shopify_title")),
        "vendor": VENDOR,
        "status": DRAFT_STATUS,
        "product_type": clean(row.get("product_type")) or zoin_import.PRODUCT_TYPE_DEFAULT,
        "category": CATEGORY_ID,
        "price": PRICE,
        "variants": [
            {
                "sku": sku,
                "option_name": option_name(row),
                "title_source": clean(row.get("name_en")),
                "series": clean(row.get("series_en")),
                "age": clean(row.get("specs_recommended_age")),
                "piece_count": clean(row.get("specs_piece_count")),
                "package_size": clean(row.get("specs_package_size")),
                "finished_size": clean(row.get("specs_finished_model_size")),
            }
        ],
        "metafields": metafields_for_row(row),
        "main_media": main_media,
        "detail_images": detail_images,
        "sku_images": [],
        "missing": {
            "white": not bool(images["white"]),
            "main": not bool(main_media),
            "detail": not bool(detail_images),
            "piece_count": not bool(clean(row.get("specs_piece_count"))),
        },
        "source_row": row,
    }


def fetch_zoin_products(admin: zoin_import.ShopifyAdmin) -> list[dict[str, Any]]:
    products: list[dict[str, Any]] = []
    cursor: str | None = None
    while True:
        data = admin.graphql(
            """
            query ZoinProducts($after: String) {
              products(first: 50, after: $after, query: "vendor:Zoin") {
                pageInfo { hasNextPage endCursor }
                nodes {
                  id title handle status vendor productType descriptionHtml
                  category { id name }
                  media(first: 80, sortKey: POSITION) {
                    nodes {
                      id alt mediaContentType
                      preview { image { url } }
                      ... on MediaImage { image { url } }
                    }
                  }
                  metafields(first: 50) { nodes { namespace key value } }
                  variants(first: 80) {
                    nodes {
                      id title price sku
                      image { id altText url }
                      media(first: 10) { nodes { id alt } }
                    }
                  }
                }
              }
            }
            """,
            {"after": cursor},
        )
        page = data["products"]
        products.extend(page["nodes"])
        if not page["pageInfo"]["hasNextPage"]:
            break
        cursor = page["pageInfo"]["endCursor"]
    return products


def index_products(products: list[dict[str, Any]]) -> tuple[dict[str, dict[str, Any]], dict[str, list[dict[str, Any]]]]:
    by_handle = {product["handle"]: product for product in products}
    by_sku: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for product in products:
        for variant in product["variants"]["nodes"]:
            sku = clean(variant.get("sku")).upper()
            if sku:
                by_sku[sku].append(product)
    return by_handle, by_sku


def classify_item(item: dict[str, Any], by_handle: dict[str, dict[str, Any]], by_sku: dict[str, list[dict[str, Any]]]) -> dict[str, Any]:
    sku = item["base"]
    exact = by_handle.get(item["handle"])
    sku_products = by_sku.get(sku, [])
    active_parents = [
        product
        for product in sku_products
        if product.get("status") == "ACTIVE" and len(product["variants"]["nodes"]) > 1
    ]
    exact_status = exact.get("status") if exact else ""
    action = "audit_active_single"
    if exact and exact_status == "DRAFT":
        action = "repair_existing_draft"
    elif exact and exact_status == "ACTIVE" and len(exact["variants"]["nodes"]) == 1:
        action = "audit_active_single"
    elif not exact and active_parents:
        action = "create_missing_first_sku_draft"
    elif not exact:
        action = "create_missing_draft"

    return {
        "sku": sku,
        "handle": item["handle"],
        "title": item["title"],
        "action": action,
        "exact_product_id": exact.get("id") if exact else "",
        "exact_status": exact_status,
        "active_parent_handles": [product["handle"] for product in active_parents],
        "active_parent_ids": [product["id"] for product in active_parents],
        "main_media_count": len(item["main_media"]),
        "detail_image_count": len(item["detail_images"]),
        "has_white_first": bool(item["main_media"]) and bool(re.search(r"白底|white", Path(item["main_media"][0]).name, re.I)),
        "missing_piece_count": item["missing"]["piece_count"],
    }


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")


def write_csv(path: Path, rows: list[dict[str, Any]], fields: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: json.dumps(row.get(field), ensure_ascii=False) if isinstance(row.get(field), (list, dict)) else row.get(field, "") for field in fields})


def contact_sheet(items: list[dict[str, Any]], classifications: list[dict[str, Any]], path: Path) -> None:
    by_sku = {row["sku"]: row for row in classifications}
    width, row_h = 1480, 168
    label_w, thumb_w, thumb_h = 440, 155, 118
    image = Image.new("RGB", (width, max(1, len(items)) * row_h), "white")
    draw = ImageDraw.Draw(image)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", 13)
        small = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", 11)
    except Exception:  # noqa: BLE001 - default font is acceptable for report images.
        font = ImageFont.load_default()
        small = font

    for index, item in enumerate(items):
        y = index * row_h
        fill = (248, 248, 248) if index % 2 else (255, 255, 255)
        draw.rectangle([0, y, width, y + row_h], fill=fill)
        sku = item["base"]
        classification = by_sku.get(sku, {})
        draw.text((8, y + 8), f"{sku} {item['title']}"[:58], fill=(0, 0, 0), font=font)
        draw.text((8, y + 28), f"{classification.get('action', '')} {item['handle']}"[:72], fill=(40, 40, 40), font=small)
        draw.text((8, y + 47), f"main {len(item['main_media'])} detail {len(item['detail_images'])} piece_count_missing={item['missing']['piece_count']}", fill=(90, 40, 40), font=small)
        thumbs = [Path(path) for path in item["main_media"][:4]] + [Path(path) for path in item["detail_images"][:4]]
        for col, source in enumerate(thumbs[:7]):
            x = label_w + col * thumb_w
            draw.rectangle([x + 2, y + 5, x + thumb_w - 3, y + thumb_h + 8], outline=(220, 220, 220))
            try:
                thumb = Image.open(source).convert("RGB")
                thumb.thumbnail((thumb_w - 10, thumb_h - 10), Image.Resampling.LANCZOS)
                image.paste(thumb, (x + (thumb_w - thumb.width) // 2, y + 8 + (thumb_h - thumb.height) // 2))
            except Exception:
                pass
            draw.text((x + 5, y + thumb_h + 13), source.name[:22], fill=(0, 0, 0), font=small)
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, quality=90)


def dry_run() -> dict[str, Any]:
    rows = read_rows()
    items = [item_for_row(row) for row in rows]
    admin = zoin_import.ShopifyAdmin()
    products = fetch_zoin_products(admin)
    by_handle, by_sku = index_products(products)
    classifications = [classify_item(item, by_handle, by_sku) for item in items]
    action_counts = Counter(row["action"] for row in classifications)
    piece_count_gaps = [
        {
            "sku": item["base"],
            "title": item["title"],
            "brick4_url": clean(item["source_row"].get("brick4_url")),
            "brick4_exact_match": clean(item["source_row"].get("brick4_exact_match")),
        }
        for item in items
        if item["missing"]["piece_count"]
    ]
    local_issues = [
        {
            "sku": item["base"],
            "handle": item["handle"],
            "missing": item["missing"],
        }
        for item in items
        if item["missing"]["white"] or item["missing"]["main"] or item["missing"]["detail"]
    ]
    write_json(OUT_DIR / "single-sku-items.json", items)
    write_json(OUT_DIR / "single-sku-classification.json", classifications)
    write_json(OUT_DIR / "single-sku-piece-count-gaps.json", piece_count_gaps)
    write_csv(
        OUT_DIR / "single-sku-classification.csv",
        classifications,
        [
            "sku",
            "handle",
            "title",
            "action",
            "exact_status",
            "exact_product_id",
            "active_parent_handles",
            "main_media_count",
            "detail_image_count",
            "has_white_first",
            "missing_piece_count",
        ],
    )
    write_csv(OUT_DIR / "single-sku-local-issues.csv", local_issues, ["sku", "handle", "missing"])
    contact_sheet(items, classifications, OUT_DIR / "single-sku-contact-sheet.jpg")
    summary = {
        "source_skus": len(items),
        "shopify_zoin_products": len(products),
        "shopify_status_counts": dict(Counter(product["status"] for product in products)),
        "action_counts": dict(action_counts),
        "missing_piece_count": len(piece_count_gaps),
        "local_image_issue_count": len(local_issues),
        "reports": {
            "classification_csv": str(OUT_DIR / "single-sku-classification.csv"),
            "classification_json": str(OUT_DIR / "single-sku-classification.json"),
            "contact_sheet": str(OUT_DIR / "single-sku-contact-sheet.jpg"),
            "piece_count_gaps": str(OUT_DIR / "single-sku-piece-count-gaps.json"),
        },
    }
    write_json(OUT_DIR / "single-sku-dry-run-summary.json", summary)
    return summary


def upload_details(admin: zoin_import.ShopifyAdmin, item: dict[str, Any]) -> list[str]:
    urls: list[str] = []
    cache_path = OUT_DIR / "single-sku-detail-url-cache.json"
    cache = json.loads(cache_path.read_text(encoding="utf-8")) if cache_path.exists() else {}
    for detail_index, source in enumerate(item["detail_images"], start=1):
        for part_index, path in enumerate(safe_detail_upload_paths(Path(source), item["base"]), start=1):
            key = str(path)
            if key not in cache:
                suffix = f" part {part_index}" if part_index > 1 else ""
                cache[key] = admin.file_create(path, f"{item['title']} {item['base']} details {detail_index}{suffix}")
                write_json(cache_path, cache)
            urls.append(cache[key])
    return urls


def expected_detail_part_count(item: dict[str, Any]) -> int:
    count = 0
    for source in item["detail_images"]:
        count += len(safe_detail_upload_paths(Path(source), item["base"]))
    return count


def description_html(item: dict[str, Any], urls: list[str]) -> str:
    return "\n".join(
        f'<p><img src="{html.escape(url)}" alt="{html.escape(item["title"])} {item["base"]} details part {index}" /></p>'
        for index, url in enumerate(urls, start=1)
    )


def product_update(admin: zoin_import.ShopifyAdmin, product_input: dict[str, Any]) -> None:
    data = admin.graphql(
        """
        mutation ProductUpdate($product: ProductUpdateInput!) {
          productUpdate(product: $product) {
            product { id }
            userErrors { field message }
          }
        }
        """,
        {"product": product_input},
    )
    base_import.assert_no_user_errors("productUpdate", data["productUpdate"]["userErrors"])


def variants_bulk_update(admin: zoin_import.ShopifyAdmin, product_id: str, variants: list[dict[str, Any]]) -> None:
    if not variants:
        return
    data = admin.graphql(
        """
        mutation ProductVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants, allowPartialUpdates: true) {
            product { id }
            userErrors { field message }
          }
        }
        """,
        {"productId": product_id, "variants": variants},
    )
    base_import.assert_no_user_errors("productVariantsBulkUpdate", data["productVariantsBulkUpdate"]["userErrors"])


def media_url(media: dict[str, Any]) -> str:
    return ((media.get("image") or {}).get("url") or ((media.get("preview") or {}).get("image") or {}).get("url") or "")


def sync_media(admin: zoin_import.ShopifyAdmin, item: dict[str, Any], product_id: str) -> dict[str, Any]:
    product = admin.fetch_product(product_id)
    existing_by_alt = {media.get("alt") or "": media for media in product["media"]["nodes"]}
    expected_alts = []
    inputs = []
    for source in item["main_media"]:
        path = Path(source)
        alt = f"{item['title']} - {path.name}"
        expected_alts.append(alt)
        if alt not in existing_by_alt:
            inputs.append({"originalSource": admin.stage_upload(path), "alt": alt, "mediaContentType": "IMAGE"})
    if inputs:
        admin.product_update_media(product_id, inputs)
        time.sleep(8)
    product = admin.fetch_product(product_id)
    expected_set = set(expected_alts)
    delete_ids = [media["id"] for media in product["media"]["nodes"] if (media.get("alt") or "") not in expected_set]
    detach_inputs = []
    for media_id in delete_ids:
        for variant in product["variants"]["nodes"]:
            if any(node["id"] == media_id for node in variant.get("media", {}).get("nodes", [])):
                detach_inputs.append({"variantId": variant["id"], "mediaIds": [media_id]})
    admin.detach_variant_media(product_id, detach_inputs)
    admin.delete_files(delete_ids)
    product = admin.fetch_product(product_id)
    admin.reorder_media(product_id, expected_alts)
    time.sleep(4)
    product = admin.fetch_product(product_id)
    white_alt = expected_alts[0] if expected_alts else ""
    white_media = next((media for media in product["media"]["nodes"] if (media.get("alt") or "") == white_alt), None)
    variant = product["variants"]["nodes"][0] if product["variants"]["nodes"] else None
    if white_media and variant:
        admin.append_variant_media(product_id, [{"variantId": variant["id"], "mediaIds": [white_media["id"]]}])
    return admin.fetch_product(product_id)


def create_or_repair_draft(
    admin: zoin_import.ShopifyAdmin,
    item: dict[str, Any],
    classification: dict[str, Any],
    status: str = DRAFT_STATUS,
) -> dict[str, Any]:
    product_id = classification.get("exact_product_id") or ""
    existing = bool(product_id)
    detail_urls = upload_details(admin, item)
    item_description = description_html(item, detail_urls)
    item_for_create = {**item, "status": status}
    if not existing:
        product = admin.product_set(item_for_create, item_description)
        product_id = product["id"]
    product_update(
        admin,
        {
            "id": product_id,
            "title": item["title"],
            "handle": item["handle"],
            "vendor": VENDOR,
            "status": status,
            "productType": item["product_type"],
            "category": CATEGORY_ID,
            "descriptionHtml": item_description,
            "metafields": base_import.product_metafields(item),
        },
    )
    product = admin.fetch_product(product_id)
    variants_bulk_update(
        admin,
        product_id,
        [
            {"id": variant["id"], "price": PRICE, "inventoryItem": {"sku": item["base"], "tracked": False}}
            for variant in product["variants"]["nodes"]
        ],
    )
    product = sync_media(admin, item, product_id)
    return {
        "sku": item["base"],
        "handle": item["handle"],
        "product_id": product_id,
        "existing": existing,
        "status": product["status"],
        "media_count": len(product["media"]["nodes"]),
        "description_image_count": (product.get("descriptionHtml") or "").lower().count("<img"),
        "variant_count": len(product["variants"]["nodes"]),
        "variant_bindings": [
            {
                "sku": variant.get("sku"),
                "price": variant.get("price"),
                "image_alt": (variant.get("image") or {}).get("altText"),
                "attached_media_alts": [media.get("alt") for media in variant.get("media", {}).get("nodes", [])],
            }
            for variant in product["variants"]["nodes"]
        ],
    }


def apply_draft(batch_size: int, offset: int, repair_existing_drafts: bool) -> dict[str, Any]:
    dry_run()
    items = {item["base"]: item for item in json.loads((OUT_DIR / "single-sku-items.json").read_text(encoding="utf-8"))}
    classifications = json.loads((OUT_DIR / "single-sku-classification.json").read_text(encoding="utf-8"))
    target_actions = {"create_missing_first_sku_draft", "create_missing_draft"}
    if repair_existing_drafts:
        target_actions.add("repair_existing_draft")
    targets = [
        row
        for row in classifications
        if row["action"] in target_actions
    ]
    batch = targets[offset : offset + batch_size]
    admin = zoin_import.ShopifyAdmin()
    results_path = OUT_DIR / "single-sku-apply-draft-result.json"
    results = json.loads(results_path.read_text(encoding="utf-8")) if results_path.exists() else []
    done_skus = {row.get("sku") for row in results if row.get("ok")}
    for index, target in enumerate(batch, start=1):
        sku = target["sku"]
        if sku in done_skus:
            continue
        result = {"sku": sku, "handle": target["handle"], "action": target["action"], "ok": False}
        try:
            result.update(create_or_repair_draft(admin, items[sku], target))
            result["ok"] = True
        except Exception as error:  # noqa: BLE001 - batch should report and continue.
            result["error"] = str(error)
        results.append(result)
        write_json(results_path, results)
        print(f"Processed {offset + index}: {sku} {target['action']} ok={result['ok']}", flush=True)
    summary = {
        "targets_total": len(targets),
        "target_actions": sorted(target_actions),
        "processed_this_batch": len(batch),
        "ok_total": sum(1 for row in results if row.get("ok")),
        "failed_total": sum(1 for row in results if not row.get("ok")),
        "next_offset": offset + batch_size,
        "result_json": str(results_path),
    }
    write_json(OUT_DIR / "single-sku-apply-draft-summary.json", summary)
    return summary


def post_audit() -> dict[str, Any]:
    rows = read_rows()
    admin = zoin_import.ShopifyAdmin()
    products = fetch_zoin_products(admin)
    by_handle, by_sku = index_products(products)
    issues = []
    for row in rows:
        item = item_for_row(row)
        exact = by_handle.get(item["handle"])
        sku = item["base"]
        if not exact:
            issues.append({"sku": sku, "handle": item["handle"], "issue": "missing_single_sku_product"})
            continue
        variants = exact["variants"]["nodes"]
        variant = variants[0] if variants else {}
        desc = exact.get("descriptionHtml") or ""
        media_nodes = exact["media"]["nodes"]
        metafields = {f"{node['namespace']}.{node['key']}": node.get("value", "") for node in exact["metafields"]["nodes"]}
        variant_image_alt = ((variant.get("image") or {}).get("altText") or "") if variant else ""
        attached_variant_media_alts = [node.get("alt") or "" for node in (variant.get("media") or {}).get("nodes", [])] if variant else []
        checks = [
            ("vendor_not_zoin", exact.get("vendor") != VENDOR, exact.get("vendor")),
            ("variant_count_not_one", len(variants) != 1, len(variants)),
            ("sku_mismatch", not variants or clean(variant.get("sku")).upper() != sku, [row.get("sku") for row in variants]),
            ("price_not_999", variants and clean(variant.get("price")) not in {PRICE, f"{PRICE}.0", f"{PRICE}.00"}, variant.get("price") if variants else ""),
            ("missing_media", not media_nodes, len(media_nodes)),
            ("first_media_not_white", bool(media_nodes) and not re.search(r"白底|white", media_nodes[0].get("alt") or "", re.I), media_nodes[0].get("alt") if media_nodes else ""),
            ("variant_image_missing", variants and not variant_image_alt and not attached_variant_media_alts, ""),
            (
                "variant_image_not_white_or_current_sku",
                variants
                and bool(variant_image_alt or attached_variant_media_alts)
                and not any(
                    sku in alt and re.search(r"白底|white", alt, re.I)
                    for alt in [variant_image_alt, *attached_variant_media_alts]
                ),
                {"variant_image_alt": variant_image_alt, "attached_media_alts": attached_variant_media_alts},
            ),
            ("missing_detail_description", "<img" not in desc.lower(), ""),
            ("piece_count_missing_known_gap", item["missing"]["piece_count"], ""),
        ]
        for key, failed, value in checks:
            if failed:
                issues.append({"sku": sku, "handle": item["handle"], "issue": key, "value": value})
        for key, expected in item["metafields"].items():
            if key == "specs.piece_count":
                continue
            if clean(metafields.get(key)) != expected:
                issues.append({"sku": sku, "handle": item["handle"], "issue": f"metafield_mismatch:{key}", "value": metafields.get(key, ""), "expected": expected})
    active_multi = [
        {
            "handle": product["handle"],
            "title": product["title"],
            "skus": [variant.get("sku") for variant in product["variants"]["nodes"]],
        }
        for product in products
        if product.get("status") == "ACTIVE" and len(product["variants"]["nodes"]) > 1
    ]
    summary = {
        "source_skus": len(rows),
        "shopify_zoin_products": len(products),
        "single_sku_products_found": len(rows) - sum(1 for issue in issues if issue["issue"] == "missing_single_sku_product"),
        "active_multi_variant_products": active_multi,
        "issue_count": len(issues),
        "known_piece_count_gaps": sum(1 for issue in issues if issue["issue"] == "piece_count_missing_known_gap"),
        "issues_csv": str(OUT_DIR / "single-sku-post-audit-issues.csv"),
    }
    write_json(OUT_DIR / "single-sku-post-audit.json", {"summary": summary, "issues": issues})
    write_csv(OUT_DIR / "single-sku-post-audit-issues.csv", issues, ["sku", "handle", "issue", "value", "expected"])
    return summary


def strict_media_audit() -> dict[str, Any]:
    rows = read_rows()
    admin = zoin_import.ShopifyAdmin()
    products = fetch_zoin_products(admin)
    by_handle, _ = index_products(products)
    audit_rows = []
    for row in rows:
        item = item_for_row(row)
        product = by_handle.get(item["handle"])
        expected_alts = [f"{item['title']} - {Path(source).name}" for source in item["main_media"]]
        if not product:
            audit_rows.append(
                {
                    "sku": item["base"],
                    "handle": item["handle"],
                    "status": "",
                    "needs_repair": True,
                    "reason": "missing_single_sku_product",
                }
            )
            continue
        media_alts = [media.get("alt") or "" for media in product["media"]["nodes"]]
        desc = product.get("descriptionHtml") or ""
        desc_img_count = desc.lower().count("<img")
        expected_detail_count = expected_detail_part_count(item)
        variants = product["variants"]["nodes"]
        variant = variants[0] if variants else {}
        variant_image_alt = ((variant.get("image") or {}).get("altText") or "") if variant else ""
        attached_variant_media_alts = [node.get("alt") or "" for node in (variant.get("media") or {}).get("nodes", [])] if variant else []
        other_sku_matches = sorted({match for match in re.findall(r"\bG[A-Z]\d{3}\b|\bFT\d{3}\b", desc) if match != item["base"]})
        reason = []
        if media_alts != expected_alts:
            reason.append("media_order_or_count_mismatch")
        if desc_img_count != expected_detail_count:
            reason.append("detail_image_count_mismatch")
        if other_sku_matches:
            reason.append("description_mentions_other_sku")
        if not variants or clean(variant.get("sku")).upper() != item["base"]:
            reason.append("variant_sku_mismatch")
        if variants and not any(
            item["base"] in alt and re.search(r"白底|white", alt, re.I)
            for alt in [variant_image_alt, *attached_variant_media_alts]
        ):
            reason.append("variant_image_not_current_white")
        audit_rows.append(
            {
                "sku": item["base"],
                "handle": item["handle"],
                "status": product.get("status"),
                "title": item["title"],
                "expected_media_count": len(expected_alts),
                "shopify_media_count": len(media_alts),
                "media_order_exact": media_alts == expected_alts,
                "first_expected": expected_alts[0] if expected_alts else "",
                "first_actual": media_alts[0] if media_alts else "",
                "missing_expected_media": [alt for alt in expected_alts if alt not in media_alts],
                "unexpected_media": [alt for alt in media_alts if alt not in expected_alts],
                "expected_detail_img_count": expected_detail_count,
                "shopify_detail_img_count": desc_img_count,
                "other_sku_mentions": other_sku_matches,
                "variant_image_alt": variant_image_alt,
                "attached_variant_media_alts": attached_variant_media_alts,
                "needs_repair": bool(reason),
                "reason": reason,
            }
        )
    fields = [
        "sku",
        "handle",
        "status",
        "title",
        "expected_media_count",
        "shopify_media_count",
        "media_order_exact",
        "first_expected",
        "first_actual",
        "missing_expected_media",
        "unexpected_media",
        "expected_detail_img_count",
        "shopify_detail_img_count",
        "other_sku_mentions",
        "variant_image_alt",
        "attached_variant_media_alts",
        "needs_repair",
        "reason",
    ]
    write_csv(OUT_DIR / "single-sku-strict-media-audit.csv", audit_rows, fields)
    summary = {
        "source_skus": len(rows),
        "needs_repair": sum(1 for row in audit_rows if row["needs_repair"]),
        "max_color_main_images": MAX_COLOR_MAIN_IMAGES,
        "audit_csv": str(OUT_DIR / "single-sku-strict-media-audit.csv"),
    }
    write_json(OUT_DIR / "single-sku-strict-media-audit.json", {"summary": summary, "rows": audit_rows})
    return summary


def repair_strict_media(batch_size: int, offset: int) -> dict[str, Any]:
    strict_media_audit()
    rows = read_rows()
    items = {item_for_row(row)["base"]: item_for_row(row) for row in rows}
    audit = json.loads((OUT_DIR / "single-sku-strict-media-audit.json").read_text(encoding="utf-8"))
    targets = [row for row in audit["rows"] if row.get("needs_repair")]
    batch = targets[offset : offset + batch_size]
    admin = zoin_import.ShopifyAdmin()
    products = fetch_zoin_products(admin)
    by_handle, _ = index_products(products)
    results_path = OUT_DIR / "single-sku-strict-media-repair-result.json"
    results = json.loads(results_path.read_text(encoding="utf-8")) if results_path.exists() else []
    done_skus = {row.get("sku") for row in results if row.get("ok")}
    for index, target in enumerate(batch, start=1):
        sku = target["sku"]
        if sku in done_skus:
            continue
        item = items[sku]
        product = by_handle.get(item["handle"])
        result = {"sku": sku, "handle": item["handle"], "reason": target.get("reason", []), "ok": False}
        try:
            if not product:
                raise RuntimeError("single SKU product missing")
            classification = {"exact_product_id": product["id"]}
            result.update(create_or_repair_draft(admin, item, classification, status=product.get("status") or "ACTIVE"))
            result["ok"] = True
        except Exception as error:  # noqa: BLE001 - batch should report and continue.
            result["error"] = str(error)
        results.append(result)
        write_json(results_path, results)
        print(f"Repaired {offset + index}: {sku} ok={result['ok']}", flush=True)
    summary = {
        "targets_total": len(targets),
        "processed_this_batch": len(batch),
        "ok_total": sum(1 for row in results if row.get("ok")),
        "failed_total": sum(1 for row in results if not row.get("ok")),
        "next_offset": offset + batch_size,
        "result_json": str(results_path),
    }
    write_json(OUT_DIR / "single-sku-strict-media-repair-summary.json", summary)
    return summary


def repair_crop_media(batch_size: int, offset: int) -> dict[str, Any]:
    rows = read_rows()
    items = []
    for row in rows:
        item = item_for_row(row)
        if any("detail-main-crop" in str(path) for path in item["main_media"]):
            items.append(item)
    batch = items[offset : offset + batch_size]
    admin = zoin_import.ShopifyAdmin()
    products = fetch_zoin_products(admin)
    by_handle, _ = index_products(products)
    results_path = OUT_DIR / "single-sku-crop-media-repair-result.json"
    results = json.loads(results_path.read_text(encoding="utf-8")) if results_path.exists() else []
    done_skus = {row.get("sku") for row in results if row.get("ok")}
    for index, item in enumerate(batch, start=1):
        sku = item["base"]
        if sku in done_skus:
            continue
        product = by_handle.get(item["handle"])
        result = {"sku": sku, "handle": item["handle"], "ok": False}
        try:
            if not product:
                raise RuntimeError("single SKU product missing")
            classification = {"exact_product_id": product["id"]}
            result.update(create_or_repair_draft(admin, item, classification, status=product.get("status") or "ACTIVE"))
            result["ok"] = True
        except Exception as error:  # noqa: BLE001 - batch should report and continue.
            result["error"] = str(error)
        results.append(result)
        write_json(results_path, results)
        print(f"Repaired crop media {offset + index}: {sku} ok={result['ok']}", flush=True)
    summary = {
        "targets_total": len(items),
        "processed_this_batch": len(batch),
        "ok_total": sum(1 for row in results if row.get("ok")),
        "failed_total": sum(1 for row in results if not row.get("ok")),
        "next_offset": offset + batch_size,
        "result_json": str(results_path),
    }
    write_json(OUT_DIR / "single-sku-crop-media-repair-summary.json", summary)
    return summary


def switch_live() -> dict[str, Any]:
    audit_summary = post_audit()
    audit = json.loads((OUT_DIR / "single-sku-post-audit.json").read_text(encoding="utf-8"))
    blocking_issues = [
        issue
        for issue in audit["issues"]
        if issue["issue"] != "piece_count_missing_known_gap"
    ]
    if blocking_issues:
        write_json(OUT_DIR / "single-sku-switch-live-blocking-issues.json", blocking_issues)
        raise RuntimeError(f"Refusing switch-live with {len(blocking_issues)} blocking audit issues")

    rows = read_rows()
    admin = zoin_import.ShopifyAdmin()
    products = fetch_zoin_products(admin)
    by_handle, _ = index_products(products)
    results = []
    for row in rows:
        item = item_for_row(row)
        product = by_handle.get(item["handle"])
        result = {
            "role": "single_sku",
            "sku": item["base"],
            "handle": item["handle"],
            "from_status": product.get("status") if product else "",
            "to_status": "ACTIVE",
            "ok": False,
        }
        try:
            if not product:
                raise RuntimeError("single SKU product missing")
            if product.get("status") != "ACTIVE":
                product_update(admin, {"id": product["id"], "status": "ACTIVE"})
            result["ok"] = True
        except Exception as error:  # noqa: BLE001 - write full status-switch report.
            result["error"] = str(error)
        results.append(result)
        write_json(OUT_DIR / "single-sku-switch-live-result.json", results)

    parent_handles = [row["handle"] for row in audit_summary["active_multi_variant_products"]]
    products = fetch_zoin_products(admin)
    by_handle, _ = index_products(products)
    for handle in parent_handles:
        product = by_handle.get(handle)
        result = {
            "role": "collection_parent",
            "handle": handle,
            "from_status": product.get("status") if product else "",
            "to_status": "DRAFT",
            "ok": False,
        }
        try:
            if not product:
                raise RuntimeError("collection parent product missing")
            if product.get("status") != "DRAFT":
                product_update(admin, {"id": product["id"], "status": "DRAFT"})
            result["ok"] = True
        except Exception as error:  # noqa: BLE001 - write full status-switch report.
            result["error"] = str(error)
        results.append(result)
        write_json(OUT_DIR / "single-sku-switch-live-result.json", results)

    summary = {
        "single_sku_targets": len(rows),
        "collection_parent_targets": len(parent_handles),
        "ok_total": sum(1 for row in results if row.get("ok")),
        "failed_total": sum(1 for row in results if not row.get("ok")),
        "result_json": str(OUT_DIR / "single-sku-switch-live-result.json"),
    }
    write_json(OUT_DIR / "single-sku-switch-live-summary.json", summary)
    return summary


def main() -> int:
    parser = argparse.ArgumentParser(description="Review and prepare Zoin products as one Shopify product per SKU.")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--apply-draft", action="store_true")
    parser.add_argument("--post-audit", action="store_true")
    parser.add_argument("--strict-media-audit", action="store_true")
    parser.add_argument("--repair-strict-media", action="store_true")
    parser.add_argument("--repair-crop-media", action="store_true")
    parser.add_argument("--switch-live", action="store_true", help="Activate all reviewed single-SKU Zoin products and draft active collection parents.")
    parser.add_argument("--repair-existing-drafts", action="store_true", help="Also rewrite existing Zoin DRAFT single-SKU media, description, variants, and metafields.")
    parser.add_argument("--batch-size", type=int, default=8)
    parser.add_argument("--offset", type=int, default=0)
    args = parser.parse_args()
    if not (args.dry_run or args.apply_draft or args.post_audit or args.strict_media_audit or args.repair_strict_media or args.repair_crop_media or args.switch_live):
        parser.error("Choose --dry-run, --apply-draft, --post-audit, --strict-media-audit, --repair-strict-media, --repair-crop-media, or --switch-live")
    if args.batch_size < 1 or args.batch_size > 12:
        parser.error("--batch-size must be between 1 and 12")
    if args.dry_run:
        print(json.dumps(dry_run(), ensure_ascii=False, indent=2))
    if args.apply_draft:
        print(json.dumps(apply_draft(args.batch_size, args.offset, args.repair_existing_drafts), ensure_ascii=False, indent=2))
    if args.post_audit:
        print(json.dumps(post_audit(), ensure_ascii=False, indent=2))
    if args.strict_media_audit:
        print(json.dumps(strict_media_audit(), ensure_ascii=False, indent=2))
    if args.repair_strict_media:
        print(json.dumps(repair_strict_media(args.batch_size, args.offset), ensure_ascii=False, indent=2))
    if args.repair_crop_media:
        print(json.dumps(repair_crop_media(args.batch_size, args.offset), ensure_ascii=False, indent=2))
    if args.switch_live:
        print(json.dumps(switch_live(), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
