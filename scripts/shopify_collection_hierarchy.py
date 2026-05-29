#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import os
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


OUT_DIR = Path("/private/tmp/jiestar-shopify-collection-hierarchy")
API_VERSION_FALLBACK = "2026-01"
BATCH_SIZE = 20


MAIN_CATEGORIES = [
    {
        "handle": "vehicles",
        "title": "Vehicles",
        "children": ["Car Model", "Fire Rescue"],
        "image_from": "car-model",
        "description": "Browse JIESTAR cars, trucks, motorcycles, and other vehicle model kits.",
    },
    {
        "handle": "engineering-technic",
        "title": "Engineering & Technic",
        "children": ["Engineering", "Technic"],
        "image_from": "engineering",
        "description": "Construction machines, mechanical builds, and technical model kits for hands-on builders.",
    },
    {
        "handle": "military-police",
        "title": "Military & Police",
        "children": ["Military", "Police", "SWAT", "Tank"],
        "image_from": "military",
        "description": "Tactical vehicles, armored models, police scenes, and display-ready defense-themed builds.",
    },
    {
        "handle": "buildings-street-scenes",
        "title": "Buildings & Street Scenes",
        "children": ["Street View", "Modular Buildings", "City", "Castle", "Fairy Tale"],
        "image_from": "street-view",
        "description": "Architecture, city streets, shops, castles, and display buildings for collectors.",
    },
    {
        "handle": "ships-boats",
        "title": "Ships & Boats",
        "children": ["Ship Model", "Warship", "Pirates"],
        "image_from": "pirates",
        "description": "Pirate ships, naval vessels, boats, and maritime building block models.",
    },
    {
        "handle": "aircraft",
        "title": "Aircraft",
        "children": ["Aircraft"],
        "image_from": "aircraft",
        "description": "Planes, helicopters, drones, and aviation-inspired display model kits.",
    },
    {
        "handle": "trains",
        "title": "Trains",
        "children": ["Trains"],
        "image_from": "trains",
        "description": "Locomotives, railway vehicles, and train display models for JIESTAR builders.",
    },
    {
        "handle": "space",
        "title": "Space",
        "children": ["Space"],
        "image_from": "space",
        "description": "Spacecraft, launch scenes, rovers, and sci-fi building block models.",
    },
    {
        "handle": "flowers-botanical",
        "title": "Flowers & Botanical",
        "children": ["Flower"],
        "image_from": "flower",
        "description": "Botanical building sets, bouquets, plants, and decorative floral display models.",
    },
    {
        "handle": "animals-creatures",
        "title": "Animals & Creatures",
        "children": ["Animal", "Dinosaur", "Legendary Dragon"],
        "image_from": "animal",
        "description": "Animals, dinosaurs, dragons, and creature-themed display builds.",
    },
    {
        "handle": "mecha-robots",
        "title": "Mecha & Robots",
        "children": ["Mecha"],
        "image_from": "mecha",
        "description": "Robots, mecha models, and sci-fi mechanical display builds.",
    },
    {
        "handle": "amusement-games",
        "title": "Amusement & Games",
        "children": ["Fairground", "Arcade Game", "Hot Air Balloon"],
        "image_from": "fairground",
        "description": "Fairground rides, amusement scenes, arcade builds, and playful display models.",
    },
    {
        "handle": "ocean-underwater",
        "title": "Ocean & Underwater",
        "children": ["Ocean & Underwater"],
        "image_from": "ocean-underwater",
        "description": "Marine life, diving scenes, underwater bases, and ocean-themed building sets.",
    },
    {
        "handle": "decor-collectibles",
        "title": "Decor & Collectibles",
        "children": [
            "Ornament",
            "Christmas",
            "Storage Box",
            "Constellation",
            "Chemical",
            "Frozen",
            "Ranch",
            "Girl",
            "Character Figure",
            "Home Appliance",
            "Other",
            "Brick Alliance",
            "Scene",
            "Furniture",
            "Boy",
            "Movie & Game",
        ],
        "image_from": "ornament",
        "description": "Decorative models, seasonal builds, compact collectibles, and specialty display sets.",
    },
    {
        "handle": "props-blasters",
        "title": "Props & Blasters",
        "children": ["Gun", "Weapon"],
        "image_from": "gun",
        "description": "Toy-like prop builds, sci-fi blasters, and fantasy accessories made from building blocks.",
    },
]

