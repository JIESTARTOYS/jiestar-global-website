#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import html
import json
import os
import re
import struct
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))

import shopify_active_product_health_audit as health
import shopify_cn_pending_import as cn_import


OUT_DIR = Path("/private/tmp/jiestar-shopify-active-detail-backfill")
HEALTH_CSV = Path("/private/tmp/jiestar-shopify-active-health/active-product-content-audit.csv")
SOURCE_ROOTS = [
    Path("/Volumes/ORICO/jiestar电商图/中文详情"),
    Path("/Volumes/ORICO/jiestar电商图/英文详情"),
    Path("/Volumes/ORICO/jiestar电商图/待上架中文详情文件夹"),
]
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
LONG_DETAIL_MIN_HEIGHT = 1800
LONG_DETAIL_MIN_RATIO = 2.0
PLAN_FIELDNAMES = [
    "action",
    "handle",
    "title",
    "product_id",
    "skus",
    "candidate_count",
    "detail_paths",
    "candidate_reasons",
    "candidate_dimensions",
    "note",
]
RESULT_FIELDNAMES = [
    *PLAN_FIELDNAMES,
    "result",
    "uploaded_url_count",
    "error",
]


@dataclass(frozen=True)
class DetailCandidate:
    path: Path
    width: int
    height: int
    reason: str

    @property
    def ratio(self) -> float:
        return self.height / max(self.width, 1)


def png_dimensions(data: bytes) -> tuple[int, int] | None:
    if data.startswith(b"\x89PNG\r\n\x1a\n") and len(data) >= 24:
        return struct.unpack(">II", data[16:24])
    return None


def jpeg_dimensions(data: bytes) -> tuple[int, int] | None:
    if not data.startswith(b"\xff\xd8"):
        return None
    offset = 2
    while offset + 9 < len(data):
        if data[offset] != 0xFF:
            offset += 1
            continue
        marker = data[offset + 1]
        offset += 2
        while marker == 0xFF and offset < len(data):
            marker = data[offset]
            offset += 1
        if marker in {0xD8, 0xD9}:
            continue
        if offset + 2 > len(data):
            return None
        length = struct.unpack(">H", data[offset : offset + 2])[0]
        if length < 2 or offset + length > len(data):
            return None
        if marker in {0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF}:
            if length >= 7:
                height, width = struct.unpack(">HH", data[offset + 3 : offset + 7])
                return width, height
            return None
        offset += length
    return None


def image_dimensions(path: Path) -> tuple[int, int]:
    try:
        data = path.read_bytes()
    except OSError:
        return 0, 0
    dimensions = png_dimensions(data) or jpeg_dimensions(data)
    return dimensions or (0, 0)


def split_skus(row: dict[str, str]) -> list[str]:
    return [sku.strip() for sku in (row.get("skus") or "").split("|") if sku.strip()]


def sku_aliases(row: dict[str, str]) -> set[str]:
    skus = split_skus(row)
    if not skus:
        return set()
    if len(skus) == 1:
        return {skus[0].upper()}

    joined = "-".join(skus)
    aliases = {joined.upper(), *(sku.upper() for sku in skus)}
    first, last = skus[0], skus[-1]
    first_match = re.match(r"^([A-Z]*)(\d+)$", first, flags=re.I)
    last_match = re.match(r"^([A-Z]*)(\d+)$", last, flags=re.I)
    if first_match and last_match and first_match.group(1).upper() == last_match.group(1).upper():
        prefix = first_match.group(1).upper()
        first_number = first_match.group(2)
        last_number = last_match.group(2)
        aliases.update(
            {
                f"{prefix}{first_number}-{last_number}".upper(),
                f"{prefix}{first_number}-{last_number[-2:]}".upper(),
                f"{first_number}-{last_number[-2:]}".upper(),
                f"{first_number}-{last_number[-3:]}".upper(),
            }
        )
    return aliases


def candidate_dirs(row: dict[str, str], source_roots: list[Path] | None = None) -> list[Path]:
    aliases = sku_aliases(row)
    if not aliases:
        return []
    roots = source_roots or SOURCE_ROOTS
    candidates: list[Path] = []
    for root in roots:
        if not root.exists():
            continue
        for dirpath, _dirnames, _filenames in os.walk(root):
            path = Path(dirpath)
            text = path.as_posix().upper()
            if any(alias in text for alias in aliases):
                candidates.append(path)

    pruned: list[Path] = []
    for candidate in sorted(set(candidates), key=lambda path: (len(path.parts), path.as_posix())):
        if any(candidate.is_relative_to(existing) for existing in pruned):
            continue
        pruned.append(candidate)
    return pruned[:10]


def explicit_detail_path(path: Path, folder: Path) -> bool:
    rel_parts = [part.lower() for part in path.relative_to(folder).parts[:-1]]
    if re.search(r"详情|detail|slice|切片", path.name, flags=re.I):
        return True
    return any(re.search(r"详情|detail|slice|切片|images", part, flags=re.I) for part in rel_parts)


