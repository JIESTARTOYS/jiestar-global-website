#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))

import shopify_sample_import as base_import
import shopify_xbert_brick4_metafield_backfill as brick4
import shopify_xbert_pending_import as xbert


OUT_DIR = Path("/private/tmp/jiestar-shopify-xbert-import")
PLAN_CSV = OUT_DIR / "xbert-brick4-white-image-plan.csv"
RESULT_CSV = OUT_DIR / "xbert-brick4-white-image-result.csv"
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"


def parse_cover_url(html: str) -> str:
    cover = re.search(r'<div[^>]+class="cover"[^>]+data-imgurl="([^"]+)"', html)
    if cover:
        return urllib.parse.urljoin("https://cdn.brick4.com/", cover.group(1))

    og = re.search(r'<meta[^>]+property="og:image"[^>]+content="([^"]+)"', html)
    if not og:
        return ""
    url = og.group(1).replace("!setcover", "")
    return url.replace("http://", "https://", 1)


def missing_white_target(folder: Path, sku: str) -> Path | None:
    if any(path.is_file() and re.search(r"-白底\.", path.name, re.I) for path in folder.iterdir()):
        return None
    return folder / f"{sku}-白底.jpg"


def request_bytes(url: str, *, retries: int = 3) -> bytes:
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(request, timeout=60) as response:
                return response.read()
        except Exception as error:  # noqa: BLE001 - keep retry context.
            last_error = error
            time.sleep(1.5 * attempt)
    raise RuntimeError(f"download failed: {url}: {last_error}")


def brick4_cover_for_sku(sku: str) -> dict[str, str]:
    spec = brick4.fetch_brick4_spec(sku)
    if not spec:
        return {}
    html = brick4.request_text(spec.source_url)
    cover_url = parse_cover_url(html)
    if not cover_url:
        return {}
    return {
        "sku": sku,
        "brick4_set_id": spec.brick4_set_id,
        "brick4_title": spec.title,
        "brick4_theme": spec.theme,
        "source_url": spec.source_url,
        "cover_url": cover_url,
    }


def build_plan() -> list[dict[str, str]]:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest, _skipped, _supplements = xbert.build_manifest()
    rows: list[dict[str, str]] = []

    for item in manifest:
        sku = item["variants"][0]["sku"]
        folder = Path(item["folder_path"])
        target = missing_white_target(folder, sku)
        if not target:
            continue

        print(f"[brick4] {sku}", flush=True)
        cover = brick4_cover_for_sku(sku)
        action = "download_white_image" if cover else "manual_review"
        rows.append(
            {
                "action": action,
                "sku": sku,
                "title": item["title"],
                "folder_path": str(folder),
                "target_path": str(target),
                "cover_url": cover.get("cover_url", ""),
                "source_url": cover.get("source_url", ""),
                "brick4_set_id": cover.get("brick4_set_id", ""),
                "brick4_title": cover.get("brick4_title", ""),
                "brick4_theme": cover.get("brick4_theme", ""),
            }
        )
        time.sleep(0.15)

    write_csv(PLAN_CSV, rows)
    summary = {
        "plan_csv": str(PLAN_CSV),
        "products_in_plan": len(rows),
        "downloadable": sum(1 for row in rows if row["action"] == "download_white_image"),
        "manual_review": sum(1 for row in rows if row["action"] == "manual_review"),
    }
    (OUT_DIR / "xbert-brick4-white-image-summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return rows


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as file:
        fieldnames = list(rows[0].keys()) if rows else ["action"]
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def load_plan() -> list[dict[str, str]]:
    with PLAN_CSV.open(encoding="utf-8") as file:
        return list(csv.DictReader(file))


def apply_downloads(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    result = []
    for row in rows:
        output = dict(row)
        if row["action"] != "download_white_image":
            output["downloaded"] = "no"
            output["reason"] = "manual_review"
            result.append(output)
            continue

        target = Path(row["target_path"])
        if target.exists():
            output["downloaded"] = "no"
            output["reason"] = "target_exists"
            result.append(output)
            continue

        data = request_bytes(row["cover_url"])
        if len(data) < 1000:
            output["downloaded"] = "no"
            output["reason"] = "download_too_small"
            result.append(output)
            continue

        target.write_bytes(data)
        output["downloaded"] = "yes"
        output["bytes"] = str(len(data))
        output["reason"] = ""
        result.append(output)

    write_csv(RESULT_CSV, result)
    return result


def product_id_by_sku(admin: xbert.ShopifyAdmin) -> dict[str, str]:
    query = """
    query($cursor: String) {
      products(first: 250, after: $cursor, query: "vendor:Xbert") {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          variants(first: 20) { nodes { sku } }
        }
      }
    }
    """
    output = {}
    cursor = None
    while True:
        data = admin.graphql(query, {"cursor": cursor})
        page = data["products"]
        for product in page["nodes"]:
            for variant in product["variants"]["nodes"]:
                sku = xbert.normalize_sku(variant.get("sku"))
                if sku:
                    output[sku] = product["id"]
        if not page["pageInfo"]["hasNextPage"]:
            break
        cursor = page["pageInfo"]["endCursor"]
    return output


def sync_downloaded_white_images(result_rows: list[dict[str, str]]) -> None:
    downloaded_skus = {row["sku"] for row in result_rows if row.get("downloaded") == "yes"}
    if not downloaded_skus:
        return

    manifest, _skipped, _supplements = xbert.build_manifest()
    manifest_by_sku = {item["variants"][0]["sku"]: item for item in manifest if item["variants"][0]["sku"] in downloaded_skus}
    admin = xbert.ShopifyAdmin()
    ids = product_id_by_sku(admin)

    for index, sku in enumerate(sorted(downloaded_skus), start=1):
        product_id = ids.get(sku)
        item = manifest_by_sku.get(sku)
        if not product_id or not item:
            print(f"[shopify] skip {sku}: missing product or manifest", flush=True)
            continue
        print(f"[shopify] {index}/{len(downloaded_skus)} {sku} sync white image", flush=True)
        base_import.sync_product_assets(admin, item, product_id, update_description=False)


def main() -> int:
    parser = argparse.ArgumentParser(description="Download missing Xbert white images from exact Brick4 product pages.")
    parser.add_argument("--apply", action="store_true", help="Build a fresh plan, download images, and sync Shopify media.")
    parser.add_argument("--apply-existing", action="store_true", help="Apply an existing plan CSV, then sync Shopify media.")
    parser.add_argument("--download-only", action="store_true", help="Download files without syncing Shopify.")
    args = parser.parse_args()

    rows = load_plan() if args.apply_existing else build_plan()

    if args.apply or args.apply_existing or args.download_only:
        result = apply_downloads(rows)
        if not args.download_only:
            sync_downloaded_white_images(result)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
