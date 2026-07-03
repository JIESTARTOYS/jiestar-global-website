#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path
from typing import Any, Iterable

from openpyxl import load_workbook


OUT_DIR = Path("/private/tmp/jiestar-shopify-shipping-update")
TEMPLATE_WORKBOOK = Path("/Users/chensen/jiestar/定价参考/Shopify运费模板_体积重_Shopify盒规补全_20260630.xlsx")
API_VERSION_FALLBACK = "2026-01"

TARGET_PROFILE_BY_SOURCE = {
    "Standard goods": "JIESTAR Standard goods",
    "Battery/electric goods": "JIESTAR Battery/electric goods",
}
MANUAL_REVIEW_PROFILE = "JIESTAR Manual Shipping Review"
TARGET_PROFILE_NAMES = sorted([*TARGET_PROFILE_BY_SOURCE.values(), MANUAL_REVIEW_PROFILE])
TARGET_COUNTRY_CODES = {"AU", "BE", "CA", "DE", "ES", "FR", "GB", "IT", "NL", "PL", "SE", "US"}
REQUIRED_SCOPES = {"read_products", "write_products", "read_locations", "read_shipping", "write_shipping"}
VARIANT_ASSOCIATE_BATCH_SIZE = 250

SUMMARY_JSON = "shipping-update-summary.json"
APPLY_RESULT_JSON = "shipping-apply-result.json"
RATE_PLAN_CSV = "shipping-rate-plan.csv"
WEIGHT_UPDATES_CSV = "shipping-weight-updates.csv"
PROFILE_ASSIGNMENTS_CSV = "shipping-profile-assignments.csv"
HEAVY_REVIEW_CSV = "shipping-blocked-heavy.csv"
UNMATCHED_ACTIVE_CSV = "shipping-unmatched-active.csv"
API_DIFF_CSV = "shipping-api-diff.csv"


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def canonical_hash(value: Any) -> str:
    data = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def clean(value: Any) -> str:
    return str(value or "").strip()


def sku_key(value: Any) -> str:
    return clean(value).upper()


def dec(value: Any) -> Decimal | None:
    if value in (None, ""):
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None


def money_str(value: Decimal | None) -> str:
    if value is None:
        return ""
    return f"{value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP):.2f}"


def decimal_str(value: Decimal | None, places: str = "0.###") -> str:
    if value is None:
        return ""
    normalized = value.normalize()
    return format(normalized, "f")


