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
from shopify_cn_pending_import import ShopifyAdmin as BaseShopifyAdmin


STAGING_ROOT = Path("/Volumes/ORICO/iblock/iblock-上架前整理")
READINESS_CSV = STAGING_ROOT / "reports" / "iblock-shopify-readiness.csv"
GROUPS_CSV = STAGING_ROOT / "reports" / "iblock-product-groups.csv"
INTEGRITY_CSV = STAGING_ROOT / "reports" / "iblock-upload-ready-integrity.csv"
UPLOAD_READY_ROOT = STAGING_ROOT / "shopify-products-upload-ready"
OUT_DIR = Path("/private/tmp/jiestar-shopify-iblock-import")

VENDOR = "iBlock"
STATUS = "ACTIVE"
PRICE = "999"
CATEGORY_ID = "gid://shopify/TaxonomyCategory/tg-5-7-12"
CATEGORY_NAME = "Interlocking Blocks"
OPTION_NAME = "Model"
EXPECTED_PRODUCT_GROUPS = 68
EXPECTED_SOURCE_SKUS = 121
EXPECTED_VARIANT_SKUS = 120
PARENT_ONLY_SKUS = {"IB2202"}
EXCLUDED_FAKE_SKUS = {"IB1101-5", "IB1102-5"}
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
IGNORED_FILE_NAMES = {".DS_Store", "Thumbs.db"}
REQUIRED_SCOPES = {"read_products", "write_products", "read_files", "write_files"}
PUBLICATION_SCOPES = {"read_publications", "write_publications"}
DETAIL_SLICE_MAX_HEIGHT = 7000
DETAIL_SLICE_MAX_BYTES = 8 * 1024 * 1024
DETAIL_UPLOAD_MAX_HEIGHT = 4000
DETAIL_UPLOAD_MAX_BYTES = 2 * 1024 * 1024
MEDIA_OPTIMIZE_BYTES = 2_500_000
MEDIA_OPTIMIZE_MAX_DIMENSION = 2000

PRODUCT_TYPE_COLLECTION_HANDLES = {
    "aircraft",
    "animal",
    "car-model",
    "city",
    "constellation",
    "engineering",
    "fairy-tale",
    "fire-rescue",
    "flower",
    "mecha",
    "military",
    "other",
    "police",
    "space",
    "tank",
    "warship",
}

PRODUCT_TYPE_TO_HANDLE = {
    "Aircraft": "aircraft",
    "Animal": "animal",
    "Car Model": "car-model",
    "City": "city",
    "Constellation": "constellation",
    "Engineering": "engineering",
    "Fairy Tale": "fairy-tale",
    "Fire Rescue": "fire-rescue",
    "Flower": "flower",
    "Mecha": "mecha",
    "Military": "military",
    "Other": "other",
    "Police": "police",
    "Space": "space",
    "Tank": "tank",
    "Warship": "warship",
}


