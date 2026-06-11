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
import shopify_xbert_pending_import as xbert


OUT_DIR = Path("/private/tmp/jiestar-shopify-xbert-import")
BRICK4_BRAND_ID = "52"
BRICK4_BRAND_KEYWORD = "砖悦Xbert"
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
CHECK_KEYS = [
    "specs.piece_count",
    "specs.recommended_age",
    "specs.finished_model_size",
    "specs.package_size",
    "specs.difficulty_level",
    "custom.series",
]


@dataclass(frozen=True)
class Brick4Spec:
    sku: str
    brick4_set_id: str
    title: str
    theme: str
    piece_count: str
    recommended_age: str
    package_size: str
    finished_size: str
    source_url: str
    confidence: str


def request_text(url: str, *, retries: int = 3) -> str:
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(request, timeout=45) as response:
                return response.read().decode("utf-8", errors="ignore")
        except Exception as error:  # noqa: BLE001 - keep retry context for network fetches.
            last_error = error
            time.sleep(1.5 * attempt)
    raise RuntimeError(f"request failed: {url}: {last_error}")


def request_json(url: str) -> dict[str, Any]:
    return json.loads(request_text(url))


def clean_text(value: Any) -> str:
    return re.sub(r"\s+", " ", unescape(str(value or ""))).strip()


def normalize_sku(value: Any) -> str:
    return xbert.normalize_sku(value)


def normalize_size(value: str) -> str:
    value = clean_text(value)
    value = re.sub(r"^(包装尺寸|成品尺寸|模型尺寸|成品)\s*", "", value)
    match = re.search(r"([0-9.]+\s*[×x*]\s*[0-9.]+\s*[×x*]\s*[0-9.]+)", value)
    if not match:
        return ""
    size = match.group(1).replace("×", "x").replace("*", "x")
    size = re.sub(r"\s*x\s*", "x", size)
    return size if re.fullmatch(r"[0-9.]+x[0-9.]+x[0-9.]+", size) else ""


def parse_detail_sizes(html: str) -> dict[str, str]:
    def extract(class_name: str) -> str:
        match = re.search(rf'<dl class="{class_name}"[^>]*>.*?<dd>(.*?)</dd>', html, flags=re.S)
        if not match:
            return ""
        return normalize_size(re.sub(r"<[^>]+>", " ", match.group(1)))

    return {
        "package_size": extract("setparam_package_size"),
        "finished_size": extract("setparam_size"),
    }


def brick4_age(node: dict[str, Any]) -> str:
    lower = clean_text(node.get("age_lower"))
    upper = clean_text(node.get("age_upper"))
    if lower and lower != "0" and (not upper or upper == "0"):
        return f"{lower}+"
    if lower and lower != "0" and upper and upper != "0":
        return f"{lower}-{upper}"
    return ""


def exact_xbert_setnumber(node: dict[str, Any], sku: str) -> bool:
    normalized = normalize_sku(sku)
    for setnumber in node.get("setnumber") or []:
        brand = str(setnumber.get("brand") or "")
        number = normalize_sku(setnumber.get("setnumber") or "")
        keyword = clean_text(setnumber.get("brandkeyword"))
        if brand == BRICK4_BRAND_ID and number == normalized and keyword == BRICK4_BRAND_KEYWORD:
            return True
    return False


def series_from_theme(theme: str) -> str:
    theme = clean_text(theme)
    mapping = {
        "街景": "Architecture & Street View",
        "影视游戏": "Film & Game",
        "哈利·波特": "Fantasy & Wizardry",
        "机械组": "Mechanical",
        "创意百变高手": "Creative Builds",
        "动物": "Animals",
        "植物": "Botanical",
        "花": "Botanical",
        "城市": "City",
        "军事": "Military",
        "汽车": "Vehicles",
        "赛车": "Vehicles",
        "车模": "Vehicles",
        "机械": "Mechanical",
        "恐龙": "Dinosaurs",
        "海盗": "Pirates",
        "主题系列": "Themed Builds",
        "创意百变": "Creative Builds",
        "侏罗纪世界": "Dinosaurs",
        "建筑": "Architecture & Street View",
        "游乐场": "Amusement Park",
        "花卉植物": "Botanical",
        "艺术品": "Art & Display",
        "艺术生活": "Art & Display",
        "指环王": "Fantasy & Adventure",
    }
    return mapping.get(theme, "")


