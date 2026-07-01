from __future__ import annotations

from pathlib import Path
import sys
import tempfile
import unittest


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import shopify_small_angle_delist as delist


class FakeAdmin:
    def __init__(self, products: list[dict[str, str]]) -> None:
        self.products = {product["id"]: dict(product) for product in products}
        self.updated: list[tuple[str, str]] = []

    def all_products(self) -> list[dict[str, str]]:
        return list(self.products.values())

    def product_by_id(self, product_id: str) -> dict[str, str] | None:
        product = self.products.get(product_id)
        return dict(product) if product else None

    def update_status(self, product_id: str, status: str) -> None:
        self.updated.append((product_id, status))
        self.products[product_id]["status"] = status


class ShopifySmallAngleDelistTests(unittest.TestCase):
    def test_build_plan_targets_only_active_small_angle_products(self) -> None:
        rows, summary = delist.build_plan(
            [
                {
                    "id": "gid://shopify/Product/1",
                    "handle": "active-small-angle",
                    "title": "Small Angle Active",
                    "vendor": "Small Angle",
                    "status": "ACTIVE",
                    "onlineStoreUrl": "https://example.com/products/active-small-angle",
                    "totalVariants": 1,
                },
                {
                    "id": "gid://shopify/Product/2",
                    "handle": "draft-small-angle",
                    "title": "Small Angle Draft",
                    "vendor": "Small Angle",
                    "status": "DRAFT",
                    "onlineStoreUrl": "",
                    "totalVariants": 1,
                },
                {
                    "id": "gid://shopify/Product/3",
                    "handle": "active-zoin",
                    "title": "ZOIN Active",
                    "vendor": "ZOIN",
                    "status": "ACTIVE",
                    "onlineStoreUrl": "https://example.com/products/active-zoin",
                    "totalVariants": 1,
                },
            ]
        )

        self.assertEqual(summary["small_angle_products"], 2)
        self.assertEqual(summary["active_to_draft"], 1)
        self.assertEqual(summary["already_draft"], 1)
        self.assertEqual(summary["non_small_angle_targets"], 0)
        self.assertEqual([row["handle"] for row in rows], ["active-small-angle", "draft-small-angle"])
        self.assertEqual(rows[0]["action"], "draft_active_small_angle")
        self.assertEqual(rows[1]["action"], "already_draft")

    def test_apply_plan_rechecks_vendor_and_status_before_drafting(self) -> None:
        admin = FakeAdmin(
            [
                {
                    "id": "gid://shopify/Product/1",
                    "handle": "active-small-angle",
                    "title": "Small Angle Active",
                    "vendor": "Small Angle",
                    "status": "ACTIVE",
                    "onlineStoreUrl": "https://example.com/products/active-small-angle",
                    "totalVariants": 1,
                },
                {
                    "id": "gid://shopify/Product/2",
                    "handle": "changed-vendor",
                    "title": "Changed Vendor",
                    "vendor": "ZOIN",
                    "status": "ACTIVE",
                    "onlineStoreUrl": "https://example.com/products/changed-vendor",
                    "totalVariants": 1,
                },
                {
                    "id": "gid://shopify/Product/3",
                    "handle": "already-draft",
                    "title": "Already Draft",
                    "vendor": "Small Angle",
                    "status": "DRAFT",
                    "onlineStoreUrl": "",
                    "totalVariants": 1,
                },
            ]
        )
        rows = [
            {
                "product_id": "gid://shopify/Product/1",
                "handle": "active-small-angle",
                "title": "Small Angle Active",
                "vendor": "Small Angle",
                "current_status": "ACTIVE",
                "target_status": "DRAFT",
                "action": "draft_active_small_angle",
            },
            {
                "product_id": "gid://shopify/Product/2",
                "handle": "changed-vendor",
                "title": "Changed Vendor",
                "vendor": "Small Angle",
                "current_status": "ACTIVE",
                "target_status": "DRAFT",
                "action": "draft_active_small_angle",
            },
            {
                "product_id": "gid://shopify/Product/3",
                "handle": "already-draft",
                "title": "Already Draft",
                "vendor": "Small Angle",
                "current_status": "DRAFT",
                "target_status": "DRAFT",
                "action": "already_draft",
            },
        ]

        with tempfile.NamedTemporaryFile("w", encoding="utf-8", newline="") as file:
            delist.write_plan_csv(Path(file.name), rows)
            file.flush()

            result = delist.apply_approved_plan(admin, Path(file.name))

        self.assertEqual(admin.updated, [("gid://shopify/Product/1", "DRAFT")])
        self.assertEqual(result["attempted"], 2)
        self.assertEqual(result["ok"], 1)
        self.assertEqual(result["skipped"], 1)
        self.assertEqual(result["failed"], 0)
        self.assertEqual(result["rows"][1]["status"], "skipped")


if __name__ == "__main__":
    unittest.main()
