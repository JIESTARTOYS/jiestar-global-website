#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from PIL import Image, ImageOps, UnidentifiedImageError


TARGET_ROOT = Path("/Volumes/ORICO/iblock/iblock-上架前整理")
REPORTS_ROOT = TARGET_ROOT / "reports"
SOURCE_ROOT = Path("/Volumes/ORICO/iblock/iBlock积趣_电商素材")
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def clean(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def normalize_sku(value: Any) -> str:
    text = clean(value).upper()
    text = re.sub(r"IBLOCK[_ -]*IB", "IB", text)
    text = re.sub(r"[^A-Z0-9-]", "", text)
    return text.strip("-")


def natural_key(value: Any) -> list[Any]:
    return [int(part) if part.isdigit() else part.lower() for part in re.split(r"(\d+)", str(value))]


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists() or path.stat().st_size == 0:
        return []
    with path.open(newline="", encoding="utf-8-sig") as file:
        return list(csv.DictReader(file))


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str] | None = None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if fieldnames is None:
        fieldnames = list(rows[0].keys()) if rows else []
    with path.open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def image_files(root: Path) -> list[Path]:
    if not root.exists():
        return []
    return sorted(
        [
            path
            for path in root.rglob("*")
            if path.is_file()
            and path.suffix.lower() in IMAGE_EXTS
            and not path.name.startswith("._")
        ],
        key=lambda path: natural_key(path.as_posix()),
    )


def sha1_file(path: Path) -> str:
    digest = hashlib.sha1()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def average_hash(path: Path, size: int = 16) -> str:
    with Image.open(path) as image:
        image = ImageOps.exif_transpose(image).convert("L").resize((size, size))
        pixels = list(image.getdata())
    avg = sum(pixels) / len(pixels)
    bits = "".join("1" if pixel >= avg else "0" for pixel in pixels)
    return f"{int(bits, 2):0{size * size // 4}x}"


def image_size(path: Path) -> tuple[int, int]:
    try:
        with Image.open(path) as image:
            return image.width, image.height
    except (OSError, UnidentifiedImageError):
        return 0, 0


def role_from_name(name: str) -> str:
    lower = name.lower()
    if "白底" in name:
        return "white"
    if "-sku" in lower or "_sku" in lower:
        return "sku"
    if "详情" in name:
        return "detail"
    return "main"


def source_sku_score(path: Path, sku: str, row: dict[str, str]) -> tuple[bool, str]:
    path_text = path.as_posix().upper()
    sku = normalize_sku(sku)
    parent = sku.split("-", 1)[0]
    if sku and sku in path_text:
        return True, "exact_sku_in_source_path"
    if parent and parent in path_text:
        return True, "parent_sku_in_source_path"

    aliases = {
        "IB1301-1": ["T25", "T-25"],
        "IB1301-2": ["J20", "J-20"],
        "IB1301-3": ["J05", "J-05"],
        "IB1301-4": ["99A"],
        "IB1301-5": ["Z10", "Z-10"],
        "IB1301-6": ["DF15", "DF"],
    }.get(sku, [])
    if any(alias.upper() in path_text for alias in aliases):
        return True, "alias_in_source_path"

    name_cn = clean(row.get("name_cn"))
    product_series = clean(row.get("product_series"))
    short_terms = [term for term in re.split(r"[()（）·.\-—_/、,，\s]+", f"{product_series} {name_cn}") if len(term) >= 2]
    source_text = path.as_posix()
    if any(term and term in source_text for term in short_terms):
        return True, "cn_name_or_series_in_source_path"
    return False, "source_path_does_not_match_sku_or_name"


def first_display_image(folder: Path, group: str) -> Path | None:
    image_dir = folder / "images"
    if not image_dir.exists():
        return None
    patterns = [
        f"{group}__*-白底*",
        f"{group}__*-1.*",
        f"{group}__*-local-01.*",
        "*.jpg",
        "*.png",
        "*.webp",
    ]
    for pattern in patterns:
        hits = [path for path in sorted(image_dir.glob(pattern), key=lambda item: natural_key(item.name)) if path.is_file()]
        if hits:
            return hits[0]
    return None


