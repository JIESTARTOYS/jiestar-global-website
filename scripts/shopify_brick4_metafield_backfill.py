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
from dataclasses import dataclass
from html import unescape
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))

import shopify_sample_import as base_import
from shopify_collection_audit import ShopifyAdmin
from shopify_metafield_audit import CHECK_KEYS, normalize_sku, workbook_rows_with_fallbacks


OUT_DIR = Path("/private/tmp/jiestar-shopify-metafield-backfill")
AUDIT_CSV = Path("/private/tmp/jiestar-shopify-metafield-audit/metafield-audit-plan.csv")
BRICK4_BRAND_ID = "52"
DIFFICULTY_DEFAULT = "See product package"
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"


@dataclass
class Brick4Spec:
    sku: str
    brick4_set_id: str
    title: str
    theme: str
    piece_count: str
    recommended_age: str
    package_size: str
    source_url: str
    confidence: str
    reason: str = ""


def request_text(url: str, *, retries: int = 3) -> str:
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(request, timeout=45) as response:
                return response.read().decode("utf-8", errors="ignore")
        except Exception as error:  # noqa: BLE001
            last_error = error
            time.sleep(1.5 * attempt)
    raise RuntimeError(f"request failed: {url}: {last_error}")


def request_json(url: str, *, retries: int = 3) -> dict[str, Any]:
    return json.loads(request_text(url, retries=retries))


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", unescape(str(value or ""))).strip()


def normalize_size(value: str) -> str:
    value = clean_text(value)
    value = re.sub(r"^(包装尺寸|成品尺寸|模型尺寸)\s*", "", value)
    match = re.search(r"([0-9.]+\s*[×x*]\s*[0-9.]+\s*[×x*]\s*[0-9.]+)", value)
    if match:
        value = match.group(1)
    value = re.sub(r"\s*cm\s*$", "", value, flags=re.I)
    value = value.replace("×", "x").replace("*", "x")
    value = re.sub(r"\s*x\s*", "x", value)
    value = value.strip()
    return value if re.fullmatch(r"[0-9.]+x[0-9.]+x[0-9.]+", value) else ""


def normalize_size_list(value: str) -> list[str]:
    return [size for size in [normalize_size(part) for part in re.split(r"[,/]", value or "")] if size]


def brick4_age(node: dict[str, Any]) -> str:
    lower = str(node.get("age_lower") or "").strip()
    upper = str(node.get("age_upper") or "").strip()
    if lower and lower != "0" and (not upper or upper == "0"):
        return f"{lower}+"
    if lower and lower != "0" and upper and upper != "0":
        return f"{lower}-{upper}"
    return ""


def exact_setnumber(node: dict[str, Any], sku: str) -> dict[str, Any] | None:
    normalized = normalize_sku(sku)
    for setnumber in node.get("setnumber") or []:
        brand = str(setnumber.get("brand") or "")
        number = normalize_sku(setnumber.get("setnumber") or "")
        if brand == BRICK4_BRAND_ID and number == normalized:
            return setnumber
    return None


def parse_detail_package_size(set_id: str, sku: str, title2url: str = "") -> str:
    path = f"https://brick4.com/set/{set_id}/"
    if title2url:
        path += urllib.parse.quote(title2url.strip("/"))
    html = request_text(path)
    normalized = re.escape(normalize_sku(sku))
    number_match = re.search(
        rf'<div class="number">\s*{normalized}\s*</div>(?P<tail>.*?)</div>\s*</div>',
        html,
        flags=re.I | re.S,
    )
    search_area = number_match.group("tail") if number_match else html
    package_match = re.search(r'<dl class="setparam_package_size"[^>]*>.*?<dd>(.*?)</dd>', search_area, flags=re.S)
    if not package_match:
        package_match = re.search(r"包装尺寸\s*([0-9.]+\s*[×x*]\s*[0-9.]+\s*[×x*]\s*[0-9.]+)\s*cm", search_area, flags=re.I)
    if not package_match:
        return ""
    return normalize_size(re.sub(r"<[^>]+>", " ", package_match.group(1)))


