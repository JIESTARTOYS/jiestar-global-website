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


MANIFEST_PATH = Path("/private/tmp/jiestar-shopify-import/all-manifest.json")
OUT_DIR = Path("/private/tmp/jiestar-shopify-finalize")
PLAN_CSV = OUT_DIR / "finalize-plan.csv"
RESULT_JSON = OUT_DIR / "finalize-result.json"
API_VERSION_FALLBACK = "2026-01"
BATCH_SIZE = 25
CACHED_QUERY_BATCH_SIZE = 50
CATEGORY_ID = "gid://shopify/TaxonomyCategory/tg-5-7-12"
CATEGORY_NAME = "Interlocking Blocks"
REQUIRED_SCOPES = {"read_products", "write_products", "read_publications", "write_publications"}


@dataclass
class ProductState:
    id: str
    handle: str
    title: str
    status: str
    category_id: str
    category_name: str
    published_publication_ids: set[str]


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return

    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()

        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def manifest_handles() -> list[str]:
    if not MANIFEST_PATH.exists():
        raise RuntimeError(f"Missing manifest: {MANIFEST_PATH}")

    data = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    handles = []
    seen = set()

    for item in data:
        handle = (item.get("handle") or "").strip()

        if handle and handle not in seen:
            handles.append(handle)
            seen.add(handle)

    return handles


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
            raise RuntimeError(f"Shopify GraphQL errors: {json.dumps(payload['errors'], ensure_ascii=False)}")

        return payload["data"]

    def access_scopes(self) -> set[str]:
        data = self.graphql(
            """
            query CurrentScopes {
              currentAppInstallation {
                accessScopes {
                  handle
                }
              }
            }
            """
        )
        return {scope["handle"] for scope in data["currentAppInstallation"]["accessScopes"]}

    def taxonomy_category(self) -> dict[str, str]:
        data = self.graphql(
            """
            query TaxonomyCategory($search: String!) {
              taxonomy {
                categories(first: 20, search: $search) {
                  nodes {
                    id
                    name
                    fullName
                  }
                }
              }
            }
            """,
            {"search": CATEGORY_NAME},
        )

        nodes = data["taxonomy"]["categories"]["nodes"]
        match = next((node for node in nodes if node["id"] == CATEGORY_ID), None)

        if not match:
            raise RuntimeError(f"Could not confirm Shopify taxonomy category {CATEGORY_ID}")

        return match

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

    def product_by_handle(self, handle: str, publication_ids: list[str]) -> ProductState | None:
        publication_fields = "\n".join(
            f'p{i}: publishedOnPublication(publicationId: "{publication_id}")'
            for i, publication_id in enumerate(publication_ids)
        )
        query = f"""
            query ProductByHandle($query: String!) {{
              products(first: 1, query: $query) {{
                nodes {{
                  id
                  handle
                  title
                  status
                  category {{
                    id
                    name
                  }}
                  {publication_fields}
                }}
              }}
            }}
        """
        data = self.graphql(query, {"query": f"handle:{handle}"})
        nodes = data["products"]["nodes"]

        if not nodes:
            return None

        node = nodes[0]
        published_publication_ids = {
            publication_id
            for i, publication_id in enumerate(publication_ids)
            if node.get(f"p{i}") is True
        }

        return ProductState(
            id=node["id"],
            handle=node["handle"],
            title=node["title"],
            status=node["status"],
            category_id=(node.get("category") or {}).get("id") or "",
            category_name=(node.get("category") or {}).get("name") or "",
            published_publication_ids=published_publication_ids,
        )

    def products_by_ids(self, ids: list[str], publication_ids: list[str]) -> list[ProductState]:
        publication_fields = "\n".join(
            f'p{i}: publishedOnPublication(publicationId: "{publication_id}")'
            for i, publication_id in enumerate(publication_ids)
        )
        data = self.graphql(
            f"""
            query ProductsByIds($ids: [ID!]!) {{
              nodes(ids: $ids) {{
                ... on Product {{
                  id
                  handle
                  title
                  status
                  category {{
                    id
                    name
                  }}
                  {publication_fields}
                }}
              }}
            }}
            """,
            {"ids": ids},
        )
        products = []

        for node in data["nodes"]:
            if not node:
                continue

            published_publication_ids = {
                publication_id
                for i, publication_id in enumerate(publication_ids)
                if node.get(f"p{i}") is True
            }
            products.append(
                ProductState(
                    id=node["id"],
                    handle=node["handle"],
                    title=node["title"],
                    status=node["status"],
                    category_id=(node.get("category") or {}).get("id") or "",
                    category_name=(node.get("category") or {}).get("name") or "",
                    published_publication_ids=published_publication_ids,
                )
            )

        return products

    def update_status_and_category(self, product_id: str) -> None:
        data = self.graphql(
            """
            mutation ProductFinalize($product: ProductUpdateInput!) {
              productUpdate(product: $product) {
                product {
                  id
                  status
                  category {
                    id
                    name
                  }
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """,
            {"product": {"id": product_id, "status": "ACTIVE", "category": CATEGORY_ID}},
        )
        assert_no_user_errors("productUpdate", data["productUpdate"]["userErrors"])

    def publish_to_publications(self, product_id: str, publication_ids: list[str]) -> None:
        if not publication_ids:
            return

        data = self.graphql(
            """
            mutation PublishProduct($id: ID!, $input: [PublicationInput!]!) {
              publishablePublish(id: $id, input: $input) {
                publishable {
                  ... on Product {
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
            {"id": product_id, "input": [{"publicationId": publication_id} for publication_id in publication_ids]},
        )
        assert_no_user_errors("publishablePublish", data["publishablePublish"]["userErrors"])


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


def build_plan(admin: ShopifyAdmin, handles: list[str], publications: list[dict[str, str]]) -> list[dict[str, str]]:
    rows = []
    publication_ids = [publication["id"] for publication in publications]

    for handle in handles:
        product = admin.product_by_handle(handle, publication_ids)

        if not product:
            rows.append(
                {
                    "handle": handle,
                    "product_id": "",
                    "title": "",
                    "status": "",
                    "category_id": "",
                    "category_name": "",
                    "missing_publications": "",
                    "action": "skip_missing_product",
                    "error": "",
                }
            )
            continue

        missing_publication_ids = [
            publication_id for publication_id in publication_ids if publication_id not in product.published_publication_ids
        ]
        needs_update = product.status != "ACTIVE" or product.category_id != CATEGORY_ID or bool(missing_publication_ids)

        rows.append(
            {
                "handle": product.handle,
                "product_id": product.id,
                "title": product.title,
                "status": product.status,
                "category_id": product.category_id,
                "category_name": product.category_name,
                "missing_publications": "|".join(missing_publication_ids),
                "action": "update" if needs_update else "noop",
                "error": "",
            }
        )

    return rows


def cached_plan_ids(handles: list[str]) -> dict[str, str]:
    if not PLAN_CSV.exists():
        return {}

    with PLAN_CSV.open("r", encoding="utf-8", newline="") as file:
        rows = list(csv.DictReader(file))

    handle_set = set(handles)
    ids = {
        row["handle"]: row["product_id"]
        for row in rows
        if row.get("handle") in handle_set and row.get("product_id")
    }
    return ids if len(ids) == len(handle_set) else {}


def build_plan_from_product_ids(
    admin: ShopifyAdmin,
    handle_to_product_id: dict[str, str],
    publications: list[dict[str, str]],
) -> list[dict[str, str]]:
    publication_ids = [publication["id"] for publication in publications]
    states_by_handle = {}
    ids = list(handle_to_product_id.values())

    for start in range(0, len(ids), CACHED_QUERY_BATCH_SIZE):
        batch = ids[start : start + CACHED_QUERY_BATCH_SIZE]
        for product in admin.products_by_ids(batch, publication_ids):
            states_by_handle[product.handle] = product
        print(f"Read product states {min(start + len(batch), len(ids))}/{len(ids)}", flush=True)

    rows = []
    for handle, product_id in handle_to_product_id.items():
        product = states_by_handle.get(handle)

        if not product:
            rows.append(
                {
                    "handle": handle,
                    "product_id": product_id,
                    "title": "",
                    "status": "",
                    "category_id": "",
                    "category_name": "",
                    "missing_publications": "",
                    "action": "skip_missing_product",
                    "error": "Product id from cached plan was not returned by Shopify.",
                }
            )
            continue

        missing_publication_ids = [
            publication_id for publication_id in publication_ids if publication_id not in product.published_publication_ids
        ]
        needs_update = product.status != "ACTIVE" or product.category_id != CATEGORY_ID or bool(missing_publication_ids)
        rows.append(
            {
                "handle": product.handle,
                "product_id": product.id,
                "title": product.title,
                "status": product.status,
                "category_id": product.category_id,
                "category_name": product.category_name,
                "missing_publications": "|".join(missing_publication_ids),
                "action": "update" if needs_update else "noop",
                "error": "",
            }
        )

    return rows


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fields = [
        "handle",
        "product_id",
        "title",
        "status",
        "category_id",
        "category_name",
        "missing_publications",
        "action",
        "error",
    ]

    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def summarize(rows: list[dict[str, str]], publications: list[dict[str, str]]) -> dict[str, int]:
    existing = [row for row in rows if row["product_id"]]
    return {
        "manifest_handles": len(rows),
        "products_found": len(existing),
        "missing_products": sum(1 for row in rows if row["action"] == "skip_missing_product"),
        "already_active": sum(1 for row in existing if row["status"] == "ACTIVE"),
        "already_category": sum(1 for row in existing if row["category_id"] == CATEGORY_ID),
        "already_fully_published": sum(1 for row in existing if not row["missing_publications"]),
        "planned_updates": sum(1 for row in rows if row["action"] == "update"),
        "noop": sum(1 for row in rows if row["action"] == "noop"),
        "publication_count": len(publications),
    }


def apply_updates(admin: ShopifyAdmin, rows: list[dict[str, str]], publication_ids: list[str]) -> dict[str, Any]:
    update_rows = [row for row in rows if row["action"] == "update"]
    results = []

    for index, row in enumerate(update_rows, 1):
        result = {**row, "ok": "false"}

        try:
            admin.update_status_and_category(row["product_id"])
            missing_publications = [value for value in row["missing_publications"].split("|") if value]
            admin.publish_to_publications(row["product_id"], missing_publications)
            result["ok"] = "true"
        except Exception as error:  # noqa: BLE001 - batch report should capture the Shopify error.
            result["error"] = str(error)

        results.append(result)
        print(f"Applied {index}/{len(update_rows)}: {row['handle']} ok={result['ok']}", flush=True)

        if index % BATCH_SIZE == 0:
            time.sleep(1)

    return {
        "attempted": len(update_rows),
        "ok": sum(1 for row in results if row["ok"] == "true"),
        "failed": sum(1 for row in results if row["ok"] != "true"),
        "rows": results,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Finalize newly imported JIESTAR Shopify products.")
    parser.add_argument("--apply", action="store_true", help="Apply status/category/publication updates.")
    parser.add_argument("--yes", action="store_true", help="Required with --apply.")
    args = parser.parse_args()

    if args.apply and not args.yes:
        raise SystemExit("--apply requires --yes")

    admin = ShopifyAdmin()
    handles = manifest_handles()
    scopes = admin.access_scopes()
    missing_scopes = sorted(REQUIRED_SCOPES - scopes)

    if missing_scopes:
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        result = {
            "ok": False,
            "blocked": "missing_scopes",
            "missing_scopes": missing_scopes,
            "current_scopes": sorted(scopes),
            "required_scopes": sorted(REQUIRED_SCOPES),
            "manifest_handles": len(handles),
        }
        RESULT_JSON.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 2

    category = admin.taxonomy_category()
    publications = admin.publications()

    if not publications:
        raise RuntimeError("No Shopify publications/sales channels were returned.")

    cached_ids = cached_plan_ids(handles)
    if cached_ids:
        print(f"Using cached product ids from {PLAN_CSV}", flush=True)
        rows = build_plan_from_product_ids(admin, cached_ids, publications)
    else:
        rows = build_plan(admin, handles, publications)
    write_csv(PLAN_CSV, rows)
    result: dict[str, Any] = {
        "ok": True,
        "category": category,
        "publications": publications,
        "plan_csv": str(PLAN_CSV),
        "summary": summarize(rows, publications),
    }

    if args.apply:
        apply_results = apply_updates(admin, rows, [publication["id"] for publication in publications])
        verify_rows = build_plan_from_product_ids(admin, cached_plan_ids(handles), publications)
        write_csv(PLAN_CSV, verify_rows)
        result["apply_results"] = apply_results
        result["verification"] = summarize(verify_rows, publications)
        result["verification_failures"] = [
            row for row in verify_rows if row["action"] not in {"noop", "skip_missing_product"}
        ]
    else:
        result["preview"] = rows[:30]

    RESULT_JSON.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