def grams_from_weight(weight: dict[str, Any] | None) -> int | None:
    if not weight:
        return None
    value = dec(weight.get("value"))
    unit = clean(weight.get("unit")).upper()
    if value is None:
        return None
    multipliers = {
        "GRAMS": Decimal("1"),
        "KILOGRAMS": Decimal("1000"),
        "POUNDS": Decimal("453.59237"),
        "OUNCES": Decimal("28.349523125"),
    }
    multiplier = multipliers.get(unit)
    if multiplier is None:
        return None
    return int((value * multiplier).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def chunks(items: list[Any], size: int) -> Iterable[list[Any]]:
    for index in range(0, len(items), size):
        yield items[index : index + size]


def row_dicts(sheet: Any) -> list[dict[str, Any]]:
    rows = sheet.iter_rows(values_only=True)
    try:
        headers = [clean(cell) for cell in next(rows)]
    except StopIteration:
        return []
    output: list[dict[str, Any]] = []
    for row in rows:
        if not row or not any(cell not in (None, "") for cell in row):
            continue
        output.append({headers[idx]: row[idx] if idx < len(row) else None for idx in range(len(headers)) if headers[idx]})
    return output


@dataclass(frozen=True)
class RateRow:
    source_profile: str
    target_profile: str
    country: str
    country_code: str
    service_type: str
    rate_name: str
    transit_time: str
    min_weight_kg: Decimal
    max_weight_kg: Decimal
    price_usd: Decimal
    freight_cost_rmb: Decimal | None


@dataclass(frozen=True)
class WeightTarget:
    sku: str
    sku_key: str
    handle: str
    title: str
    vendor: str
    target_weight_g: int | None
    source_profile: str
    target_profile: str
    weight_import_status: str
    dimension_verification: str
    shipping_status: str
    listing_status: str
    notes: str


@dataclass(frozen=True)
class ShopifyVariant:
    product_id: str
    product_handle: str
    product_title: str
    product_status: str
    vendor: str
    variant_id: str
    variant_title: str
    sku: str
    sku_key: str
    inventory_item_id: str
    requires_shipping: bool | None
    current_weight_g: int | None


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
        body = json.dumps({"query": query, "variables": variables or {}}).encode("utf-8")
        for attempt in range(6):
            request = urllib.request.Request(
                self.endpoint,
                data=body,
                method="POST",
                headers={"Content-Type": "application/json", "X-Shopify-Access-Token": self.token},
            )
            try:
                with urllib.request.urlopen(request, timeout=120) as response:
                    payload = json.loads(response.read().decode("utf-8"))
            except urllib.error.HTTPError as error:
                error_body = error.read().decode("utf-8", errors="ignore")
                if error.code in {429, 500, 502, 503, 504} and attempt < 5:
                    time.sleep(min(30, 2**attempt))
                    continue
                raise RuntimeError(f"Shopify HTTP {error.code}: {error_body[:1200]}") from error

            errors = payload.get("errors")
            if errors:
                error_text = json.dumps(errors, ensure_ascii=False)
                retryable = any(
                    str(error.get("extensions", {}).get("code", "")).upper() == "THROTTLED"
                    or "throttl" in str(error).lower()
                    or "timeout" in str(error).lower()
                    for error in errors
                    if isinstance(error, dict)
                )
                if retryable and attempt < 5:
                    time.sleep(min(30, 2**attempt))
                    continue
                raise RuntimeError(f"Shopify GraphQL errors: {error_text}")
            return payload["data"]
        raise RuntimeError("Shopify GraphQL retry limit exceeded")

    def access_scopes(self) -> set[str]:
        data = self.graphql(
            """
            query AppScopes {
              currentAppInstallation {
                accessScopes {
                  handle
                }
              }
            }
            """
        )
        return {scope["handle"] for scope in data["currentAppInstallation"]["accessScopes"]}

    def active_variants(self) -> list[ShopifyVariant]:
        query = """
        query ActiveVariantsForShipping($cursor: String) {
          products(first: 250, after: $cursor, query: "status:active", sortKey: TITLE) {
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
              variants(first: 250) {
                nodes {
                  id
                  title
                  sku
                  inventoryItem {
                    id
                    requiresShipping
                    measurement {
                      weight {
                        value
                        unit
                      }
                    }
                  }
                }
              }
            }
          }
        }
        """
        variants: list[ShopifyVariant] = []
        cursor = None
        while True:
            data = self.graphql(query, {"cursor": cursor})
            page = data["products"]
            for product in page["nodes"]:
                for variant in product.get("variants", {}).get("nodes", []):
                    inventory_item = variant.get("inventoryItem") or {}
                    sku = clean(variant.get("sku"))
                    variants.append(
                        ShopifyVariant(
                            product_id=product["id"],
                            product_handle=clean(product.get("handle")),
                            product_title=clean(product.get("title")),
                            product_status=clean(product.get("status")),
                            vendor=clean(product.get("vendor")),
                            variant_id=variant["id"],
                            variant_title=clean(variant.get("title")),
                            sku=sku,
                            sku_key=sku_key(sku),
                            inventory_item_id=inventory_item.get("id") or "",
                            requires_shipping=inventory_item.get("requiresShipping"),
                            current_weight_g=grams_from_weight((inventory_item.get("measurement") or {}).get("weight")),
                        )
                    )
            if not page["pageInfo"]["hasNextPage"]:
                break
            cursor = page["pageInfo"]["endCursor"]
        return variants

    def locations(self) -> list[dict[str, Any]]:
        data = self.graphql(
            """
            query LocationsForDeliveryProfile {
              locations(first: 50) {
                nodes {
                  id
                  name
                  isActive
                  fulfillsOnlineOrders
                }
              }
            }
            """
        )
        return data["locations"]["nodes"]

    def delivery_profiles(self, include_profile_items: bool = False) -> list[dict[str, Any]]:
        query = """
        query DeliveryProfileSnapshot($cursor: String) {
          deliveryProfiles(first: 5, after: $cursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              name
              default
              legacyMode
              productVariantsCount {
                count
              }
              profileLocationGroups {
                locationGroup {
                  id
                  locations(first: 5) {
                    nodes {
                      id
                      name
                    }
                  }
                }
                locationGroupZones(first: 30) {
                  nodes {
                    zone {
                      id
                      name
                      countries {
                        code {
                          countryCode
                        }
                      }
                    }
                    methodDefinitions(first: 50) {
                      nodes {
                        id
                        name
                        active
                        description
                        rateProvider {
                          __typename
                          ... on DeliveryRateDefinition {
                            id
                            price {
                              amount
                              currencyCode
                            }
                          }
                        }
                        methodConditions {
                          id
                          field
                          operator
                          conditionCriteria {
                            __typename
                            ... on Weight {
                              value
                              unit
                            }
                            ... on MoneyV2 {
                              amount
                              currencyCode
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        """
        profiles: list[dict[str, Any]] = []
        cursor = None
        while True:
            data = self.graphql(query, {"cursor": cursor})
            page = data["deliveryProfiles"]
            profiles.extend(page["nodes"])
            if not page["pageInfo"]["hasNextPage"]:
                break
            cursor = page["pageInfo"]["endCursor"]
        if include_profile_items:
            for profile in profiles:
                if clean(profile.get("name")) in TARGET_PROFILE_NAMES:
                    profile["profileItemVariantIds"] = self.delivery_profile_variant_ids(profile["id"])
        return profiles

    def delivery_profile_variant_ids(self, profile_id: str) -> list[str]:
        query = """
        query DeliveryProfileItems($id: ID!, $cursor: String) {
          node(id: $id) {
            ... on DeliveryProfile {
              profileItems(first: 250, after: $cursor) {
                pageInfo {
                  hasNextPage
                  endCursor
                }
                nodes {
                  variants(first: 250) {
                    nodes {
                      id
                    }
                  }
                }
              }
            }
          }
        }
        """
        variant_ids: list[str] = []
        cursor = None
        while True:
            data = self.graphql(query, {"id": profile_id, "cursor": cursor})
            page = data["node"]["profileItems"]
            for item in page["nodes"]:
                variant_ids.extend(variant["id"] for variant in item.get("variants", {}).get("nodes", []))
            if not page["pageInfo"]["hasNextPage"]:
                break
            cursor = page["pageInfo"]["endCursor"]
        return sorted(set(variant_ids))

    def variants_bulk_update(self, product_id: str, variants: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not variants:
            return []
        data = self.graphql(
            """
            mutation ProductVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
              productVariantsBulkUpdate(productId: $productId, variants: $variants, allowPartialUpdates: true) {
                product {
                  id
                }
                productVariants {
                  id
                  sku
                  inventoryItem {
                    id
                    requiresShipping
                    measurement {
                      weight {
                        value
                        unit
                      }
                    }
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

    def delivery_profile_create(self, profile: dict[str, Any]) -> dict[str, Any]:
        data = self.graphql(
            """
            mutation DeliveryProfileCreate($profile: DeliveryProfileInput!) {
              deliveryProfileCreate(profile: $profile) {
                profile {
                  id
                  name
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """,
            {"profile": profile},
        )
        return data["deliveryProfileCreate"]

    def delivery_profile_update(self, profile_id: str, profile: dict[str, Any]) -> dict[str, Any]:
        data = self.graphql(
            """
            mutation DeliveryProfileUpdate($id: ID!, $profile: DeliveryProfileInput!) {
              deliveryProfileUpdate(id: $id, profile: $profile) {
                profile {
                  id
                  name
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """,
            {"id": profile_id, "profile": profile},
        )
        return data["deliveryProfileUpdate"]


def load_shipping_template(path: Path) -> tuple[list[RateRow], dict[str, WeightTarget]]:
    workbook = load_workbook(path, read_only=True, data_only=True)
    required_sheets = {"Shopify运费配置", "Shopify商品重量导入"}
    missing = required_sheets - set(workbook.sheetnames)
    if missing:
        raise RuntimeError(f"Shipping template missing sheets: {sorted(missing)}")

    rate_rows: list[RateRow] = []
    for row in row_dicts(workbook["Shopify运费配置"]):
        if clean(row.get("Active")).lower() != "active":
            continue
        country_code = clean(row.get("Country Code")).upper()
        if country_code not in TARGET_COUNTRY_CODES:
            continue
        source_profile = clean(row.get("Shipping Profile"))
        target_profile = TARGET_PROFILE_BY_SOURCE.get(source_profile)
        if not target_profile:
            raise RuntimeError(f"Unsupported shipping profile in template: {source_profile}")
        min_weight = dec(row.get("Min Weight kg"))
        max_weight = dec(row.get("Max Weight kg"))
        price = dec(row.get("Price USD"))
        if min_weight is None or max_weight is None or price is None:
            raise RuntimeError(f"Invalid rate row for {country_code} / {source_profile}: {row}")
        rate_rows.append(
            RateRow(
                source_profile=source_profile,
                target_profile=target_profile,
                country=clean(row.get("Zone Country")),
                country_code=country_code,
                service_type=clean(row.get("Service Type")),
                rate_name=clean(row.get("Rate Name")),
                transit_time=clean(row.get("Transit Time")),
                min_weight_kg=min_weight,
                max_weight_kg=max_weight,
                price_usd=price,
                freight_cost_rmb=dec(row.get("Freight Cost RMB")),
            )
        )

    target_by_sku: dict[str, WeightTarget] = {}
    duplicate_conflicts: list[str] = []
    for row in row_dicts(workbook["Shopify商品重量导入"]):
        sku = clean(row.get("Variant SKU"))
        key = sku_key(sku)
        if not key:
            continue
        source_profile = clean(row.get("Shipping Profile Suggestion"))
        target_profile = TARGET_PROFILE_BY_SOURCE.get(source_profile, "")
        weight_status = clean(row.get("Weight Import Status"))
        target_weight = row.get("Variant Weight")
        target_weight_g: int | None
        try:
            target_weight_g = int(Decimal(str(target_weight)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
        except (InvalidOperation, TypeError, ValueError):
            target_weight_g = None
        if weight_status != "Yes":
            target_profile = MANUAL_REVIEW_PROFILE if weight_status == "Review" else ""
        if weight_status == "Yes" and (target_weight_g is None or target_weight_g <= 0):
            weight_status = "Review"
            target_profile = MANUAL_REVIEW_PROFILE
        target = WeightTarget(
            sku=sku,
            sku_key=key,
            handle=clean(row.get("Handle")),
            title=clean(row.get("Title")),
            vendor=clean(row.get("Vendor")),
            target_weight_g=target_weight_g,
            source_profile=source_profile,
            target_profile=target_profile,
            weight_import_status=weight_status,
            dimension_verification=clean(row.get("Dimension Verification")),
            shipping_status=clean(row.get("Shipping Status")),
            listing_status=clean(row.get("Listing Status")),
            notes=clean(row.get("Notes")),
        )
        if key in target_by_sku:
            if target_by_sku[key] != target:
                duplicate_conflicts.append(key)
            continue
        target_by_sku[key] = target
    if duplicate_conflicts:
        raise RuntimeError(f"Conflicting duplicate SKU rows in shipping template: {sorted(set(duplicate_conflicts))[:20]}")
    return rate_rows, target_by_sku


def rate_csv_rows(rate_rows: list[RateRow]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for row in rate_rows:
        rows.append(
            {
                "target_profile": row.target_profile,
                "source_profile": row.source_profile,
                "zone_country": row.country,
                "country_code": row.country_code,
                "service_type": row.service_type,
                "rate_name": row.rate_name,
                "transit_time": row.transit_time,
                "min_weight_kg": decimal_str(row.min_weight_kg),
                "max_weight_kg": decimal_str(row.max_weight_kg),
                "price_usd": money_str(row.price_usd),
                "freight_cost_rmb": decimal_str(row.freight_cost_rmb),
                "active": "Active",
            }
        )
    return rows


def build_shipping_report(
    variants: list[ShopifyVariant],
    targets: dict[str, WeightTarget],
) -> tuple[list[dict[str, str]], list[dict[str, str]], list[dict[str, str]], list[dict[str, str]]]:
    weight_updates: list[dict[str, str]] = []
    assignments: list[dict[str, str]] = []
    heavy_review: list[dict[str, str]] = []
    unmatched: list[dict[str, str]] = []

    for variant in variants:
        if not variant.sku_key:
            unmatched.append(unmatched_row(variant, "missing_variant_sku"))
            continue
        target = targets.get(variant.sku_key)
        if not target:
            unmatched.append(unmatched_row(variant, "unmatched_shipping_template"))
            continue

        target_weight_g = target.target_weight_g
        if target.weight_import_status == "No":
            unmatched.append(unmatched_row(variant, "template_weight_import_no", target))
            continue
        if target_weight_g is None or target_weight_g <= 0:
            unmatched.append(unmatched_row(variant, "invalid_template_weight", target))
            continue

        manual_review = target.weight_import_status != "Yes" or target.target_profile == MANUAL_REVIEW_PROFILE or target_weight_g > 10000
        target_profile = MANUAL_REVIEW_PROFILE if manual_review else target.target_profile
        if not target_profile:
            unmatched.append(unmatched_row(variant, "missing_target_profile", target))
            continue

        weight_action = "noop" if variant.current_weight_g == target_weight_g and variant.requires_shipping is True else "update"
        reason = "manual_review_no_checkout" if manual_review else "eligible_weight_and_profile_update"
        update_row = {
            "action": weight_action,
            "reason": reason,
            "product_id": variant.product_id,
            "variant_id": variant.variant_id,
            "inventory_item_id": variant.inventory_item_id,
            "handle": variant.product_handle,
            "product_title": variant.product_title,
            "vendor": variant.vendor,
            "variant_title": variant.variant_title,
            "sku": variant.sku,
            "current_weight_g": "" if variant.current_weight_g is None else str(variant.current_weight_g),
            "target_weight_g": str(target_weight_g),
            "current_requires_shipping": "" if variant.requires_shipping is None else str(variant.requires_shipping),
            "target_requires_shipping": "True",
            "source_profile": target.source_profile,
            "target_profile": target_profile,
            "weight_import_status": target.weight_import_status,
            "dimension_verification": target.dimension_verification,
            "shipping_status": target.shipping_status,
            "template_handle": target.handle,
            "template_title": target.title,
        }
        weight_updates.append(update_row)
        assignments.append(
            {
                "action": "assign",
                "reason": reason,
                "product_id": variant.product_id,
                "variant_id": variant.variant_id,
                "handle": variant.product_handle,
                "product_title": variant.product_title,
                "vendor": variant.vendor,
                "sku": variant.sku,
                "target_profile": target_profile,
                "target_weight_g": str(target_weight_g),
                "shipping_status": target.shipping_status,
            }
        )
        if manual_review:
            heavy_review.append(update_row)

    return weight_updates, assignments, heavy_review, unmatched


def unmatched_row(variant: ShopifyVariant, reason: str, target: WeightTarget | None = None) -> dict[str, str]:
    return {
        "skip_reason": reason,
        "product_id": variant.product_id,
        "variant_id": variant.variant_id,
        "inventory_item_id": variant.inventory_item_id,
        "handle": variant.product_handle,
        "product_title": variant.product_title,
        "vendor": variant.vendor,
        "variant_title": variant.variant_title,
        "sku": variant.sku,
        "current_weight_g": "" if variant.current_weight_g is None else str(variant.current_weight_g),
        "current_requires_shipping": "" if variant.requires_shipping is None else str(variant.requires_shipping),
        "template_weight_status": target.weight_import_status if target else "",
        "template_profile": target.target_profile if target else "",
        "shipping_status": target.shipping_status if target else "",
    }


def write_csv(path: Path, rows: list[dict[str, str]], fieldnames: list[str] | None = None) -> None:
    if fieldnames is None:
        keys: list[str] = []
        seen = set()
        for row in rows:
            for key in row:
                if key not in seen:
                    keys.append(key)
                    seen.add(key)
        fieldnames = keys
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def delivery_access_snapshot(admin: ShopifyAdmin) -> tuple[list[dict[str, str]], dict[str, Any]]:
    rows: list[dict[str, str]] = []
    snapshot: dict[str, Any] = {"profiles_accessible": False, "locations_accessible": False, "errors": []}

    try:
        locations = admin.locations()
        snapshot["locations_accessible"] = True
        snapshot["location_count"] = len(locations)
        snapshot["locations"] = [
            {
                "id": location.get("id"),
                "name": location.get("name"),
                "isActive": location.get("isActive"),
                "fulfillsOnlineOrders": location.get("fulfillsOnlineOrders"),
            }
            for location in locations
        ]
        rows.append({"area": "locations", "status": "read_ok", "name": "", "id": "", "detail": str(len(locations))})
    except Exception as error:
        snapshot["errors"].append({"area": "locations", "error": str(error)})
        rows.append({"area": "locations", "status": "read_error", "name": "", "id": "", "detail": str(error)})

    try:
        profiles = admin.delivery_profiles(include_profile_items=False)
        snapshot["profiles_accessible"] = True
        snapshot["profile_count"] = len(profiles)
        target_profiles = []
        for profile in profiles:
            name = clean(profile.get("name"))
            method_count = 0
            zone_count = 0
            for location_group in profile.get("profileLocationGroups") or []:
                zones = ((location_group.get("locationGroupZones") or {}).get("nodes") or [])
                zone_count += len(zones)
                for zone in zones:
                    method_count += len(((zone.get("methodDefinitions") or {}).get("nodes") or []))
            if name in TARGET_PROFILE_NAMES:
                target_profiles.append(
                    {
                        "id": profile.get("id"),
                        "name": name,
                        "zone_count": zone_count,
                        "method_count": method_count,
                    }
                )
            rows.append(
                {
                    "area": "delivery_profile",
                    "status": "read_ok",
                    "name": name,
                    "id": profile.get("id") or "",
                    "detail": f"zones={zone_count}; methods={method_count}; variants={((profile.get('productVariantsCount') or {}).get('count'))}",
                }
            )
        snapshot["target_profiles"] = target_profiles
    except Exception as error:
        snapshot["errors"].append({"area": "deliveryProfiles", "error": str(error)})
        rows.append({"area": "deliveryProfiles", "status": "read_error", "name": "", "id": "", "detail": str(error)})

    return rows, snapshot


def build_summary(
    workbook_path: Path,
    out_dir: Path,
    admin: ShopifyAdmin,
    scopes: set[str],
    rate_rows: list[RateRow],
    variants: list[ShopifyVariant],
    targets: dict[str, WeightTarget],
    weight_updates: list[dict[str, str]],
    assignments: list[dict[str, str]],
    heavy_review: list[dict[str, str]],
    unmatched: list[dict[str, str]],
    delivery_snapshot: dict[str, Any],
    applied: bool,
) -> dict[str, Any]:
    rate_profile_counts = Counter(row.target_profile for row in rate_rows)
    rate_country_counts = Counter(row.country_code for row in rate_rows)
    target_weight_counts = Counter(target.weight_import_status for target in targets.values())
    assignment_profile_counts = Counter(row["target_profile"] for row in assignments)
    unmatched_reason_counts = Counter(row["skip_reason"] for row in unmatched)
    weight_action_counts = Counter(row["action"] for row in weight_updates)
    missing_scopes = sorted(REQUIRED_SCOPES - scopes)
    workbook_sha = sha256_file(workbook_path)
    approval_payload = {
        "workbook": str(workbook_path),
        "workbook_sha256": workbook_sha,
        "rate_plan": [row.__dict__ | {"min_weight_kg": str(row.min_weight_kg), "max_weight_kg": str(row.max_weight_kg), "price_usd": str(row.price_usd), "freight_cost_rmb": str(row.freight_cost_rmb) if row.freight_cost_rmb is not None else None} for row in rate_rows],
        "weight_updates": sorted(
            [
                {
                    "variant_id": row["variant_id"],
                    "inventory_item_id": row["inventory_item_id"],
                    "sku": row["sku"],
                    "target_weight_g": row["target_weight_g"],
                    "target_profile": row["target_profile"],
                    "reason": row["reason"],
                }
                for row in weight_updates
            ],
            key=lambda item: (item["variant_id"], item["target_profile"]),
        ),
        "active_variant_ids": sorted(row.variant_id for row in variants),
    }
    approval_signature = canonical_hash(approval_payload)
    ready_for_apply = not missing_scopes and delivery_snapshot.get("profiles_accessible") and delivery_snapshot.get("locations_accessible")
    return {
        "applied": applied,
        "ready_for_apply": bool(ready_for_apply),
        "approval_signature": approval_signature,
        "shopify_store_domain": admin.domain,
        "shopify_api_version": admin.version,
        "workbook": str(workbook_path),
        "workbook_sha256": workbook_sha,
        "template_rate_row_count": len(rate_rows),
        "template_rate_profile_counts": dict(sorted(rate_profile_counts.items())),
        "template_rate_country_count": len(rate_country_counts),
        "template_rate_country_counts": dict(sorted(rate_country_counts.items())),
        "template_weight_sku_count": len(targets),
        "template_weight_status_counts": dict(sorted(target_weight_counts.items())),
        "shopify_active_variant_count": len(variants),
        "matched_active_variant_count": len(weight_updates),
        "normal_checkout_variant_count": sum(1 for row in assignments if row["target_profile"] != MANUAL_REVIEW_PROFILE),
        "manual_review_no_checkout_variant_count": len(heavy_review),
        "unmatched_active_variant_count": len(unmatched),
        "weight_action_counts": dict(sorted(weight_action_counts.items())),
        "assignment_profile_counts": dict(sorted(assignment_profile_counts.items())),
        "unmatched_reason_counts": dict(sorted(unmatched_reason_counts.items())),
        "access_scope_count": len(scopes),
        "access_scopes": sorted(scopes),
        "missing_required_scopes": missing_scopes,
        "delivery_access": delivery_snapshot,
        "reports": {
            "rate_plan": str(out_dir / RATE_PLAN_CSV),
            "weight_updates": str(out_dir / WEIGHT_UPDATES_CSV),
            "profile_assignments": str(out_dir / PROFILE_ASSIGNMENTS_CSV),
            "blocked_heavy": str(out_dir / HEAVY_REVIEW_CSV),
            "unmatched_active": str(out_dir / UNMATCHED_ACTIVE_CSV),
            "api_diff": str(out_dir / API_DIFF_CSV),
        },
    }


def condition_inputs(min_weight_kg: Decimal, max_weight_kg: Decimal) -> list[dict[str, Any]]:
    return [
        {
            "criteria": {"value": float(min_weight_kg), "unit": "KILOGRAMS"},
            "operator": "GREATER_THAN_OR_EQUAL_TO",
        },
        {
            "criteria": {"value": float(max_weight_kg), "unit": "KILOGRAMS"},
            "operator": "LESS_THAN_OR_EQUAL_TO",
        },
    ]


def method_definition_input(row: RateRow) -> dict[str, Any]:
    return {
        "name": row.rate_name,
        "description": f"{row.service_type}; {row.transit_time}".strip("; "),
        "active": True,
        "rateDefinition": {
            "price": {
                "amount": money_str(row.price_usd),
                "currencyCode": "USD",
            }
        },
        "weightConditionsToCreate": condition_inputs(row.min_weight_kg, row.max_weight_kg),
    }


def zones_to_create(rate_rows: list[RateRow]) -> list[dict[str, Any]]:
    by_country: dict[str, list[RateRow]] = defaultdict(list)
    for row in rate_rows:
        by_country[row.country_code].append(row)
    zones: list[dict[str, Any]] = []
    for country_code in sorted(by_country):
        country_rows = sorted(by_country[country_code], key=lambda item: (item.min_weight_kg, item.max_weight_kg, item.rate_name))
        country_name = country_rows[0].country or country_code
        zones.append(
            {
                "name": f"JIESTAR {country_code} {country_name}",
                "countries": [{"code": country_code, "includeAllProvinces": True}],
                "methodDefinitionsToCreate": [method_definition_input(row) for row in country_rows],
            }
        )
    return zones


def target_location_id(locations: list[dict[str, Any]]) -> str:
    active_online = [
        location
        for location in locations
        if location.get("isActive") is True and location.get("fulfillsOnlineOrders") is True
    ]
    active = [location for location in locations if location.get("isActive") is True]
    selected = (active_online or active or locations)
    if not selected:
        raise RuntimeError("No Shopify location available for delivery profile creation")
    return selected[0]["id"]


def profile_existing_ids(profile: dict[str, Any]) -> tuple[list[str], list[str], str | None]:
    zone_ids: list[str] = []
    method_ids: list[str] = []
    location_group_id: str | None = None
    for location_group in profile.get("profileLocationGroups") or []:
        location_group_id = location_group.get("locationGroup", {}).get("id") or location_group_id
        for zone in ((location_group.get("locationGroupZones") or {}).get("nodes") or []):
            zone_id = zone.get("zone", {}).get("id")
            if zone_id:
                zone_ids.append(zone_id)
            for method in ((zone.get("methodDefinitions") or {}).get("nodes") or []):
                if method.get("id"):
                    method_ids.append(method["id"])
    return zone_ids, method_ids, location_group_id


def create_or_update_profile(
    admin: ShopifyAdmin,
    existing_profile: dict[str, Any] | None,
    profile_name: str,
    variant_ids: list[str],
    rate_rows: list[RateRow],
    location_id: str,
) -> dict[str, Any]:
    first_variant_ids = variant_ids[:VARIANT_ASSOCIATE_BATCH_SIZE]
    remaining_variant_batches = list(chunks(variant_ids[VARIANT_ASSOCIATE_BATCH_SIZE:], VARIANT_ASSOCIATE_BATCH_SIZE))
    if existing_profile is None:
        location_group: dict[str, Any] = {"locations": [location_id]}
        if rate_rows:
            location_group["zonesToCreate"] = zones_to_create(rate_rows)
        profile_input: dict[str, Any] = {
            "name": profile_name,
            "variantsToAssociate": first_variant_ids,
            "locationGroupsToCreate": [location_group],
        }
        result = admin.delivery_profile_create(profile_input)
        associate_results = []
        created_profile_id = (result.get("profile") or {}).get("id")
        if created_profile_id and not result.get("userErrors"):
            for batch in remaining_variant_batches:
                associate_results.append(admin.delivery_profile_update(created_profile_id, {"variantsToAssociate": batch}))
        return {
            "operation": "create",
            "profile_name": profile_name,
            "variant_count": len(variant_ids),
            "associate_batch_count": 1 + len(remaining_variant_batches) if variant_ids else 0,
            "result": result,
            "associate_results": associate_results,
        }

    zone_ids, method_ids, location_group_id = profile_existing_ids(existing_profile)
    current_variant_ids = set(existing_profile.get("profileItemVariantIds") or [])
    target_variant_ids = set(variant_ids)
    stale_variant_ids = sorted(current_variant_ids - target_variant_ids)

    delete_input: dict[str, Any] = {"name": profile_name}
    if method_ids:
        delete_input["methodDefinitionsToDelete"] = method_ids
    if zone_ids:
        delete_input["zonesToDelete"] = zone_ids
    if stale_variant_ids:
        delete_input["variantsToDissociate"] = stale_variant_ids
    delete_result = admin.delivery_profile_update(existing_profile["id"], delete_input)
    if delete_result.get("userErrors"):
        return {"operation": "delete_existing", "profile_name": profile_name, "result": delete_result}

    update_input: dict[str, Any] = {"name": profile_name, "variantsToAssociate": first_variant_ids}
    if rate_rows:
        if location_group_id:
            update_input["locationGroupsToUpdate"] = [
                {
                    "id": location_group_id,
                    "zonesToCreate": zones_to_create(rate_rows),
                }
            ]
        else:
            update_input["locationGroupsToCreate"] = [
                {
                    "locations": [location_id],
                    "zonesToCreate": zones_to_create(rate_rows),
                }
            ]
    result = admin.delivery_profile_update(existing_profile["id"], update_input)
    associate_results = []
    if not result.get("userErrors"):
        for batch in remaining_variant_batches:
            associate_results.append(admin.delivery_profile_update(existing_profile["id"], {"variantsToAssociate": batch}))
    return {
        "operation": "update",
        "profile_name": profile_name,
        "variant_count": len(variant_ids),
        "associate_batch_count": 1 + len(remaining_variant_batches) if variant_ids else 0,
        "stale_variant_dissociate_count": len(stale_variant_ids),
        "deleted_zone_count": len(zone_ids),
        "deleted_method_count": len(method_ids),
        "delete_result": delete_result,
        "result": result,
        "associate_results": associate_results,
    }


def apply_shipping(
    admin: ShopifyAdmin,
    rate_rows: list[RateRow],
    weight_updates: list[dict[str, str]],
    assignments: list[dict[str, str]],
) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []

    grouped_weight_updates: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in weight_updates:
        if row["action"] != "update":
            continue
        grouped_weight_updates[row["product_id"]].append(
            {
                "id": row["variant_id"],
                "inventoryItem": {
                    "requiresShipping": True,
                    "measurement": {
                        "weight": {
                            "value": float(row["target_weight_g"]),
                            "unit": "GRAMS",
                        }
                    },
                },
            }
        )

    for product_id, updates in grouped_weight_updates.items():
        for batch in chunks(updates, 100):
            errors = admin.variants_bulk_update(product_id, batch)
            results.append(
                {
                    "type": "variant_weight_update",
                    "product_id": product_id,
                    "variant_count": len(batch),
                    "ok": not errors,
                    "errors": errors,
                }
            )

    locations = admin.locations()
    profiles = admin.delivery_profiles(include_profile_items=True)
    existing_by_name = {clean(profile.get("name")): profile for profile in profiles if clean(profile.get("name")) in TARGET_PROFILE_NAMES}
    location_id = target_location_id(locations)

    rates_by_profile: dict[str, list[RateRow]] = defaultdict(list)
    for row in rate_rows:
        rates_by_profile[row.target_profile].append(row)
    variants_by_profile: dict[str, list[str]] = defaultdict(list)
    for row in assignments:
        variants_by_profile[row["target_profile"]].append(row["variant_id"])

    for profile_name in TARGET_PROFILE_NAMES:
        profile_result = create_or_update_profile(
            admin=admin,
            existing_profile=existing_by_name.get(profile_name),
            profile_name=profile_name,
            variant_ids=sorted(set(variants_by_profile.get(profile_name, []))),
            rate_rows=sorted(rates_by_profile.get(profile_name, []), key=lambda item: (item.country_code, item.min_weight_kg, item.rate_name)),
            location_id=location_id,
        )
        profile_errors = []
        for key in ("delete_result", "result"):
            value = profile_result.get(key)
            if isinstance(value, dict):
                profile_errors.extend(value.get("userErrors") or [])
        results.append({"type": "delivery_profile", "ok": not profile_errors, "errors": profile_errors, **profile_result})

    return results


def read_approved_summary(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise RuntimeError(f"Approved summary does not exist: {path}")
    with path.open(encoding="utf-8") as file:
        summary = json.load(file)
    required = {"approval_signature", "ready_for_apply", "workbook_sha256"}
    missing = required - set(summary)
    if missing:
        raise RuntimeError(f"Approved summary missing required fields: {sorted(missing)}")
    return summary


def main() -> int:
    parser = argparse.ArgumentParser(description="Update Shopify shipping weights, profiles, and weight-based rates from the JIESTAR shipping workbook.")
    parser.add_argument("--template-workbook", type=Path, default=TEMPLATE_WORKBOOK)
    parser.add_argument("--out-dir", type=Path, default=OUT_DIR)
    parser.add_argument("--apply", action="store_true", help="Apply reviewed shipping updates to Shopify.")
    parser.add_argument("--yes", action="store_true", help="Required with --apply.")
    parser.add_argument("--input-approved-report", type=Path, help="Required with --apply. Use shipping-update-summary.json from reviewed dry-run.")
    args = parser.parse_args()

    if args.apply and (not args.yes or not args.input_approved_report):
        raise RuntimeError("--apply requires --yes and --input-approved-report")

    args.out_dir.mkdir(parents=True, exist_ok=True)
    rate_rows, targets = load_shipping_template(args.template_workbook)
    admin = ShopifyAdmin()
    scopes = admin.access_scopes()
    variants = admin.active_variants()
    weight_updates, assignments, heavy_review, unmatched = build_shipping_report(variants, targets)
    api_diff_rows, delivery_snapshot = delivery_access_snapshot(admin)
    summary = build_summary(
        workbook_path=args.template_workbook,
        out_dir=args.out_dir,
        admin=admin,
        scopes=scopes,
        rate_rows=rate_rows,
        variants=variants,
        targets=targets,
        weight_updates=weight_updates,
        assignments=assignments,
        heavy_review=heavy_review,
        unmatched=unmatched,
        delivery_snapshot=delivery_snapshot,
        applied=args.apply,
    )

    # The approved summary path intentionally contains the signature. CSV files are
    # review aids; the JSON signature is the apply guard.
    if args.apply:
        approved = read_approved_summary(args.input_approved_report)
        if not summary.get("ready_for_apply"):
            raise RuntimeError("Current Shopify access is not ready_for_apply; fix Shopify app scopes and rerun dry-run.")
        if not approved.get("ready_for_apply"):
            raise RuntimeError("Approved dry-run summary was not ready_for_apply; fix Shopify app permissions first.")
        if approved.get("approval_signature") != summary["approval_signature"]:
            raise RuntimeError("Current shipping dry-run signature differs from the approved report; rerun dry-run and review again.")
        apply_results = apply_shipping(admin, rate_rows, weight_updates, assignments)
        (args.out_dir / APPLY_RESULT_JSON).write_text(json.dumps(apply_results, ensure_ascii=False, indent=2), encoding="utf-8")
        summary["apply_result_path"] = str(args.out_dir / APPLY_RESULT_JSON)
        summary["apply_ok_count"] = sum(1 for row in apply_results if row.get("ok"))
        summary["apply_error_count"] = sum(1 for row in apply_results if not row.get("ok"))
        summary["applied_weight_update_count"] = sum(row.get("variant_count", 0) for row in apply_results if row.get("type") == "variant_weight_update")

    write_csv(args.out_dir / RATE_PLAN_CSV, rate_csv_rows(rate_rows))
    write_csv(args.out_dir / WEIGHT_UPDATES_CSV, weight_updates)
    write_csv(args.out_dir / PROFILE_ASSIGNMENTS_CSV, assignments)
    write_csv(args.out_dir / HEAVY_REVIEW_CSV, heavy_review)
    write_csv(args.out_dir / UNMATCHED_ACTIVE_CSV, unmatched)
    write_csv(args.out_dir / API_DIFF_CSV, api_diff_rows, ["area", "status", "name", "id", "detail"])
    (args.out_dir / SUMMARY_JSON).write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(1)