def fetch_brick4_spec(sku: str) -> Brick4Spec | None:
    params = urllib.parse.urlencode(
        {
            "s": sku,
            "filter_brand": BRICK4_BRAND_ID,
            "brandorder": "1",
            "page": "1",
        }
    )
    data = request_json(f"https://brick4.com/get/set?{params}")
    if data.get("state") != 1:
        return None
    candidates = []
    for node in data.get("data") or []:
        match = exact_setnumber(node, sku)
        if match:
            candidates.append((node, match))
    if not candidates:
        return None

    node, _match = candidates[0]
    set_id = str(node.get("id") or "")
    package_size = ""
    if set_id:
        try:
            package_size = parse_detail_package_size(set_id, sku, str(node.get("title2url") or ""))
        except Exception as error:  # noqa: BLE001
            package_size = ""
            reason = f"detail_package_parse_failed: {error}"
        else:
            reason = ""
    else:
        reason = "missing_brick4_set_id"

    return Brick4Spec(
        sku=normalize_sku(sku),
        brick4_set_id=set_id,
        title=clean_text(node.get("title") or ""),
        theme=clean_text(node.get("theme") or ""),
        piece_count=clean_text(node.get("pcs") or ""),
        recommended_age=brick4_age(node),
        package_size=package_size,
        source_url=f"https://brick4.com/set/{set_id}/" if set_id else "",
        confidence="exact_brand_sku",
        reason=reason,
    )


def load_audit_rows() -> list[dict[str, str]]:
    if not AUDIT_CSV.exists():
        raise RuntimeError(f"Missing audit CSV: {AUDIT_CSV}. Run scripts/shopify_metafield_audit.py first.")
    with AUDIT_CSV.open(encoding="utf-8") as file:
        return list(csv.DictReader(file))


def expected_from_workbook(skus: list[str]) -> dict[str, str]:
    workbook = workbook_rows_with_fallbacks()
    rows = [workbook.get(sku) for sku in skus]
    usable_rows = [row for row in rows if row]
    piece_counts = [base_import.parse_piece_count(row.notes) for row in usable_rows if base_import.parse_piece_count(row.notes)]
    ages = sorted({clean_text(row.age) for row in usable_rows if clean_text(row.age)})
    package_sizes = sorted({normalize_size(row.package_size) for row in usable_rows if normalize_size(row.package_size)})
    finished_sizes = [clean_text(row.finished_size) for row in usable_rows if clean_text(row.finished_size)]
    series_values = sorted({clean_text(row.series_en) for row in usable_rows if clean_text(row.series_en)})
    expected = {
        "specs.piece_count": str(sum(int(count) for count in piece_counts)) if piece_counts else "",
        "specs.recommended_age": ", ".join(ages),
        "specs.finished_model_size": " / ".join(finished_sizes),
        "specs.package_size": ", ".join(package_sizes),
        "specs.difficulty_level": DIFFICULTY_DEFAULT,
        "custom.series": series_values[0] if len(series_values) == 1 else "",
    }
    return {key: value for key, value in expected.items() if value}


def merge_specs(skus: list[str], brick4_specs: dict[str, Brick4Spec]) -> dict[str, str]:
    expected = expected_from_workbook(skus)
    missing_skus = [sku for sku in skus if sku not in workbook_rows_with_fallbacks()]
    brick_specs = [brick4_specs[sku] for sku in missing_skus if sku in brick4_specs]

    if brick_specs:
        existing_piece = int(expected["specs.piece_count"]) if expected.get("specs.piece_count", "").isdigit() else 0
        brick_piece_values = [int(spec.piece_count) for spec in brick_specs if spec.piece_count.isdigit()]
        if brick_piece_values:
            expected["specs.piece_count"] = str(existing_piece + sum(brick_piece_values))

        ages = [expected.get("specs.recommended_age", "")]
        ages.extend(spec.recommended_age for spec in brick_specs if spec.recommended_age)
        age_values = sorted({age for value in ages for age in [v.strip() for v in value.split(",")] if age})
        if age_values:
            expected["specs.recommended_age"] = ", ".join(age_values)

        package_sizes = [expected.get("specs.package_size", "")]
        package_sizes.extend(spec.package_size for spec in brick_specs if spec.package_size)
        package_values = sorted({size for value in package_sizes for size in normalize_size_list(value)})
        if package_values:
            expected["specs.package_size"] = ", ".join(package_values)

    expected.setdefault("specs.difficulty_level", DIFFICULTY_DEFAULT)
    return {key: value for key, value in expected.items() if value}


