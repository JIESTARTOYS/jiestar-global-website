#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import html
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


OUT_DIR = Path("/private/tmp/jiestar-shopify-active-health")
API_VERSION_FALLBACK = "2026-01"
VARIANT_NAME_FIELDNAMES = [
    "approved",
    "approved_value",
    "approval_status",
    "mode",
    "handle",
    "product_title",
    "product_id",
    "admin_url",
    "online_store_url",
    "variant_id",
    "variant_sku",
    "current_value",
    "variant_title",
    "selected_options",
    "option_name",
    "recommended_value",
    "english_sibling_examples",
    "sku_only_sibling_examples",
    "cjk_examples",
]
PRODUCT_GROUP_FIELDNAMES = [
    "mode",
    "handle",
    "title",
    "product_id",
    "admin_url",
    "variant_count",
    "cjk_variant_count",
    "english_sibling_examples",
    "sku_only_sibling_examples",
    "cjk_examples",
]
IMAGE_FIELDNAMES = [
    "verdict",
    "reason",
    "handle",
    "product_title",
    "product_id",
    "admin_url",
    "variant_id",
    "variant_sku",
    "variant_title",
    "selected_options",
    "image_width",
    "image_height",
    "aspect_h_over_w",
    "media_position",
    "media_alt",
    "image_url",
]


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def urlopen_with_retries(request: urllib.request.Request, timeout: int = 120) -> Any:
    last_error: Exception | None = None
    for _ in range(4):
        try:
            return urllib.request.urlopen(request, timeout=timeout)
        except (TimeoutError, urllib.error.URLError) as error:
            last_error = error
    raise RuntimeError(f"Request failed after retries: {last_error}")


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
            headers={"Content-Type": "application/json", "X-Shopify-Access-Token": self.token},
        )
        try:
            with urlopen_with_retries(request, timeout=120) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            body = error.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"Shopify HTTP {error.code}: {body[:1200]}") from error
        if payload.get("errors"):
            raise RuntimeError(f"Shopify GraphQL errors: {json.dumps(payload['errors'], ensure_ascii=False)}")
        return payload["data"]

    def fetch_active_products(self) -> list[dict[str, Any]]:
        query = """
        query VariantOptionImageAudit($cursor: String) {
          products(first: 150, after: $cursor, query: "status:active", sortKey: TITLE) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              handle
              title
              vendor
              status
              onlineStoreUrl
              descriptionHtml
              media(first: 250, sortKey: POSITION) {
                nodes {
                  mediaContentType
                  alt
                  ... on MediaImage {
                    id
                    image {
                      url
                      altText
                      width
                      height
                    }
                  }
                }
              }
              variants(first: 250) {
                nodes {
                  id
                  title
                  sku
                  selectedOptions {
                    name
                    value
                  }
                  image {
                    url
                    altText
                    width
                    height
                  }
                }
              }
            }
          }
        }
        """
        products: list[dict[str, Any]] = []
        cursor = None
        while True:
            data = self.graphql(query, {"cursor": cursor})
            page = data["products"]
            products.extend(page["nodes"])
            if not page["pageInfo"]["hasNextPage"]:
                break
            cursor = page["pageInfo"]["endCursor"]
        return products

    def update_variant_option_values(self, product_id: str, variants: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not variants:
            return []
        data = self.graphql(
            """
            mutation UpdateVariantOptionValues($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
              productVariantsBulkUpdate(productId: $productId, variants: $variants, allowPartialUpdates: true) {
                product {
                  id
                }
                productVariants {
                  id
                  title
                  sku
                  selectedOptions {
                    name
                    value
                  }
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """,
            {"productId": product_id, "variants": variants},
        )
        return data["productVariantsBulkUpdate"]["userErrors"]


def has_cjk(value: str) -> bool:
    return bool(re.search(r"[\u3400-\u9fff]", value or ""))


def clean(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def numeric_id(gid: str) -> str:
    return (gid or "").rsplit("/", 1)[-1]


def admin_url(product: dict[str, Any]) -> str:
    product_number = numeric_id(product.get("id") or "")
    return f"https://admin.shopify.com/store/jiestartoys/products/{product_number}" if product_number else ""


def selected_options_text(variant: dict[str, Any]) -> str:
    return "|".join(
        f"{clean(option.get('name'))}={clean(option.get('value'))}"
        for option in variant.get("selectedOptions") or []
        if clean(option.get("name")) or clean(option.get("value"))
    )


def option_name_for_variant(variant: dict[str, Any]) -> str:
    options = variant.get("selectedOptions") or []
    cjk_option = next((option for option in options if has_cjk(clean(option.get("value")))), None)
    selected = cjk_option or (options[0] if options else {})
    return clean(selected.get("name")) or "SKU"


def option_value_for_variant(variant: dict[str, Any]) -> str:
    options = variant.get("selectedOptions") or []
    cjk_option = next((option for option in options if has_cjk(clean(option.get("value")))), None)
    selected = cjk_option or (options[0] if options else {})
    return clean(selected.get("value")) or clean(variant.get("title"))


def variant_contains_cjk(variant: dict[str, Any]) -> bool:
    if has_cjk(clean(variant.get("title"))) or has_cjk(clean(variant.get("sku"))):
        return True
    return any(has_cjk(clean(option.get("value"))) for option in variant.get("selectedOptions") or [])


SKU_ONLY_RE = re.compile(r"^[A-Z]*\d{3,6}$", re.I)
SKU_WITH_NAME_RE = re.compile(r"^([A-Z]*\d{3,6})\s*-\s*(.+)$", re.I)


def is_sku_only(value: str) -> bool:
    return bool(SKU_ONLY_RE.fullmatch(clean(value)))


def is_english_named_option(value: str) -> bool:
    value = clean(value)
    if not value or value.lower() == "default title" or has_cjk(value):
        return False
    match = SKU_WITH_NAME_RE.fullmatch(value)
    if match:
        return bool(re.search(r"[A-Za-z]", match.group(2)))
    return bool(re.search(r"[A-Za-z]", value)) and not is_sku_only(value)


def product_mode(variants: list[dict[str, Any]]) -> tuple[str, list[str], list[str], list[dict[str, Any]]]:
    cjk_variants = [variant for variant in variants if variant_contains_cjk(variant)]
    english_siblings: list[str] = []
    sku_only_siblings: list[str] = []

    for variant in variants:
        if variant in cjk_variants:
            continue
        value = option_value_for_variant(variant)
        if is_english_named_option(value):
            english_siblings.append(value)
        elif is_sku_only(value):
            sku_only_siblings.append(value)

    if english_siblings:
        mode = "needs_english_by_sibling_pattern"
    elif sku_only_siblings:
        mode = "sku_only_by_sibling_pattern"
    elif len(cjk_variants) == len(variants):
        mode = "all_values_need_review_or_source"
    else:
        mode = "unknown_mixed_pattern"
    return mode, english_siblings, sku_only_siblings, cjk_variants


def build_variant_name_rows(products: list[dict[str, Any]]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for product in products:
        variants = product.get("variants", {}).get("nodes", [])
        mode, english_siblings, sku_only_siblings, cjk_variants = product_mode(variants)
        if not cjk_variants:
            continue

        cjk_examples = [option_value_for_variant(variant) for variant in cjk_variants]
        for variant in cjk_variants:
            sku = clean(variant.get("sku")).upper()
            if mode == "needs_english_by_sibling_pattern":
                recommended = ""
                approval_status = "needs_review"
            elif mode == "sku_only_by_sibling_pattern":
                recommended = sku
                approval_status = "sku_only_by_sibling_pattern"
            else:
                recommended = sku
                approval_status = "sku_only_default"

            rows.append(
                {
                    "approved": "false",
                    "approved_value": recommended,
                    "approval_status": approval_status,
                    "mode": mode,
                    "handle": clean(product.get("handle")),
                    "product_title": clean(product.get("title")),
                    "product_id": clean(product.get("id")),
                    "admin_url": admin_url(product),
                    "online_store_url": clean(product.get("onlineStoreUrl")),
                    "variant_id": clean(variant.get("id")),
                    "variant_sku": sku,
                    "current_value": option_value_for_variant(variant),
                    "variant_title": clean(variant.get("title")),
                    "selected_options": selected_options_text(variant),
                    "option_name": option_name_for_variant(variant),
                    "recommended_value": recommended,
                    "english_sibling_examples": " | ".join(english_siblings[:8]),
                    "sku_only_sibling_examples": " | ".join(sku_only_siblings[:8]),
                    "cjk_examples": " | ".join(cjk_examples[:8]),
                }
            )
    return rows


def build_product_group_rows(products: list[dict[str, Any]]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for product in products:
        variants = product.get("variants", {}).get("nodes", [])
        mode, english_siblings, sku_only_siblings, cjk_variants = product_mode(variants)
        if not cjk_variants:
            continue
        rows.append(
            {
                "mode": mode,
                "handle": clean(product.get("handle")),
                "title": clean(product.get("title")),
                "product_id": clean(product.get("id")),
                "admin_url": admin_url(product),
                "variant_count": str(len(variants)),
                "cjk_variant_count": str(len(cjk_variants)),
                "english_sibling_examples": " | ".join(english_siblings[:8]),
                "sku_only_sibling_examples": " | ".join(sku_only_siblings[:8]),
                "cjk_examples": " | ".join(option_value_for_variant(variant) for variant in cjk_variants[:8]),
            }
        )
    return rows


def base_url(url: str) -> str:
    parsed = urllib.parse.urlsplit(url or "")
    return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, "", ""))


def description_image_urls(description_html: str) -> list[str]:
    urls: list[str] = []
    for match in re.finditer(r"<img\b[^>]*\bsrc=[\"']([^\"']+)[\"']", description_html or "", re.I):
        url = html.unescape(match.group(1)).strip()
        if url:
            urls.append(url)
    return urls


def media_index(product: dict[str, Any]) -> dict[str, dict[str, str]]:
    output: dict[str, dict[str, str]] = {}
    for index, media in enumerate(product.get("media", {}).get("nodes", []), start=1):
        image = media.get("image") or {}
        url = clean(image.get("url"))
        if not url:
            continue
        output[base_url(url)] = {
            "media_position": str(index),
            "media_alt": clean(media.get("alt")) or clean(image.get("altText")),
        }
    return output


def build_variant_image_rows(products: list[dict[str, Any]]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for product in products:
        media_by_url = media_index(product)
        description_urls = {base_url(url) for url in description_image_urls(product.get("descriptionHtml") or "")}
        for variant in product.get("variants", {}).get("nodes", []):
            image = variant.get("image") or {}
            url = clean(image.get("url"))
            reasons: list[str] = []
            width = int(image.get("width") or 0)
            height = int(image.get("height") or 0)
            ratio = height / width if width else 0
            media = media_by_url.get(base_url(url), {}) if url else {}
            alt = clean(image.get("altText")) or clean(media.get("media_alt"))

            if not url:
                reasons.append("variant_missing_image")
            else:
                if base_url(url) in description_urls:
                    reasons.append("variant_image_matches_description_image")
                if re.search(r"详情|detail", alt, re.I):
                    reasons.append("variant_image_alt_looks_detail")
                if width and height and ratio >= 1.8 and height >= 1200:
                    reasons.append("variant_image_is_tall")
                if width and height and ratio >= 2.4:
                    reasons.append("variant_image_is_very_tall")

            if not reasons:
                continue

            rows.append(
                {
                    "verdict": "REVIEW" if reasons == ["variant_missing_image"] else "FAIL",
                    "reason": "|".join(reasons),
                    "handle": clean(product.get("handle")),
                    "product_title": clean(product.get("title")),
                    "product_id": clean(product.get("id")),
                    "admin_url": admin_url(product),
                    "variant_id": clean(variant.get("id")),
                    "variant_sku": clean(variant.get("sku")).upper(),
                    "variant_title": clean(variant.get("title")),
                    "selected_options": selected_options_text(variant),
                    "image_width": str(width),
                    "image_height": str(height),
                    "aspect_h_over_w": f"{ratio:.2f}" if width else "",
                    "media_position": clean(media.get("media_position")),
                    "media_alt": alt,
                    "image_url": url,
                }
            )
    return rows


def load_approved_variant_name_plan(
    path: Path,
    source_rows: list[dict[str, str]],
) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    source_by_variant = {row["variant_id"]: row for row in source_rows if row.get("variant_id")}
    approved_rows: list[dict[str, str]] = []
    errors: list[dict[str, str]] = []
    seen_variants: set[str] = set()
    product_values: dict[str, set[str]] = defaultdict(set)

    with path.open(encoding="utf-8-sig", newline="") as file:
        for row_number, row in enumerate(csv.DictReader(file), start=2):
            if clean(row.get("approved")).lower() not in {"true", "yes", "y", "1"}:
                continue

            variant_id = clean(row.get("variant_id"))
            product_id = clean(row.get("product_id"))
            approved_value = clean(row.get("approved_value") or row.get("new_value"))
            row_errors: list[str] = []

            if not approved_value:
                row_errors.append("approved_value_empty")
            if approved_value and has_cjk(approved_value):
                row_errors.append("approved_value_contains_chinese")
            if variant_id in seen_variants:
                row_errors.append("duplicate_variant_id")

            source = source_by_variant.get(variant_id)
            if source is None:
                row_errors.append("variant_not_in_current_audit")
            else:
                expected_current = clean(source.get("current_value"))
                submitted_current = clean(row.get("current_value"))
                if submitted_current and submitted_current != expected_current:
                    row_errors.append("current_value_mismatch")
                if source.get("mode") == "needs_english_by_sibling_pattern" and is_sku_only(approved_value):
                    row_errors.append("english_sibling_pattern_requires_english_name")

            if row_errors:
                errors.append(
                    {
                        "row_number": str(row_number),
                        "variant_id": variant_id,
                        "variant_sku": clean(row.get("variant_sku")),
                        "error": "|".join(row_errors),
                    }
                )
                continue

            duplicate_key = product_id or clean(source.get("product_id") if source else "")
            if approved_value in product_values[duplicate_key]:
                errors.append(
                    {
                        "row_number": str(row_number),
                        "variant_id": variant_id,
                        "variant_sku": clean(row.get("variant_sku")),
                        "error": "duplicate_approved_value_in_product",
                    }
                )
                continue

            seen_variants.add(variant_id)
            product_values[duplicate_key].add(approved_value)
            approved_rows.append(
                {
                    "product_id": product_id or clean(source.get("product_id") if source else ""),
                    "handle": clean(row.get("handle")) or clean(source.get("handle") if source else ""),
                    "variant_id": variant_id,
                    "variant_sku": clean(row.get("variant_sku")).upper() or clean(source.get("variant_sku") if source else ""),
                    "current_value": clean(row.get("current_value")) or clean(source.get("current_value") if source else ""),
                    "option_name": clean(row.get("option_name")) or clean(source.get("option_name") if source else "") or "SKU",
                    "approved_value": approved_value,
                }
            )

    return approved_rows, errors


def write_csv(path: Path, rows: list[dict[str, str]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")


def write_audit_outputs(products: list[dict[str, Any]], out_dir: Path) -> dict[str, Any]:
    variant_rows = build_variant_name_rows(products)
    product_group_rows = build_product_group_rows(products)
    image_rows = build_variant_image_rows(products)

    cjk_path = out_dir / "active-variant-cjk-title-audit.csv"
    review_path = out_dir / "active-variant-cjk-title-english-review.csv"
    group_path = out_dir / "cjk-variant-product-format-groups.csv"
    image_path = out_dir / "active-variant-image-long-audit.csv"
    raw_path = out_dir / "active-products-variant-media-dimensions.json"

    write_csv(cjk_path, variant_rows, VARIANT_NAME_FIELDNAMES)
    write_csv(review_path, variant_rows, VARIANT_NAME_FIELDNAMES)
    write_csv(group_path, product_group_rows, PRODUCT_GROUP_FIELDNAMES)
    write_csv(image_path, image_rows, IMAGE_FIELDNAMES)
    write_json(raw_path, products)

    summary = {
        "active_products_checked": len(products),
        "variant_cjk_rows": len(variant_rows),
        "variant_cjk_products": len({row["handle"] for row in variant_rows}),
        "product_format_mode_counts": dict(Counter(row["mode"] for row in product_group_rows)),
        "variant_image_problem_or_review_rows": len(image_rows),
        "variant_image_problem_or_review_products": len({row["handle"] for row in image_rows}),
        "variant_image_verdict_counts": dict(Counter(row["verdict"] for row in image_rows)),
        "variant_image_reason_counts": dict(Counter(reason for row in image_rows for reason in row["reason"].split("|"))),
        "cjk_csv": str(cjk_path),
        "review_csv": str(review_path),
        "product_group_csv": str(group_path),
        "image_csv": str(image_path),
        "raw_products_json": str(raw_path),
    }
    write_json(out_dir / "variant-title-image-audit-summary.json", summary)
    return summary


def apply_approved_plan(admin: ShopifyAdmin, plan: list[dict[str, str]]) -> list[dict[str, Any]]:
    grouped: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in plan:
        grouped[row["product_id"]].append(row)

    results: list[dict[str, Any]] = []
    for product_id, rows in grouped.items():
        variant_inputs = [
            {
                "id": row["variant_id"],
                "optionValues": [
                    {
                        "optionName": row["option_name"],
                        "name": row["approved_value"],
                    }
                ],
            }
            for row in rows
        ]
        user_errors = admin.update_variant_option_values(product_id, variant_inputs)
        results.append(
            {
                "product_id": product_id,
                "handle": rows[0]["handle"] if rows else "",
                "variant_count": len(rows),
                "variant_skus": "|".join(row["variant_sku"] for row in rows),
                "user_errors": user_errors,
                "ok": not user_errors,
            }
        )
    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit and guarded-fix Shopify variant option names and variant image bindings.")
    parser.add_argument("--out-dir", default=str(OUT_DIR))
    parser.add_argument("--apply", action="store_true", help="Apply approved variant option-name updates.")
    parser.add_argument("--yes", action="store_true", help="Required with --apply.")
    parser.add_argument("--input-approved-report", default="", help="CSV with approved=true and approved_value for variant option-name updates.")
    args = parser.parse_args()

    if args.apply and not args.yes:
        raise SystemExit("--apply requires --yes")
    if args.apply and not args.input_approved_report:
        raise SystemExit("--apply requires --input-approved-report")

    out_dir = Path(args.out_dir)
    admin = ShopifyAdmin()
    products = admin.fetch_active_products()
    variant_rows = build_variant_name_rows(products)

    if args.apply:
        approved_report_path = Path(args.input_approved_report)
        plan, errors = load_approved_variant_name_plan(approved_report_path, variant_rows)
        if approved_report_path.exists():
            approved_snapshot = out_dir / "approved-variant-option-input-report.csv"
            approved_snapshot.parent.mkdir(parents=True, exist_ok=True)
            approved_snapshot.write_text(approved_report_path.read_text(encoding="utf-8-sig"), encoding="utf-8-sig")
        else:
            approved_snapshot = None

    summary = write_audit_outputs(products, out_dir)

    if args.apply:
        write_csv(out_dir / "approved-variant-option-update-plan.csv", plan, [
            "product_id",
            "handle",
            "variant_id",
            "variant_sku",
            "current_value",
            "option_name",
            "approved_value",
        ])
        write_csv(out_dir / "approved-variant-option-update-errors.csv", errors, ["row_number", "variant_id", "variant_sku", "error"])
        summary["approved_update_plan_rows"] = len(plan)
        summary["approved_update_error_rows"] = len(errors)
        summary["approved_update_plan_csv"] = str(out_dir / "approved-variant-option-update-plan.csv")
        summary["approved_update_errors_csv"] = str(out_dir / "approved-variant-option-update-errors.csv")
        if approved_snapshot:
            summary["approved_input_snapshot_csv"] = str(approved_snapshot)
        if errors:
            write_json(out_dir / "variant-title-image-audit-summary.json", summary)
            print(json.dumps(summary, ensure_ascii=False, indent=2))
            return 2
        if not plan:
            summary["approved_update_error_rows"] = 1
            summary["approved_update_errors_csv"] = str(out_dir / "approved-variant-option-update-errors.csv")
            write_csv(
                out_dir / "approved-variant-option-update-errors.csv",
                [{"row_number": "", "variant_id": "", "variant_sku": "", "error": "approved_update_plan_empty"}],
                ["row_number", "variant_id", "variant_sku", "error"],
            )
            write_json(out_dir / "variant-title-image-audit-summary.json", summary)
            print(json.dumps(summary, ensure_ascii=False, indent=2))
            return 2
        results = apply_approved_plan(admin, plan)
        write_json(out_dir / "approved-variant-option-update-result.json", results)
        summary["applied"] = True
        summary["apply_result_json"] = str(out_dir / "approved-variant-option-update-result.json")
        summary["apply_ok_products"] = sum(1 for result in results if result["ok"])
        summary["apply_error_products"] = sum(1 for result in results if not result["ok"])
        write_json(out_dir / "variant-title-image-audit-summary.json", summary)

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:  # noqa: BLE001 - CLI should report Shopify/API context cleanly.
        print(str(error), file=sys.stderr)
        raise SystemExit(1)