def exact_long_detail_path(path: Path, row: dict[str, str], width: int, height: int) -> bool:
    if height < LONG_DETAIL_MIN_HEIGHT or height / max(width, 1) < LONG_DETAIL_MIN_RATIO:
        return False
    return path.stem.upper() in sku_aliases(row)


def long_image_in_matched_folder(width: int, height: int) -> bool:
    return height >= LONG_DETAIL_MIN_HEIGHT and height / max(width, 1) >= LONG_DETAIL_MIN_RATIO


def detail_candidate_for(path: Path, row: dict[str, str], folder: Path) -> DetailCandidate | None:
    if path.name.startswith("._") or path.suffix.lower() not in IMAGE_EXTS:
        return None
    width, height = image_dimensions(path)
    if not width or not height:
        return None
    if explicit_detail_path(path, folder):
        return DetailCandidate(path=path, width=width, height=height, reason="name_or_detail_dir")
    if exact_long_detail_path(path, row, width, height):
        return DetailCandidate(path=path, width=width, height=height, reason="long_exact_sku_or_combo_file")
    if long_image_in_matched_folder(width, height):
        return DetailCandidate(path=path, width=width, height=height, reason="long_image_in_matched_sku_folder")
    return None


def dedupe_candidates(candidates: list[DetailCandidate]) -> list[DetailCandidate]:
    output: list[DetailCandidate] = []
    seen: set[Path] = set()
    for candidate in sorted(candidates, key=lambda item: (item.path.as_posix().lower(), item.width, item.height)):
        resolved = candidate.path.resolve()
        if resolved in seen:
            continue
        seen.add(resolved)
        output.append(candidate)
    return output


def find_detail_candidates(row: dict[str, str], source_roots: list[Path] | None = None) -> list[DetailCandidate]:
    for folder in candidate_dirs(row, source_roots):
        candidates: list[DetailCandidate] = []
        for path in sorted(folder.rglob("*")):
            if not path.is_file():
                continue
            candidate = detail_candidate_for(path, row, folder)
            if candidate:
                candidates.append(candidate)
        if candidates:
            return dedupe_candidates(candidates)
    return []


def load_health_rows(path: Path = HEALTH_CSV) -> list[dict[str, str]]:
    if not path.exists():
        raise RuntimeError(f"Missing health CSV: {path}. Run scripts/shopify_active_product_health_audit.py first.")
    with path.open(encoding="utf-8", newline="") as file:
        return list(csv.DictReader(file))


