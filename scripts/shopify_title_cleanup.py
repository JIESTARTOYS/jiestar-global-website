#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import os
import re
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


OUT_DIR = Path("/private/tmp/jiestar-shopify-title-cleanup")
MANIFEST_PATH = Path("/private/tmp/jiestar-shopify-import/all-manifest.json")
API_VERSION_FALLBACK = "2026-01"
BATCH_SIZE = 25

SAFE_TITLE_BY_BASE = {
    "25821": "JIESTAR Fun Telephone Snail Projection Piano Building Block Set",
    "25885": "JIESTAR Air Fryer and Storage Box Building Block Set",
    "25898": "JIESTAR 3-in-1 Pirate Ship Rocking Chair Building Block Set",
    "57010": "JIESTAR 1:8 Rally Sports Car Building Block Set",
    "57032": "JIESTAR Fountain Plaza Building Block Set",
    "58032": "JIESTAR Bavarian Style Building Block Set",
    "58135": "JIESTAR Supercar 750S Building Block Set",
    "58141": "JIESTAR Missile Launcher Truck Building Block Set",
    "58209": "JIESTAR Ruins Guardian Building Block Set",
    "58279": "JIESTAR Birds and Flowers Building Block Set",
    "59011": "JIESTAR Space Launch Center Building Block Set",
    "59020": "JIESTAR Steam Locomotive Building Block Set",
    "59047": "JIESTAR Undersea Exploration Building Block Set",
    "59093": "JIESTAR Bamboo Forest Cabin Building Block Set",
    "59096": "JIESTAR Railway Express Building Block Set",
    "59163": "JIESTAR Rocky Bay Building Block Set",
    "68001": "JIESTAR Zodiac Collection Part One Building Block Set",
    "89120": "JIESTAR Cafe Building Block Set",
    "89129": "JIESTAR City Light Rail Station Building Block Set with LED Lights",
    "89136": "JIESTAR European Train Station Building Block Set with LED Lights",
    "89144": "JIESTAR Western General Store Building Block Set",
    "91101": "JIESTAR 1:8 Supercar Building Block Set",
    "FF10013": "JIESTAR Sports Car F82 Building Block Set",
    "FF10028": "JIESTAR Classic Muscle Car Building Block Set",
    "FF10029": "JIESTAR Off-Road Utility Vehicle Building Block Set",
    "FF10033": "JIESTAR Off-Road SUV Building Block Set",
    "FF11011": "JIESTAR Remote Control Engineering Crane Building Block Set",
    "FF30011+30014": "JIESTAR Carousel Building Block Set",
    "JJ9013": "JIESTAR Wizard Shopping Street Magic Hall Building Block Set",
    "JJ9021": "JIESTAR Remote Control Tracked Robot Building Block Set",
    "JJ9022": "JIESTAR Transforming Robot Building Block Set",
    "JJ9024": "JIESTAR Wizard Castle Courtyard Building Block Set",
    "JJ9028": "JIESTAR Midsummer Garden Building Block Set",
    "JJ9029": "JIESTAR Ocean Heart Building Block Set",
    "JJ9034": "JIESTAR Ivy Plant Building Block Set",
    "JJ9045": "JIESTAR Starry Flower Garden Building Block Set",
    "JJ9047": "JIESTAR Balloon House Building Block Set",
    "JJ9057": "JIESTAR Wizard Shopping Street Book Shop Set with LED Lights",
    "JJ9058": "JIESTAR Wizard Shopping Street Book Store Set with LED Lights",
    "JJ9059": "JIESTAR Wizard Steam Train Building Block Set with LED Lights",
    "JJ9063": "JIESTAR Fantasy Warrior Building Block Set",
    "JJ9066": "JIESTAR Dream Elf Building Block Set",
    "JJ9071": "JIESTAR Bear Restaurant Building Block Set with LED Lights",
    "JJ9102": "JIESTAR Cyberpunk Dragonfly Building Block Set with LED Lights",
    "JJ9109": "JIESTAR Potted Chrysanthemum Building Block Set",
    "JJ9155": "JIESTAR Oriental Train Building Block Set with LED Lights",
    "JJ9194": "JIESTAR Ferris Wheel Building Block Set",
    "JJ9248": "JIESTAR Taco Food Truck Building Block Set",
}

