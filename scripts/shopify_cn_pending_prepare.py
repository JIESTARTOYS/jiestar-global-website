#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import os
import re
import shutil
import unicodedata
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


SOURCE_ROOT = Path("/Volumes/ORICO/jiestar电商图/中文详情")
TARGET_ROOT = Path("/Volumes/ORICO/jiestar电商图/待上架中文详情文件夹")
OUT_DIR = Path("/private/tmp/jiestar-cn-pending")
PLAN_CSV = OUT_DIR / "pending-cn-products-plan.csv"
RESULT_JSON = OUT_DIR / "pending-cn-products-result.json"
API_VERSION_FALLBACK = "2026-01"
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
PRODUCT_PAGE_SIZE = 100


@dataclass
class ShopifyProduct:
    id: str
    handle: str
    title: str
    status: str
    skus: list[str]


@dataclass
class CopyEntry:
    source: Path
    target_name: str
    kind: str


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return

    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def normalize_sku(value: str) -> str:
    return unicodedata.normalize("NFKC", value).strip().upper()


def normalize_name(value: str) -> str:
    value = unicodedata.normalize("NFKC", value)
    value = re.sub(r"(英文|中文)$", "", value, flags=re.I).strip()
    return value


def parse_code_part(part: str, previous: str | None = None) -> str | None:
    match = re.fullmatch(r"([A-Z]{0,3})(\d{1,6})([A-Z]?)", part.strip(), re.I)
    if not match:
        return None

    prefix, digits, suffix = match.groups()
    prefix = prefix.upper()
    suffix = suffix.upper()

    if previous and prefix and len(digits) < 3:
        return None

    if previous:
        previous_match = re.fullmatch(r"([A-Z]{0,3})(\d{1,6})([A-Z]?)", previous, re.I)
        if previous_match:
            previous_prefix, previous_digits, _previous_suffix = previous_match.groups()
            if not prefix:
                prefix = previous_prefix.upper()
            if len(digits) < len(previous_digits):
                digits = previous_digits[: len(previous_digits) - len(digits)] + digits

    return f"{prefix}{digits}{suffix}"


def extract_skus(folder_name: str) -> list[str]:
    normalized = normalize_name(folder_name).upper()
    codes: list[str] = []
    previous: str | None = None

    for plus_group in re.split(r"\s*\+\s*", normalized):
        segments = re.findall(r"[A-Z]{0,3}\d{2,6}[A-Z]?(?:\s*-\s*[A-Z]{0,3}\d{1,6}[A-Z]?)*", plus_group)

        for segment in segments:
            raw_parts = [part for part in re.split(r"\s*-\s*", segment) if part]
            parts = raw_parts
            raw_digit_lengths = []
            parsed: list[str] = []

            for part in parts:
                part_match = re.fullmatch(r"[A-Z]{0,3}(\d{1,6})[A-Z]?", part.strip(), re.I)
                raw_digit_lengths.append(len(part_match.group(1)) if part_match else 0)
                code = parse_code_part(part, previous)
                if not code:
                    continue
                parsed.append(code)
                previous = code

            should_expand_range = (
                len(parsed) >= 2
                and "-" in segment
                and raw_digit_lengths[-1] >= 2
                and all(re.fullmatch(r"[A-Z]{0,3}\d{1,6}", code) for code in parsed)
            )

            if should_expand_range:
                first = parsed[0]
                last = parsed[-1]
                first_match = re.fullmatch(r"([A-Z]{0,3})(\d{1,6})", first)
                last_match = re.fullmatch(r"([A-Z]{0,3})(\d{1,6})", last)

                if first_match and last_match and first_match.group(1) == last_match.group(1):
                    start = int(first_match.group(2))
                    end = int(last_match.group(2))

                    if start <= end and end - start <= 200:
                        width = len(first_match.group(2))
                        prefix = first_match.group(1)
                        parsed = [f"{prefix}{number:0{width}d}" for number in range(start, end + 1)]

            elif len(raw_parts) >= 2 and raw_digit_lengths[-1] < 2:
                parsed = parsed[:1]

            for code in parsed:
                code = normalize_sku(code)
                if code not in codes:
                    codes.append(code)

    return codes