def clean(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def contains_cjk(value: str) -> bool:
    return bool(re.search(r"[\u3400-\u9fff]", value or ""))


def normalize_sku(value: Any) -> str:
    return clean(value).upper()


def slugify(value: str) -> str:
    text = re.sub(r"[^a-z0-9]+", "-", value.lower())
    return re.sub(r"-+", "-", text).strip("-") or "iblock-product"


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        raise FileNotFoundError(f"Missing required CSV: {path}")
    with path.open(encoding="utf-8-sig", newline="") as file:
        return [dict(row) for row in csv.DictReader(file)]


def sku_list(value: str) -> list[str]:
    return [normalize_sku(part) for part in re.split(r"[,，]", value or "") if normalize_sku(part)]


def image_dimensions(path: Path) -> tuple[int, int]:
    try:
        output = subprocess.check_output(
            ["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(path)],
            text=True,
            stderr=subprocess.DEVNULL,
        )
    except Exception:  # noqa: BLE001 - best effort for upload optimization.
        return 0, 0

    width = re.search(r"pixelWidth:\s*(\d+)", output)
    height = re.search(r"pixelHeight:\s*(\d+)", output)
    return (int(width.group(1)), int(height.group(1))) if width and height else (0, 0)


def optimize_media_path(path: Path, group: str) -> Path:
    if not path.exists() or path.stat().st_size <= MEDIA_OPTIMIZE_BYTES:
        return path

    output_dir = OUT_DIR / "optimized-media" / group
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


def detail_upload_paths(path: Path, group: str) -> list[Path]:
    width, height = image_dimensions(path)

    if not width or not height:
        return base_import.detail_image_paths(path)

    if height <= DETAIL_UPLOAD_MAX_HEIGHT and path.stat().st_size <= DETAIL_UPLOAD_MAX_BYTES:
        return [optimize_media_path(path, group)]

    try:
        from PIL import Image
    except ImportError:
        return base_import.detail_image_paths(path)

    output_dir = OUT_DIR / "detail-slices" / group / path.stem
    output_dir.mkdir(parents=True, exist_ok=True)
    paths: list[Path] = []

    with Image.open(path) as image:
        if image.mode != "RGB":
            image = image.convert("RGB")

        for index, top in enumerate(range(0, height, DETAIL_UPLOAD_MAX_HEIGHT), start=1):
            bottom = min(top + DETAIL_UPLOAD_MAX_HEIGHT, height)
            output_path = output_dir / f"{path.stem}-part-{index:02d}.jpg"

            if not output_path.exists() or output_path.stat().st_size == 0 or output_path.stat().st_size > DETAIL_UPLOAD_MAX_BYTES:
                crop = image.crop((0, top, width, bottom))
                quality = 84
                while True:
                    crop.save(output_path, format="JPEG", quality=quality, optimize=True)
                    if output_path.stat().st_size <= DETAIL_UPLOAD_MAX_BYTES or quality <= 62:
                        break
                    quality -= 6
            paths.append(output_path)

    return paths


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
        key=lambda path: natural_image_key(path.name),
    )


def file_prefix(path: Path) -> str:
    return path.name.split("__", 1)[0].upper() if "__" in path.name else ""


def logical_name(path: Path) -> str:
    return path.name.split("__", 1)[1] if "__" in path.name else path.name


def natural_image_key(name: str) -> tuple[int, int, str]:
    logical = name.split("__", 1)[-1]
    is_white = 0 if "白底" in logical else 1
    match = re.search(r"-(\d+)(?:-[^.]+)?\.\w+$", logical)
    number = int(match.group(1)) if match else 9999
    return (is_white, number, logical.lower())


def detail_image_key(path: Path) -> tuple[str, int, str]:
    name = logical_name(path)
    match = re.search(r"详情(?:-|_)?(?:brick4-)?(\d+)?", name, re.I)
    number = int(match.group(1)) if match and match.group(1) else 0
    return (file_prefix(path), number, name.lower())


def is_detail(path: Path) -> bool:
    return bool(re.search(r"详情|detail", logical_name(path), re.I))


def is_sku_image(path: Path) -> bool:
    return bool(re.search(r"(?:^|[-_])sku(?:[-_.]|$)", logical_name(path), re.I))


def is_white(path: Path) -> bool:
    return "白底" in logical_name(path)


def is_numbered_main(path: Path) -> bool:
    name = logical_name(path)
    return bool(re.search(r"-\d+(?:-[^.]+)?\.\w+$", name, re.I)) and not is_detail(path) and not is_sku_image(path)


def title_fragment(title: str) -> str:
    value = re.sub(r"^iBlock\s+", "", title, flags=re.I)
    value = re.sub(r"\s+Building Block Set$", "", value, flags=re.I)
    return clean(value) or "Model"


def product_type_for_row(row: dict[str, str]) -> str:
    series = clean(row.get("product_series") or row.get("custom_series"))
    title = clean(row.get("shopify_title_safe"))
    haystack = f"{series} {title}".lower()

    if "十二生肖" in series or "十二星座" in series or "zodiac" in haystack:
        return "Constellation"
    if any(term in series for term in ["四时花境", "花愿祈", "花漾玲珑"]) or "flower" in haystack:
        return "Flower"
    if "虫界漫游" in series or "butterfly flower" in haystack:
        return "Animal"
    if "极速方程" in series or "race car" in haystack:
        return "Car Model"
    if "瓶中童话" in series or "fairy tale" in haystack:
        return "Fairy Tale"
    if "医疗" in series or "medical" in haystack or "ambulance" in haystack:
        return "City"
    if "工程" in series or "construction" in haystack or "bulldozer" in haystack or "excavator" in haystack:
        return "Engineering"
    if "救援" in series or "fire truck" in haystack or "firefighter" in haystack or "rescue" in haystack:
        return "Fire Rescue"
    if "快反" in series or "police" in haystack or "rapid response" in haystack:
        return "Police"
    if "太空" in series or "space" in haystack or "rocket" in haystack or "rover" in haystack or "satellite" in haystack:
        return "Space"
    if any(term in haystack for term in ["aircraft carrier", "amphibious assault ship", "submarine", "destroyer", " ship"]):
        return "Warship"
    if any(term in haystack for term in ["aircraft", "fighter", "helicopter", "drone", "air mission"]):
        return "Aircraft"
    if "tank" in haystack:
        return "Tank"
    if "特种" in series or "special operations" in haystack or "mini military" in haystack or "military" in haystack or "missile" in haystack:
        return "Military"
    if "封神战甲录" in series or "次元仿生" in series or "mecha" in haystack:
        return "Mecha"
    return "Other"


def product_type_handle(product_type: str) -> str:
    return PRODUCT_TYPE_TO_HANDLE.get(product_type, slugify(product_type))


def group_title(group: dict[str, str], rows_by_sku: dict[str, dict[str, str]], variant_skus: list[str]) -> str:
    parent_sku = normalize_sku(group.get("parent_sku"))
    if parent_sku and rows_by_sku.get(parent_sku):
        title = clean(rows_by_sku[parent_sku].get("shopify_title_safe"))
        if title and not contains_cjk(title):
            return title

    if len(variant_skus) == 1:
        title = clean(rows_by_sku[variant_skus[0]].get("shopify_title_safe"))
        if title and not contains_cjk(title):
            return title

    first_row = rows_by_sku.get(variant_skus[0], {}) if variant_skus else {}
    product_type = product_type_for_row(first_row)
    label_by_group = {
        "IB1065-IB1068": "Bottled Fairy Tale",
        "IB1076-IB1081": "Race Car",
        "IB1085-IB1090": "Flower",
        "IB1101-1-IB1101-4": "Rescue Team",
        "IB1102-1-IB1102-4": "Rapid Response Team",
        "IB1103-1-IB1103-4": "Special Operations Team",
        "IB1104-1-IB1104-4": "Construction Team",
        "IB1111-IB1114": "Air Mission Team",
        "IB1401-1-IB1401-6": "Floral Wish",
        "IB2001-1-IB2001-12": "Zodiac Star Box",
        "IB2202-1-IB2202-9": "Insect Explorer",
    }
    label = label_by_group.get(clean(group.get("upload_group")), product_type)
    return f"iBlock {label} {len(variant_skus)}-Model Building Block Set"


def handle_for_title(group_name: str, title: str) -> str:
    return slugify(title.removeprefix("iBlock ").strip()) or slugify(group_name)


def non_empty_metafields(row: dict[str, str], product_type: str) -> dict[str, str]:
    metafields = {
        "specs.piece_count": clean(row.get("specs_piece_count")),
        "specs.recommended_age": clean(row.get("specs_recommended_age") or row.get("recommended_age")),
        "specs.finished_model_size": clean(row.get("specs_finished_model_size") or row.get("product_size_cm")),
        "specs.package_size": clean(row.get("specs_package_size") or row.get("box_size_cm")),
        "specs.difficulty_level": clean(row.get("specs_difficulty_level")) or "See product package",
        "custom.series": product_type,
    }
    return {key: value for key, value in metafields.items() if value}


def image_buckets(folder: Path, group: dict[str, str], variant_skus: list[str]) -> dict[str, list[Path]]:
    files = image_files(folder)
    parent_sku = normalize_sku(group.get("parent_sku"))
    primary = parent_sku or (variant_skus[0] if variant_skus else clean(group.get("upload_group")).upper())
    variant_set = set(variant_skus)

    primary_files = [path for path in files if file_prefix(path) in {primary, ""}]
    white = [path for path in primary_files if is_white(path) and not is_detail(path)]
    main = [path for path in primary_files if is_numbered_main(path)]
    detail = sorted([path for path in files if is_detail(path)], key=detail_image_key)
    explicit_sku_images = [
        path
        for path in files
        if file_prefix(path) in variant_set and is_sku_image(path)
    ]
    explicit_sku_prefixes = {file_prefix(path) for path in explicit_sku_images}
    white_fallback_images = [
        path
        for path in files
        if file_prefix(path) in variant_set
        and file_prefix(path) not in explicit_sku_prefixes
        and is_white(path)
        and not is_detail(path)
    ]
    sku_images = explicit_sku_images + white_fallback_images

    return {
        "white": sorted(white, key=lambda path: natural_image_key(path.name)),
        "main": sorted(main, key=lambda path: natural_image_key(path.name)),
        "sku": sorted(sku_images, key=lambda path: (file_prefix(path), natural_image_key(path.name))),
        "detail": detail,
    }


def validate_source_tables(
    readiness_rows: list[dict[str, str]],
    groups: list[dict[str, str]],
    integrity_rows: list[dict[str, str]],
    *,
    strict_counts: bool = True,
) -> list[str]:
    issues: list[str] = []
    source_skus = {normalize_sku(row.get("sku")) for row in readiness_rows if normalize_sku(row.get("sku"))}
    variant_skus = {
        sku
        for group in groups
        for sku in sku_list(group.get("variant_skus", ""))
    }
    parent_skus = {normalize_sku(group.get("parent_sku")) for group in groups if normalize_sku(group.get("parent_sku"))}

    if strict_counts:
        if len(groups) != EXPECTED_PRODUCT_GROUPS:
            issues.append(f"product_group_count:{len(groups)}")
        if len(source_skus) != EXPECTED_SOURCE_SKUS:
            issues.append(f"source_sku_count:{len(source_skus)}")
        if len(variant_skus) != EXPECTED_VARIANT_SKUS:
            issues.append(f"variant_sku_count:{len(variant_skus)}")
        if source_skus - variant_skus != PARENT_ONLY_SKUS:
            issues.append(f"parent_only_skus:{','.join(sorted(source_skus - variant_skus))}")
    else:
        if not groups:
            issues.append("product_group_count:0")
        missing_variant_rows = sorted(variant_skus - source_skus)
        if missing_variant_rows:
            issues.append(f"missing_variant_rows:{','.join(missing_variant_rows)}")
        unexpected_source_rows = sorted(source_skus - variant_skus - parent_skus)
        if unexpected_source_rows:
            issues.append(f"unexpected_source_rows:{','.join(unexpected_source_rows)}")
    if EXCLUDED_FAKE_SKUS & source_skus:
        issues.append(f"fake_skus_present:{','.join(sorted(EXCLUDED_FAKE_SKUS & source_skus))}")

    bad_integrity = [
        row["upload_group"]
        for row in integrity_rows
        if int(row.get("unreadable_count") or 0) != 0
        or int(row.get("detail_count") or 0) == 0
        or (int(row.get("white_count") or 0) == 0 and int(row.get("main_count") or 0) == 0)
    ]
    if bad_integrity:
        issues.append(f"integrity_issues:{','.join(bad_integrity[:10])}")

    missing_parent_rows = sorted(parent_skus - source_skus)
    if missing_parent_rows:
        issues.append(f"missing_parent_rows:{','.join(missing_parent_rows)}")

    group_names = {clean(group.get("upload_group")) for group in groups if clean(group.get("upload_group"))}
    integrity_names = {clean(row.get("upload_group")) for row in integrity_rows if clean(row.get("upload_group"))}
    missing_integrity = sorted(group_names - integrity_names)
    if missing_integrity:
        issues.append(f"missing_integrity_rows:{','.join(missing_integrity)}")

    return issues


def build_manifest(
    *,
    strict_counts: bool = True,
    sku_filter: set[str] | None = None,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]], list[dict[str, str]]]:
    readiness_rows = read_csv(READINESS_CSV)
    groups = read_csv(GROUPS_CSV)
    integrity_rows = read_csv(INTEGRITY_CSV)
    requested_skus = {normalize_sku(sku) for sku in (sku_filter or set()) if normalize_sku(sku)}
    if requested_skus:
        groups = [
            group
            for group in groups
            if requested_skus
            & (set(sku_list(group.get("variant_skus", ""))) | {normalize_sku(group.get("parent_sku"))})
        ]
        selected_groups = {clean(group.get("upload_group")) for group in groups}
        selected_skus = {
            sku
            for group in groups
            for sku in (sku_list(group.get("variant_skus", "")) + [normalize_sku(group.get("parent_sku"))])
            if sku
        }
        missing_requested = sorted(requested_skus - selected_skus)
        if missing_requested:
            raise RuntimeError(f"Requested SKU not found in staging reports: {', '.join(missing_requested)}")
        readiness_rows = [row for row in readiness_rows if normalize_sku(row.get("sku")) in selected_skus]
        integrity_rows = [row for row in integrity_rows if clean(row.get("upload_group")) in selected_groups]

    source_issues = validate_source_tables(
        readiness_rows,
        groups,
        integrity_rows,
        strict_counts=strict_counts,
    )
    integrity_by_group = {clean(row.get("upload_group")): row for row in integrity_rows}
    rows_by_sku = {normalize_sku(row.get("sku")): row for row in readiness_rows}
    manifest: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []
    piece_count_gaps: list[dict[str, Any]] = []
    product_type_plan: list[dict[str, str]] = []
    seen_handles: Counter[str] = Counter()

    for group in groups:
        group_name = clean(group.get("upload_group"))
        variant_skus = sku_list(group.get("variant_skus", ""))
        parent_sku = normalize_sku(group.get("parent_sku"))
        primary_sku = parent_sku or (variant_skus[0] if variant_skus else "")
        primary_row = rows_by_sku.get(primary_sku) or rows_by_sku.get(variant_skus[0], {})
        product_type = product_type_for_row(primary_row)
        title = group_title(group, rows_by_sku, variant_skus)
        handle = handle_for_title(group_name, title)
        seen_handles[handle] += 1
        folder = UPLOAD_READY_ROOT / group_name / "images"
        buckets = image_buckets(folder, group, variant_skus)
        main_media = [optimize_media_path(path, group_name) for path in buckets["white"][:1] + buckets["main"]]
        sku_images = [optimize_media_path(path, group_name) for path in buckets["sku"]]
        detail_images = buckets["detail"]
        issues = list(source_issues)
        integrity = integrity_by_group.get(group_name, {})

        if not group_name:
            issues.append("missing_upload_group")
        if not variant_skus:
            issues.append("missing_variant_skus")
        if contains_cjk(title):
            issues.append("title_contains_chinese")
        if clean(primary_row.get("vendor")) != VENDOR:
            issues.append("vendor_not_iblock")
        if clean(primary_row.get("category")) != CATEGORY_NAME:
            issues.append("category_not_interlocking_blocks")
        if clean(primary_row.get("shopify_price")) != PRICE:
            issues.append("price_not_999")
        if not folder.exists():
            issues.append("missing_upload_ready_folder")
        if not main_media:
            issues.append("missing_main_media")
        if not detail_images:
            issues.append("missing_detail_image")
        if int(integrity.get("unreadable_count") or 0) != 0:
            issues.append("unreadable_upload_ready_image")
        if contains_cjk(product_type):
            issues.append("product_type_contains_chinese")

        variants = []
        for sku in variant_skus:
            row = rows_by_sku.get(sku)
            if not row:
                issues.append(f"missing_variant_row:{sku}")
                continue
            if sku in EXCLUDED_FAKE_SKUS:
                issues.append(f"fake_sku_variant:{sku}")
            if not clean(row.get("specs_piece_count")):
                piece_count_gaps.append(
                    {
                        "sku": sku,
                        "upload_group": group_name,
                        "title": clean(row.get("shopify_title_safe")),
                        "reason": "missing_piece_count",
                        "display_fallback": clean(row.get("specs_piece_count_display")),
                    }
                )
            variants.append(
                {
                    "sku": sku,
                    "option_name": f"{sku} - {title_fragment(clean(row.get('shopify_title_safe')))}",
                    "title_source": clean(row.get("shopify_title_safe")),
                    "age": clean(row.get("specs_recommended_age")),
                    "piece_count": clean(row.get("specs_piece_count")),
                    "package_size": clean(row.get("specs_package_size")),
                    "finished_size": clean(row.get("specs_finished_model_size")),
                }
            )

        product_type_plan.append(
            {
                "upload_group": group_name,
                "source_series": clean(primary_row.get("product_series")),
                "target_product_type": product_type,
                "target_handle": product_type_handle(product_type),
                "title": title,
            }
        )

        if issues:
            skipped.append({"upload_group": group_name, "handle": handle, "issues": sorted(set(issues))})
            continue

        manifest.append(
            {
                "folder": group_name,
                "folder_path": str(folder),
                "base": group_name,
                "parent_sku": parent_sku,
                "handle": handle,
                "title": title,
                "vendor": VENDOR,
                "status": STATUS,
                "product_type": product_type,
                "product_type_handle": product_type_handle(product_type),
                "category": CATEGORY_ID,
                "price": PRICE,
                "option_name": OPTION_NAME,
                "variants": variants,
                "metafields": non_empty_metafields(primary_row, product_type),
                "main_media": [str(path) for path in main_media],
                "sku_images": [str(path) for path in sku_images],
                "detail_images": [str(path) for path in detail_images],
                "transparent_images": [],
                "missing": {
                    "white": not bool(buckets["white"]),
                    "main": not bool(main_media),
                    "detail": not bool(detail_images),
                    "piece_count": not bool(clean(primary_row.get("specs_piece_count"))),
                },
                "source_row": primary_row,
            }
        )

    duplicate_handles = {handle for handle, count in seen_handles.items() if count > 1}
    if duplicate_handles:
        for item in manifest:
            if item["handle"] in duplicate_handles:
                item["handle"] = f"{item['handle']}-{slugify(item['folder'])}"

    return manifest, skipped, piece_count_gaps, product_type_plan


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fieldnames})


