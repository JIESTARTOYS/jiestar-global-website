from pathlib import Path
import csv
import sys
import tempfile
import unittest
from typing import Optional


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import shopify_variant_option_image_audit as audit


class ShopifyVariantOptionImageAuditTests(unittest.TestCase):
    def test_classifies_cjk_variants_by_same_product_english_sibling_pattern(self) -> None:
        product = self._product(
            handle="bundle",
            variants=[
                self._variant("gid://shopify/ProductVariant/1", "59114", "59114 - 月球探索"),
                self._variant("gid://shopify/ProductVariant/2", "59115", "59115 - lunar probe"),
                self._variant("gid://shopify/ProductVariant/3", "59116", "59116 - space station"),
            ],
        )

        rows = audit.build_variant_name_rows([product])

        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["mode"], "needs_english_by_sibling_pattern")
        self.assertEqual(rows[0]["recommended_value"], "")
        self.assertEqual(rows[0]["approval_status"], "needs_review")
        self.assertIn("59115 - lunar probe", rows[0]["english_sibling_examples"])

    def test_classifies_all_cjk_product_as_sku_only_default(self) -> None:
        product = self._product(
            handle="single",
            variants=[
                self._variant("gid://shopify/ProductVariant/1", "JJ9047", "JJ9047 - 飞屋环游记"),
            ],
        )

        rows = audit.build_variant_name_rows([product])

        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["mode"], "all_values_need_review_or_source")
        self.assertEqual(rows[0]["recommended_value"], "JJ9047")
        self.assertEqual(rows[0]["approval_status"], "sku_only_default")

    def test_detects_tall_variant_image_without_downloading(self) -> None:
        product = self._product(
            handle="long-image",
            variants=[
                self._variant(
                    "gid://shopify/ProductVariant/1",
                    "59002",
                    "59002 - GWR steam train",
                    image={"url": "https://cdn.example/59002.jpg", "width": 750, "height": 7169, "altText": ""},
                ),
            ],
        )

        rows = audit.build_variant_image_rows([product])

        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["verdict"], "FAIL")
        self.assertIn("variant_image_is_tall", rows[0]["reason"])
        self.assertIn("variant_image_is_very_tall", rows[0]["reason"])

    def test_approved_report_rejects_unapproved_chinese_and_empty_values(self) -> None:
        source_rows = [
            {
                "product_id": "gid://shopify/Product/1",
                "handle": "bundle",
                "variant_id": "gid://shopify/ProductVariant/1",
                "variant_sku": "59114",
                "current_value": "59114 - 月球探索",
                "option_name": "SKU",
                "recommended_value": "",
            },
            {
                "product_id": "gid://shopify/Product/1",
                "handle": "bundle",
                "variant_id": "gid://shopify/ProductVariant/2",
                "variant_sku": "59115",
                "current_value": "59115 - lunar probe",
                "option_name": "SKU",
                "recommended_value": "59115 - lunar probe",
            },
        ]

        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "approved.csv"
            with path.open("w", encoding="utf-8", newline="") as file:
                writer = csv.DictWriter(
                    file,
                    fieldnames=[
                        "approved",
                        "product_id",
                        "handle",
                        "variant_id",
                        "variant_sku",
                        "current_value",
                        "option_name",
                        "approved_value",
                    ],
                )
                writer.writeheader()
                writer.writerow(
                    {
                        "approved": "true",
                        "product_id": "gid://shopify/Product/1",
                        "handle": "bundle",
                        "variant_id": "gid://shopify/ProductVariant/1",
                        "variant_sku": "59114",
                        "current_value": "59114 - 月球探索",
                        "option_name": "SKU",
                        "approved_value": "59114 - Moon Exploration",
                    }
                )
                writer.writerow(
                    {
                        "approved": "false",
                        "product_id": "gid://shopify/Product/1",
                        "handle": "bundle",
                        "variant_id": "gid://shopify/ProductVariant/2",
                        "variant_sku": "59115",
                        "current_value": "59115 - lunar probe",
                        "option_name": "SKU",
                        "approved_value": "59115 - 月球探测器",
                    }
                )
                writer.writerow(
                    {
                        "approved": "true",
                        "product_id": "gid://shopify/Product/1",
                        "handle": "bundle",
                        "variant_id": "gid://shopify/ProductVariant/3",
                        "variant_sku": "59116",
                        "current_value": "59116 - space station",
                        "option_name": "SKU",
                        "approved_value": "",
                    }
                )

            plan, errors = audit.load_approved_variant_name_plan(path, source_rows)

        self.assertEqual(
            plan,
            [
                {
                    "product_id": "gid://shopify/Product/1",
                    "handle": "bundle",
                    "variant_id": "gid://shopify/ProductVariant/1",
                    "variant_sku": "59114",
                    "current_value": "59114 - 月球探索",
                    "option_name": "SKU",
                    "approved_value": "59114 - Moon Exploration",
                }
            ],
        )
        self.assertEqual(len(errors), 1)
        self.assertIn("approved_value_empty", errors[0]["error"])

    def _product(self, handle: str, variants: list[dict]) -> dict:
        return {
            "id": f"gid://shopify/Product/{handle}",
            "handle": handle,
            "title": "JIESTAR Bundle Set",
            "vendor": "JieStar",
            "onlineStoreUrl": f"https://example.com/products/{handle}",
            "descriptionHtml": "",
            "media": {"nodes": []},
            "variants": {"nodes": variants},
        }

    def _variant(self, variant_id: str, sku: str, title: str, image: Optional[dict] = None) -> dict:
        return {
            "id": variant_id,
            "sku": sku,
            "title": title,
            "selectedOptions": [{"name": "SKU", "value": title}],
            "image": image,
        }


if __name__ == "__main__":
    unittest.main()
