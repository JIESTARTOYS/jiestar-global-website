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


OUT_DIR = Path("/private/tmp/jiestar-shopify-collection-audit")
API_VERSION_FALLBACK = "2026-01"
BATCH_SIZE = 25

# Keep this aligned with lib/shopify.ts PRODUCT_TYPE_COLLECTION_HANDLES.
PRODUCT_TYPE_COLLECTION_HANDLES = [
    "pirates",
    "fairground",
    "technic",
    "movie-game",
    "modular-buildings",
    "other",
    "gun",
    "trains",
    "military",
    "space",
    "character-figure",
    "warship",
    "frozen",
    "animal",
    "chemical",
    "christmas",
    "scene",
    "tank",
    "castle",
    "city",
    "girl",
    "furniture",
    "home-appliance",
    "engineering",
    "dinosaur",
    "ornament",
    "storage-box",
    "constellation",
    "mecha",
    "weapon",
    "ocean-underwater",
    "fire-rescue",
    "hot-air-balloon",
    "ranch",
    "swat",
    "arcade-game",
    "boy",
    "legendary-dragon",
    "ship-model",
    "flower",
    "street-view",
    "police",
    "car-model",
    "aircraft",
    "brick-alliance",
    "fairy-tale",
]
PRODUCT_TYPE_SET = set(PRODUCT_TYPE_COLLECTION_HANDLES)


@dataclass
class Collection:
    id: str
    handle: str
    title: str
    website_collection_type: str
    rule_set: str


@dataclass
class Product:
    id: str
    handle: str
    title: str
    status: str
    product_type: str
    skus: list[str]
    collections: list[Collection]


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return

    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


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
            with urlopen_with_retries(request, timeout=90) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            body = error.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"Shopify HTTP {error.code}: {body[:1200]}") from error

        if payload.get("errors"):
            raise RuntimeError(f"Shopify GraphQL errors: {json.dumps(payload['errors'], ensure_ascii=False)}")

        return payload["data"]

    def collections(self) -> list[Collection]:
        collections: list[Collection] = []
        cursor = None

        while True:
            data = self.graphql(
                """
                query ProductCollections($cursor: String) {
                  collections(first: 250, after: $cursor, sortKey: TITLE) {
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                    nodes {
                      id
                      handle
                      title
                      websiteCollectionType: metafield(namespace: "custom", key: "website_collection_type") {
                        value
                      }
                      ruleSet {
                        appliedDisjunctively
                        rules {
                          column
                          relation
                          condition
                        }
                      }
                    }
                  }
                }
                """,
                {"cursor": cursor},
            )
            page = data["collections"]
            for node in page["nodes"]:
                collections.append(
                    Collection(
                        id=node["id"],
                        handle=node["handle"],
                        title=node["title"],
                        website_collection_type=(node.get("websiteCollectionType") or {}).get("value") or "",
                        rule_set=json.dumps(node.get("ruleSet") or {}, ensure_ascii=False, sort_keys=True),
                    )
                )

            if not page["pageInfo"]["hasNextPage"]:
                break
            cursor = page["pageInfo"]["endCursor"]

        return collections

    def products(self) -> list[Product]:
        products: list[Product] = []
        cursor = None

        while True:
            data = self.graphql(
                """
                query ProductsForCollectionAudit($cursor: String) {
                  products(first: 250, after: $cursor, sortKey: TITLE) {
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                    nodes {
                      id
                      handle
                      title
                      status
                      productType
                      variants(first: 100) {
                        nodes {
                          sku
                        }
                      }
                      collections(first: 100) {
                        nodes {
                          id
                          handle
                          title
                          websiteCollectionType: metafield(namespace: "custom", key: "website_collection_type") {
                            value
                          }
                          ruleSet {
                            appliedDisjunctively
                            rules {
                              column
                              relation
                              condition
                            }
                          }
                        }
                      }
                    }
                  }
                }
                """,
                {"cursor": cursor},
            )
            page = data["products"]
            for node in page["nodes"]:
                products.append(
                    Product(
                        id=node["id"],
                        handle=node["handle"],
                        title=node["title"],
                        status=node["status"],
                        product_type=node.get("productType") or "",
                        skus=[variant.get("sku") or "" for variant in node["variants"]["nodes"] if variant.get("sku")],
                        collections=[
                            Collection(
                                id=collection["id"],
                                handle=collection["handle"],
                                title=collection["title"],
                                website_collection_type=(collection.get("websiteCollectionType") or {}).get("value") or "",
                                rule_set=json.dumps(collection.get("ruleSet") or {}, ensure_ascii=False, sort_keys=True),
                            )
                            for collection in node["collections"]["nodes"]
                        ],
                    )
                )

            if not page["pageInfo"]["hasNextPage"]:
                break
            cursor = page["pageInfo"]["endCursor"]

        return products

    def collection_add_products(self, collection_id: str, product_ids: list[str]) -> None:
        data = self.graphql(
            """
            mutation CollectionAddProducts($id: ID!, $productIds: [ID!]!) {
              collectionAddProducts(id: $id, productIds: $productIds) {
                collection {
                  id
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """,
            {"id": collection_id, "productIds": product_ids},
        )
        assert_no_user_errors("collectionAddProducts", data["collectionAddProducts"]["userErrors"])

    def collection_remove_products(self, collection_id: str, product_ids: list[str]) -> None:
        data = self.graphql(
            """
            mutation CollectionRemoveProducts($id: ID!, $productIds: [ID!]!) {
              collectionRemoveProducts(id: $id, productIds: $productIds) {
                job {
                  id
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """,
            {"id": collection_id, "productIds": product_ids},
        )
        assert_no_user_errors("collectionRemoveProducts", data["collectionRemoveProducts"]["userErrors"])

    def update_product_type(self, product_id: str, product_type: str) -> None:
        data = self.graphql(
            """
            mutation ProductTypeUpdate($product: ProductUpdateInput!) {
              productUpdate(product: $product) {
                product {
                  id
                  productType
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """,
            {"product": {"id": product_id, "productType": product_type}},
        )
        assert_no_user_errors("productUpdate", data["productUpdate"]["userErrors"])


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


