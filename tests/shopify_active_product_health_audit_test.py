from pathlib import Path
import sys
import unittest


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import shopify_active_product_health_audit as health


class ShopifyActiveProductHealthAuditTests(unittest.TestCase):
    def test_content_row_flags_chinese_sku_and_missing_metafields(self) -> None:
        product = {
            "id": "gid://shopify/Product/1",
            "handle": "sample-product",
            "title": "JIESTAR Sample Building Block Set",
            "status": "ACTIVE",
            "vendor": "JieStar",
            "descriptionHtml": '<p><img src="detail-1.jpg"><img src="detail-2.jpg"></p>',
            "onlineStoreUrl": "https://example.com/products/sample-product",
            "category": {"id": health.INTERLOCKING_BLOCKS_ID, "fullName": "Toys > Building Toys > Interlocking Blocks"},
            "featuredMedia": {"mediaContentType": "IMAGE"},
            "media": {
                "nodes": [
                    {"mediaContentType": "IMAGE"},
                    {"mediaContentType": "IMAGE"},
                ]
            },
            "variants": {
                "nodes": [
                    {
                        "id": "gid://shopify/ProductVariant/1",
                        "title": "Default Title",
                        "sku": "测试SKU",
                        "price": "999.00",
                        "inventoryItem": {"tracked": False},
                        "image": {"url": "https://example.com/main.jpg"},
                    }
                ]
            },
            "resourcePublications": {
                "nodes": [
                    {"isPublished": True, "publication": {"name": "Online Store"}},
                ]
            },
            "metafields": {
                "nodes": [
                    {"namespace": "specs", "key": "piece_count", "value": "123", "type": "number_integer"},
                ]
            },
        }

        issues, _summary = health.audit_products([product])
        rows = health.build_content_audit_rows([product], issues)

        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["detail_image_count"], "2")
        self.assertEqual(rows[0]["media_count"], "2")
        self.assertEqual(rows[0]["skus"], "测试SKU")
        self.assertIn("variant_sku_contains_chinese", rows[0]["critical_issues"])
        self.assertIn("specs.recommended_age", rows[0]["missing_required_metafields"])
        self.assertIn("specs.finished_model_size", rows[0]["missing_required_metafields"])
        self.assertIn("specs.package_size", rows[0]["missing_required_metafields"])
        self.assertEqual(rows[0]["recommended_action"], "fix_critical_issues")

    def test_zoin_missing_piece_count_is_known_gap(self) -> None:
        product = {
            "id": "gid://shopify/Product/2",
            "handle": "zoin-known-piece-gap",
            "title": "Zoin Known Piece Gap Building Block Set",
            "status": "ACTIVE",
            "vendor": "Zoin",
            "descriptionHtml": '<p><img src="detail.jpg"></p>',
            "onlineStoreUrl": "https://example.com/products/zoin-known-piece-gap",
            "category": {"id": health.INTERLOCKING_BLOCKS_ID, "fullName": "Toys > Building Toys > Interlocking Blocks"},
            "featuredMedia": {"mediaContentType": "IMAGE"},
            "media": {"nodes": [{"mediaContentType": "IMAGE"}]},
            "variants": {
                "nodes": [
                    {
                        "id": "gid://shopify/ProductVariant/2",
                        "title": "Default Title",
                        "sku": "GK601",
                        "price": "999.00",
                        "inventoryItem": {"tracked": False},
                        "image": {"url": "https://example.com/main.jpg"},
                    }
                ]
            },
            "resourcePublications": {"nodes": [{"isPublished": True, "publication": {"name": "Online Store"}}]},
            "metafields": {
                "nodes": [
                    {"namespace": "specs", "key": "recommended_age", "value": "8+", "type": "single_line_text_field"},
                    {"namespace": "specs", "key": "finished_model_size", "value": "See product package", "type": "single_line_text_field"},
                    {"namespace": "specs", "key": "package_size", "value": "12x6x10", "type": "single_line_text_field"},
                ]
            },
        }

        issues, _summary = health.audit_products([product])
        rows = health.build_content_audit_rows([product], issues)

        self.assertNotIn("missing_metafield_piece_count", rows[0]["warning_issues"])
        self.assertNotIn("specs.piece_count", rows[0]["missing_required_metafields"])

    def test_known_unknown_piece_count_sku_is_known_gap(self) -> None:
        product = {
            "id": "gid://shopify/Product/4",
            "handle": "87010-jiestar-building-block-set-87010",
            "title": "JIESTAR Dinosaur Building Set",
            "status": "ACTIVE",
            "vendor": "JieStar",
            "descriptionHtml": '<p><img src="detail.jpg"></p>',
            "onlineStoreUrl": "https://example.com/products/87010-jiestar-building-block-set-87010",
            "category": {"id": health.INTERLOCKING_BLOCKS_ID, "fullName": "Toys > Building Toys > Interlocking Blocks"},
            "featuredMedia": {"mediaContentType": "IMAGE"},
            "media": {"nodes": [{"mediaContentType": "IMAGE"}]},
            "variants": {
                "nodes": [
                    {
                        "id": "gid://shopify/ProductVariant/4",
                        "title": "Default Title",
                        "sku": "87010",
                        "price": "999.00",
                        "inventoryItem": {"tracked": False},
                        "image": {"url": "https://example.com/main.jpg"},
                    }
                ]
            },
            "resourcePublications": {"nodes": [{"isPublished": True, "publication": {"name": "Online Store"}}]},
            "metafields": {
                "nodes": [
                    {"namespace": "specs", "key": "recommended_age", "value": "6+", "type": "single_line_text_field"},
                    {"namespace": "specs", "key": "finished_model_size", "value": "Variable", "type": "single_line_text_field"},
                    {"namespace": "specs", "key": "package_size", "value": "31x46.5x62.5", "type": "single_line_text_field"},
                ]
            },
        }

        issues, _summary = health.audit_products([product])
        rows = health.build_content_audit_rows([product], issues)

        self.assertNotIn("missing_metafield_piece_count", rows[0]["warning_issues"])
        self.assertNotIn("specs.piece_count", rows[0]["missing_required_metafields"])

    def test_non_jiestar_building_block_set_suffix_is_not_mechanical_title_issue(self) -> None:
        product = {
            "id": "gid://shopify/Product/3",
            "handle": "xbert-sample-product",
            "title": "Xbert Sample Vehicle Building Block Set",
            "status": "ACTIVE",
            "vendor": "Xbert",
            "descriptionHtml": '<p><img src="detail.jpg"></p>',
            "onlineStoreUrl": "https://example.com/products/xbert-sample-product",
            "category": {"id": health.INTERLOCKING_BLOCKS_ID, "fullName": "Toys > Building Toys > Interlocking Blocks"},
            "featuredMedia": {"mediaContentType": "IMAGE"},
            "media": {"nodes": [{"mediaContentType": "IMAGE"}]},
            "variants": {
                "nodes": [
                    {
                        "id": "gid://shopify/ProductVariant/3",
                        "title": "Default Title",
                        "sku": "66000",
                        "price": "999.00",
                        "inventoryItem": {"tracked": False},
                        "image": {"url": "https://example.com/main.jpg"},
                    }
                ]
            },
            "resourcePublications": {"nodes": [{"isPublished": True, "publication": {"name": "Online Store"}}]},
            "metafields": {
                "nodes": [
                    {"namespace": "specs", "key": "piece_count", "value": "100", "type": "number_integer"},
                    {"namespace": "specs", "key": "recommended_age", "value": "8+", "type": "single_line_text_field"},
                    {"namespace": "specs", "key": "finished_model_size", "value": "10x10x10", "type": "single_line_text_field"},
                    {"namespace": "specs", "key": "package_size", "value": "20x20x20", "type": "single_line_text_field"},
                ]
            },
        }

        issues, _summary = health.audit_products([product])
        rows = health.build_content_audit_rows([product], issues)

        self.assertNotIn("title_still_mechanical", rows[0]["warning_issues"])

    def test_xbert_and_zoin_are_allowed_active_vendors(self) -> None:
        products = []
        for index, vendor in enumerate(["Xbert", "Zoin"], start=10):
            products.append(
                {
                    "id": f"gid://shopify/Product/{index}",
                    "handle": f"{vendor.lower()}-sample-product",
                    "title": f"{vendor} Sample Product Building Block Set",
                    "status": "ACTIVE",
                    "vendor": vendor,
                    "descriptionHtml": '<p><img src="detail.jpg"></p>',
                    "onlineStoreUrl": f"https://example.com/products/{vendor.lower()}-sample-product",
                    "category": {"id": health.INTERLOCKING_BLOCKS_ID, "fullName": "Toys > Building Toys > Interlocking Blocks"},
                    "featuredMedia": {"mediaContentType": "IMAGE"},
                    "media": {"nodes": [{"mediaContentType": "IMAGE"}]},
                    "variants": {
                        "nodes": [
                            {
                                "id": f"gid://shopify/ProductVariant/{index}",
                                "title": "Default Title",
                                "sku": f"{vendor.upper()}{index}",
                                "price": "999.00",
                                "inventoryItem": {"tracked": False},
                                "image": {"url": "https://example.com/main.jpg"},
                            }
                        ]
                    },
                    "resourcePublications": {"nodes": [{"isPublished": True, "publication": {"name": "Online Store"}}]},
                    "metafields": {
                        "nodes": [
                            {"namespace": "specs", "key": "piece_count", "value": "100", "type": "number_integer"},
                            {"namespace": "specs", "key": "recommended_age", "value": "8+", "type": "single_line_text_field"},
                            {"namespace": "specs", "key": "finished_model_size", "value": "10x10x10", "type": "single_line_text_field"},
                            {"namespace": "specs", "key": "package_size", "value": "20x20x20", "type": "single_line_text_field"},
                        ]
                    },
                }
            )

        issues, _summary = health.audit_products(products)

        self.assertNotIn("vendor_not_jiestar", {issue["issue"] for issue in issues})

    def test_bundle_titles_do_not_create_similar_title_groups(self) -> None:
        products = [
            self._healthy_product(
                "gid://shopify/Product/20",
                "59100-59103-jiestar-aerospace-building-block-set-3-pack",
                "JIESTAR Aerospace Bundle Set 3-Pack",
                ["59100", "59102", "59103"],
            ),
            self._healthy_product(
                "gid://shopify/Product/21",
                "59114-59116-jiestar-aerospace-building-block-set-3-pack",
                "JIESTAR Aerospace Bundle Set 3-Pack",
                ["59114", "59115", "59116"],
            ),
        ]

        issues, _summary = health.audit_products(products)

        self.assertNotIn("similar_title_group", {issue["issue"] for issue in issues})

    def test_single_sku_duplicate_titles_still_create_similar_title_group(self) -> None:
        products = [
            self._healthy_product(
                "gid://shopify/Product/30",
                "91005-jiestar-cement-mixer-truck-building-block-set",
                "JIESTAR Cement Mixer Truck Model Kit",
                ["91005"],
            ),
            self._healthy_product(
                "gid://shopify/Product/31",
                "ff11012-jiestar-building-block-set-ff11012",
                "JIESTAR Cement Mixer Truck Model Kit",
                ["FF11012"],
            ),
        ]

        issues, _summary = health.audit_products(products)

        self.assertIn("similar_title_group", {issue["issue"] for issue in issues})

    def test_series_style_titles_do_not_create_similar_title_groups(self) -> None:
        products = [
            self._healthy_product(
                "gid://shopify/Product/40",
                "37300-jiestar-cute-pet-paradise-series-6-small-styles-building-block-set",
                "JIESTAR Cute Pet Paradise Series [6 Small Styles] Building Set",
                ["37300"],
            ),
            self._healthy_product(
                "gid://shopify/Product/41",
                "58012-jiestar-cute-pet-paradise-series-6-small-styles-building-block-set",
                "JIESTAR Cute Pet Paradise Series [6 Small Styles] Building Set",
                ["58012"],
            ),
        ]

        issues, _summary = health.audit_products(products)

        self.assertNotIn("similar_title_group", {issue["issue"] for issue in issues})

    def _healthy_product(self, product_id: str, handle: str, title: str, skus: list[str]) -> dict:
        return {
            "id": product_id,
            "handle": handle,
            "title": title,
            "status": "ACTIVE",
            "vendor": "JieStar",
            "descriptionHtml": '<p><img src="detail.jpg"></p>',
            "onlineStoreUrl": f"https://example.com/products/{handle}",
            "category": {"id": health.INTERLOCKING_BLOCKS_ID, "fullName": "Toys > Building Toys > Interlocking Blocks"},
            "featuredMedia": {"mediaContentType": "IMAGE"},
            "media": {"nodes": [{"mediaContentType": "IMAGE"}]},
            "variants": {
                "nodes": [
                    {
                        "id": f"gid://shopify/ProductVariant/{sku}",
                        "title": sku,
                        "sku": sku,
                        "price": "999.00",
                        "inventoryItem": {"tracked": False},
                        "image": {"url": "https://example.com/main.jpg"},
                    }
                    for sku in skus
                ]
            },
            "resourcePublications": {"nodes": [{"isPublished": True, "publication": {"name": "Online Store"}}]},
            "metafields": {
                "nodes": [
                    {"namespace": "specs", "key": "piece_count", "value": "100", "type": "number_integer"},
                    {"namespace": "specs", "key": "recommended_age", "value": "8+", "type": "single_line_text_field"},
                    {"namespace": "specs", "key": "finished_model_size", "value": "10x10x10", "type": "single_line_text_field"},
                    {"namespace": "specs", "key": "package_size", "value": "20x20x20", "type": "single_line_text_field"},
                ]
            },
        }


if __name__ == "__main__":
    unittest.main()
