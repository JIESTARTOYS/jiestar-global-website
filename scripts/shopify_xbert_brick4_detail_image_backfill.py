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

sys.path.insert(0, str(Path(__file__).resolve().parent))

import shopify_xbert_brick4_metafield_backfill as brick4
import shopify_xbert_pending_import as xbert


OUT_DIR = Path("/private/tmp/jiestar-shopify-xbert-import")
PLAN_CSV = OUT_DIR / "xbert-brick4-detail-image-plan.csv"
RESULT_CSV = OUT_DIR / "xbert-brick4-detail-image-result.csv"
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"


def parse_album_urls(html: str) -> list[str]:
    match = re.search(r'<div[^>]+id="list_setpic_share"[^>]*>(.*?)</div>', html, flags=re.S)
    if not match:
        return []

    urls: list[str] = []
    seen: set[str] = set()
    for raw_url in re.findall(r'data-imgurl="([^"]+)"', match.group(1)):
        url = urllib.parse.urljoin("https://cdn.brick4.com/", raw_url).replace("http://", "https://", 1)
        if url not in seen:
            urls.append(url)
            seen.add(url)
    return urls


def has_local_detail_image(folder: Path) -> bool:
    return any(path.is_file() and "-详情" in path.name for path in folder.iterdir())


def missing_detail_targets(folder: Path, sku: str, count: int) -> list[Path]:
    if has_local_detail_image(folder):
        return []
    return [folder / f"{sku}-详情-{index}.jpg" for index in range(1, count + 1)]


def request_bytes(url: str, *, retries: int = 3) -> bytes:
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(request, timeout=60) as response:
                return response.read()
        except Exception as error:  # noqa: BLE001 - keep retry context for network fetches.
            last_error = error
            time.sleep(1.5 * attempt)
    raise RuntimeError(f"download failed: {url}: {last_error}")


def brick4_album_for_sku(sku: str) -> dict[str, object]:
    spec = brick4.fetch_brick4_spec(sku)
    if not spec:
        return {}

    html = brick4.request_text(spec.source_url)
    detail_urls = parse_album_urls(html)
    if not detail_urls:
        return {}

    return {
        "sku": sku,
        "brick4_set_id": spec.brick4_set_id,
        "brick4_title": spec.title,
        "brick4_theme": spec.theme,
        "source_url": spec.source_url,
        "detail_urls": detail_urls,
    }


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as file:
        fieldnames = list(rows[0].keys()) if rows else ["action"]
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def build_plan() -> list[dict[str, str]]:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest, _skipped, _supplements = xbert.build_manifest()
    rows: list[dict[str, str]] = []

    for item in manifest:
        sku = item["variants"][0]["sku"]
        folder = Path(item["folder_path"])
        if not item["missing"]["detail"]:
            continue

        print(f"[brick4] {sku}", flush=True)
        album = brick4_album_for_sku(sku)
        urls = list(album.get("detail_urls", [])) if album else []
        targets = missing_detail_targets(folder, sku, len(urls))
        action = "download_detail_images" if urls and targets else "manual_review"
        rows.append(
            {
                "action": action,
                "sku": sku,
                "title": item["title"],
                "folder_path": str(folder),
                "target_paths": json.dumps([str(path) for path in targets], ensure_ascii=False),
                "detail_urls": json.dumps(urls, ensure_ascii=False),
                "source_url": str(album.get("source_url", "")) if album else "",
                "brick4_set_id": str(album.get("brick4_set_id", "")) if album else "",
                "brick4_title": str(album.get("brick4_title", "")) if album else "",
                "brick4_theme": str(album.get("brick4_theme", "")) if album else "",
                "image_count": str(len(urls)),
            }
        )
        time.sleep(0.15)

    write_csv(PLAN_CSV, rows)
    summary = {
        "plan_csv": str(PLAN_CSV),
        "products_in_plan": len(rows),
        "downloadable": sum(1 for row in rows if row["action"] == "download_detail_images"),
        "manual_review": sum(1 for row in rows if row["action"] == "manual_review"),
        "planned_images": sum(int(row.get("image_count") or 0) for row in rows if row["action"] == "download_detail_images"),
    }
    (OUT_DIR / "xbert-brick4-detail-image-summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return rows


def load_plan() -> list[dict[str, str]]:
    with PLAN_CSV.open(encoding="utf-8") as file:
        return list(csv.DictReader(file))


def apply_downloads(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    result: list[dict[str, str]] = []
    for row in rows:
        output = dict(row)
        if row["action"] != "download_detail_images":
            output["downloaded"] = "no"
            output["downloaded_count"] = "0"
            output["reason"] = "manual_review"
            result.append(output)
            continue

        urls = json.loads(row["detail_urls"])
        targets = [Path(path) for path in json.loads(row["target_paths"])]
        downloaded = 0
        reasons: list[str] = []

        for url, target in zip(urls, targets):
            if target.exists():
                reasons.append(f"{target.name}:target_exists")
                continue

            data = request_bytes(url)
            if len(data) < 1000:
                reasons.append(f"{target.name}:download_too_small")
                continue

            target.write_bytes(data)
            downloaded += 1

        output["downloaded"] = "yes" if downloaded else "no"
        output["downloaded_count"] = str(downloaded)
        output["reason"] = "|".join(reasons)
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
    output: dict[str, str] = {}
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


def sync_downloaded_detail_images(result_rows: list[dict[str, str]]) -> None:
    downloaded_skus = {
        row["sku"]
        for row in result_rows
        if row.get("downloaded") == "yes" or int(row.get("downloaded_count") or 0) > 0
    }
    if not downloaded_skus:
        return

    manifest, _skipped, _supplements = xbert.build_manifest()
    manifest_by_sku = {
        item["variants"][0]["sku"]: item
        for item in manifest
        if item["variants"][0]["sku"] in downloaded_skus
    }
    admin = xbert.ShopifyAdmin()
    ids = product_id_by_sku(admin)

    for index, sku in enumerate(sorted(downloaded_skus), start=1):
        product_id = ids.get(sku)
        item = manifest_by_sku.get(sku)
        if not product_id or not item:
            print(f"[shopify] skip {sku}: missing product or manifest", flush=True)
            continue

        print(f"[shopify] {index}/{len(downloaded_skus)} {sku} sync detail images", flush=True)
        detail_urls = xbert.upload_detail_images_for_item(admin, item)
        admin.product_update_description(product_id, xbert.description_html(item, detail_urls))
        time.sleep(0.5)


def main() -> int:
    parser = argparse.ArgumentParser(description="Download missing Xbert detail images from exact Brick4 product pages.")
    parser.add_argument("--apply", action="store_true", help="Build a fresh plan, download images, and sync Shopify descriptions.")
    parser.add_argument("--apply-existing", action="store_true", help="Apply an existing plan CSV, then sync Shopify descriptions.")
    parser.add_argument("--download-only", action="store_true", help="Download files without syncing Shopify.")
    args = parser.parse_args()

    rows = load_plan() if args.apply_existing else build_plan()

    if args.apply or args.apply_existing or args.download_only:
        result = apply_downloads(rows)
        if not args.download_only:
            sync_downloaded_detail_images(result)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