def assert_no_user_errors(operation: str, errors: list[dict[str, Any]]) -> None:
    if errors:
        raise RuntimeError(f"{operation} userErrors: {json.dumps(errors, ensure_ascii=False)}")


def has_any(text: str, keywords: list[str]) -> bool:
    for keyword in keywords:
        if " " in keyword or "-" in keyword:
            if keyword in text:
                return True
            continue

        if re.search(rf"\b{re.escape(keyword)}\b", text):
            return True

    return False


def expected_collection_handle(product: Product) -> tuple[str, str]:
    title_text = " ".join([product.title, product.handle, " ".join(product.skus)]).lower()
    type_text = (product.product_type or "").lower()

    # Specific categories first. Keep ships split so boat/ship products do not disappear into generic vehicles.
    if has_any(title_text, ["submarine", "undersea", "underwater", "diving", "ocean base", "fish tank", "deep sea", "marine life", "ocean slalom"]):
        return "ocean-underwater", "underwater keywords"
    if has_any(title_text, ["pirate ship", "ghost ship", "flying dutchman", "royal victory ship"]):
        return "pirates", "pirate ship keywords"
    if has_any(title_text, ["warship", "battleship", "naval", "aircraft carrier", "patrol boat", "destroyer"]):
        return "warship", "warship keywords"
    if has_any(title_text, ["tank 300"]):
        return "car-model", "tank 300 vehicle keyword"
    if has_any(title_text, ["rifle", "shotgun", "firearms", "desert eagle", "revolver", "anti-aircraft gun", "gun"]):
        return "gun", "gun keywords"
    if has_any(title_text, ["sword", "weapon"]):
        return "weapon", "weapon keywords"
    if has_any(title_text, ["military", "armored", "missile", "artillery", "swat", "tactical", "air defense", "infantry fighting"]):
        return "military", "military keywords"
    if has_any(title_text, ["steam train", "locomotive", "train", "railway", "tram"]):
        return "trains", "train keywords"
    if has_any(title_text, ["fighter jet", "aircraft", "airplane", "plane", "helicopter", "drone", "bomber", "shuttle"]):
        return "aircraft", "aircraft keywords"
    if has_any(title_text, ["fire rescue", "fire station", "fire truck", "fire boat", "fire", "rescue"]):
        return "fire-rescue", "fire/rescue keywords"
    if has_any(title_text, ["sailboat", "sailing ship", "houseboat", "ship", "boat", "ocean liner", "liner", "yacht", "vessel"]):
        return "ship-model", "ship/boat keywords"
    if has_any(title_text, ["excavator", "loader", "bulldozer", "forklift", "crane", "cement mixer", "engineering", "construction", "tractor"]):
        return "engineering", "engineering keywords"
    if has_any(title_text, ["tank"]):
        return "tank", "tank keywords"
    if has_any(title_text, ["police"]):
        return "police", "police keywords"

    if has_any(title_text, ["supercar", "sports car", "race car", "racing", "racer", "suv", "coupe", "hypercar", "hypersport", "motorcycle", "truck", "vehicle", "car"]):
        return "car-model", "car/vehicle keywords"
    if has_any(title_text, ["mecha", "robot"]):
        return "mecha", "mecha/robot keywords"
    if has_any(title_text, ["dinosaur", "triceratops", "raptor"]):
        return "dinosaur", "dinosaur keywords"
    if has_any(title_text, ["dragon"]):
        return "legendary-dragon", "dragon keywords"
    if has_any(title_text, ["tiger", "crow", "giraffe", "butterfly", "dragonfly", "animal", "pet friends", "pet"]):
        return "animal", "animal keywords"

    if has_any(title_text, ["flower", "bouquet", "cherry blossom", "plant", "succulent", "chrysanthemum"]):
        return "flower", "flower/plant keywords"
    if has_any(title_text, ["castle"]):
        return "castle", "castle keywords"
    if has_any(title_text, ["space", "mars", "launch"]):
        return "space", "space keywords"
    if has_any(title_text, ["hot air balloon", "balloon"]):
        return "hot-air-balloon", "hot air balloon keywords"
    if has_any(title_text, ["street", "townhouse", "corner hotel", "bank", "bakery", "cafe", "book shop", "book store", "store", "restaurant", "mall", "station", "hospital", "library", "cottage", "house", "cabin", "shopping center", "pub", "university", "classroom", "mine", "venice", "memorial hall"]):
        return "street-view", "street/building keywords"
    if has_any(title_text, ["carousel", "ferris", "roller coaster", "amusement", "theme park", "fun park", "pendulum ride"]):
        return "fairground", "fairground keywords"
    if has_any(title_text, ["air fryer", "washing machine", "typewriter", "phone"]):
        return "home-appliance", "home appliance keywords"
    if has_any(title_text, ["storage box"]):
        return "storage-box", "storage keywords"
    if has_any(title_text, ["study table"]):
        return "furniture", "furniture keywords"
    if has_any(title_text, ["activity table", "piano", "xylophone", "baby walker", "hammer ball", "play house", "drum"]):
        return "brick-alliance", "educational/toy keywords"
    if has_any(title_text, ["doll"]):
        return "girl", "doll/girl keywords"
    if has_any(title_text, ["game room"]):
        return "arcade-game", "game room keywords"

    if has_any(type_text, ["chemical"]):
        return "chemical", "product type chemical"
    if has_any(type_text, ["christmas"]):
        return "christmas", "product type christmas"
    if has_any(type_text, ["constellation"]):
        return "constellation", "product type constellation"
    if has_any(type_text, ["ornament"]):
        return "ornament", "product type ornament"
    if has_any(type_text, ["hot air balloon"]):
        return "hot-air-balloon", "product type hot air balloon"
    if has_any(type_text, ["aerospace"]):
        return "space", "product type aerospace"
    if has_any(type_text, ["aircraft"]):
        return "aircraft", "product type aircraft"
    if has_any(type_text, ["engineering"]):
        return "engineering", "product type engineering"
    if has_any(type_text, ["car model"]):
        return "car-model", "product type car model"
    if has_any(type_text, ["ship model"]):
        return "ship-model", "product type ship model"
    if has_any(type_text, ["warship"]):
        return "warship", "product type warship"
    if has_any(type_text, ["street view"]):
        return "street-view", "product type street view"
    if has_any(type_text, ["fire rescue"]):
        return "fire-rescue", "product type fire rescue"
    if has_any(type_text, ["home appliance"]):
        return "home-appliance", "product type home appliance"
    if has_any(type_text, ["brick alliance"]):
        return "brick-alliance", "product type brick alliance"
    if has_any(type_text, ["flower"]):
        return "flower", "product type flower"
    if has_any(type_text, ["animal"]):
        return "animal", "product type animal"
    if has_any(type_text, ["military"]):
        return "military", "product type military"
    if has_any(type_text, ["tank"]):
        return "tank", "product type tank"
    if has_any(type_text, ["mecha"]):
        return "mecha", "product type mecha"
    if has_any(type_text, ["police"]):
        return "police", "product type police"
    if has_any(type_text, ["dinosaur"]):
        return "dinosaur", "product type dinosaur"
    if has_any(type_text, ["gun"]):
        return "gun", "product type gun"
    if has_any(type_text, ["ship"]):
        return "ship-model", "product type ship"
    if has_any(type_text, ["ocean"]):
        return "ocean-underwater", "product type ocean"
    if has_any(type_text, ["amusement park"]):
        return "fairground", "product type amusement park"
    if has_any(type_text, ["motorcycle"]):
        return "car-model", "product type motorcycle"
    if has_any(type_text, ["pirate"]):
        return "pirates", "product type pirate"
    if has_any(type_text, ["train"]):
        return "trains", "product type train"
    if has_any(type_text, ["ranch"]):
        return "ranch", "product type ranch"
    if has_any(type_text, ["city"]):
        return "city", "product type city"
    if has_any(type_text, ["girl"]):
        return "girl", "product type girl"
    if has_any(type_text, ["boy"]):
        return "boy", "product type boy"
    if has_any(type_text, ["frozen"]):
        return "frozen", "product type frozen"
    if has_any(type_text, ["furniture"]):
        return "furniture", "product type furniture"
    if has_any(type_text, ["character"]):
        return "character-figure", "product type character"
    if has_any(type_text, ["scene"]):
        return "scene", "product type scene"
    if has_any(type_text, ["arcade"]):
        return "arcade-game", "product type arcade"
    if has_any(type_text, ["movie", "game"]):
        return "movie-game", "product type movie/game"

    return "", "no confident rule"