def build_source_maps() -> tuple[dict[str, list[dict[str, str]]], dict[str, str]]:
    copy_rows = read_csv(REPORTS_ROOT / "iblock-asset-copy-plan.csv")
    source_by_stage_target: dict[str, str] = {
        clean(row.get("target")): clean(row.get("source"))
        for row in copy_rows
        if clean(row.get("target")) and clean(row.get("source"))
    }
    sources_by_sku: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in copy_rows:
        sku = normalize_sku(row.get("sku"))
        if sku:
            sources_by_sku[sku].append(row)
    return sources_by_sku, source_by_stage_target


def audit() -> dict[str, Any]:
    readiness_rows = read_csv(REPORTS_ROOT / "iblock-shopify-readiness.csv")
    rows_by_sku = {normalize_sku(row.get("sku")): row for row in readiness_rows if normalize_sku(row.get("sku"))}
    group_rows = read_csv(REPORTS_ROOT / "iblock-product-groups.csv")
    upload_assets = read_csv(REPORTS_ROOT / "iblock-upload-ready-assets.csv")
    sources_by_sku, source_by_stage_target = build_source_maps()

    issues: list[dict[str, Any]] = []
    asset_rows: list[dict[str, Any]] = []
    first_rows: list[dict[str, Any]] = []
    hash_groups: dict[str, list[dict[str, str]]] = defaultdict(list)

    source_lookup_by_stage_name: dict[tuple[str, str], str] = {}
    for sku, rows in sources_by_sku.items():
        for row in rows:
            target = Path(clean(row.get("target")))
            source_lookup_by_stage_name[(sku, target.name)] = clean(row.get("source"))

    for asset in upload_assets:
        group = clean(asset.get("upload_group"))
        target = Path(clean(asset.get("target")))
        role = clean(asset.get("role")) or role_from_name(target.name)
        sku_match = re.match(r"([A-Z]{2}\d{3,5}(?:-\d+)?)__", target.name.upper())
        sku = normalize_sku(sku_match.group(1) if sku_match else group)
        stage_name = target.name.split("__", 1)[1] if "__" in target.name else target.name
        stage_target = (TARGET_ROOT / "images" / sku / stage_name).as_posix()
        original = source_by_stage_target.get(stage_target) or source_lookup_by_stage_name.get((sku, stage_name), "")
        expected_row = rows_by_sku.get(sku, {})
        source_ok = False
        source_reason = "missing_original_source_trace"
        if original:
            source_ok, source_reason = source_sku_score(Path(original), sku, expected_row)

        width, height = image_size(target) if target.exists() else (0, 0)
        exact_hash = sha1_file(target) if target.exists() else ""
        visual_hash = ""
        if target.exists() and role in {"white", "main", "sku"}:
            try:
                visual_hash = average_hash(target)
                hash_groups[visual_hash].append({"upload_group": group, "sku": sku, "role": role, "target": target.as_posix()})
            except Exception as error:  # noqa: BLE001 - continue audit and report bad image.
                issues.append(
                    {
                        "scope": "asset",
                        "upload_group": group,
                        "sku": sku,
                        "role": role,
                        "issue": "unreadable_for_visual_hash",
                        "value": str(error),
                        "target": target.as_posix(),
                        "original_source": original,
                    }
                )

        row = {
            "upload_group": group,
            "sku": sku,
            "role": role,
            "target": target.as_posix(),
            "target_exists": "yes" if target.exists() else "no",
            "width": width,
            "height": height,
            "sha1": exact_hash,
            "visual_hash": visual_hash,
            "original_source": original,
            "source_match_status": "ok" if source_ok else "review",
            "source_match_reason": source_reason,
        }
        asset_rows.append(row)
        if not target.exists():
            issues.append({**row, "scope": "asset", "issue": "missing_upload_ready_file", "value": ""})
        if role in {"white", "main", "sku"} and not source_ok:
            issues.append({**row, "scope": "asset", "issue": "main_asset_source_mismatch", "value": source_reason})

    for group in group_rows:
        upload_group = clean(group.get("upload_group"))
        folder = TARGET_ROOT / "shopify-products-upload-ready" / upload_group
        first = first_display_image(folder, upload_group)
        variant_skus = [normalize_sku(part) for part in re.split(r"[,;]\s*", clean(group.get("variant_skus"))) if normalize_sku(part)]
        expected_skus = set(variant_skus or [upload_group])
        source = ""
        source_ok = False
        source_reason = "missing_first_image"
        visual_hash = ""
        if first:
            stage_sku_match = re.match(r"([A-Z]{2}\d{3,5}(?:-\d+)?)__", first.name.upper())
            stage_sku = normalize_sku(stage_sku_match.group(1) if stage_sku_match else upload_group)
            stage_name = first.name.split("__", 1)[1] if "__" in first.name else first.name
            source = source_by_stage_target.get((TARGET_ROOT / "images" / stage_sku / stage_name).as_posix(), "")
            source_ok, source_reason = source_sku_score(Path(source), stage_sku, rows_by_sku.get(stage_sku, {})) if source else (False, "missing_original_source_trace")
            try:
                visual_hash = average_hash(first)
            except Exception:
                visual_hash = ""
            if stage_sku not in expected_skus:
                source_ok = False
                source_reason = f"first_image_sku_{stage_sku}_not_in_group_variants"

        first_row = {
            "upload_group": upload_group,
            "variant_skus": "; ".join(sorted(expected_skus, key=natural_key)),
            "first_image": first.as_posix() if first else "",
            "first_visual_hash": visual_hash,
            "original_source": source,
            "source_match_status": "ok" if source_ok else "review",
            "source_match_reason": source_reason,
        }
        first_rows.append(first_row)
        if not source_ok:
            issues.append({**first_row, "scope": "product_first_image", "issue": "first_image_source_mismatch", "sku": "", "role": "first_image", "value": source_reason})

    for visual_hash, members in hash_groups.items():
        groups = {member["upload_group"] for member in members}
        skus = {member["sku"] for member in members}
        if len(groups) <= 1:
            continue
        for member in members:
            issues.append(
                {
                    "scope": "visual_hash",
                    "upload_group": member["upload_group"],
                    "sku": member["sku"],
                    "role": member["role"],
                    "issue": "same_visual_hash_across_upload_groups",
                    "value": f"hash={visual_hash}; groups={';'.join(sorted(groups, key=natural_key))}; skus={';'.join(sorted(skus, key=natural_key))}",
                    "target": member["target"],
                    "original_source": "",
                }
            )

    REPORTS_ROOT.mkdir(parents=True, exist_ok=True)
    write_csv(REPORTS_ROOT / "iblock-original-asset-audit-assets.csv", asset_rows)
    write_csv(REPORTS_ROOT / "iblock-original-asset-audit-first-images.csv", first_rows)
    write_csv(
        REPORTS_ROOT / "iblock-original-asset-audit-issues.csv",
        issues,
        [
            "scope",
            "upload_group",
            "sku",
            "role",
            "issue",
            "value",
            "target",
            "target_exists",
            "width",
            "height",
            "sha1",
            "visual_hash",
            "first_image",
            "first_visual_hash",
            "variant_skus",
            "original_source",
            "source_match_status",
            "source_match_reason",
        ],
    )
    summary = {
        "upload_asset_count": len(asset_rows),
        "product_group_count": len(first_rows),
        "issue_count": len(issues),
        "issue_counts": dict(sorted(Counter(clean(row.get("issue")) for row in issues).items())),
        "review_upload_groups": sorted({clean(row.get("upload_group")) for row in issues if clean(row.get("upload_group"))}, key=natural_key),
        "reports": {
            "assets": (REPORTS_ROOT / "iblock-original-asset-audit-assets.csv").as_posix(),
            "first_images": (REPORTS_ROOT / "iblock-original-asset-audit-first-images.csv").as_posix(),
            "issues": (REPORTS_ROOT / "iblock-original-asset-audit-issues.csv").as_posix(),
        },
    }
    (REPORTS_ROOT / "iblock-original-asset-audit-summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return summary


def main() -> int:
    audit()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
