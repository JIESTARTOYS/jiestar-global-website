#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import time
from copy import deepcopy
from pathlib import Path
from typing import Any

import shopify_sample_import as base_import
import shopify_xbert_pending_import as xbert
from shopify_cn_pending_import import REQUIRED_SCOPES, ShopifyAdmin


OUT_DIR = Path("/private/tmp/jiestar-shopify-media-repair")
DEFAULT_AUDIT_CSV = Path("/private/tmp/jiestar-shopify-active-health/active-variant-image-long-audit.csv")
DEFAULT_XBERT_ROOTS = [
    Path("/Volumes/ORICO/Xbert/Xbert新品/6.18新品/砖悦图包"),
    Path("/Volumes/ORICO/Xbert/砖悦电商图"),
]
EARLY_SINGLE_VARIANT_SKUS = {"JJ9236", "57023", "58278", "JJ9225"}
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

PLAN_FIELDNAMES = [
    "approved",
    "confidence",
    "action",
    "handle",
    "product_title",
    "product_id",
    "variant_id",
    "variant_sku",
    "variant_title",
    "issue_verdict",
    "issue_reason",
    "current_image_url",
    "old_media_id",
    "old_media_alt",
    "replacement_media_id",
    "replacement_alt",
    "replacement_source_path",
    "replacement_source_kind",
    "replacement_width",
    "replacement_height",
    "rebuild_description",
    "current_detail_count",
    "expected_detail_count",
    "detail_source_paths",
    "delete_old_long_media",
    "note",
]

ISSUE_FIELDNAMES = [
    "handle",
    "variant_sku",
    "issue",
    "value",
]

RESULT_FIELDNAMES = [
    "ok",
    "action",
    "handle",
    "variant_sku",
    "variant_id",
    "uploaded_media",
    "attached_media_id",
    "detached_old_media",
    "deleted_old_media",
    "rebuilt_description",
    "error",
]