def target_prefix(skus: list[str], folder_name: str) -> str:
    if skus:
        if len(skus) == 1:
            return skus[0]
        return f"{skus[0]}-{skus[-1]}"

    fallback = normalize_name(folder_name)
    fallback = re.sub(r"[^\w.-]+", "-", fallback).strip("-")
    return fallback or folder_name


class ShopifyAdmin:
    def __init__(self) -> None:
        load_dotenv(Path(".env.local"))
        self.domain = os.environ.get("SHOPIFY_STORE_DOMAIN", "").strip()
        self.version = os.environ.get("SHOPIFY_API_VERSION", API_VERSION_FALLBACK).strip() or API_VERSION_FALLBACK
        self.token = os.environ.get("SHOPIFY_ADMIN_ACCESS_TOKEN", "").strip()

        if not self.domain:
            raise RuntimeError("Missing SHOPIFY_STORE_DOMAIN in .env.local")
        if not self.token:
            raise RuntimeError("Missing SHOPIFY_ADMIN_ACCESS_TOKEN in .env.local")

        self.endpoint = f"https://{self.domain}/admin/api/{self.version}/graphql.json"

    def graphql(self, query: str, variables: dict[str, Any] | None = None) -> dict[str, Any]:
        request = urllib.request.Request(
            self.endpoint,
            data=json.dumps({"query": query, "variables": variables or {}}).encode("utf-8"),
            method="POST",
            headers={
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": self.token,
            },
        )

        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            body = error.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"Shopify HTTP {error.code}: {body[:1200]}") from error

        if payload.get("errors"):
            raise RuntimeError(f"Shopify GraphQL errors: {json.dumps(payload['errors'], ensure_ascii=False)}")

        return payload["data"]

    def products(self) -> list[ShopifyProduct]:
        products: list[ShopifyProduct] = []
        cursor: str | None = None

        while True:
            data = self.graphql(
                """
                query Products($first: Int!, $after: String) {
                  products(first: $first, after: $after) {
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                    nodes {
                      id
                      handle
                      title
                      status
                      variants(first: 100) {
                        nodes {
                          sku
                        }
                      }
                    }
                  }
                }
                """,
                {"first": PRODUCT_PAGE_SIZE, "after": cursor},
            )
            connection = data["products"]

            for node in connection["nodes"]:
                products.append(
                    ShopifyProduct(
                        id=node["id"],
                        handle=node["handle"],
                        title=node["title"],
                        status=node["status"],
                        skus=[
                            normalize_sku(variant.get("sku") or "")
                            for variant in node["variants"]["nodes"]
                            if normalize_sku(variant.get("sku") or "")
                        ],
                    )
                )

            if not connection["pageInfo"]["hasNextPage"]:
                return products

            cursor = connection["pageInfo"]["endCursor"]


def all_image_files(folder: Path) -> list[Path]:
    return sorted(
        [
            path
            for path in folder.rglob("*")
            if path.is_file() and path.suffix.lower() in IMAGE_EXTS and not path.name.startswith("._")
        ],
        key=lambda path: path.relative_to(folder).as_posix().lower(),
    )


def parent_has(path: Path, keyword: str) -> bool:
    return any(keyword.lower() == part.lower() or keyword in part for part in path.parts)


def image_number(path: Path) -> int | None:
    stem = unicodedata.normalize("NFKC", path.stem)
    match = re.search(r"(?:^|[^0-9])0?([1-9][0-9]?)(?:[^0-9]|$)", stem)
    return int(match.group(1)) if match else None


def is_main_image(path: Path) -> bool:
    stem = unicodedata.normalize("NFKC", path.stem)
    if parent_has(path.parent, "主图") or "主图" in stem:
        return image_number(path) is not None
    return re.fullmatch(r"0?[1-9][0-9]?", stem.strip("-_ ")) is not None


