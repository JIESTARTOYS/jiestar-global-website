#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


TARGET_ROOT = Path("/Volumes/ORICO/积域资料/Zoin-上架前整理")
REPORT_DIR = Path("/private/tmp/zoin-product-prep")
MANIFEST_CSV = REPORT_DIR / "zoin-products-manifest.csv"
MISSING_CSV = REPORT_DIR / "zoin-missing-assets.csv"
BRICK4_CDN = "https://cdn.brick4.com/"
BRICK4_WEB = "https://brick4.com"


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as file:
        return list(csv.DictReader(file))


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    with path.open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def request_json(url: str) -> dict[str, Any]:
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        body = response.read().decode("utf-8-sig")
    return json.loads(body.strip())


def request_text(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8", errors="ignore")


def exact_zoin_match(sku: str, data: dict[str, Any]) -> dict[str, Any] | None:
    for item in data.get("data") or []:
        for setnumber in item.get("setnumber") or []:
            number = (setnumber.get("setnumber") or "").strip().upper()
            brand = setnumber.get("brandkeyword") or ""
            if number == sku.upper() and ("Zoin" in brand or "集域" in brand or "积域" in brand):
                return item
    return None


def brick4_search(sku: str) -> dict[str, Any] | None:
    query = urllib.parse.urlencode({"s": sku, "page": "1"})
    data = request_json(f"{BRICK4_WEB}/get/set?{query}")
    return exact_zoin_match(sku, data)


def clean_image_url(value: str) -> str:
    value = value.strip().strip('"').strip("'")
    value = re.sub(r"!(?:richtext|bigpic|setcover|setlist|large|thumb).*$", "", value)
    if value.startswith("//"):
        value = "https:" + value
    if value.startswith("http://"):
        value = "https://" + value[len("http://") :]
    if value.startswith("https://"):
        return value
    return BRICK4_CDN + value.lstrip("/")


def image_extension(url: str) -> str:
    clean = clean_image_url(url)
    suffix = Path(urllib.parse.urlparse(clean).path).suffix.lower()
    return suffix if suffix in {".jpg", ".jpeg", ".png", ".webp"} else ".jpg"


def brick4_page_urls(item: dict[str, Any]) -> tuple[str, list[str], list[str]]:
    page_url = f"{BRICK4_WEB}/set/{item['id']}/{item.get('title2url') or ''}"
    html = request_text(page_url)
    album = [clean_image_url(match) for match in re.findall(r'data-imgurl="([^"]+)"', html)]
    richtext = [clean_image_url(match) for match in re.findall(r'<img[^>]+src="([^"]+)"', html)]
    return page_url, album, richtext


def download(url: str, target: Path, apply: bool) -> bool:
    if target.exists():
        return False
    if not apply:
        return False
    request = urllib.request.Request(clean_image_url(url), headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=45) as response:
        data = response.read()
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    return True


def has_named_image(folder: Path, marker: str) -> bool:
    return any(path.is_file() and marker in path.name and not path.name.startswith("._") for path in folder.iterdir())


def backfill(apply: bool, limit: int | None = None) -> dict[str, Any]:
    manifest = read_csv(MANIFEST_CSV)
    rows: list[dict[str, str]] = []
    downloaded: list[Path] = []

    products = manifest[:limit] if limit else manifest
    for index, product in enumerate(products, start=1):
        sku = product["sku"]
        folder = TARGET_ROOT / "images" / sku
        folder.mkdir(parents=True, exist_ok=True)
        needs_white = not has_named_image(folder, "-白底")
        needs_detail = not has_named_image(folder, "-详情")
        needs_piece = not product.get("piece_count")
        result = {
            "sku": sku,
            "exact_match": "no",
            "brick4_id": "",
            "brick4_url": "",
            "brick4_title": "",
            "brick4_subtitle": "",
            "brick4_pcs": "",
            "downloaded_white": "0",
            "downloaded_detail": "0",
            "note": "",
        }

        if not needs_white and not needs_detail and not needs_piece:
            result["note"] = "no_missing_field"
            rows.append(result)
            continue

        try:
            item = brick4_search(sku)
            time.sleep(0.15)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
            result["note"] = f"search_error: {error}"
            rows.append(result)
            continue

        if not item:
            result["note"] = "no_exact_zoin_match"
            rows.append(result)
            continue

        result.update(
            {
                "exact_match": "yes",
                "brick4_id": str(item.get("id") or ""),
                "brick4_title": item.get("title") or "",
                "brick4_subtitle": item.get("subtitle") or "",
                "brick4_pcs": str(item.get("pcs") or ""),
            }
        )

        try:
            page_url, album_urls, richtext_urls = brick4_page_urls(item)
            time.sleep(0.15)
        except (urllib.error.URLError, TimeoutError) as error:
            result["note"] = f"page_error: {error}"
            rows.append(result)
            continue

        result["brick4_url"] = page_url
        if needs_white and not has_named_image(folder, "-白底"):
            white_source = item.get("cover") or (album_urls[0] if album_urls else "") or (richtext_urls[0] if richtext_urls else "")
            if white_source:
                target = folder / f"{sku}-白底-brick4{image_extension(white_source)}"
                if download(white_source, target, apply):
                    downloaded.append(target)
                    result["downloaded_white"] = "1"

        if needs_detail and not has_named_image(folder, "-详情"):
            detail_sources = richtext_urls or album_urls
            detail_count = 0
            for detail_index, url in enumerate(detail_sources[:12], start=1):
                target = folder / f"{sku}-详情-brick4-{detail_index:02d}{image_extension(url)}"
                if download(url, target, apply):
                    downloaded.append(target)
                    detail_count += 1
            result["downloaded_detail"] = str(detail_count)

        if result["downloaded_white"] == "0" and result["downloaded_detail"] == "0":
            result["note"] = "exact_match_no_download_needed_or_already_present"

        rows.append(result)

    supplement_csv = REPORT_DIR / "zoin-brick4-supplement.csv"
    summary_json = REPORT_DIR / "zoin-brick4-supplement-summary.json"
    write_csv(supplement_csv, rows)
    summary = {
        "apply": apply,
        "checked_sku_count": len(products),
        "exact_match_count": sum(1 for row in rows if row["exact_match"] == "yes"),
        "downloaded_file_count": len(downloaded),
        "downloaded_white_count": sum(int(row["downloaded_white"]) for row in rows),
        "downloaded_detail_count": sum(int(row["downloaded_detail"]) for row in rows),
        "with_piece_count_from_brick4": sum(1 for row in rows if row["brick4_pcs"]),
        "supplement_csv": supplement_csv.as_posix(),
        "summary_json": summary_json.as_posix(),
    }
    summary_json.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

    if apply:
        report_target = TARGET_ROOT / "reports"
        report_target.mkdir(parents=True, exist_ok=True)
        for source in (supplement_csv, summary_json):
            target = report_target / source.name
            target.write_bytes(source.read_bytes())

    return summary


def main() -> int:
    parser = argparse.ArgumentParser(description="Backfill exact Zoin matches from Brick4.")
    parser.add_argument("--apply", action="store_true", help="Download missing images into the Zoin staging folder.")
    parser.add_argument("--limit", type=int)
    args = parser.parse_args()
    print(json.dumps(backfill(apply=args.apply, limit=args.limit), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