def clean(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def truthy(value: Any) -> bool:
    return clean(value).lower() in {"true", "yes", "y", "1"}


def base_url(url: str) -> str:
    return clean(url).split("?", 1)[0]


def normalize_sku(value: Any) -> str:
    return clean(value).upper()


def image_dimensions(path: Path) -> tuple[int, int]:
    try:
        from PIL import Image

        with Image.open(path) as image:
            return image.size
    except Exception:  # noqa: BLE001 - dimensions are advisory for repair planning.
        return 0, 0


def is_squareish(width: int, height: int) -> bool:
    if not width or not height:
        return False
    ratio = height / width
    return 0.75 <= ratio <= 1.33


def is_tall(width: int, height: int) -> bool:
    return bool(width and height and height / width >= 1.8 and height >= 1200)


def local_image_files(folder: Path) -> list[Path]:
    if not folder.exists():
        return []
    return sorted(
        [
            path
            for path in folder.rglob("*")
            if path.is_file()
            and path.suffix.lower() in IMAGE_EXTS
            and not path.name.startswith("._")
            and path.name.lower() not in {".ds_store", "thumbs.db"}
        ],
        key=lambda path: path.relative_to(folder).as_posix().lower(),
    )


def _choice(path: Path, source_kind: str) -> dict[str, str]:
    width, height = image_dimensions(path)
    return {
        "source_path": str(path),
        "source_kind": source_kind,
        "width": str(width),
        "height": str(height),
    }


def choose_local_variant_image(item: dict[str, Any]) -> dict[str, str] | None:
    folder = Path(clean(item.get("folder_path")))
    local_files = local_image_files(folder)
    dimension_candidates = [path for path in local_files if "尺寸" in path.stem or "包装尺寸" in path.stem]

    for path in sorted(dimension_candidates, key=lambda p: p.name.lower()):
        width, height = image_dimensions(path)
        if is_squareish(width, height) and not is_tall(width, height):
            return _choice(path, "local_dimension_image")

    for raw_path in item.get("sku_images") or []:
        path = Path(raw_path)
        width, height = image_dimensions(path)
        if path.exists() and is_squareish(width, height) and not is_tall(width, height):
            return _choice(path, "local_sku_image")

    for raw_path in item.get("main_media") or []:
        path = Path(raw_path)
        if path.exists():
            return _choice(path, "fallback_first_media")

    return None


def detail_upload_paths_for_item(item: dict[str, Any]) -> list[Path]:
    paths: list[Path] = []
    for source in item.get("detail_images") or []:
        paths.extend(base_import.detail_image_paths(Path(source)))
    return paths


def description_image_count(description_html: str) -> int:
    return len(re.findall(r"<img\b[^>]*\bsrc\s*=", description_html or "", flags=re.I))


def should_rebuild_description(current_count: int, expected_count: int) -> bool:
    if expected_count <= 0:
        return False
    if current_count == 0:
        return True
    return expected_count >= 2 and current_count < max(1, expected_count // 2)


def media_nodes(product: dict[str, Any]) -> list[dict[str, Any]]:
    return list((product.get("media") or {}).get("nodes") or [])


def variant_nodes(product: dict[str, Any]) -> list[dict[str, Any]]:
    return list((product.get("variants") or {}).get("nodes") or [])


def media_url(media: dict[str, Any]) -> str:
    return clean(((media.get("image") or {}).get("url")))


def media_alt(media: dict[str, Any]) -> str:
    return clean(media.get("alt") or ((media.get("image") or {}).get("altText")))


def first_image_media(product: dict[str, Any]) -> dict[str, Any] | None:
    for media in media_nodes(product):
        if media.get("mediaContentType") == "IMAGE" and clean(media.get("id")):
            return media
    return None


def find_media_by_alt(product: dict[str, Any], alt: str) -> dict[str, Any] | None:
    for media in media_nodes(product):
        if media_alt(media) == alt:
            return media
    return None


def find_media_by_url(product: dict[str, Any], url: str) -> dict[str, Any] | None:
    target = base_url(url)
    if not target:
        return None
    for media in media_nodes(product):
        if base_url(media_url(media)) == target:
            return media
    return None


def find_variant(product: dict[str, Any], issue: dict[str, str]) -> dict[str, Any] | None:
    variant_id = clean(issue.get("variant_id"))
    sku = normalize_sku(issue.get("variant_sku"))
    for variant in variant_nodes(product):
        if variant_id and clean(variant.get("id")) == variant_id:
            return variant
        if sku and normalize_sku(variant.get("sku")) == sku:
            return variant
    return None


def build_xbert_manifest_by_sku(roots: list[Path]) -> dict[str, dict[str, Any]]:
    by_sku: dict[str, dict[str, Any]] = {}
    for root in roots:
        if not root.exists():
            continue
        manifest, _skipped, _supplements = xbert.build_manifest(root=root, workbook_rows={})
        for item in manifest:
            sku = normalize_sku(item["variants"][0]["sku"])
            by_sku.setdefault(sku, item)
    return by_sku


def build_plan_row(
    product: dict[str, Any],
    variant: dict[str, Any],
    issue: dict[str, str],
    manifest_by_sku: dict[str, dict[str, Any]],
) -> dict[str, str]:
    sku = normalize_sku(variant.get("sku") or issue.get("variant_sku"))
    product_title = clean(product.get("title") or issue.get("product_title"))
    replacement_media_id = ""
    replacement_alt = ""
    replacement_source_path = ""
    replacement_source_kind = ""
    replacement_width = ""
    replacement_height = ""
    action = "manual_review"
    confidence = "manual_review"
    note = ""
    current_image_url = clean((variant.get("image") or {}).get("url") or issue.get("image_url"))
    old_media = find_media_by_url(product, current_image_url)
    old_media_id = clean((old_media or {}).get("id")) or clean((variant.get("image") or {}).get("id"))
    old_media_alt = media_alt(old_media or {}) or clean((variant.get("image") or {}).get("altText") or issue.get("media_alt"))
    item = manifest_by_sku.get(sku)
    current_detail_count = description_image_count(product.get("descriptionHtml") or "")
    expected_detail_count = 0
    detail_source_paths = ""
    rebuild_description = False

    if item:
        item = deepcopy(item)
        item["title"] = product_title
        expected_detail_count = len(detail_upload_paths_for_item(item))
        detail_source_paths = json.dumps(item.get("detail_images") or [], ensure_ascii=False)
        rebuild_description = should_rebuild_description(current_detail_count, expected_detail_count)
        choice = choose_local_variant_image(item)
        if choice:
            replacement_source_path = choice["source_path"]
            replacement_source_kind = choice["source_kind"]
            replacement_width = choice["width"]
            replacement_height = choice["height"]
            replacement_alt = f"{product_title} SKU image - {Path(replacement_source_path).name}"
            existing = find_media_by_alt(product, replacement_alt)
            if existing:
                action = "attach_existing_media"
                replacement_media_id = clean(existing.get("id"))
            else:
                action = "upload_local_media"
            confidence = "high"
        elif rebuild_description:
            action = "rebuild_description_only"
            confidence = "high"
            note = "description repair only; no local variant image candidate"

    if action == "manual_review":
        first_media = first_image_media(product)
        if (
            first_media
            and len(variant_nodes(product)) == 1
            and (sku in EARLY_SINGLE_VARIANT_SKUS or "variant_missing_image" in clean(issue.get("reason")))
        ):
            action = "attach_existing_media"
            replacement_media_id = clean(first_media.get("id"))
            replacement_alt = media_alt(first_media)
            replacement_source_kind = "fallback_first_media"
            confidence = "medium" if sku in EARLY_SINGLE_VARIANT_SKUS else "fallback"

    delete_old = (
        action in {"attach_existing_media", "upload_local_media"}
        and "variant_image_is_tall" in clean(issue.get("reason"))
        and bool(old_media_id)
        and re.search(r"SKU image", old_media_alt, re.I) is not None
    )

    if action == "manual_review" and not note:
        note = "no replacement media candidate"

    return {
        "approved": "true" if action != "manual_review" else "false",
        "confidence": confidence,
        "action": action,
        "handle": clean(product.get("handle") or issue.get("handle")),
        "product_title": product_title,
        "product_id": clean(product.get("id") or issue.get("product_id")),
        "variant_id": clean(variant.get("id") or issue.get("variant_id")),
        "variant_sku": sku,
        "variant_title": clean(variant.get("title") or issue.get("variant_title")),
        "issue_verdict": clean(issue.get("verdict")),
        "issue_reason": clean(issue.get("reason")),
        "current_image_url": current_image_url,
        "old_media_id": old_media_id,
        "old_media_alt": old_media_alt,
        "replacement_media_id": replacement_media_id,
        "replacement_alt": replacement_alt,
        "replacement_source_path": replacement_source_path,
        "replacement_source_kind": replacement_source_kind,
        "replacement_width": replacement_width,
        "replacement_height": replacement_height,
        "rebuild_description": "true" if rebuild_description else "false",
        "current_detail_count": str(current_detail_count),
        "expected_detail_count": str(expected_detail_count),
        "detail_source_paths": detail_source_paths,
        "delete_old_long_media": "true" if delete_old else "false",
        "note": note,
    }


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fieldnames})


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, default=str), encoding="utf-8")