SENSITIVE_REPLACEMENTS = [
    (re.compile(r"\bford\s+mustang\s+shelby\b", re.I), "Classic Muscle Car"),
    (re.compile(r"\bland\s+rover\s+defender\b", re.I), "Off-Road SUV"),
    (re.compile(r"\bmclaren\s*750s\b", re.I), "Supercar 750S"),
    (re.compile(r"\bmclaren\b", re.I), "Supercar"),
    (re.compile(r"\bhogwarts\s+express\b", re.I), "Wizard Steam Train"),
    (re.compile(r"\bhogwarts\s+courtyard\b", re.I), "Wizard Castle Courtyard"),
    (re.compile(r"\bhogwarts\b", re.I), "Wizard Castle"),
    (re.compile(r"\bdiagon\s+alley\b", re.I), "Wizard Shopping Street"),
    (re.compile(r"\bministry\s+of\s+magic\b", re.I), "Magic Hall"),
    (re.compile(r"\bweasley\s+joke\s+shop\b", re.I), "Joke Shop"),
    (re.compile(r"\bquidditch\s+boutique\b", re.I), "Sports Boutique"),
    (re.compile(r"\bferrari\b", re.I), "Sports Car"),
    (re.compile(r"\bhummer\b", re.I), "Off-Road Utility Vehicle"),
    (re.compile(r"\bsubaru\b", re.I), "Rally Sports Car"),
    (re.compile(r"\boptimus(?:\s+prime)?\b", re.I), "Transforming Robot"),
    (re.compile(r"\bzelda\b", re.I), "Fantasy Adventure"),
]

SENSITIVE_PATTERNS = [
    re.compile(pattern, re.I)
    for pattern in [
        r"\blego\b",
        r"\bdisney\b",
        r"\bmarvel\b",
        r"\bstar\s*wars\b",
        r"\bpokemon\b",
        r"\bpikachu\b",
        r"\bminecraft\b",
        r"\bharry\s+potter\b",
        r"\bhogwarts\b",
        r"\bdiagon\s+alley\b",
        r"\bmclaren\b",
        r"\bferrari\b",
        r"\bporsche\b",
        r"\blamborghini\b",
        r"\bbugatti\b",
        r"\bbmw\b",
        r"\bmercedes\b",
        r"\btesla\b",
        r"\bford\s+mustang\b",
        r"\bshelby\b",
        r"\bland\s+rover\b",
        r"\bdefender\b",
        r"\boptimus\b",
        r"\bzelda\b",
        r"\bjurassic\b",
        r"\bninjago\b",
        r"\bsuper\s*mario\b",
        r"\bbatman\b",
        r"\bspider[-\s]?man\b",
        r"\bavengers\b",
        r"\btransformers\b",
    ]
]


@dataclass
class Product:
    id: str
    handle: str
    title: str
    status: str
    vendor: str


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return

    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()

        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def has_chinese(value: str) -> bool:
    return bool(re.search(r"[\u4e00-\u9fff]", value))


def sensitive_hits(value: str) -> list[str]:
    hits = []

    for pattern in SENSITIVE_PATTERNS:
        match = pattern.search(value)

        if match:
            hits.append(match.group(0))

    return sorted(set(hits), key=str.lower)


def normalize_spaces(value: str) -> str:
    value = re.sub(r"\s+", " ", value)
    value = re.sub(r"\s+([,.)\]])", r"\1", value)
    value = re.sub(r"([(])\s+", r"\1", value)
    return value.strip(" .")


def ensure_jiestar_prefix(value: str) -> str:
    value = normalize_spaces(value)
    value = re.sub(r"^jie\s*star\b", "JIESTAR", value, flags=re.I)
    value = re.sub(r"^jiestar\b", "JIESTAR", value, flags=re.I)

    if not value.upper().startswith("JIESTAR "):
        value = f"JIESTAR {value}"

    return normalize_spaces(value)


def apply_sensitive_replacements(value: str) -> tuple[str, list[str]]:
    reasons = []

    for pattern, replacement in SENSITIVE_REPLACEMENTS:
        if pattern.search(value):
            reasons.append(f"sensitive:{pattern.pattern}")
            value = pattern.sub(replacement, value)

    return normalize_spaces(value), reasons