def fetch_brick4_spec(sku: str) -> Brick4Spec | None:
    params = urllib.parse.urlencode({"s": normalize_sku(sku), "page": "1"})
    data = request_json(f"https://brick4.com/get/set?{params}")
    if data.get("state") != 1:
        return None

    candidates = [node for node in data.get("data") or [] if exact_xbert_setnumber(node, sku)]
    if not candidates:
        return None

    node = candidates[0]
    set_id = clean_text(node.get("id"))
    slug = clean_text(node.get("title2url"))
    detail_url = f"https://brick4.com/set/{set_id}/"
    if slug:
        detail_url += urllib.parse.quote(slug.strip("/"))
    sizes = parse_detail_sizes(request_text(detail_url)) if set_id else {"package_size": "", "finished_size": ""}

    return Brick4Spec(
        sku=normalize_sku(sku),
        brick4_set_id=set_id,
        title=clean_text(node.get("title")),
        theme=clean_text(node.get("theme")),
        piece_count=clean_text(node.get("pcs")),
        recommended_age=brick4_age(node),
        package_size=sizes["package_size"],
        finished_size=sizes["finished_size"],
        source_url=detail_url,
        confidence="exact_xbert_sku",
    )


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


def missing_metafield_updates(current: dict[str, str], spec: Brick4Spec) -> dict[str, str]:
    candidates = {
        "specs.piece_count": spec.piece_count if spec.piece_count.isdigit() else "",
        "specs.recommended_age": spec.recommended_age,
        "specs.finished_model_size": spec.finished_size,
        "specs.package_size": spec.package_size,
        "custom.series": series_from_theme(spec.theme),
    }
    return {key: value for key, value in candidates.items() if value and not clean_text(current.get(key))}


def xbert_products(admin: xbert.ShopifyAdmin) -> list[dict[str, Any]]:
    query = """
    query($cursor: String) {
      products(first: 250, after: $cursor, query: "vendor:Xbert") {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          handle
          title
          vendor
          status
          productType
          variants(first: 20) { nodes { sku price } }
          specs: metafields(first: 20, namespace: "specs") { nodes { namespace key value type } }
          custom: metafields(first: 20, namespace: "custom") { nodes { namespace key value type } }
        }
      }
    }
    """
    products: list[dict[str, Any]] = []
    cursor = None
    while True:
        data = admin.graphql(query, {"cursor": cursor})
        page = data["products"]
        products.extend(page["nodes"])
        if not page["pageInfo"]["hasNextPage"]:
            break
        cursor = page["pageInfo"]["endCursor"]
    return products


def product_sku(product: dict[str, Any]) -> str:
    for variant in product["variants"]["nodes"]:
        sku = normalize_sku(variant.get("sku"))
        if sku:
            return sku
    return ""


def product_metafields(product: dict[str, Any]) -> dict[str, str]:
    output = {}
    for namespace in ("specs", "custom"):
        for metafield in product[namespace]["nodes"]:
            output[f"{metafield['namespace']}.{metafield['key']}"] = clean_text(metafield.get("value"))
    return output


def needs_backfill(product: dict[str, Any]) -> bool:
    current = product_metafields(product)
    return any(not current.get(key) for key in CHECK_KEYS)