def classify_images(folder: Path, skus: list[str]) -> dict[str, list[Path]]:
    buckets = {
        "white": [],
        "main": [],
        "sku": [],
        "detail": [],
        "transparent": [],
        "other": [],
    }

    for image in all_image_files(folder):
        name = image.name
        lower_name = name.lower()
        relative_parts = [part.lower() for part in image.relative_to(folder).parts[:-1]]

        if "白底" in name:
            buckets["white"].append(image)
        elif "透明" in name:
            buckets["transparent"].append(image)
        elif "详情" in name or "images" in relative_parts:
            buckets["detail"].append(image)
        elif "sku" in lower_name or "sku" in relative_parts:
            buckets["sku"].append(image)
        elif is_main_image(image):
            buckets["main"].append(image)
        elif len(skus) > 1 and any(sku.lower() in lower_name for sku in skus):
            buckets["sku"].append(image)
        else:
            buckets["other"].append(image)

    buckets["main"].sort(key=lambda path: (image_number(path) or 999, path.name.lower()))
    buckets["detail"].sort(key=lambda path: path.relative_to(folder).as_posix().lower())
    buckets["sku"].sort(key=lambda path: path.relative_to(folder).as_posix().lower())
    return buckets


def extension(path: Path) -> str:
    return path.suffix.lower() if path.suffix.lower() != ".jpeg" else ".jpg"


def unique_entries(entries: list[CopyEntry]) -> list[CopyEntry]:
    used: dict[str, int] = {}
    unique = []

    for entry in entries:
        target_name = entry.target_name
        count = used.get(target_name, 0)

        if count:
            stem = Path(target_name).stem
            suffix = Path(target_name).suffix
            target_name = f"{stem}-copy{count + 1}{suffix}"

        used[entry.target_name] = count + 1
        unique.append(CopyEntry(entry.source, target_name, entry.kind))

    return unique


def build_copy_entries(folder: Path, prefix: str, skus: list[str]) -> tuple[list[CopyEntry], dict[str, str]]:
    buckets = classify_images(folder, skus)
    entries: list[CopyEntry] = []
    notes = {
        "main_files": "",
        "white_file": "",
        "sku_files": "",
        "detail_files": "",
        "transparent_files": "",
        "warnings": "",
    }
    warnings = []

    main_images = [image for image in buckets["main"] if "白底" not in image.name and "透明" not in image.name]
    white = buckets["white"][0] if buckets["white"] else None

    if not white:
        white_candidates = [
            image
            for image in [*main_images, *buckets["other"]]
            if image_number(image) == 5 and "透明" not in image.name
        ]
        white = white_candidates[0] if white_candidates else None

    numbered_main = [image for image in main_images if image != white]
    for index, image in enumerate(numbered_main, 1):
        entries.append(CopyEntry(image, f"{prefix}-{index}{extension(image)}", "main"))

    if white:
        entries.append(CopyEntry(white, f"{prefix}-白底{extension(white)}", "white"))
    else:
        warnings.append("missing_white")

    if buckets["transparent"]:
        transparent = buckets["transparent"][0]
        entries.append(CopyEntry(transparent, f"{prefix}-透明{extension(transparent)}", "transparent"))

    sku_images = buckets["sku"]
    if sku_images:
        if len(skus) <= 1:
            sku = skus[0] if skus else prefix
            entries.append(CopyEntry(sku_images[0], f"{sku}-sku{extension(sku_images[0])}", "sku"))
        else:
            for index, sku in enumerate(skus):
                image = sku_images[index] if index < len(sku_images) else sku_images[-1]
                entries.append(CopyEntry(image, f"{sku}-sku{extension(image)}", "sku"))
    elif white:
        for sku in skus or [prefix]:
            entries.append(CopyEntry(white, f"{sku}-sku{extension(white)}", "sku_fallback_white"))
    else:
        warnings.append("missing_sku_no_white_fallback")

    detail_images = buckets["detail"]
    if len(detail_images) == 1:
        image = detail_images[0]
        entries.append(CopyEntry(image, f"{prefix}-详情{extension(image)}", "detail"))
    elif len(detail_images) > 1:
        for index, image in enumerate(detail_images, 1):
            entries.append(CopyEntry(image, f"{prefix}-详情-{index:02d}{extension(image)}", "detail_slice"))
    else:
        warnings.append("missing_detail")

    if not numbered_main:
        fallback_main = next((image for image in buckets["other"] if image != white), None)
        if fallback_main:
            entries.insert(0, CopyEntry(fallback_main, f"{prefix}-1{extension(fallback_main)}", "main_fallback"))
            warnings.append("main_from_other")
        else:
            warnings.append("missing_main")

    entries = unique_entries(entries)
    notes["main_files"] = "|".join(entry.target_name for entry in entries if entry.kind.startswith("main"))
    notes["white_file"] = "|".join(entry.target_name for entry in entries if entry.kind == "white")
    notes["sku_files"] = "|".join(entry.target_name for entry in entries if entry.kind.startswith("sku"))
    notes["detail_files"] = "|".join(entry.target_name for entry in entries if entry.kind.startswith("detail"))
    notes["transparent_files"] = "|".join(entry.target_name for entry in entries if entry.kind == "transparent")
    notes["warnings"] = "|".join(warnings)
    return entries, notes