def metafield_inputs(metafields: dict[str, str]) -> list[dict[str, str]]:
    output = []
    for full_key, value in metafields.items():
        namespace, key = full_key.split(".", 1)
        output.append(
            {
                "namespace": namespace,
                "key": key,
                "type": "number_integer" if full_key == "specs.piece_count" else "single_line_text_field",
                "value": str(value),
            }
        )
    return output


def update_product_metafields(admin: ShopifyAdmin, product_id: str, metafields: dict[str, str]) -> None:
    if not metafields:
        return
    data = admin.graphql(
        """
        mutation BackfillBrick4Metafields($product: ProductUpdateInput!) {
          productUpdate(product: $product) {
            product { id }
            userErrors { field message }
          }
        }
        """,
        {"product": {"id": product_id, "metafields": metafield_inputs(metafields)}},
    )
    base_import.assert_no_user_errors("productUpdate", data["productUpdate"]["userErrors"])


def build_plan() -> tuple[list[dict[str, str]], dict[str, Brick4Spec]]:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    audit_rows = [
        row
        for row in load_audit_rows()
        if row["status"] == "ACTIVE"
        and row["action"] in {"manual_no_workbook_match", "partial_workbook_match", "manual_no_sku", "metafield_issue"}
    ]

    needed_skus: set[str] = set()
    workbook = workbook_rows_with_fallbacks()
    for row in audit_rows:
        skus = [normalize_sku(sku) for sku in row["skus"].split("|") if normalize_sku(sku)]
        for sku in skus:
            if sku not in workbook:
                needed_skus.add(sku)

    brick4_specs: dict[str, Brick4Spec] = {}
    not_found: list[str] = []
    for index, sku in enumerate(sorted(needed_skus), start=1):
        print(f"[brick4] {index}/{len(needed_skus)} {sku}")
        try:
            spec = fetch_brick4_spec(sku)
        except Exception as error:  # noqa: BLE001
            spec = None
            print(f"  error: {error}")
        if spec:
            brick4_specs[sku] = spec
        else:
            not_found.append(sku)
        time.sleep(0.15)

    plan_rows: list[dict[str, str]] = []
    for audit in audit_rows:
        skus = [normalize_sku(sku) for sku in audit["skus"].split("|") if normalize_sku(sku)]
        current = json.loads(audit.get("current_metafields") or "{}")
        expected = merge_specs(skus, brick4_specs) if skus else {}

        updates = {}
        for key in CHECK_KEYS:
            if key == "specs.finished_model_size":
                continue
            if expected.get(key) and not current.get(key):
                updates[key] = expected[key]

        remaining_missing = [key for key in ["specs.piece_count", "specs.recommended_age", "specs.finished_model_size", "specs.package_size"] if not current.get(key) and not updates.get(key)]
        brick4_found = [sku for sku in skus if sku in brick4_specs]
        brick4_missing = [sku for sku in skus if sku not in workbook and sku not in brick4_specs]
        action = "update_metafields" if updates else "manual_review"
        if not skus:
            action = "manual_no_sku"
        elif brick4_missing and not updates:
            action = "brick4_not_found"

        plan_rows.append(
            {
                "action": action,
                "product_id": audit["product_id"],
                "handle": audit["handle"],
                "title": audit["title"],
                "skus": "|".join(skus),
                "audit_action": audit.get("action", ""),
                "brick4_found_skus": "|".join(brick4_found),
                "brick4_missing_skus": "|".join(brick4_missing),
                "update_metafields": json.dumps(updates, ensure_ascii=False, sort_keys=True),
                "remaining_missing_core_keys": "|".join(remaining_missing),
                "current_metafields": json.dumps({key: current.get(key, "") for key in CHECK_KEYS if key in current}, ensure_ascii=False, sort_keys=True),
                "brick4_specs": json.dumps({sku: brick4_specs[sku].__dict__ for sku in skus if sku in brick4_specs}, ensure_ascii=False, sort_keys=True),
            }
        )

    (OUT_DIR / "brick4-not-found-skus.json").write_text(json.dumps(sorted(not_found), ensure_ascii=False, indent=2), encoding="utf-8")
    return plan_rows, brick4_specs