def write_manifest(
    manifest: list[dict[str, Any]],
    skipped: list[dict[str, Any]],
    piece_count_gaps: list[dict[str, Any]],
    product_type_plan: list[dict[str, str]],
    name: str = "iblock-pending",
) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / f"{name}-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT_DIR / f"{name}-skipped.json").write_text(json.dumps(skipped, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT_DIR / f"{name}-piece-count-gaps.json").write_text(json.dumps(piece_count_gaps, ensure_ascii=False, indent=2), encoding="utf-8")

    write_csv(
        OUT_DIR / f"{name}-manifest.csv",
        [
            {
                "upload_group": item["folder"],
                "handle": item["handle"],
                "title": item["title"],
                "vendor": item["vendor"],
                "status": item["status"],
                "price": item["price"],
                "product_type": item["product_type"],
                "variant_count": len(item["variants"]),
                "variant_skus": ", ".join(variant["sku"] for variant in item["variants"]),
                "main_media_count": len(item["main_media"]),
                "sku_media_count": len(item["sku_images"]),
                "detail_count": len(item["detail_images"]),
                "has_white_first": "-白底" in Path(item["main_media"][0]).name if item["main_media"] else False,
                "missing_piece_count": item["missing"]["piece_count"],
            }
            for item in manifest
        ],
        [
            "upload_group",
            "handle",
            "title",
            "vendor",
            "status",
            "price",
            "product_type",
            "variant_count",
            "variant_skus",
            "main_media_count",
            "sku_media_count",
            "detail_count",
            "has_white_first",
            "missing_piece_count",
        ],
    )
    write_csv(
        OUT_DIR / "iblock-product-type-plan.csv",
        product_type_plan,
        ["upload_group", "source_series", "target_product_type", "target_handle", "title", "existing_product_type", "existing_collection", "action"],
    )
    write_csv(
        OUT_DIR / "iblock-upload-conflicts.csv",
        skipped,
        ["upload_group", "folder", "handle", "reason", "skus", "issues"],
    )
    write_csv(
        OUT_DIR / "iblock-piece-count-gaps.csv",
        piece_count_gaps,
        ["sku", "upload_group", "title", "reason", "display_fallback"],
    )