def website_primary_collection(product: Product) -> str:
    for collection in product.collections:
        if collection.handle in PRODUCT_TYPE_SET:
            return collection.handle
    for collection in product.collections:
        if collection.handle:
            return collection.handle
    return ""


def build_rows(products: list[Product], collection_by_handle: dict[str, Collection]) -> list[dict[str, str]]:
    rows = []
    for product in products:
        current_product_type_handles = [collection.handle for collection in product.collections if collection.handle in PRODUCT_TYPE_SET]
        expected_handle, reason = expected_collection_handle(product)
        expected_exists = expected_handle in collection_by_handle
        primary = website_primary_collection(product)

        if product.status == "DRAFT":
            action = "skip_draft"
        elif not expected_handle and current_product_type_handles:
            action = "ok"
        elif not expected_handle:
            action = "manual_no_collection"
        elif not expected_exists:
            action = "manual_missing_collection"
        elif expected_handle not in current_product_type_handles:
            action = "add_expected"
        elif any(handle != expected_handle for handle in current_product_type_handles):
            action = "remove_wrong_extra"
        elif primary != expected_handle:
            action = "primary_mismatch"
        else:
            action = "ok"

        rows.append(
            {
                "product_id": product.id,
                "handle": product.handle,
                "title": product.title,
                "status": product.status,
                "skus": "|".join(product.skus),
                "product_type": product.product_type,
                "current_product_type_collections": "|".join(current_product_type_handles),
                "all_collections": "|".join(collection.handle for collection in product.collections),
                "website_primary_collection": primary,
                "expected_collection": expected_handle,
                "target_product_type": collection_by_handle[expected_handle].title if expected_exists else "",
                "expected_collection_exists": "true" if expected_exists else "false",
                "reason": reason,
                "action": action,
            }
        )
    return rows