def load_manifest_by_handle() -> dict[str, dict[str, Any]]:
    if not MANIFEST_PATH.exists():
        return {}

    data = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    return {item["handle"]: item for item in data if item.get("handle")}


def cleaned_title(product: Product, manifest_by_handle: dict[str, dict[str, Any]]) -> tuple[str | None, list[str]]:
    reasons = []
    old_title = product.title
    new_title = old_title
    manifest = manifest_by_handle.get(product.handle)

    if manifest:
        base = re.sub(r"（.*?）|\(.*?\)", "", manifest.get("base", "")).strip()

        if base in SAFE_TITLE_BY_BASE:
            new_title = SAFE_TITLE_BY_BASE[base]
            reasons.append("local-safe-override")
        elif has_chinese(new_title):
            manifest_title = manifest.get("title", "")

            if manifest_title and not has_chinese(manifest_title) and not sensitive_hits(manifest_title):
                new_title = manifest_title
                reasons.append("local-manifest-title")

    if has_chinese(old_title):
        reasons.append("contains-chinese")

    hits = sensitive_hits(old_title)

    if hits:
        reasons.append("sensitive:" + "|".join(hits))

    new_title, replacement_reasons = apply_sensitive_replacements(new_title)
    reasons.extend(replacement_reasons)
    new_title = ensure_jiestar_prefix(new_title)

    if has_chinese(new_title):
        reasons.append("manual-review:still-contains-chinese")
        return None, sorted(set(reasons))

    remaining_hits = sensitive_hits(new_title)

    if remaining_hits:
        reasons.append("manual-review:still-sensitive:" + "|".join(remaining_hits))
        return None, sorted(set(reasons))

    if normalize_spaces(new_title) == normalize_spaces(old_title):
        return None, []

    return new_title, sorted(set(reasons))


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

    def graphql(self, query: str, variables: dict[str, Any] | None = None) -> dict[str, Any]:
        request = urllib.request.Request(
            f"https://{self.domain}/admin/api/{self.version}/graphql.json",
            data=json.dumps({"query": query, "variables": variables or {}}).encode("utf-8"),
            method="POST",
            headers={
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": self.token,
            },
        )

        try:
            with urlopen_with_retries(request, timeout=90) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            body = error.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"Shopify HTTP {error.code}: {body[:1200]}") from error

        if payload.get("errors"):
            raise RuntimeError(f"Shopify GraphQL errors: {payload['errors']}")

        return payload["data"]

    def products(self) -> list[Product]:
        products = []
        cursor = None

        while True:
            data = self.graphql(
                """
                query ProductsForTitleCleanup($cursor: String) {
                  products(first: 250, after: $cursor, sortKey: ID) {
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                    nodes {
                      id
                      handle
                      title
                      status
                      vendor
                    }
                  }
                }
                """,
                {"cursor": cursor},
            )
            connection = data["products"]

            for node in connection["nodes"]:
                products.append(
                    Product(
                        id=node["id"],
                        handle=node["handle"],
                        title=node["title"],
                        status=node["status"],
                        vendor=node.get("vendor") or "",
                    )
                )

            if not connection["pageInfo"]["hasNextPage"]:
                break

            cursor = connection["pageInfo"]["endCursor"]

        return products

    def update_title(self, product_id: str, title: str) -> None:
        data = self.graphql(
            """
            mutation ProductTitleCleanup($product: ProductUpdateInput!) {
              productUpdate(product: $product) {
                product {
                  id
                  title
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """,
            {"product": {"id": product_id, "title": title}},
        )
        errors = data["productUpdate"]["userErrors"]

        if errors:
            raise RuntimeError(f"productUpdate userErrors: {errors}")


def urlopen_with_retries(request: urllib.request.Request, timeout: int, attempts: int = 3):
    last_error: Exception | None = None

    for attempt in range(1, attempts + 1):
        try:
            return urllib.request.urlopen(request, timeout=timeout)
        except urllib.error.HTTPError:
            raise
        except (urllib.error.URLError, TimeoutError, OSError) as error:
            last_error = error

            if attempt == attempts:
                break

            time.sleep(2 * attempt)

    assert last_error is not None
    raise last_error