def missing_detail_rows(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    return [
        row
        for row in rows
        if row.get("vendor") == health.EXPECTED_VENDOR
        and "description_missing_detail_image" in (row.get("warning_issues") or "").split("|")
    ]


def fetch_current_products_by_handle(admin: health.ShopifyAdmin) -> dict[str, dict[str, Any]]:
    return {product.get("handle") or "": product for product in health.fetch_active_products(admin)}


def product_has_description_image(product: dict[str, Any] | None) -> bool:
    return bool(product and health.count_description_images(product.get("descriptionHtml") or "") > 0)


def plan_rows(
    rows: list[dict[str, str]],
    source_roots: list[Path] | None = None,
    current_products_by_handle: dict[str, dict[str, Any]] | None = None,
) -> list[dict[str, str]]:
    output: list[dict[str, str]] = []
    for row in missing_detail_rows(rows):
        current_product = (current_products_by_handle or {}).get(row.get("handle") or "")
        if product_has_description_image(current_product):
            action = "skip_existing_description_images"
            candidates: list[DetailCandidate] = []
            note = "current_shopify_product_already_has_description_images"
        else:
            candidates = find_detail_candidates(row, source_roots)
            action = "ready_to_backfill" if candidates else "manual_review_no_detail_candidate"
            note = "" if candidates else "no_reliable_detail_image_candidate_found"

        output.append(
            {
                "action": action,
                "handle": row.get("handle") or "",
                "title": row.get("title") or "",
                "product_id": row.get("product_id") or "",
                "skus": row.get("skus") or "",
                "candidate_count": str(len(candidates)),
                "detail_paths": json.dumps([str(candidate.path) for candidate in candidates], ensure_ascii=False),
                "candidate_reasons": "|".join(sorted({candidate.reason for candidate in candidates})),
                "candidate_dimensions": json.dumps(
                    [
                        {
                            "width": candidate.width,
                            "height": candidate.height,
                            "ratio": round(candidate.ratio, 2),
                        }
                        for candidate in candidates
                    ],
                    ensure_ascii=False,
                ),
                "note": note,
            }
        )
    return output


def build_description_html(title: str, detail_urls: list[str]) -> str:
    return "\n".join(
        f'<p><img src="{html.escape(url)}" alt="{html.escape(title)} details part {index}" /></p>'
        for index, url in enumerate(detail_urls, start=1)
    )


def upload_detail_paths(admin: Any, row: dict[str, str]) -> list[str]:
    urls: list[str] = []
    detail_paths = [Path(path) for path in json.loads(row.get("detail_paths") or "[]")]
    for detail_index, source in enumerate(detail_paths, start=1):
        for part_index, path in enumerate(cn_import.detail_image_paths(source), start=1):
            part = f" part {part_index}" if part_index > 1 else ""
            urls.append(admin.file_create(path, f"{row['title']} details {detail_index}{part}"))
    return urls


def select_plan_rows(rows: list[dict[str, str]], limit: int | None = None, handles: set[str] | None = None) -> list[dict[str, str]]:
    selected: list[dict[str, str]] = []
    ready_count = 0
    for row in rows:
        if handles and row.get("handle") not in handles:
            continue
        if limit is not None and row.get("action") == "ready_to_backfill":
            if ready_count >= limit:
                continue
            ready_count += 1
        selected.append(row)
    return selected


def apply_plan_rows(rows: list[dict[str, str]], admin: Any, dry_run: bool) -> list[dict[str, str]]:
    results: list[dict[str, str]] = []
    for index, row in enumerate(rows, start=1):
        output = dict(row)
        output["uploaded_url_count"] = "0"
        output["error"] = ""
        if row["action"] != "ready_to_backfill":
            output["result"] = row["action"]
            results.append(output)
            continue
        if dry_run:
            output["result"] = "dry_run_ready"
            results.append(output)
            continue
        try:
            print(f"[backfill] {index}/{len(rows)} {row['handle']} upload details", flush=True)
            detail_urls = upload_detail_paths(admin, row)
            print(f"[backfill] {index}/{len(rows)} {row['handle']} update description urls={len(detail_urls)}", flush=True)
            admin.product_update_description(row["product_id"], build_description_html(row["title"], detail_urls))
            output["result"] = "backfilled"
            output["uploaded_url_count"] = str(len(detail_urls))
            print(f"[backfill] {index}/{len(rows)} {row['handle']} done", flush=True)
        except Exception as error:  # noqa: BLE001 - keep per-product failure in result CSV.
            output["result"] = "upload_failed_manual_review"
            output["error"] = str(error)
            print(f"[backfill] {index}/{len(rows)} {row['handle']} failed: {error}", flush=True)
        results.append(output)
    return results


def write_admin_class() -> type[cn_import.ShopifyAdmin]:
    return cn_import.ShopifyAdmin


def write_csv(path: Path, rows: list[dict[str, str]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def write_reports(rows: list[dict[str, str]], prefix: str) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    fieldnames = RESULT_FIELDNAMES if prefix == "result" else PLAN_FIELDNAMES
    csv_path = OUT_DIR / f"detail-backfill-{prefix}.csv"
    json_path = OUT_DIR / f"detail-backfill-{prefix}.json"
    write_csv(csv_path, rows, fieldnames)
    json_path.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    if prefix == "plan":
        manual = [row for row in rows if row["action"].startswith("manual_review")]
        write_csv(OUT_DIR / "detail-backfill-manual-review.csv", manual, PLAN_FIELDNAMES)


def summarize(rows: list[dict[str, str]], key: str) -> dict[str, Any]:
    counts: dict[str, int] = {}
    for row in rows:
        value = row.get(key) or ""
        counts[value] = counts.get(value, 0) + 1
    return {
        "rows": len(rows),
        f"{key}_counts": counts,
        "out_dir": str(OUT_DIR),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Backfill missing Shopify description detail images from ORICO assets.")
    parser.add_argument("--dry-run", action="store_true", help="Generate plan and dry-run result without Shopify writes.")
    parser.add_argument("--apply", action="store_true", help="Upload detail images and update product descriptions.")
    parser.add_argument("--yes", action="store_true", help="Required with --apply.")
    parser.add_argument("--limit", type=int, default=None, help="Apply/dry-run at most this many ready_to_backfill rows.")
    parser.add_argument("--handle", action="append", default=[], help="Only process a specific product handle. Can repeat.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.apply and not args.yes:
        print("--apply requires --yes", file=sys.stderr)
        return 2
    dry_run = not args.apply

    read_admin = health.ShopifyAdmin()
    current_products_by_handle = fetch_current_products_by_handle(read_admin)
    rows = plan_rows(load_health_rows(), SOURCE_ROOTS, current_products_by_handle)
    rows = select_plan_rows(rows, limit=args.limit, handles=set(args.handle) if args.handle else None)
    write_reports(rows, "plan")

    write_admin = read_admin if dry_run else write_admin_class()()
    result_rows = apply_plan_rows(rows, write_admin, dry_run=dry_run)
    write_reports(result_rows, "result")

    summary = {
        "mode": "dry_run" if dry_run else "apply",
        "plan": summarize(rows, "action"),
        "result": summarize(result_rows, "result"),
        "finished_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    (OUT_DIR / "detail-backfill-summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