def load_approved_plan(path: Path) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    approved: list[dict[str, str]] = []
    errors: list[dict[str, str]] = []
    seen_variants: set[str] = set()

    for row_number, row in enumerate(read_csv(path), start=2):
        if not truthy(row.get("approved")):
            continue

        row = {field: clean(row.get(field)) for field in PLAN_FIELDNAMES}
        action = row["action"]
        row_errors: list[str] = []

        if action not in {"attach_existing_media", "upload_local_media", "rebuild_description_only"}:
            row_errors.append("unsupported_action")
        if not row["product_id"]:
            row_errors.append("missing_product_id")
        if action in {"attach_existing_media", "upload_local_media"} and not row["variant_id"]:
            row_errors.append("missing_variant_id")
        if action == "attach_existing_media" and not row["replacement_media_id"]:
            row_errors.append("missing_replacement_media_id")
        if action == "upload_local_media":
            if not row["replacement_source_path"]:
                row_errors.append("missing_replacement_source_path")
            elif not Path(row["replacement_source_path"]).exists():
                row_errors.append("replacement_source_path_not_found")
        if truthy(row["rebuild_description"]) and not row["detail_source_paths"]:
            row_errors.append("missing_detail_source_paths")
        if row["variant_id"] and row["variant_id"] in seen_variants:
            row_errors.append("duplicate_variant_id")

        if row_errors:
            errors.append(
                {
                    "handle": row["handle"],
                    "variant_sku": row["variant_sku"],
                    "issue": "approved_row_invalid",
                    "value": f"row {row_number}: {'|'.join(row_errors)}",
                    "error": "|".join(row_errors),
                }
            )
            continue

        if row["variant_id"]:
            seen_variants.add(row["variant_id"])
        approved.append(row)

    return approved, errors