def summary(rows: list[dict[str, str]], collections: list[Collection]) -> dict[str, Any]:
    active_rows = [row for row in rows if row["status"] == "ACTIVE"]
    direct_counts = {handle: 0 for handle in PRODUCT_TYPE_COLLECTION_HANDLES}
    primary_counts = {handle: 0 for handle in PRODUCT_TYPE_COLLECTION_HANDLES}
    expected_counts = {handle: 0 for handle in PRODUCT_TYPE_COLLECTION_HANDLES}

    for row in active_rows:
        for handle in row["current_product_type_collections"].split("|"):
            if handle in direct_counts:
                direct_counts[handle] += 1
        if row["website_primary_collection"] in primary_counts:
            primary_counts[row["website_primary_collection"]] += 1
        if row["expected_collection"] in expected_counts:
            expected_counts[row["expected_collection"]] += 1

    action_counts: dict[str, int] = {}
    for row in rows:
        action_counts[row["action"]] = action_counts.get(row["action"], 0) + 1

    return {
        "products_checked": len(rows),
        "active_products": len(active_rows),
        "draft_products": sum(1 for row in rows if row["status"] == "DRAFT"),
        "shopify_collections_seen": len(collections),
        "product_type_collections_seen": sum(1 for collection in collections if collection.handle in PRODUCT_TYPE_SET),
        "action_counts": action_counts,
        "direct_counts": direct_counts,
        "website_primary_counts": primary_counts,
        "expected_counts": expected_counts,
        "ship_related": {
            "direct_ship_model": direct_counts.get("ship-model", 0),
            "primary_ship_model": primary_counts.get("ship-model", 0),
            "expected_ship_model": expected_counts.get("ship-model", 0),
            "direct_warship": direct_counts.get("warship", 0),
            "primary_warship": primary_counts.get("warship", 0),
            "expected_warship": expected_counts.get("warship", 0),
            "direct_pirates": direct_counts.get("pirates", 0),
            "primary_pirates": primary_counts.get("pirates", 0),
            "expected_pirates": expected_counts.get("pirates", 0),
        },
        "collection_rules": {
            collection.handle: {
                "title": collection.title,
                "website_collection_type": collection.website_collection_type,
                "rule_set": collection.rule_set,
            }
            for collection in collections
            if collection.handle in PRODUCT_TYPE_SET
        },
    }


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "product_id",
        "handle",
        "title",
        "status",
        "skus",
        "product_type",
        "current_product_type_collections",
        "all_collections",
        "website_primary_collection",
        "expected_collection",
        "target_product_type",
        "expected_collection_exists",
        "reason",
        "action",
    ]
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def apply_rows(admin: ShopifyAdmin, rows: list[dict[str, str]], collection_by_handle: dict[str, Collection], remove_wrong: bool) -> list[dict[str, str]]:
    results = []
    add_rows = [row for row in rows if row["action"] in {"add_expected", "primary_mismatch"} and row["status"] == "ACTIVE"]
    remove_rows = [row for row in rows if row["action"] in {"remove_wrong_extra", "primary_mismatch"} and row["status"] == "ACTIVE"]

    for index, row in enumerate(add_rows, start=1):
        result = {"handle": row["handle"], "operation": "add", "target": row["expected_collection"], "ok": "false", "error": ""}
        try:
            admin.collection_add_products(collection_by_handle[row["expected_collection"]].id, [row["product_id"]])
            result["ok"] = "true"
        except Exception as error:  # noqa: BLE001
            result["error"] = str(error)
        results.append(result)
        if index % BATCH_SIZE == 0:
            time.sleep(2)

    if remove_wrong:
        for row in remove_rows:
            wrong_handles = [
                handle
                for handle in row["current_product_type_collections"].split("|")
                if handle and handle != row["expected_collection"] and handle in collection_by_handle
            ]
            for wrong_handle in wrong_handles:
                result = {"handle": row["handle"], "operation": "remove", "target": wrong_handle, "ok": "false", "error": ""}
                try:
                    admin.collection_remove_products(collection_by_handle[wrong_handle].id, [row["product_id"]])
                    result["ok"] = "true"
                except Exception as error:  # noqa: BLE001
                    result["error"] = str(error)
                results.append(result)
                time.sleep(0.15)

    return results


