from __future__ import annotations

import csv
import tempfile
import unittest
from pathlib import Path
import sys


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import shopify_draft_unpriced_active_products as draft_unpriced


class FakeAdmin:
    def __init__(self, products: list[dict[str, str]]) -> None:
        self.products = {product["id"]: dict(product) for product in products}
        self.updated: list[tuple[str, str]] = []

    def products_by_ids(self, product_ids: list[str]) -> dict[str, dict[str, str]]:
        return {product_id: dict(self.products[product_id]) for product_id in product_ids if product_id in self.products}

    def product_by_id(self, product_id: str) -> dict[str, str] | None:
        product = self.products.get(product_id)
        return dict(product) if product else None

    def update_status(self, product_id: str, status: str) -> None:
        self.updated.append((product_id, status))
        self.products[product_id]["status"] = status


def price_row(product_id: str, variant_id: str, sku: str, reason: str, product_title: str = "Bundle") -> dict[str, str]:
    return {
        "action": "skip" if reason == "unmatched_active_sku" else "noop",
        "skip_reason": reason,
        "product_id": product_id,
        "variant_id": variant_id,
        "handle": f"handle-{product_id[-1]}",
        "product_title": product_title,
        "vendor": "JieStar",
        "variant_title": sku,
        "sku": sku,
        "current_price": "999.00" if reason == "unmatched_active_sku" else "9.99",
        "current_compare_at_price": "",
        "target_price": "" if reason == "unmatched_active_sku" else "9.99",
        "target_compare_at_price": "",
        "pricing_status": "" if reason == "unmatched_active_sku" else "REVIEW: 缺品牌/平台控价",
        "pricing_brand": "" if reason == "unmatched_active_sku" else "JieStar",
        "pricing_source_file": "" if reason == "unmatched_active_sku" else "pricing.xlsx",
        "online_store_url": "https://example.com/products/test",
    }


class ShopifyDraftUnpricedActiveProductsTests(unittest.TestCase):
    def test_build_reports_classifies_full_and_mixed_unresolved_products(self) -> None:
        full_rows = [
            price_row("gid://shopify/Product/1", "v1", "A", "unmatched_active_sku", "Full Missing"),
            price_row("gid://shopify/Product/2", "v2", "B", "unmatched_active_sku", "Mixed Missing"),
            price_row("gid://shopify/Product/2", "v3", "C", "already_current", "Mixed Missing"),
        ]
        unmatched_rows = [full_rows[0], full_rows[1]]
        shipping_rows = [
            {"product_id": "gid://shopify/Product/1", "sku": "A", "vendor": "JieStar"},
            {"product_id": "gid://shopify/Product/2", "sku": "B", "vendor": "JieStar"},
            {"product_id": "gid://shopify/Product/3", "sku": "D", "vendor": "Xbert"},
        ]
        products = {
            "gid://shopify/Product/1": {
                "id": "gid://shopify/Product/1",
                "handle": "full-missing",
                "title": "Full Missing",
                "vendor": "JieStar",
                "status": "ACTIVE",
                "onlineStoreUrl": "https://example.com/products/full-missing",
                "totalVariants": 1,
            },
            "gid://shopify/Product/2": {
                "id": "gid://shopify/Product/2",
                "handle": "mixed-missing",
                "title": "Mixed Missing",
                "vendor": "JieStar",
                "status": "ACTIVE",
                "onlineStoreUrl": "https://example.com/products/mixed-missing",
                "totalVariants": 2,
            },
        }

        product_rows, variant_rows, mixed_rows, hidden_rows, shipping_remaining, shipping_removed, summary = draft_unpriced.build_reports(
            full_rows,
            unmatched_rows,
            shipping_rows,
            products,
        )

        self.assertEqual(summary["draft_product_count"], 2)
        self.assertEqual(summary["full_unresolved_product_count"], 1)
        self.assertEqual(summary["mixed_unresolved_product_count"], 1)
        self.assertEqual(summary["active_variant_count_on_draft_products"], 3)
        self.assertEqual(summary["unmatched_variant_count_on_draft_products"], 2)
        self.assertEqual(summary["priced_sibling_variant_count_on_draft_products"], 1)
        self.assertEqual(summary["shipping_unmatched_removed_by_draft_count"], 2)
        self.assertEqual(summary["shipping_unmatched_remaining_after_draft_count"], 1)
        self.assertEqual(len(product_rows), 2)
        self.assertEqual(len(variant_rows), 3)
        self.assertEqual(len(mixed_rows), 1)
        self.assertEqual(len(hidden_rows), 1)
        self.assertEqual(shipping_removed[0]["sku"], "A")
        self.assertEqual(shipping_remaining[0]["sku"], "D")

    def test_apply_requires_current_candidates_and_rechecks_vendor_and_status(self) -> None:
        admin = FakeAdmin(
            [
                {
                    "id": "gid://shopify/Product/1",
                    "handle": "draft-me",
                    "title": "Draft Me",
                    "vendor": "JieStar",
                    "status": "ACTIVE",
                    "onlineStoreUrl": "https://example.com/products/draft-me",
                    "totalVariants": 1,
                },
                {
                    "id": "gid://shopify/Product/2",
                    "handle": "changed-vendor",
                    "title": "Changed Vendor",
                    "vendor": "Xbert",
                    "status": "ACTIVE",
                    "onlineStoreUrl": "https://example.com/products/changed-vendor",
                    "totalVariants": 1,
                },
            ]
        )
        current_rows = [
            {
                "action": "draft_unpriced_product",
                "product_id": "gid://shopify/Product/1",
                "handle": "draft-me",
                "title": "Draft Me",
                "target_status": "DRAFT",
            },
            {
                "action": "draft_unpriced_product",
                "product_id": "gid://shopify/Product/2",
                "handle": "changed-vendor",
                "title": "Changed Vendor",
                "target_status": "DRAFT",
            },
        ]

        with tempfile.NamedTemporaryFile("w", encoding="utf-8", newline="") as file:
            writer = csv.DictWriter(file, fieldnames=draft_unpriced.PRODUCT_FIELDS, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(current_rows)
            file.flush()

            result = draft_unpriced.apply_approved_plan(admin, current_rows, Path(file.name))

        self.assertEqual(admin.updated, [("gid://shopify/Product/1", "DRAFT")])
        self.assertEqual(result["attempted"], 2)
        self.assertEqual(result["ok"], 1)
        self.assertEqual(result["skipped"], 1)
        self.assertEqual(result["failed"], 0)
        self.assertEqual(result["rows"][1]["reason"], "vendor_changed")


if __name__ == "__main__":
    unittest.main()
