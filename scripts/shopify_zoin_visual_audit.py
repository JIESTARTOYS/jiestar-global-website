#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import hashlib
import html
import json
import re
import textwrap
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont, ImageOps

import shopify_zoin_single_sku_review as single_sku
import shopify_zoin_pending_import as zoin_import


OUT_DIR = Path("/private/tmp/jiestar-shopify-zoin-import/zoin-53-visual-audit")
DOWNLOAD_DIR = OUT_DIR / "downloads"
SHEET_DIR = OUT_DIR / "product-sheets"
MIN_DISPLAY_IMAGES = 3
MAX_DISPLAY_IMAGES = 8
MAX_MEDIA_THUMBS = 12
MAX_DETAIL_THUMBS = 4
SKU_RE = re.compile(r"\bG[A-Z]\d{3}\b|\bFT\d{3}\b")
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def clean(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def media_url(media: dict[str, Any]) -> str:
    return ((media.get("image") or {}).get("url") or ((media.get("preview") or {}).get("image") or {}).get("url") or "")


def description_image_urls(description_html: str) -> list[str]:
    urls: list[str] = []
    for match in re.finditer(r"<img\b[^>]*\bsrc=[\"']([^\"']+)[\"']", description_html or "", re.I):
        url = html.unescape(match.group(1)).strip()
        if url:
            urls.append(url)
    return urls


def safe_name(value: str, fallback: str = "image") -> str:
    name = re.sub(r"[^A-Za-z0-9._-]+", "-", value).strip("-._")
    return name[:140] or fallback


def url_cache_path(url: str, kind: str, handle: str, index: int) -> Path:
    parsed = urllib.parse.urlparse(url)
    suffix = Path(parsed.path).suffix.lower()
    if suffix not in IMAGE_EXTS:
        suffix = ".jpg"
    digest = hashlib.sha1(url.encode("utf-8")).hexdigest()[:12]
    return DOWNLOAD_DIR / handle / f"{kind}-{index:02d}-{digest}{suffix}"


def download_image(url: str, path: Path, timeout: int = 2) -> bool:
    if path.exists() and path.stat().st_size > 0:
        return True
    path.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "JIESTAR-Zoin-Visual-Audit/1.0",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            path.write_bytes(response.read())
        return path.stat().st_size > 0
    except (urllib.error.URLError, TimeoutError, OSError):
        if path.exists() and path.stat().st_size == 0:
            path.unlink()
        return False


def average_hash(path: Path) -> str:
    try:
        with Image.open(path) as raw:
            image = ImageOps.exif_transpose(raw).convert("L").resize((8, 8), Image.Resampling.LANCZOS)
        pixels = list(image.get_flattened_data() if hasattr(image, "get_flattened_data") else image.getdata())
    except Exception:
        return ""
    avg = sum(pixels) / len(pixels)
    bits = "".join("1" if pixel >= avg else "0" for pixel in pixels)
    return f"{int(bits, 2):016x}"


def hamming(a: str, b: str) -> int:
    if not a or not b:
        return 64
    return bin(int(a, 16) ^ int(b, 16)).count("1")


def image_size(path: Path) -> tuple[int, int]:
    try:
        with Image.open(path) as raw:
            return raw.size
    except Exception:
        return (0, 0)


def draw_thumb(
    canvas: Image.Image,
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    path: Path | None,
    label: str,
    status: str,
    font: ImageFont.ImageFont,
    small: ImageFont.ImageFont,
) -> None:
    x1, y1, x2, y2 = box
    draw.rectangle([x1, y1, x2, y2], fill="white", outline=(210, 210, 210))
    if path and path.exists():
        try:
            with Image.open(path) as raw:
                thumb = ImageOps.exif_transpose(raw).convert("RGB")
            thumb.thumbnail((x2 - x1 - 12, y2 - y1 - 42), Image.Resampling.LANCZOS)
            canvas.paste(thumb, (x1 + (x2 - x1 - thumb.width) // 2, y1 + 6 + (y2 - y1 - 42 - thumb.height) // 2))
        except Exception:
            draw.text((x1 + 8, y1 + 42), "image read failed", fill=(160, 20, 20), font=small)
    else:
        draw.text((x1 + 8, y1 + 42), "download failed", fill=(160, 20, 20), font=small)
    draw.text((x1 + 6, y2 - 34), label[:32], fill=(0, 0, 0), font=small)
    draw.text((x1 + 6, y2 - 18), status[:34], fill=(80, 80, 80), font=small)


def fonts() -> tuple[ImageFont.ImageFont, ImageFont.ImageFont, ImageFont.ImageFont]:
    try:
        return (
            ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", 18),
            ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", 13),
            ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", 11),
        )
    except Exception:
        font = ImageFont.load_default()
        return font, font, font


def expected_alt(item: dict[str, Any], source: str) -> str:
    return f"{item['title']} - {Path(source).name}"


def duplicate_groups(values: list[str]) -> list[list[int]]:
    positions: dict[str, list[int]] = {}
    for index, value in enumerate(values, start=1):
        if value:
            positions.setdefault(value, []).append(index)
    return [indexes for indexes in positions.values() if len(indexes) > 1]


def near_duplicate_groups(hashes: list[str], max_distance: int = 3) -> list[list[int]]:
    groups: list[list[int]] = []
    used: set[int] = set()
    for i, digest in enumerate(hashes):
        if i in used or not digest:
            continue
        group = [i + 1]
        for j in range(i + 1, len(hashes)):
            if j not in used and hashes[j] and hamming(digest, hashes[j]) <= max_distance:
                group.append(j + 1)
        if len(group) > 1:
            used.update(index - 1 for index in group)
            groups.append(group)
    return groups


def classify_row(row: dict[str, Any]) -> tuple[str, list[str]]:
    fail_reasons = []
    review_reasons = []

    if not row["product_found"]:
        fail_reasons.append("missing_product")
    if not row["first_image_current_white"]:
        fail_reasons.append("first_image_not_current_sku_white")
    if row["description_other_sku_mentions"]:
        fail_reasons.append("description_mentions_other_sku")
    if not row["variant_image_current_white"]:
        fail_reasons.append("variant_image_not_current_sku_white")
    if row["current_media_count"] <= 1 and row["expected_display_count"] >= MIN_DISPLAY_IMAGES:
        fail_reasons.append("only_white_or_single_media")
    if row["current_detail_img_count"] == 0 and row["expected_detail_img_count"] > 0:
        fail_reasons.append("missing_detail_images")

    if not row["media_order_exact"]:
        review_reasons.append("media_order_or_count_mismatch")
    if row["actual_display_count"] < min(MIN_DISPLAY_IMAGES, row["expected_display_count"]):
        review_reasons.append("display_image_count_below_minimum")
    if row["current_detail_img_count"] != row["expected_detail_img_count"]:
        review_reasons.append("detail_image_count_mismatch")
    if row["media_duplicate_alt_groups"] or row["media_duplicate_url_groups"] or row["media_near_duplicate_groups"]:
        review_reasons.append("possible_duplicate_media")
    if fail_reasons:
        return "FAIL", fail_reasons + review_reasons
    if review_reasons:
        return "REVIEW", review_reasons
    return "PASS", []


def build_product_sheet(row: dict[str, Any], media_images: list[dict[str, Any]], detail_images: list[dict[str, Any]]) -> str:
    title_font, font, small = fonts()
    columns = 4
    thumb_w, thumb_h = 250, 210
    gap = 16
    header_h = 170
    media_count = min(len(media_images), MAX_MEDIA_THUMBS)
    detail_count = min(len(detail_images), MAX_DETAIL_THUMBS)
    rows_needed = (media_count + columns - 1) // columns + (detail_count + columns - 1) // columns
    width = columns * thumb_w + (columns + 1) * gap
    height = header_h + max(1, rows_needed) * (thumb_h + gap) + gap
    canvas = Image.new("RGB", (width, height), (246, 247, 249))
    draw = ImageDraw.Draw(canvas)
    color = {"PASS": (22, 115, 54), "REVIEW": (160, 91, 0), "FAIL": (172, 34, 34)}.get(row["verdict"], (70, 70, 70))
    draw.rectangle([0, 0, width, header_h - 18], fill=(255, 255, 255))
    draw.text((18, 16), f"{row['sku']}  {row['title']}", fill=(0, 0, 0), font=title_font)
    draw.text((18, 44), row["handle"], fill=(65, 65, 65), font=font)
    draw.text((18, 72), f"{row['verdict']}: {', '.join(row['reasons']) or 'ok'}", fill=color, font=font)
    draw.text(
        (18, 100),
        f"media {row['current_media_count']}/{row['expected_media_count']} | display {row['actual_display_count']}/{row['expected_display_count']} | detail {row['current_detail_img_count']}/{row['expected_detail_img_count']}",
        fill=(40, 40, 40),
        font=font,
    )
    draw.text((18, 126), f"Shopify: {row['admin_url']}", fill=(40, 40, 40), font=small)

    y = header_h
    for section, images in [("MEDIA", media_images[:MAX_MEDIA_THUMBS]), ("DETAIL", detail_images[:MAX_DETAIL_THUMBS])]:
        if not images:
            continue
        draw.text((18, y - 20), section, fill=(30, 30, 30), font=font)
        for index, image in enumerate(images):
            col = index % columns
            row_index = index // columns
            x1 = gap + col * (thumb_w + gap)
            y1 = y + row_index * (thumb_h + gap)
            box = (x1, y1, x1 + thumb_w, y1 + thumb_h)
            draw_thumb(
                canvas,
                draw,
                box,
                Path(image["path"]) if image.get("path") else None,
                image["label"],
                image["status"],
                font,
                small,
            )
        y += ((len(images) + columns - 1) // columns) * (thumb_h + gap) + gap

    SHEET_DIR.mkdir(parents=True, exist_ok=True)
    path = SHEET_DIR / f"{safe_name(row['sku'] + '-' + row['handle'])}.jpg"
    canvas.save(path, quality=90)
    return str(path)


def build_overview(rows: list[dict[str, Any]]) -> str:
    title_font, font, small = fonts()
    width, row_h = 1780, 154
    label_w, thumb_w = 550, 142
    height = max(1, len(rows)) * row_h + 60
    canvas = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(canvas)
    draw.rectangle([0, 0, width, 44], fill=(30, 34, 41))
    draw.text((14, 12), "Zoin 53-product visual audit overview", fill="white", font=title_font)
    for index, row in enumerate(rows):
        y = 50 + index * row_h
        fill = (248, 248, 248) if index % 2 else (255, 255, 255)
        draw.rectangle([0, y, width, y + row_h - 6], fill=fill)
        color = {"PASS": (22, 115, 54), "REVIEW": (160, 91, 0), "FAIL": (172, 34, 34)}.get(row["verdict"], (70, 70, 70))
        draw.text((12, y + 10), f"{row['verdict']}  {row['sku']}  {row['title']}"[:76], fill=color, font=font)
        draw.text((12, y + 34), row["handle"][:78], fill=(55, 55, 55), font=small)
        draw.text(
            (12, y + 54),
            f"media {row['current_media_count']}/{row['expected_media_count']} display {row['actual_display_count']}/{row['expected_display_count']} detail {row['current_detail_img_count']}/{row['expected_detail_img_count']}",
            fill=(55, 55, 55),
            font=small,
        )
        reasons = ", ".join(row["reasons"])
        draw.text((12, y + 76), textwrap.shorten(reasons or "ok", width=95, placeholder="..."), fill=(80, 80, 80), font=small)
        for col, path_text in enumerate(row.get("overview_thumb_paths", [])[:8]):
            x = label_w + col * thumb_w
            path = Path(path_text)
            draw.rectangle([x + 4, y + 8, x + thumb_w - 8, y + 122], outline=(210, 210, 210), fill="white")
            try:
                with Image.open(path) as raw:
                    thumb = ImageOps.exif_transpose(raw).convert("RGB")
                thumb.thumbnail((thumb_w - 18, 104), Image.Resampling.LANCZOS)
                canvas.paste(thumb, (x + (thumb_w - thumb.width) // 2, y + 12 + (104 - thumb.height) // 2))
            except Exception:
                draw.text((x + 10, y + 48), "no image", fill=(160, 20, 20), font=small)
    path = OUT_DIR / "overview-contact-sheet.jpg"
    path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(path, quality=90)
    return str(path)


def write_csv(path: Path, rows: list[dict[str, Any]], fields: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    field: json.dumps(row.get(field), ensure_ascii=False)
                    if isinstance(row.get(field), (list, dict))
                    else row.get(field, "")
                    for field in fields
                }
            )


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")


def write_html(rows: list[dict[str, Any]], summary: dict[str, Any]) -> str:
    def rel(path_text: str) -> str:
        return urllib.parse.quote(Path(path_text).relative_to(OUT_DIR).as_posix())

    cards = []
    for row in rows:
        css = row["verdict"].lower()
        reasons = html.escape(", ".join(row["reasons"]) or "ok")
        sheet = rel(row["sheet_path"])
        cards.append(
            f"""
            <article class="card {css}">
              <a href="{sheet}"><img src="{sheet}" alt="{html.escape(row['sku'])} contact sheet"></a>
              <h2>{html.escape(row['verdict'])} {html.escape(row['sku'])}</h2>
              <p>{html.escape(row['title'])}</p>
              <p class="meta">media {row['current_media_count']}/{row['expected_media_count']} · display {row['actual_display_count']}/{row['expected_display_count']} · detail {row['current_detail_img_count']}/{row['expected_detail_img_count']}</p>
              <p class="reasons">{reasons}</p>
              <p><a href="{html.escape(row['admin_url'])}">Shopify Admin</a> · <a href="{html.escape(row['storefront_url'])}">Storefront</a></p>
            </article>
            """
        )
    overview = rel(summary["overview_contact_sheet"])
    body = f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>Zoin 53-product visual audit</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 24px; background: #f6f7f9; color: #111827; }}
    header {{ margin-bottom: 24px; }}
    .summary {{ display: flex; gap: 12px; flex-wrap: wrap; margin: 12px 0 20px; }}
    .pill {{ background: white; border: 1px solid #d8dde5; border-radius: 6px; padding: 8px 10px; }}
    .overview {{ max-width: 100%; border: 1px solid #d8dde5; background: white; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; margin-top: 20px; }}
    .card {{ background: white; border: 1px solid #d8dde5; border-left-width: 6px; border-radius: 6px; padding: 12px; }}
    .card.pass {{ border-left-color: #16733a; }}
    .card.review {{ border-left-color: #a05b00; }}
    .card.fail {{ border-left-color: #ac2222; }}
    .card img {{ width: 100%; max-height: 240px; object-fit: cover; border: 1px solid #e5e7eb; }}
    h1 {{ margin: 0; }}
    h2 {{ font-size: 16px; margin: 10px 0 4px; }}
    p {{ margin: 4px 0; }}
    .meta, .reasons {{ color: #4b5563; font-size: 13px; }}
    a {{ color: #174ea6; }}
  </style>
</head>
<body>
  <header>
    <h1>Zoin 53-product visual audit</h1>
    <div class="summary">
      <span class="pill">total {summary['total_products']}</span>
      <span class="pill">PASS {summary['verdict_counts'].get('PASS', 0)}</span>
      <span class="pill">REVIEW {summary['verdict_counts'].get('REVIEW', 0)}</span>
      <span class="pill">FAIL {summary['verdict_counts'].get('FAIL', 0)}</span>
      <span class="pill">generated {html.escape(summary['generated_at'])}</span>
    </div>
    <p>Only read-only Shopify Admin API data was used. No product fields, media, descriptions, variants, or metafields were modified.</p>
    <p><a href="{overview}">Open full overview contact sheet</a></p>
    <img class="overview" src="{overview}" alt="overview contact sheet">
  </header>
  <main class="grid">
    {''.join(cards)}
  </main>
</body>
</html>
"""
    path = OUT_DIR / "index.html"
    path.write_text(body, encoding="utf-8")
    return str(path)


def audit() -> dict[str, Any]:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    rows = single_sku.read_rows()
    items = [single_sku.item_for_row(row) for row in rows]
    admin = zoin_import.ShopifyAdmin()
    products = single_sku.fetch_zoin_products(admin)
    by_handle, _ = single_sku.index_products(products)
    report_rows: list[dict[str, Any]] = []
    raw_products: list[dict[str, Any]] = []

    for item in items:
        sku = item["base"]
        product = by_handle.get(item["handle"])
        expected_alts = [expected_alt(item, source) for source in item["main_media"]]
        expected_detail_count = single_sku.expected_detail_part_count(item)
        row: dict[str, Any] = {
            "sku": sku,
            "handle": item["handle"],
            "title": item["title"],
            "product_found": bool(product),
            "status": product.get("status") if product else "",
            "product_id": product.get("id") if product else "",
            "admin_url": "",
            "storefront_url": f"https://www.jiestartoys.com/products/{item['handle']}",
            "expected_media_count": len(expected_alts),
            "expected_display_count": max(0, len(expected_alts) - 1),
            "expected_first_alt": expected_alts[0] if expected_alts else "",
            "expected_detail_img_count": expected_detail_count,
            "current_media_count": 0,
            "actual_display_count": 0,
            "current_first_alt": "",
            "current_detail_img_count": 0,
            "media_order_exact": False,
            "first_image_current_white": False,
            "variant_image_current_white": False,
            "description_other_sku_mentions": [],
            "media_duplicate_alt_groups": [],
            "media_duplicate_url_groups": [],
            "media_near_duplicate_groups": [],
            "download_failures": [],
            "sheet_path": "",
            "overview_thumb_paths": [],
        }
        media_images: list[dict[str, Any]] = []
        detail_images: list[dict[str, Any]] = []
        if product:
            numeric_id = product["id"].rsplit("/", 1)[-1]
            row["admin_url"] = f"https://admin.shopify.com/store/jiestartoys/products/{numeric_id}"
            media_nodes = product["media"]["nodes"]
            media_alts = [media.get("alt") or "" for media in media_nodes]
            media_urls = [media_url(media) for media in media_nodes]
            desc = product.get("descriptionHtml") or ""
            desc_urls = description_image_urls(desc)
            variants = product["variants"]["nodes"]
            variant = variants[0] if variants else {}
            variant_image_alt = ((variant.get("image") or {}).get("altText") or "") if variant else ""
            attached_variant_media_alts = [node.get("alt") or "" for node in (variant.get("media") or {}).get("nodes", [])] if variant else []

            row.update(
                {
                    "current_media_count": len(media_nodes),
                    "actual_display_count": max(0, len(media_nodes) - 1),
                    "current_first_alt": media_alts[0] if media_alts else "",
                    "current_detail_img_count": len(desc_urls),
                    "media_order_exact": media_alts == expected_alts,
                    "first_image_current_white": bool(media_alts)
                    and sku in media_alts[0]
                    and bool(re.search(r"白底|white", media_alts[0], re.I)),
                    "variant_image_current_white": bool(
                        any(
                            sku in alt and re.search(r"白底|white", alt, re.I)
                            for alt in [variant_image_alt, *attached_variant_media_alts]
                        )
                    ),
                    "description_other_sku_mentions": sorted({match for match in SKU_RE.findall(desc) if match != sku}),
                    "media_duplicate_alt_groups": duplicate_groups(media_alts),
                    "media_duplicate_url_groups": duplicate_groups(media_urls),
                }
            )

            media_hashes = []
            for index, (media, url) in enumerate(zip(media_nodes, media_urls), start=1):
                path = url_cache_path(url, "media", item["handle"], index) if url else DOWNLOAD_DIR / item["handle"] / f"media-{index:02d}-missing.jpg"
                ok = bool(url) and download_image(url, path)
                if not ok:
                    row["download_failures"].append(f"media-{index}")
                digest = average_hash(path) if ok else ""
                media_hashes.append(digest)
                width, height = image_size(path) if ok else (0, 0)
                media_images.append(
                    {
                        "index": index,
                        "alt": media.get("alt") or "",
                        "url": url,
                        "path": str(path) if ok else "",
                        "hash": digest,
                        "width": width,
                        "height": height,
                        "label": f"M{index} {Path(path).name}",
                        "status": (media.get("alt") or "")[:34],
                    }
                )
            row["media_near_duplicate_groups"] = near_duplicate_groups(media_hashes)

            # Detail pages can contain many tall Shopify Files images. The audit
            # verdict uses the full HTML image count, while the contact sheet only
            # needs the first slice set for visual confirmation.
            for index, url in enumerate(desc_urls[:MAX_DETAIL_THUMBS], start=1):
                path = url_cache_path(url, "detail", item["handle"], index)
                ok = download_image(url, path)
                if not ok:
                    row["download_failures"].append(f"detail-{index}")
                width, height = image_size(path) if ok else (0, 0)
                detail_images.append(
                    {
                        "index": index,
                        "url": url,
                        "path": str(path) if ok else "",
                        "width": width,
                        "height": height,
                        "label": f"D{index} {Path(path).name}",
                        "status": f"{width}x{height}" if ok else "missing",
                    }
                )
            row["overview_thumb_paths"] = [image["path"] for image in media_images[:8] if image.get("path")]
            raw_products.append(
                {
                    "sku": sku,
                    "handle": item["handle"],
                    "product": product,
                    "description_image_urls": desc_urls,
                    "current_media": media_images,
                    "current_detail_images": detail_images,
                    "expected_media_alts": expected_alts,
                }
            )

        row["verdict"], row["reasons"] = classify_row(row)
        row["sheet_path"] = build_product_sheet(row, media_images, detail_images)
        report_rows.append(row)

    report_rows.sort(key=lambda row: {"FAIL": 0, "REVIEW": 1, "PASS": 2}.get(row["verdict"], 9))
    overview_path = build_overview(report_rows)
    fields = [
        "verdict",
        "sku",
        "handle",
        "status",
        "title",
        "expected_media_count",
        "current_media_count",
        "expected_display_count",
        "actual_display_count",
        "expected_first_alt",
        "current_first_alt",
        "first_image_current_white",
        "media_order_exact",
        "expected_detail_img_count",
        "current_detail_img_count",
        "description_other_sku_mentions",
        "variant_image_current_white",
        "media_duplicate_alt_groups",
        "media_duplicate_url_groups",
        "media_near_duplicate_groups",
        "download_failures",
        "reasons",
        "sheet_path",
        "admin_url",
        "storefront_url",
    ]
    write_csv(OUT_DIR / "zoin-visual-audit.csv", report_rows, fields)
    write_json(OUT_DIR / "zoin-visual-audit.json", report_rows)
    write_json(OUT_DIR / "raw-current-zoin-products.json", raw_products)
    summary = {
        "generated_at": __import__("datetime").datetime.now().isoformat(timespec="seconds"),
        "total_products": len(report_rows),
        "shopify_zoin_products": len(products),
        "verdict_counts": dict(Counter(row["verdict"] for row in report_rows)),
        "reason_counts": dict(Counter(reason for row in report_rows for reason in row["reasons"])),
        "csv": str(OUT_DIR / "zoin-visual-audit.csv"),
        "json": str(OUT_DIR / "zoin-visual-audit.json"),
        "raw_products_json": str(OUT_DIR / "raw-current-zoin-products.json"),
        "overview_contact_sheet": overview_path,
    }
    summary["html_index"] = write_html(report_rows, summary)
    write_json(OUT_DIR / "summary.json", summary)
    return summary


def main() -> int:
    parser = argparse.ArgumentParser(description="Read-only visual audit package for all Shopify Zoin products.")
    parser.add_argument("--summary-only", action="store_true", help="Print summary JSON after generating the audit package.")
    args = parser.parse_args()
    summary = audit()
    print(json.dumps(summary, ensure_ascii=False, indent=2 if args.summary_only else None))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