def parse_handle_filter(raw: str) -> set[str]:
    return {part.strip() for part in raw.split(",") if part.strip()}


def apply_product_type_rows(
    admin: ShopifyAdmin,
    rows: list[dict[str, str]],
    include_reclassify: bool,
    only_handles: set[str],
) -> list[dict[str, str]]:
    results = []
    update_rows = [
        row
        for row in rows
        if row["status"] == "ACTIVE"
        and row["action"] == "add_expected"
        and row["target_product_type"]
        and (include_reclassify or not row["current_product_type_collections"])
        and (not only_handles or row["handle"] in only_handles)
    ]

    for index, row in enumerate(update_rows, start=1):
        result = {
            "handle": row["handle"],
            "old_product_type": row["product_type"],
            "target_product_type": row["target_product_type"],
            "ok": "false",
            "error": "",
        }
        try:
            admin.update_product_type(row["product_id"], row["target_product_type"])
            result["ok"] = "true"
        except Exception as error:  # noqa: BLE001
            result["error"] = str(error)
        results.append(result)

        if index % BATCH_SIZE == 0:
            print(f"updated productType {index}/{len(update_rows)}", flush=True)
            time.sleep(2)

    if update_rows:
        print(f"updated productType {len(update_rows)}/{len(update_rows)}", flush=True)

    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit and optionally repair Shopify product collection/category assignments.")
    parser.add_argument("--apply", action="store_true", help="Add products to expected collections.")
    parser.add_argument("--apply-product-type", action="store_true", help="Set productType so Shopify smart collections assign products automatically.")
    parser.add_argument("--include-reclassify", action="store_true", help="With --apply-product-type, also update products that already have a product-type collection.")
    parser.add_argument("--only-handles", default="", help="Comma-separated product handles to update when applying productType changes.")
    parser.add_argument("--remove-wrong", action="store_true", help="Also remove products from wrong product-type collections.")
    parser.add_argument("--yes", action="store_true", help="Required with --apply or --apply-product-type.")
    parser.add_argument("--plan-csv", default=str(OUT_DIR / "collection-audit-plan.csv"))
    parser.add_argument("--result-json", default=str(OUT_DIR / "collection-audit-result.json"))
    args = parser.parse_args()

    if (args.apply or args.apply_product_type) and not args.yes:
        raise SystemExit("--apply / --apply-product-type requires --yes")

    admin = ShopifyAdmin()
    collections = admin.collections()
    products = admin.products()
    collection_by_handle = {collection.handle: collection for collection in collections}
    rows = build_rows(products, collection_by_handle)
    write_csv(Path(args.plan_csv), rows)

    payload: dict[str, Any] = {
        "plan_csv": args.plan_csv,
        "summary": summary(rows, collections),
        "preview": [row for row in rows if row["action"] != "ok"][:80],
        "note": "Dry-run only unless --apply --yes is passed. Apply only changes Shopify collection membership, not SKU, price, inventory, media, handle, description, title, status, or taxonomy category.",
    }

    if args.apply:
        results = apply_rows(admin, rows, collection_by_handle, remove_wrong=args.remove_wrong)
        payload["apply_results"] = {
            "attempted": len(results),
            "ok": sum(1 for result in results if result["ok"] == "true"),
            "failed": sum(1 for result in results if result["ok"] != "true"),
            "rows": results,
        }

    if args.apply_product_type:
        results = apply_product_type_rows(
            admin,
            rows,
            include_reclassify=args.include_reclassify,
            only_handles=parse_handle_filter(args.only_handles),
        )
        payload["product_type_apply_results"] = {
            "attempted": len(results),
            "ok": sum(1 for result in results if result["ok"] == "true"),
            "failed": sum(1 for result in results if result["ok"] != "true"),
            "include_reclassify": args.include_reclassify,
            "only_handles": sorted(parse_handle_filter(args.only_handles)),
            "rows": results,
        }

    Path(args.result_json).parent.mkdir(parents=True, exist_ok=True)
    Path(args.result_json).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