def current_shopify_index(admin: ShopifyAdmin) -> tuple[set[str], set[str], list[ShopifyProduct]]:
    products = admin.products()
    uploaded_skus: set[str] = set()
    uploaded_handle_codes: set[str] = set()

    for product in products:
        uploaded_skus.update(product.skus)
        uploaded_handle_codes.update(extract_skus(product.handle))

    return uploaded_skus, uploaded_handle_codes, products


def build_rows(uploaded_skus: set[str], uploaded_handle_codes: set[str]) -> tuple[list[dict[str, str]], list[dict[str, Any]]]:
    rows: list[dict[str, str]] = []
    plans: list[dict[str, Any]] = []
    folders = sorted([path for path in SOURCE_ROOT.iterdir() if path.is_dir()], key=lambda path: path.name.lower())

    for folder in folders:
        skus = extract_skus(folder.name)
        prefix = target_prefix(skus, folder.name)
        matches = sorted(set(skus) & (uploaded_skus | uploaded_handle_codes))
        status = "pending"
        reason = ""

        if not skus:
            status = "manual_no_sku"
            reason = "No SKU could be extracted from folder name."
        elif "预览" in folder.name:
            status = "skip_preview"
            reason = "Preview-only folder, skipped to avoid duplicating the same SKU."
        elif matches:
            status = "skip_uploaded"
            reason = f"SKU already exists in Shopify: {', '.join(matches[:20])}"

        copy_entries, notes = build_copy_entries(folder, prefix, skus)
        row = {
            "source_folder": str(folder),
            "target_folder": str(TARGET_ROOT / prefix),
            "folder_name": folder.name,
            "target_prefix": prefix,
            "skus": "|".join(skus),
            "status": status,
            "reason": reason,
            "main_files": notes["main_files"],
            "white_file": notes["white_file"],
            "sku_files": notes["sku_files"],
            "detail_files": notes["detail_files"],
            "transparent_files": notes["transparent_files"],
            "warnings": notes["warnings"],
            "copy_count": str(len(copy_entries)),
        }
        rows.append(row)

        if status == "pending":
            plans.append({"folder": folder, "prefix": prefix, "skus": skus, "entries": copy_entries, "row": row})

    return rows, plans


def write_csv(rows: list[dict[str, str]]) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    fields = [
        "source_folder",
        "target_folder",
        "folder_name",
        "target_prefix",
        "skus",
        "status",
        "reason",
        "main_files",
        "white_file",
        "sku_files",
        "detail_files",
        "transparent_files",
        "warnings",
        "copy_count",
    ]

    with PLAN_CSV.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def unique_folder(path: Path) -> Path:
    if not path.exists():
        return path

    for index in range(2, 1000):
        candidate = path.with_name(f"{path.name}-copy{index}")
        if not candidate.exists():
            return candidate

    raise RuntimeError(f"Could not find available target folder for {path}")