def build_plan(products: list[Product]) -> list[dict[str, str]]:
    manifest_by_handle = load_manifest_by_handle()
    rows = []

    for product in products:
        new_title, reasons = cleaned_title(product, manifest_by_handle)

        if not reasons:
            continue

        rows.append(
            {
                "id": product.id,
                "handle": product.handle,
                "old_title": product.title,
                "new_title": new_title or "",
                "reason": "; ".join(reasons),
                "status": product.status,
                "vendor": product.vendor,
                "action": "manual_review" if not new_title else "update",
            }
        )

    return rows


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = ["id", "handle", "old_title", "new_title", "reason", "status", "vendor", "action"]

    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def summary(rows: list[dict[str, str]]) -> dict[str, int]:
    return {
        "total_flagged": len(rows),
        "updates": sum(1 for row in rows if row["action"] == "update"),
        "manual_review": sum(1 for row in rows if row["action"] == "manual_review"),
        "contains_chinese": sum(1 for row in rows if "contains-chinese" in row["reason"]),
        "sensitive": sum(1 for row in rows if "sensitive:" in row["reason"]),
    }


def apply_updates(admin: ShopifyAdmin, rows: list[dict[str, str]]) -> list[dict[str, str]]:
    results = []
    update_rows = [row for row in rows if row["action"] == "update"]

    for index, row in enumerate(update_rows, start=1):
        result = dict(row)

        try:
            admin.update_title(row["id"], row["new_title"])
            result["ok"] = "true"
            result["error"] = ""
        except Exception as error:  # noqa: BLE001
            result["ok"] = "false"
            result["error"] = str(error)

        results.append(result)

        if index % BATCH_SIZE == 0:
            time.sleep(2)

    return results


def verify_after(admin: ShopifyAdmin, planned_updates: list[dict[str, str]]) -> dict[str, Any]:
    products_by_id = {product.id: product for product in admin.products()}
    failures = []

    for row in planned_updates:
        product = products_by_id.get(row["id"])

        if not product:
            failures.append({**row, "verify_error": "product-missing"})
            continue

        if product.title != row["new_title"]:
            failures.append({**row, "actual_title": product.title, "verify_error": "title-not-updated"})
            continue

        if has_chinese(product.title):
            failures.append({**row, "actual_title": product.title, "verify_error": "title-still-contains-chinese"})
            continue

        hits = sensitive_hits(product.title)

        if hits:
            failures.append({**row, "actual_title": product.title, "verify_error": "title-still-sensitive:" + "|".join(hits)})

    return {
        "checked": len(planned_updates),
        "failures": failures,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit and clean Shopify product titles.")
    parser.add_argument("--apply", action="store_true", help="Apply title updates through Shopify Admin API.")
    parser.add_argument("--yes", action="store_true", help="Required with --apply.")
    parser.add_argument("--plan-csv", default=str(OUT_DIR / "title-cleanup-plan.csv"))
    parser.add_argument("--result-json", default=str(OUT_DIR / "title-cleanup-result.json"))
    args = parser.parse_args()

    if args.apply and not args.yes:
        raise SystemExit("--apply requires --yes")

    admin = ShopifyAdmin()

    try:
        products = admin.products()
    except RuntimeError as error:
        print(
            json.dumps(
                {
                    "ok": False,
                    "error": str(error),
                    "hint": "Refresh SHOPIFY_ADMIN_ACCESS_TOKEN in .env.local, then rerun this script.",
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 2

    rows = build_plan(products)
    write_csv(Path(args.plan_csv), rows)

    payload: dict[str, Any] = {
        "products_seen": len(products),
        "plan_csv": args.plan_csv,
        "summary": summary(rows),
        "preview": rows[:30],
    }

    if args.apply:
        results = apply_updates(admin, rows)
        planned_updates = [row for row in rows if row["action"] == "update"]
        payload["apply_results"] = {
            "attempted": len(results),
            "ok": sum(1 for item in results if item["ok"] == "true"),
            "failed": sum(1 for item in results if item["ok"] != "true"),
            "rows": results,
        }
        payload["verification"] = verify_after(admin, planned_updates)

    write_json(Path(args.result_json), payload)
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