LEGACY_CHILD_HANDLES = [
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


@dataclass
class Collection:
    id: str
    handle: str
    title: str
    description: str
    website_collection_type: str
    image_url: str
    image_alt: str
    rule_set: dict[str, Any]


@dataclass
class Product:
    id: str
    status: str
    product_type: str
    collection_handles: list[str]


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return

    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


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
                query CollectionsForHierarchy($cursor: String) {
                  collections(first: 250, after: $cursor, sortKey: TITLE) {
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                    nodes {
                      id
                      handle
                      title
                      description
                      websiteCollectionType: metafield(namespace: "custom", key: "website_collection_type") {
                        value
                      }
                      image {
                        url
                        altText
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
                image = node.get("image") or {}
                collections.append(
                    Collection(
                        id=node["id"],
                        handle=node["handle"],
                        title=node["title"],
                        description=node.get("description") or "",
                        website_collection_type=(node.get("websiteCollectionType") or {}).get("value") or "",
                        image_url=image.get("url") or "",
                        image_alt=image.get("altText") or "",
                        rule_set=node.get("ruleSet") or {},
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
                query ProductsForHierarchy($cursor: String) {
                  products(first: 250, after: $cursor, sortKey: TITLE) {
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                    nodes {
                      id
                      status
                      productType
                      collections(first: 50) {
                        nodes {
                          handle
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
                        status=node["status"],
                        product_type=node.get("productType") or "",
                        collection_handles=[collection["handle"] for collection in node["collections"]["nodes"]],
                    )
                )

            if not page["pageInfo"]["hasNextPage"]:
                break
            cursor = page["pageInfo"]["endCursor"]

        return products

    def collection_create(self, payload: dict[str, Any]) -> str:
        data = self.graphql(
            """
            mutation CollectionCreate($input: CollectionInput!) {
              collectionCreate(input: $input) {
                collection {
                  id
                  handle
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """,
            {"input": payload},
        )
        assert_no_user_errors("collectionCreate", data["collectionCreate"]["userErrors"])
        return data["collectionCreate"]["collection"]["id"]

    def collection_update(self, payload: dict[str, Any]) -> None:
        data = self.graphql(
            """
            mutation CollectionUpdate($input: CollectionInput!) {
              collectionUpdate(input: $input) {
                collection {
                  id
                  handle
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """,
            {"input": payload},
        )
        assert_no_user_errors("collectionUpdate", data["collectionUpdate"]["userErrors"])

    def collection_delete(self, collection_id: str) -> None:
        data = self.graphql(
            """
            mutation CollectionDelete($input: CollectionDeleteInput!) {
              collectionDelete(input: $input) {
                deletedCollectionId
                userErrors {
                  field
                  message
                }
              }
            }
            """,
            {"input": {"id": collection_id}},
        )
        assert_no_user_errors("collectionDelete", data["collectionDelete"]["userErrors"])

    def metafields_set(self, metafields: list[dict[str, str]]) -> None:
        data = self.graphql(
            """
            mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
              metafieldsSet(metafields: $metafields) {
                metafields {
                  id
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """,
            {"metafields": metafields},
        )
        assert_no_user_errors("metafieldsSet", data["metafieldsSet"]["userErrors"])

    def publications(self) -> list[dict[str, str]]:
        data = self.graphql(
            """
            query Publications {
              publications(first: 50) {
                nodes {
                  id
                  name
                }
              }
            }
            """
        )
        return data["publications"]["nodes"]

    def publish_to_publications(self, publishable_id: str, publication_ids: list[str]) -> None:
        if not publication_ids:
            return

        data = self.graphql(
            """
            mutation PublishCollection($id: ID!, $input: [PublicationInput!]!) {
              publishablePublish(id: $id, input: $input) {
                publishable {
                  ... on Collection {
                    id
                  }
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """,
            {"id": publishable_id, "input": [{"publicationId": publication_id} for publication_id in publication_ids]},
        )
        assert_no_user_errors("publishablePublish", data["publishablePublish"]["userErrors"])


def main_category_rule_set(children: list[str]) -> dict[str, Any]:
    return {
        "appliedDisjunctively": True,
        "rules": [{"column": "TYPE", "relation": "EQUALS", "condition": child} for child in children],
    }


def metafield_input(value: str) -> dict[str, str]:
    return {
        "namespace": "custom",
        "key": "website_collection_type",
        "type": "single_line_text_field",
        "value": value,
    }


def html_description(text: str) -> str:
    return f"<p>{text}</p>"


def product_type_key(value: str) -> str:
    return value.strip().casefold()


def pick_image(collection_by_handle: dict[str, Collection], preferred_handle: str) -> dict[str, str] | None:
    collection = collection_by_handle.get(preferred_handle)
    if not collection or not collection.image_url:
        return None
    return {
        "src": collection.image_url,
        "altText": collection.image_alt or f"{collection.title} collection",
    }


def build_collection_payload(category: dict[str, Any], existing: Collection | None, collection_by_handle: dict[str, Collection]) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "handle": category["handle"],
        "title": category["title"],
        "descriptionHtml": html_description(category["description"]),
        "ruleSet": main_category_rule_set(category["children"]),
        "metafields": [metafield_input("main_category")],
    }
    image = pick_image(collection_by_handle, category["image_from"])
    if image:
        payload["image"] = image
    if existing:
        payload["id"] = existing.id
    return payload


def summarize_rule_set(rule_set: dict[str, Any]) -> str:
    return json.dumps(rule_set or {}, ensure_ascii=False, sort_keys=True)


def build_plan(collections: list[Collection], products: list[Product]) -> tuple[list[dict[str, str]], dict[str, Any]]:
    collection_by_handle = {collection.handle: collection for collection in collections}
    main_handles = {str(category["handle"]) for category in MAIN_CATEGORIES}
    active_products = [product for product in products if product.status == "ACTIVE"]
    active_by_type: dict[str, int] = {}
    active_by_collection: dict[str, int] = {}

    for product in active_products:
        active_by_type[product_type_key(product.product_type)] = active_by_type.get(product_type_key(product.product_type), 0) + 1
        for handle in product.collection_handles:
            active_by_collection[handle] = active_by_collection.get(handle, 0) + 1

    rows: list[dict[str, str]] = []

    for category in MAIN_CATEGORIES:
        handle = str(category["handle"])
        existing = collection_by_handle.get(handle)
        children = list(category["children"])
        expected_count = sum(active_by_type.get(product_type_key(child), 0) for child in children)
        image = pick_image(collection_by_handle, str(category["image_from"]))
        expected_rule_set = main_category_rule_set(children)
        current_type = existing.website_collection_type if existing else ""
        current_rule_set = existing.rule_set if existing else {}

        if not existing:
            action = "create_main_collection"
        elif current_type != "main_category" or current_rule_set != expected_rule_set:
            action = "update_main_collection"
        else:
            action = "ok"

        rows.append(
            {
                "row_type": "main",
                "handle": handle,
                "title": str(category["title"]),
                "existing_id": existing.id if existing else "",
                "current_website_collection_type": current_type,
                "target_website_collection_type": "main_category",
                "child_product_types": "|".join(children),
                "rule_conditions": "|".join(children),
                "current_product_count": str(active_by_collection.get(handle, 0)),
                "expected_product_count": str(expected_count),
                "action": action,
                "image_from": str(category["image_from"]),
                "image_url": image["src"] if image else "",
                "current_rule_set": summarize_rule_set(current_rule_set),
                "target_rule_set": summarize_rule_set(expected_rule_set),
            }
        )

    for handle in LEGACY_CHILD_HANDLES:
        collection = collection_by_handle.get(handle)
        if not collection:
            continue
        target_type = "main_category" if handle in main_handles else "child_category"
        action = "ok" if collection.website_collection_type == target_type else f"mark_{target_type}"
        rows.append(
            {
                "row_type": "child" if target_type == "child_category" else "main_existing_child_handle",
                "handle": handle,
                "title": collection.title,
                "existing_id": collection.id,
                "current_website_collection_type": collection.website_collection_type,
                "target_website_collection_type": target_type,
                "child_product_types": "",
                "rule_conditions": "",
                "current_product_count": str(active_by_collection.get(handle, 0)),
                "expected_product_count": str(active_by_collection.get(handle, 0)),
                "action": action,
                "image_from": "",
                "image_url": collection.image_url,
                "current_rule_set": summarize_rule_set(collection.rule_set),
                "target_rule_set": summarize_rule_set(collection.rule_set),
            }
        )

    summary = {
        "products_checked": len(products),
        "active_products": len(active_products),
        "collections_checked": len(collections),
        "main_categories": len(MAIN_CATEGORIES),
        "legacy_child_handles_seen": sum(1 for handle in LEGACY_CHILD_HANDLES if handle in collection_by_handle),
        "main_expected_counts": {
            str(category["handle"]): sum(active_by_type.get(product_type_key(child), 0) for child in category["children"])
            for category in MAIN_CATEGORIES
        },
        "actions": {},
    }
    for row in rows:
        summary["actions"][row["action"]] = summary["actions"].get(row["action"], 0) + 1
    return rows, summary


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "row_type",
        "handle",
        "title",
        "existing_id",
        "current_website_collection_type",
        "target_website_collection_type",
        "child_product_types",
        "rule_conditions",
        "current_product_count",
        "expected_product_count",
        "action",
        "image_from",
        "image_url",
        "current_rule_set",
        "target_rule_set",
    ]
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def apply_plan(admin: ShopifyAdmin, rows: list[dict[str, str]], collections: list[Collection]) -> list[dict[str, str]]:
    collection_by_handle = {collection.handle: collection for collection in collections}
    publication_ids = [publication["id"] for publication in admin.publications()]
    main_collection_ids: list[str] = []
    results: list[dict[str, str]] = []

    for index, category in enumerate(MAIN_CATEGORIES, start=1):
        existing = collection_by_handle.get(str(category["handle"]))
        payload = build_collection_payload(category, existing, collection_by_handle)
        result = {
            "handle": str(category["handle"]),
            "operation": "update" if existing else "create",
            "ok": "false",
            "error": "",
        }
        try:
            if existing:
                admin.collection_update(payload)
                main_collection_ids.append(existing.id)
            else:
                collection_id = admin.collection_create(payload)
                main_collection_ids.append(collection_id)
            result["ok"] = "true"
        except Exception as error:  # noqa: BLE001
            result["error"] = str(error)
        results.append(result)

        if index % BATCH_SIZE == 0:
            time.sleep(2)

    metafields: list[dict[str, str]] = []
    for row in rows:
        if row["row_type"] not in {"child", "main_existing_child_handle"}:
            continue
        if row["current_website_collection_type"] == row["target_website_collection_type"]:
            continue
        metafields.append(
            {
                "ownerId": row["existing_id"],
                **metafield_input(row["target_website_collection_type"]),
            }
        )

    for index in range(0, len(metafields), BATCH_SIZE):
        chunk = metafields[index : index + BATCH_SIZE]
        result = {
            "handle": ",".join(field["ownerId"].split("/")[-1] for field in chunk),
            "operation": "metafieldsSet",
            "ok": "false",
            "error": "",
        }
        try:
            admin.metafields_set(chunk)
            result["ok"] = "true"
        except Exception as error:  # noqa: BLE001
            result["error"] = str(error)
        results.append(result)
        time.sleep(0.5)

    for index, collection_id in enumerate(main_collection_ids, start=1):
        result = {
            "handle": collection_id.split("/")[-1],
            "operation": "publishablePublish",
            "ok": "false",
            "error": "",
        }
        try:
            admin.publish_to_publications(collection_id, publication_ids)
            result["ok"] = "true"
        except Exception as error:  # noqa: BLE001
            result["error"] = str(error)
        results.append(result)

        if index % BATCH_SIZE == 0:
            time.sleep(2)

    return results


def delete_child_collections(admin: ShopifyAdmin, rows: list[dict[str, str]]) -> list[dict[str, str]]:
    results: list[dict[str, str]] = []
    child_rows = [row for row in rows if row["row_type"] == "child" and row["existing_id"]]

    for index, row in enumerate(child_rows, start=1):
        result = {
            "handle": row["handle"],
            "operation": "collectionDelete",
            "ok": "false",
            "error": "",
        }
        try:
            admin.collection_delete(row["existing_id"])
            result["ok"] = "true"
        except Exception as error:  # noqa: BLE001
            result["error"] = str(error)
        results.append(result)

        if index % BATCH_SIZE == 0:
            time.sleep(2)

    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="Create and maintain JIESTAR main/child Shopify collection hierarchy.")
    parser.add_argument("--apply", action="store_true", help="Apply collection create/update and hierarchy metafields.")
    parser.add_argument(
        "--delete-child-collections",
        action="store_true",
        help="Delete legacy child collections after main category collections are in place. Does not delete products.",
    )
    parser.add_argument("--yes", action="store_true", help="Required with --apply.")
    parser.add_argument("--plan-csv", default=str(OUT_DIR / "hierarchy-plan.csv"))
    parser.add_argument("--result-json", default=str(OUT_DIR / "hierarchy-result.json"))
    args = parser.parse_args()

    if args.apply and not args.yes:
        raise SystemExit("--apply requires --yes")

    admin = ShopifyAdmin()
    collections = admin.collections()
    products = admin.products()
    rows, summary = build_plan(collections, products)
    write_csv(Path(args.plan_csv), rows)

    payload: dict[str, Any] = {
        "plan_csv": args.plan_csv,
        "summary": summary,
        "preview": [row for row in rows if row["action"] != "ok"][:80],
        "note": "Dry-run unless --apply --yes is passed. Does not change products, SKUs, titles, prices, media, descriptions, handles, status, or inventory.",
    }

    if args.apply:
        results = apply_plan(admin, rows, collections)
        payload["apply_results"] = {
            "attempted": len(results),
            "ok": sum(1 for result in results if result["ok"] == "true"),
            "failed": sum(1 for result in results if result["ok"] != "true"),
            "rows": results,
        }
        if args.delete_child_collections:
            delete_results = delete_child_collections(admin, rows)
            payload["delete_child_collection_results"] = {
                "attempted": len(delete_results),
                "ok": sum(1 for result in delete_results if result["ok"] == "true"),
                "failed": sum(1 for result in delete_results if result["ok"] != "true"),
                "rows": delete_results,
            }

    Path(args.result_json).parent.mkdir(parents=True, exist_ok=True)
    Path(args.result_json).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