def build_plan() -> list[dict[str, str]]:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    admin = xbert.ShopifyAdmin()
    products = [product for product in xbert_products(admin) if needs_backfill(product)]
    specs: dict[str, Brick4Spec] = {}
    rows: list[dict[str, str]] = []

    for index, product in enumerate(products, start=1):
        sku = product_sku(product)
        print(f"[brick4] {index}/{len(products)} {sku}", flush=True)
        spec = fetch_brick4_spec(sku) if sku else None
        if spec:
            specs[sku] = spec
        current = product_metafields(product)
        updates = missing_metafield_updates(current, spec) if spec else {}
        rows.append(
            {
                "action": "update_metafields" if updates else "manual_review",
                "product_id": product["id"],
                "handle": product["handle"],
                "title": product["title"],
                "sku": sku,
                "current_metafields": json.dumps({key: current.get(key, "") for key in CHECK_KEYS}, ensure_ascii=False, sort_keys=True),
                "update_metafields": json.dumps(updates, ensure_ascii=False, sort_keys=True),
                "brick4_spec": json.dumps(spec.__dict__ if spec else {}, ensure_ascii=False, sort_keys=True),
                "missing_after_update": "|".join(key for key in CHECK_KEYS if not current.get(key) and not updates.get(key)),
            }
        )
        time.sleep(0.15)

    (OUT_DIR / "xbert-brick4-specs.json").write_text(
        json.dumps({sku: spec.__dict__ for sku, spec in specs.items()}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    write_plan(rows, applied=False)
    return rows


def write_plan(rows: list[dict[str, str]], applied: bool) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    plan_csv = OUT_DIR / "xbert-brick4-metafield-backfill-plan.csv"
    with plan_csv.open("w", encoding="utf-8", newline="") as file:
        fieldnames = list(rows[0].keys()) if rows else ["action"]
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    summary = {
        "applied": applied,
        "plan_csv": str(plan_csv),
        "products_in_plan": len(rows),
        "action_counts": {},
    }
    for row in rows:
        summary["action_counts"][row["action"]] = summary["action_counts"].get(row["action"], 0) + 1
    (OUT_DIR / "xbert-brick4-metafield-backfill-summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))


def load_plan() -> list[dict[str, str]]:
    plan_csv = OUT_DIR / "xbert-brick4-metafield-backfill-plan.csv"
    if not plan_csv.exists():
        raise RuntimeError(f"Missing existing plan: {plan_csv}")
    with plan_csv.open(encoding="utf-8") as file:
        return list(csv.DictReader(file))


def update_product_metafields(admin: xbert.ShopifyAdmin, product_id: str, metafields: dict[str, str]) -> None:
    if not metafields:
        return
    data = admin.graphql(
        """
        mutation BackfillXbertMetafields($product: ProductUpdateInput!) {
          productUpdate(product: $product) {
            product { id }
            userErrors { field message }
          }
        }
        """,
        {"product": {"id": product_id, "metafields": metafield_inputs(metafields)}},
    )
    base_import.assert_no_user_errors("productUpdate", data["productUpdate"]["userErrors"])


def apply_plan(rows: list[dict[str, str]]) -> None:
    admin = xbert.ShopifyAdmin()
    updates = [row for row in rows if row["action"] == "update_metafields"]
    result_rows = []
    for index, row in enumerate(updates, start=1):
        metafields = json.loads(row["update_metafields"])
        print(f"[shopify] {index}/{len(updates)} {row['sku']} {sorted(metafields)}", flush=True)
        update_product_metafields(admin, row["product_id"], metafields)
        result_rows.append({**row, "applied": "yes"})
        time.sleep(0.2)

    if result_rows:
        result_csv = OUT_DIR / "xbert-brick4-metafield-backfill-result.csv"
        with result_csv.open("w", encoding="utf-8", newline="") as file:
            writer = csv.DictWriter(file, fieldnames=list(result_rows[0].keys()))
            writer.writeheader()
            writer.writerows(result_rows)


def main() -> int:
    parser = argparse.ArgumentParser(description="Backfill Xbert Shopify metafields from exact Brick4 SKU matches.")
    parser.add_argument("--apply", action="store_true", help="Build a fresh plan and apply safe missing-field updates.")
    parser.add_argument("--apply-existing", action="store_true", help="Apply the existing plan CSV.")
    args = parser.parse_args()

    rows = load_plan() if args.apply_existing else build_plan()
    if args.apply or args.apply_existing:
        apply_plan(rows)
        write_plan(rows, applied=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