class ShopifyAdmin(BaseShopifyAdmin):
    def product_set(self, item: dict[str, Any], description_html: str) -> dict[str, Any]:
        variants = [
            {
                "optionValues": [
                    {
                        "optionName": item.get("option_name") or OPTION_NAME,
                        "name": variant["option_name"],
                    }
                ],
                "price": item["price"],
                "inventoryItem": {
                    "sku": variant["sku"],
                    "tracked": False,
                },
            }
            for variant in item["variants"]
        ]
        data = self.graphql(
            """
            mutation ProductSet($input: ProductSetInput!, $synchronous: Boolean!) {
              productSet(input: $input, synchronous: $synchronous) {
                product {
                  id
                  title
                  handle
                  status
                  vendor
                  productType
                  variants(first: 250) {
                    nodes {
                      id
                      title
                      price
                      sku
                      inventoryItem {
                        id
                        tracked
                      }
                    }
                  }
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """,
            {
                "synchronous": True,
                "input": {
                    "title": item["title"],
                    "handle": item["handle"],
                    "vendor": item["vendor"],
                    "status": item["status"],
                    "productType": item["product_type"],
                    "descriptionHtml": description_html,
                    "productOptions": [
                        {
                            "name": item.get("option_name") or OPTION_NAME,
                            "values": [{"name": variant["option_name"]} for variant in item["variants"]],
                        }
                    ],
                    "variants": variants,
                    "metafields": base_import.product_metafields(item),
                },
            },
        )
        result = data["productSet"]
        base_import.assert_no_user_errors("productSet", result["userErrors"])
        return result["product"]

    def product_type_collections(self) -> list[dict[str, str]]:
        collections: list[dict[str, str]] = []
        cursor: str | None = None

        while True:
            data = self.graphql(
                """
                query ProductTypeCollections($cursor: String) {
                  collections(first: 250, after: $cursor, sortKey: TITLE) {
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                    nodes {
                      id
                      handle
                      title
                      websiteCollectionType: metafield(namespace: "custom", key: "website_collection_type") {
                        value
                      }
                    }
                  }
                }
                """,
                {"cursor": cursor},
            )
            page = data["collections"]
            for node in page["nodes"]:
                collections.append(
                    {
                        "id": node["id"],
                        "handle": node["handle"],
                        "title": node["title"],
                        "website_collection_type": (node.get("websiteCollectionType") or {}).get("value") or "",
                    }
                )
            if not page["pageInfo"]["hasNextPage"]:
                break
            cursor = page["pageInfo"]["endCursor"]
        return collections

    def existing_product_types(self) -> set[str]:
        product_types: set[str] = set()
        cursor: str | None = None

        while True:
            data = self.graphql(
                """
                query ExistingProductTypes($cursor: String) {
                  products(first: 250, after: $cursor) {
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                    nodes {
                      productType
                    }
                  }
                }
                """,
                {"cursor": cursor},
            )
            page = data["products"]
            for node in page["nodes"]:
                product_type = clean(node.get("productType"))
                if product_type:
                    product_types.add(product_type)
            if not page["pageInfo"]["hasNextPage"]:
                break
            cursor = page["pageInfo"]["endCursor"]
        return product_types

    def collection_create(self, payload: dict[str, Any]) -> str:
        data = self.graphql(
            """
            mutation CollectionCreate($input: CollectionInput!) {
              collectionCreate(input: $input) {
                collection {
                  id
                  handle
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """,
            {"input": payload},
        )
        base_import.assert_no_user_errors("collectionCreate", data["collectionCreate"]["userErrors"])
        return data["collectionCreate"]["collection"]["id"]

    def collection_update(self, payload: dict[str, Any]) -> None:
        data = self.graphql(
            """
            mutation CollectionUpdate($input: CollectionInput!) {
              collectionUpdate(input: $input) {
                collection {
                  id
                  handle
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """,
            {"input": payload},
        )
        base_import.assert_no_user_errors("collectionUpdate", data["collectionUpdate"]["userErrors"])

    def fetch_iblock_products(self) -> list[dict[str, Any]]:
        products: list[dict[str, Any]] = []
        cursor: str | None = None

        while True:
            data = self.graphql(
                """
                query IblockProducts($cursor: String) {
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
                {"cursor": cursor},
            )
            page = data["products"]
            products.extend(page["nodes"])
            if not page["pageInfo"]["hasNextPage"]:
                break
            cursor = page["pageInfo"]["endCursor"]
        return products


def collection_payload(product_type: str) -> dict[str, Any]:
    handle = product_type_handle(product_type)
    return {
        "handle": handle,
        "title": product_type,
        "descriptionHtml": f"<p>Browse {html.escape(product_type)} building block sets.</p>",
        "ruleSet": {
            "appliedDisjunctively": False,
            "rules": [{"column": "TYPE", "relation": "EQUALS", "condition": product_type}],
        },
        "metafields": [
            {
                "namespace": "custom",
                "key": "website_collection_type",
                "type": "single_line_text_field",
                "value": "product_type",
            }
        ],
    }


def enrich_product_type_plan(admin: ShopifyAdmin, product_type_plan: list[dict[str, str]], apply: bool) -> list[dict[str, str]]:
    existing_types = {value.casefold(): value for value in admin.existing_product_types()}
    collections = admin.product_type_collections()
    collections_by_handle = {row["handle"]: row for row in collections}
    collection_titles = {row["title"].casefold(): row for row in collections}
    updated: list[dict[str, str]] = []
    for row in product_type_plan:
        existing = existing_types.get(row["target_product_type"].casefold())
        if existing:
            row["target_product_type"] = existing
            row["target_handle"] = product_type_handle(existing)

    seen_types = sorted({row["target_product_type"] for row in product_type_plan})

    for product_type in seen_types:
        handle = product_type_handle(product_type)
        collection = collections_by_handle.get(handle) or collection_titles.get(product_type.casefold())
        existing_product_type = existing_types.get(product_type.casefold(), "")
        action = "ok"

        if collection and collection.get("website_collection_type") != "product_type":
            action = "mark_collection_product_type"
            if apply:
                payload = collection_payload(product_type)
                payload["id"] = collection["id"]
                admin.collection_update(payload)
                collection["website_collection_type"] = "product_type"
        elif not collection:
            action = "create_collection"
            if apply:
                collection_id = admin.collection_create(collection_payload(product_type))
                collection = {
                    "id": collection_id,
                    "handle": handle,
                    "title": product_type,
                    "website_collection_type": "product_type",
                }

        updated.append(
            {
                "target_product_type": product_type,
                "target_handle": handle,
                "existing_product_type": existing_product_type,
                "existing_collection": "yes" if collection else "no",
                "collection_id": collection.get("id", "") if collection else "",
                "action": action,
            }
        )

    by_type = {row["target_product_type"]: row for row in updated}
    for row in product_type_plan:
        plan_row = by_type[row["target_product_type"]]
        row.update(
            {
                "existing_product_type": plan_row["existing_product_type"],
                "existing_collection": plan_row["existing_collection"],
                "action": plan_row["action"],
            }
        )

    return product_type_plan


def apply_product_type_plan_to_manifest(manifest: list[dict[str, Any]], product_type_plan: list[dict[str, str]]) -> None:
    by_group = {row["upload_group"]: row for row in product_type_plan}
    for item in manifest:
        row = by_group.get(item["folder"])
        if not row:
            continue
        product_type = row["target_product_type"]
        item["product_type"] = product_type
        item["product_type_handle"] = product_type_handle(product_type)
        if "custom.series" in item["metafields"]:
            item["metafields"]["custom.series"] = product_type


def filter_existing(admin: ShopifyAdmin, manifest: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    existing_handles, existing_skus = admin.products_index()
    todo: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []

    for item in manifest:
        item_skus = {variant["sku"].upper() for variant in item["variants"]}
        matched_skus = sorted(item_skus & existing_skus)

        if item["handle"] in existing_handles:
            skipped.append({"upload_group": item["folder"], "handle": item["handle"], "reason": "existing_handle", "skus": ""})
        elif matched_skus:
            skipped.append({"upload_group": item["folder"], "handle": item["handle"], "reason": "existing_sku", "skus": ", ".join(matched_skus)})
        else:
            todo.append(item)

    return todo, skipped


def media_inputs_for_item(admin: ShopifyAdmin, item: dict[str, Any], existing_alts: set[str]) -> tuple[list[dict[str, Any]], list[str]]:
    media_inputs: list[dict[str, Any]] = []
    expected_alts: list[str] = []

    for media_path in item["main_media"]:
        path = Path(media_path)
        alt = f"{item['title']} - {path.name}"
        expected_alts.append(alt)
        if alt not in existing_alts:
            media_inputs.append({"originalSource": admin.stage_upload(path), "alt": alt, "mediaContentType": "IMAGE"})

    for media_path in item["sku_images"]:
        path = Path(media_path)
        alt = f"{item['title']} SKU image - {path.name}"
        expected_alts.append(alt)
        if alt not in existing_alts:
            media_inputs.append({"originalSource": admin.stage_upload(path), "alt": alt, "mediaContentType": "IMAGE"})

    return media_inputs, expected_alts


def append_variant_media(admin: ShopifyAdmin, product_id: str) -> None:
    product = admin.fetch_product(product_id)
    media_by_sku: dict[str, tuple[int, str]] = {}
    sku_media_ids: list[str] = []

    for media in product["media"]["nodes"]:
        alt = media.get("alt") or ""
        if "SKU image - " not in alt:
            continue
        sku_media_ids.append(media["id"])
        name = alt.rsplit("SKU image - ", 1)[-1]
        prefix = name.split("__", 1)[0].upper() if "__" in name else ""
        match = re.search(r"(IB\d{4}(?:-\d+)?)", name, re.I)
        sku = prefix or (match.group(1).upper() if match else "")
        if sku:
            lower_name = name.lower()
            if re.search(r"-sku\.[a-z0-9]+$", lower_name):
                score = 0
            elif "brick4" in lower_name:
                score = 3
            elif "白底" in name:
                score = 1
            elif "-sku" in lower_name:
                score = 2
            else:
                score = 4
            current = media_by_sku.get(sku)
            if current is None or score < current[0]:
                media_by_sku[sku] = (score, media["id"])

    variant_media = []
    detach_inputs = []
    for variant in product["variants"]["nodes"]:
        sku = clean(variant.get("sku")).upper()
        media_entry = media_by_sku.get(sku)
        media_id = media_entry[1] if media_entry else None
        if not media_id and len(product["variants"]["nodes"]) == 1 and len(sku_media_ids) == 1:
            media_id = sku_media_ids[0]
        if media_id:
            current_media_ids = [node["id"] for node in variant.get("media", {}).get("nodes", []) if node.get("id")]
            if current_media_ids:
                detach_inputs.append({"variantId": variant["id"], "mediaIds": current_media_ids})
            variant_media.append({"variantId": variant["id"], "mediaIds": [media_id]})

    admin.detach_variant_media(product_id, detach_inputs)
    admin.append_variant_media(product_id, variant_media)


def sync_product_assets(admin: ShopifyAdmin, item: dict[str, Any], product_id: str) -> dict[str, Any]:
    product = admin.fetch_product(product_id)
    existing_alts = {media.get("alt") or "" for media in product["media"]["nodes"]}
    media_inputs, expected_alts = media_inputs_for_item(admin, item, existing_alts)

    if media_inputs:
        admin.product_update_media(product_id, media_inputs)
        time.sleep(8)

    append_variant_media(admin, product_id)
    admin.reorder_media(product_id, expected_alts)
    time.sleep(4)
    return admin.fetch_product(product_id)


def upload_detail_images_for_item(admin: ShopifyAdmin, item: dict[str, Any]) -> list[str]:
    urls: list[str] = []

    for detail_index, source in enumerate(item.get("detail_images", []), start=1):
        for part_index, path in enumerate(detail_upload_paths(Path(source), item["folder"]), start=1):
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

    batch = manifest[offset : offset + batch_size]
    results: list[dict[str, Any]] = []
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for index, item in enumerate(batch, start=1):
        result = {"manifest": item, "ok": False}
        try:
            if admin.product_by_handle(item["handle"]):
                result["error"] = "existing_handle_found_during_create"
            else:
                detail_urls = upload_detail_images_for_item(admin, item)
                product = admin.product_set(item, description_html(item, detail_urls))
                product_id = product["id"]
                sync_product_assets(admin, item, product_id)
                admin.update_status_and_category(product_id)
                admin.publish_to_publications(product_id, publication_ids)
                result.update({"ok": True, "product": admin.fetch_product(product_id)})
        except Exception as error:  # noqa: BLE001 - batch uploads should continue and report failures.
            result["error"] = str(error)

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
    sku_filter: set[str] | None = None,
) -> dict[str, Any]:
    source_skus = {
        normalize_sku(row.get("sku"))
        for row in read_csv(READINESS_CSV)
        if normalize_sku(row.get("sku"))
        and (not sku_filter or normalize_sku(row.get("sku")) in sku_filter)
    }
    variant_skus = {
        variant["sku"]
        for item in manifest
        for variant in item["variants"]
    }
    return {
        "source_manifest_json": str(OUT_DIR / "iblock-source-manifest.json"),
        "manifest_json": str(OUT_DIR / "iblock-pending-manifest.json"),
        "skipped_json": str(OUT_DIR / "iblock-pending-skipped.json"),
        "product_type_plan_csv": str(OUT_DIR / "iblock-product-type-plan.csv"),
        "conflicts_csv": str(OUT_DIR / "iblock-upload-conflicts.csv"),
        "source_skus": len(source_skus),
        "variant_skus": len(variant_skus),
        "parent_only_skus": sorted(source_skus - variant_skus),
        "valid_product_groups": len(manifest),
        "todo_products": len(todo),
        "skipped": len(local_skipped) + len(existing_skipped),
        "local_skipped": len(local_skipped),
        "existing_or_skipped": len(existing_skipped),
        "missing_piece_count": len(piece_count_gaps),
        "price_not_999": sum(1 for item in manifest if item["price"] != PRICE),
        "status_not_active": sum(1 for item in manifest if item["status"] != STATUS),
        "product_type_contains_chinese": sum(1 for item in manifest if contains_cjk(item["product_type"])),
        "titles_with_chinese": sum(1 for item in manifest if contains_cjk(item["title"])),
    }


def run_apply(batch_size: int, *, strict_counts: bool = True, sku_filter: set[str] | None = None) -> dict[str, Any]:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    runs: list[dict[str, Any]] = []
    started_at = time.strftime("%Y%m%d-%H%M%S")

    while True:
        manifest, local_skipped, piece_count_gaps, product_type_plan = build_manifest(
            strict_counts=strict_counts,
            sku_filter=sku_filter,
        )
        admin = ShopifyAdmin()
        product_type_plan = enrich_product_type_plan(admin, product_type_plan, apply=True)
        apply_product_type_plan_to_manifest(manifest, product_type_plan)
        todo, existing_skipped = filter_existing(admin, manifest)
        write_manifest(todo, local_skipped + existing_skipped, piece_count_gaps, product_type_plan)

        if not todo:
            break

        report_name = f"iblock-apply-{started_at}-batch-{len(runs) + 1:03d}-size-{batch_size}"
        created = create_batch(todo, 0, batch_size, report_name)
        run = {
            "batch": len(runs) + 1,
            "report": str(OUT_DIR / f"{report_name}.json"),
            "processed": len(created),
            "ok": sum(1 for row in created if row.get("ok")),
            "failed": sum(1 for row in created if not row.get("ok")),
            "failed_groups": [row["manifest"]["folder"] for row in created if not row.get("ok")],
        }
        runs.append(run)
        (OUT_DIR / f"iblock-upload-result-{started_at}.json").write_text(json.dumps({"runs": runs}, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps(run, ensure_ascii=False), flush=True)
        if run["failed"] == len(created):
            print("All products in this batch failed; stopping to avoid a tight retry loop.", flush=True)
            break

    summary = {"started_at": started_at, "runs": runs}
    (OUT_DIR / "iblock-upload-result.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    return summary


def post_upload_audit(
    admin: ShopifyAdmin | None = None,
    *,
    strict_counts: bool = True,
    sku_filter: set[str] | None = None,
) -> dict[str, Any]:
    admin = admin or ShopifyAdmin()
    manifest, local_skipped, piece_count_gaps, product_type_plan = build_manifest(
        strict_counts=strict_counts,
        sku_filter=sku_filter,
    )
    product_type_plan = enrich_product_type_plan(admin, product_type_plan, apply=False)
    apply_product_type_plan_to_manifest(manifest, product_type_plan)
    expected_by_sku = {
        variant["sku"]: item
        for item in manifest
        for variant in item["variants"]
    }
    products = admin.fetch_iblock_products()
    shopify_by_sku: dict[str, dict[str, Any]] = {}
    sku_counts: Counter[str] = Counter()
    issues: list[dict[str, Any]] = []

    for product in products:
        for variant in product["variants"]["nodes"]:
            sku = clean(variant.get("sku")).upper()
            if sku:
                shopify_by_sku[sku] = product
                sku_counts[sku] += 1

    for sku, item in expected_by_sku.items():
        product = shopify_by_sku.get(sku)
        if not product:
            issues.append({"sku": sku, "handle": item["handle"], "issue": "missing_shopify_product"})
            continue
        variant = next((node for node in product["variants"]["nodes"] if clean(node.get("sku")).upper() == sku), {})
        category = product.get("category") or {}
        media_nodes = product["media"]["nodes"]
        description = product.get("descriptionHtml") or ""
        checks = [
            ("vendor_not_iblock", product.get("vendor") != VENDOR, product.get("vendor")),
            ("status_not_active", product.get("status") != STATUS, product.get("status")),
            ("price_not_999", clean(variant.get("price")) not in {PRICE, f"{PRICE}.0", f"{PRICE}.00"}, variant.get("price")),
            ("product_type_mismatch", clean(product.get("productType")).casefold() != clean(item["product_type"]).casefold(), product.get("productType")),
            ("category_mismatch", category.get("id") != CATEGORY_ID, category),
            ("missing_media", not media_nodes, len(media_nodes)),
            (
                "first_media_not_white",
                not item["missing"]["white"] and "-白底" not in ((media_nodes[0].get("alt") if media_nodes else "") or ""),
                media_nodes[0].get("alt") if media_nodes else "",
            ),
            ("missing_detail_description", "<img " not in description, "no_img_tag"),
            ("duplicate_sku", sku_counts[sku] > 1, sku_counts[sku]),
        ]
        for key, failed, value in checks:
            if failed:
                issues.append({"sku": sku, "handle": item["handle"], "issue": key, "value": value, "expected": item.get("product_type", "") if key == "product_type_mismatch" else ""})

    write_csv(OUT_DIR / "iblock-post-upload-audit.csv", issues, ["sku", "handle", "issue", "value", "expected"])
    summary = {
        "expected_variant_skus": len(expected_by_sku),
        "shopify_iblock_products": len(products),
        "manifest_skus_found": len(set(expected_by_sku) & set(shopify_by_sku)),
        "manifest_skus_missing": sorted(set(expected_by_sku) - set(shopify_by_sku)),
        "missing_piece_count": len(piece_count_gaps),
        "issues_count": len(issues),
        "issues_csv": str(OUT_DIR / "iblock-post-upload-audit.csv"),
    }
    (OUT_DIR / "iblock-post-upload-audit.json").write_text(json.dumps({"summary": summary, "issues": issues}, ensure_ascii=False, indent=2), encoding="utf-8")
    return summary


def main() -> int:
    global STAGING_ROOT, READINESS_CSV, GROUPS_CSV, INTEGRITY_CSV, UPLOAD_READY_ROOT, OUT_DIR

    parser = argparse.ArgumentParser(description="Import prepared iBlock products to Shopify.")
    parser.add_argument("--dry-run", action="store_true", help="Generate manifest and skip existing Shopify products.")
    parser.add_argument("--apply", action="store_true", help="Create all pending iBlock products in batches.")
    parser.add_argument("--create-batch", action="store_true", help="Create one batch of pending products.")
    parser.add_argument("--post-upload-audit", action="store_true", help="Run read-only post-upload Shopify audit.")
    parser.add_argument("--offset", type=int, default=0)
    parser.add_argument("--batch-size", type=int, default=8)
    parser.add_argument("--staging-root", type=Path, default=STAGING_ROOT, help="Prepared iBlock staging directory.")
    parser.add_argument("--out-dir", type=Path, default=OUT_DIR, help="Directory for manifests and upload reports.")
    parser.add_argument("--scoped", action="store_true", help="Allow a deliberately small staging batch instead of the full catalog counts.")
    parser.add_argument("--sku", action="append", default=[], help="Limit the run to an explicit SKU; may be repeated.")
    args = parser.parse_args()

    if not (args.dry_run or args.apply or args.create_batch or args.post_upload_audit):
        parser.error("Choose --dry-run, --apply, --create-batch, or --post-upload-audit")
    if args.batch_size < 1 or args.batch_size > 20:
        parser.error("--batch-size must be between 1 and 20")
    if args.scoped and not args.sku:
        parser.error("--scoped requires at least one explicit --sku")

    STAGING_ROOT = args.staging_root.resolve()
    READINESS_CSV = STAGING_ROOT / "reports" / "iblock-shopify-readiness.csv"
    GROUPS_CSV = STAGING_ROOT / "reports" / "iblock-product-groups.csv"
    INTEGRITY_CSV = STAGING_ROOT / "reports" / "iblock-upload-ready-integrity.csv"
    UPLOAD_READY_ROOT = STAGING_ROOT / "shopify-products-upload-ready"
    OUT_DIR = args.out_dir.resolve()
    sku_filter = {normalize_sku(sku) for sku in args.sku if normalize_sku(sku)}
    strict_counts = not args.scoped

    if args.apply:
        print(json.dumps(run_apply(args.batch_size, strict_counts=strict_counts, sku_filter=sku_filter), ensure_ascii=False, indent=2))
        return 0
    if args.post_upload_audit:
        print(json.dumps(post_upload_audit(strict_counts=strict_counts, sku_filter=sku_filter), ensure_ascii=False, indent=2))
        return 0

    manifest, local_skipped, piece_count_gaps, product_type_plan = build_manifest(
        strict_counts=strict_counts,
        sku_filter=sku_filter,
    )
    write_manifest(manifest, local_skipped, piece_count_gaps, product_type_plan, name="iblock-source")
    admin = ShopifyAdmin()
    product_type_plan = enrich_product_type_plan(admin, product_type_plan, apply=False)
    apply_product_type_plan_to_manifest(manifest, product_type_plan)
    todo, existing_skipped = filter_existing(admin, manifest)
    write_manifest(todo, local_skipped + existing_skipped, piece_count_gaps, product_type_plan)
    summary = source_summary(manifest, local_skipped, existing_skipped, todo, piece_count_gaps, sku_filter)
    (OUT_DIR / "iblock-upload-dry-run.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))

    if args.create_batch:
        report_name = f"iblock-batch-{time.strftime('%Y%m%d-%H%M%S')}-offset-{args.offset}-size-{args.batch_size}"
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