def fetch_products_for_issues(admin: ShopifyAdmin, issue_rows: list[dict[str, str]]) -> tuple[dict[str, dict[str, Any]], list[dict[str, str]]]:
    products: dict[str, dict[str, Any]] = {}
    issues: list[dict[str, str]] = []
    for product_id in sorted({clean(row.get("product_id")) for row in issue_rows if clean(row.get("product_id"))}):
        try:
            product = admin.fetch_product(product_id)
        except Exception as error:  # noqa: BLE001 - keep dry-run report complete.
            issues.append({"handle": "", "variant_sku": "", "issue": "fetch_product_failed", "value": f"{product_id}: {error}"})
            continue
        if product:
            products[product_id] = product
        else:
            issues.append({"handle": "", "variant_sku": "", "issue": "product_not_found", "value": product_id})
    return products, issues


def build_plan(admin: ShopifyAdmin, audit_csv: Path, roots: list[Path]) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    issue_rows = read_csv(audit_csv)
    products, issues = fetch_products_for_issues(admin, issue_rows)
    manifest_by_sku = build_xbert_manifest_by_sku(roots)
    plan: list[dict[str, str]] = []

    for issue in issue_rows:
        product = products.get(clean(issue.get("product_id")))
        if not product:
            continue
        variant = find_variant(product, issue)
        if not variant:
            issues.append(
                {
                    "handle": clean(issue.get("handle")),
                    "variant_sku": normalize_sku(issue.get("variant_sku")),
                    "issue": "variant_not_found",
                    "value": clean(issue.get("variant_id")),
                }
            )
            continue
        plan.append(build_plan_row(product, variant, issue, manifest_by_sku))

    return plan, issues


def ensure_scopes(admin: ShopifyAdmin) -> None:
    scopes = admin.access_scopes()
    missing_scopes = sorted(REQUIRED_SCOPES - scopes)
    if missing_scopes:
        raise RuntimeError(f"Missing Shopify scopes: {', '.join(missing_scopes)}")


def uploaded_or_existing_media_id(admin: ShopifyAdmin, row: dict[str, str], product: dict[str, Any]) -> tuple[str, bool]:
    existing = find_media_by_alt(product, row["replacement_alt"])
    if existing:
        return clean(existing.get("id")), False

    path = Path(row["replacement_source_path"])
    admin.product_update_media(
        row["product_id"],
        [
            {
                "originalSource": admin.stage_upload(path),
                "alt": row["replacement_alt"],
                "mediaContentType": "IMAGE",
            }
        ],
    )
    time.sleep(8)
    product = admin.fetch_product(row["product_id"])
    uploaded = find_media_by_alt(product, row["replacement_alt"])
    if not uploaded:
        raise RuntimeError(f"Uploaded media not found by alt: {row['replacement_alt']}")
    return clean(uploaded.get("id")), True


def rebuild_description(admin: ShopifyAdmin, row: dict[str, str]) -> None:
    item = {
        "title": row["product_title"],
        "detail_images": json.loads(row["detail_source_paths"]),
    }
    urls = xbert.upload_detail_images_for_item(admin, item)
    admin.product_update_description(row["product_id"], xbert.description_html(item, urls))


def apply_row(admin: ShopifyAdmin, row: dict[str, str]) -> dict[str, str]:
    result = {
        "ok": "false",
        "action": row["action"],
        "handle": row["handle"],
        "variant_sku": row["variant_sku"],
        "variant_id": row["variant_id"],
        "uploaded_media": "false",
        "attached_media_id": "",
        "detached_old_media": "false",
        "deleted_old_media": "false",
        "rebuilt_description": "false",
        "error": "",
    }
    try:
        product = admin.fetch_product(row["product_id"])
        media_id = row["replacement_media_id"]
        uploaded = False

        if row["action"] == "upload_local_media":
            media_id, uploaded = uploaded_or_existing_media_id(admin, row, product)

        if row["action"] in {"attach_existing_media", "upload_local_media"}:
            if row["old_media_id"] and row["old_media_id"] != media_id:
                admin.detach_variant_media(row["product_id"], [{"variantId": row["variant_id"], "mediaIds": [row["old_media_id"]]}])
                result["detached_old_media"] = "true"
            admin.append_variant_media(row["product_id"], [{"variantId": row["variant_id"], "mediaIds": [media_id]}])
            result["attached_media_id"] = media_id
            result["uploaded_media"] = "true" if uploaded else "false"

        if truthy(row["delete_old_long_media"]) and row["old_media_id"] and row["old_media_id"] != media_id:
            if re.search(r"SKU image", row["old_media_alt"], re.I):
                admin.delete_files([row["old_media_id"]])
                result["deleted_old_media"] = "true"

        if truthy(row["rebuild_description"]):
            rebuild_description(admin, row)
            result["rebuilt_description"] = "true"

        result["ok"] = "true"
    except Exception as error:  # noqa: BLE001 - report per-row errors.
        result["error"] = str(error)
    return result