def apply_copy(plans: list[dict[str, Any]]) -> list[dict[str, Any]]:
    TARGET_ROOT.mkdir(parents=True, exist_ok=True)
    copied = []

    for plan in plans:
        target_folder = unique_folder(TARGET_ROOT / plan["prefix"])
        target_folder.mkdir(parents=True, exist_ok=False)
        entries: list[CopyEntry] = plan["entries"]

        for entry in entries:
            target = target_folder / entry.target_name
            shutil.copyfile(entry.source, target)

        copied.append(
            {
                "source_folder": str(plan["folder"]),
                "target_folder": str(target_folder),
                "skus": plan["skus"],
                "copied_files": len(entries),
                "files": sorted(path.name for path in target_folder.iterdir() if path.is_file()),
            }
        )

    cleanup_dot_underscore(TARGET_ROOT)
    return copied


def cleanup_dot_underscore(root: Path) -> int:
    removed = 0

    if not root.exists():
        return removed

    for path in root.rglob("._*"):
        if path.is_file():
            path.unlink()
            removed += 1

    return removed


def summarize(rows: list[dict[str, str]], copied: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    pending = [row for row in rows if row["status"] == "pending"]
    return {
        "source_folders": len(rows),
        "pending_folders": len(pending),
        "skip_uploaded": sum(1 for row in rows if row["status"] == "skip_uploaded"),
        "skip_preview": sum(1 for row in rows if row["status"] == "skip_preview"),
        "manual_no_sku": sum(1 for row in rows if row["status"] == "manual_no_sku"),
        "pending_missing_main": sum(1 for row in pending if "missing_main" in row["warnings"]),
        "pending_missing_white": sum(1 for row in pending if "missing_white" in row["warnings"]),
        "pending_missing_detail": sum(1 for row in pending if "missing_detail" in row["warnings"]),
        "pending_using_white_as_sku": sum(1 for row in pending if "sku_fallback_white" in row["sku_files"] or row["sku_files"]),
        "copied_folders": len(copied or []),
        "copied_files": sum(item["copied_files"] for item in copied or []),
    }


def validate_copied(copied: list[dict[str, Any]]) -> dict[str, Any]:
    missing_main = []
    missing_white = []
    dot_underscore = []

    for item in copied:
        folder = Path(item["target_folder"])
        names = [path.name for path in folder.iterdir() if path.is_file()]
        prefix = folder.name.removesuffix("-copy2")

        if not any(re.search(r"-1\.(jpe?g|png|webp)$", name, re.I) for name in names):
            missing_main.append(str(folder))
        if not any("-白底." in name for name in names):
            missing_white.append(str(folder))
        if any(name.startswith("._") for name in names):
            dot_underscore.append(str(folder))

    return {
        "missing_main_count": len(missing_main),
        "missing_white_count": len(missing_white),
        "dot_underscore_count": len(dot_underscore),
        "missing_main": missing_main[:50],
        "missing_white": missing_white[:50],
        "dot_underscore": dot_underscore[:50],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare pending Chinese detail folders for Shopify upload.")
    parser.add_argument("--apply", action="store_true", help="Copy normalized image folders to the pending target root.")
    parser.add_argument("--yes", action="store_true", help="Required with --apply.")
    args = parser.parse_args()

    if args.apply and not args.yes:
        raise SystemExit("--apply requires --yes")

    if not SOURCE_ROOT.exists():
        raise RuntimeError(f"Missing source root: {SOURCE_ROOT}")

    admin = ShopifyAdmin()
    uploaded_skus, uploaded_handle_codes, products = current_shopify_index(admin)
    rows, plans = build_rows(uploaded_skus, uploaded_handle_codes)
    write_csv(rows)

    copied: list[dict[str, Any]] = []
    validation: dict[str, Any] | None = None

    if args.apply:
        copied = apply_copy(plans)
        validation = validate_copied(copied)

    result = {
        "ok": True,
        "source_root": str(SOURCE_ROOT),
        "target_root": str(TARGET_ROOT),
        "plan_csv": str(PLAN_CSV),
        "shopify_products_seen": len(products),
        "shopify_skus_seen": len(uploaded_skus),
        "shopify_handle_codes_seen": len(uploaded_handle_codes),
        "summary": summarize(rows, copied),
        "preview": [row for row in rows if row["status"] == "pending"][:30],
        "manual_no_sku": [row for row in rows if row["status"] == "manual_no_sku"][:50],
        "validation": validation,
    }

    RESULT_JSON.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