def write_plan(plan_rows: list[dict[str, str]], applied: bool) -> None:
    plan_csv = OUT_DIR / "brick4-metafield-backfill-plan.csv"
    with plan_csv.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=list(plan_rows[0].keys()) if plan_rows else ["action"])
        writer.writeheader()
        writer.writerows(plan_rows)

    summary = {
        "applied": applied,
        "plan_csv": str(plan_csv),
        "products_in_plan": len(plan_rows),
        "action_counts": {},
    }
    for row in plan_rows:
        summary["action_counts"][row["action"]] = summary["action_counts"].get(row["action"], 0) + 1
    (OUT_DIR / "brick4-metafield-backfill-summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


def load_existing_plan() -> list[dict[str, str]]:
    plan_csv = OUT_DIR / "brick4-metafield-backfill-plan.csv"
    if not plan_csv.exists():
        raise RuntimeError(f"Missing existing plan CSV: {plan_csv}")
    with plan_csv.open(encoding="utf-8") as file:
        return list(csv.DictReader(file))


def clean_update_metafields(metafields: dict[str, str]) -> dict[str, str]:
    cleaned = dict(metafields)
    package_size = cleaned.get("specs.package_size", "")
    if package_size:
        valid_sizes = normalize_size_list(package_size)
        if valid_sizes:
            cleaned["specs.package_size"] = ", ".join(sorted(set(valid_sizes)))
        else:
            cleaned.pop("specs.package_size", None)
    return cleaned


def clean_plan_rows(plan_rows: list[dict[str, str]]) -> list[dict[str, str]]:
    cleaned_rows = []
    for row in plan_rows:
        output = dict(row)
        updates = clean_update_metafields(json.loads(row.get("update_metafields") or "{}"))
        output["update_metafields"] = json.dumps(updates, ensure_ascii=False, sort_keys=True)
        if row.get("action") == "update_metafields" and not updates:
            output["action"] = "manual_review"
        cleaned_rows.append(output)
    return cleaned_rows


def apply_plan(plan_rows: list[dict[str, str]]) -> None:
    admin = ShopifyAdmin()
    updates = [row for row in plan_rows if row["action"] == "update_metafields"]
    result_rows = []
    for index, row in enumerate(updates, start=1):
        metafields = json.loads(row["update_metafields"])
        print(f"[shopify] {index}/{len(updates)} {row['handle']} {sorted(metafields)}")
        update_product_metafields(admin, row["product_id"], metafields)
        result_rows.append({**row, "applied": "yes"})
        time.sleep(0.25)

    result_csv = OUT_DIR / "brick4-metafield-backfill-result.csv"
    if result_rows:
        with result_csv.open("w", encoding="utf-8", newline="") as file:
            writer = csv.DictWriter(file, fieldnames=list(result_rows[0].keys()))
            writer.writeheader()
            writer.writerows(result_rows)


def main() -> int:
    parser = argparse.ArgumentParser(description="Backfill missing Shopify product metafields from exact JIESTAR Brick4 SKU matches.")
    parser.add_argument("--apply", action="store_true", help="Apply safe missing-field updates to Shopify.")
    parser.add_argument("--apply-existing", action="store_true", help="Apply the existing generated plan CSV without querying Brick4 again.")
    args = parser.parse_args()

    plan_rows = load_existing_plan() if args.apply_existing else build_plan()[0]
    plan_rows = clean_plan_rows(plan_rows)
    write_plan(plan_rows, applied=args.apply or args.apply_existing)
    if args.apply or args.apply_existing:
        apply_plan(plan_rows)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