def summarize(plan: list[dict[str, str]], issues: list[dict[str, str]], results: list[dict[str, str]] | None = None) -> dict[str, Any]:
    results = results or []
    return {
        "plan_rows": len(plan),
        "approved_rows": sum(1 for row in plan if truthy(row.get("approved"))),
        "manual_review_rows": sum(1 for row in plan if row.get("action") == "manual_review"),
        "upload_local_media_rows": sum(1 for row in plan if row.get("action") == "upload_local_media"),
        "attach_existing_media_rows": sum(1 for row in plan if row.get("action") == "attach_existing_media"),
        "rebuild_description_rows": sum(1 for row in plan if truthy(row.get("rebuild_description"))),
        "delete_old_long_media_rows": sum(1 for row in plan if truthy(row.get("delete_old_long_media"))),
        "issues": len(issues),
        "applied_ok": sum(1 for row in results if row.get("ok") == "true"),
        "applied_failed": sum(1 for row in results if row.get("ok") != "true"),
        "out_dir": str(OUT_DIR),
        "plan_csv": str(OUT_DIR / "variant-media-repair-plan.csv"),
        "issues_csv": str(OUT_DIR / "variant-media-repair-issues.csv"),
        "results_csv": str(OUT_DIR / "variant-media-repair-results.csv"),
    }


def parse_roots(values: list[str] | None) -> list[Path]:
    if not values:
        return DEFAULT_XBERT_ROOTS
    roots: list[Path] = []
    for value in values:
        roots.extend(Path(part) for part in value.split(",") if clean(part))
    return roots


def main() -> int:
    global OUT_DIR

    parser = argparse.ArgumentParser(description="Guarded repair for Shopify variant/SKU media bindings and Xbert detail descriptions.")
    parser.add_argument("--dry-run", action="store_true", help="Write a repair plan without changing Shopify.")
    parser.add_argument("--apply", action="store_true", help="Apply approved repair rows.")
    parser.add_argument("--yes", action="store_true", help="Required with --apply.")
    parser.add_argument("--audit-csv", type=Path, default=DEFAULT_AUDIT_CSV)
    parser.add_argument("--input-approved-report", type=Path, help="Approved plan CSV for --apply.")
    parser.add_argument("--xbert-source-root", action="append", help="Optional comma-separated Xbert source root(s).")
    parser.add_argument("--out-dir", type=Path, default=OUT_DIR)
    args = parser.parse_args()

    if args.dry_run == args.apply:
        parser.error("Choose exactly one of --dry-run or --apply")
    if args.apply and not args.yes:
        parser.error("--apply requires --yes")
    if args.apply and not args.input_approved_report:
        parser.error("--apply requires --input-approved-report")

    OUT_DIR = args.out_dir
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    admin = ShopifyAdmin()
    ensure_scopes(admin)

    if args.dry_run:
        plan, issues = build_plan(admin, args.audit_csv, parse_roots(args.xbert_source_root))
        write_csv(OUT_DIR / "variant-media-repair-plan.csv", plan, PLAN_FIELDNAMES)
        write_csv(OUT_DIR / "variant-media-repair-issues.csv", issues, ISSUE_FIELDNAMES)
        summary = summarize(plan, issues)
        write_json(OUT_DIR / "variant-media-repair-summary.json", summary)
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        return 0 if not issues else 2

    approved_rows, approval_errors = load_approved_plan(args.input_approved_report)
    if approval_errors:
        write_csv(OUT_DIR / "variant-media-repair-approval-errors.csv", approval_errors, ISSUE_FIELDNAMES + ["error"])
        print(json.dumps({"approval_errors": len(approval_errors), "error_csv": str(OUT_DIR / "variant-media-repair-approval-errors.csv")}, ensure_ascii=False, indent=2))
        return 2

    results = [apply_row(admin, row) for row in approved_rows]
    write_csv(OUT_DIR / "variant-media-repair-results.csv", results, RESULT_FIELDNAMES)
    summary = summarize(approved_rows, [], results)
    write_json(OUT_DIR / "variant-media-repair-apply-summary.json", summary)
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0 if all(row.get("ok") == "true" for row in results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
