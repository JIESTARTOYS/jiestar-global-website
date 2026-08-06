from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import shopify_guly_pending_import as guly


class GulyPendingImportTests(unittest.TestCase):
    def test_detail_upload_reuses_ready_shopify_files(self) -> None:
        class FakeAdmin:
            def __init__(self):
                self.created = []

            def existing_detail_urls(self, _item):
                return {"GULY W16 Engine Model Kit 60556 details 1": "https://cdn.example/1.jpg"}

            def file_create(self, path, alt):
                self.created.append((path.name, alt))
                return "https://cdn.example/2.jpg"

        admin = FakeAdmin()
        item = {
            "base": "60556",
            "title": "GULY W16 Engine Model Kit 60556",
            "detail_images": ["/tmp/1.jpg", "/tmp/2.jpg"],
        }

        with patch(
            "shopify_guly_pending_import.detail_image_paths",
            side_effect=lambda path, _sku: [path],
        ):
            urls = guly.upload_detail_images_for_item(admin, item)

        self.assertEqual(
            urls,
            ["https://cdn.example/1.jpg", "https://cdn.example/2.jpg"],
        )
        self.assertEqual(
            admin.created,
            [("2.jpg", "GULY W16 Engine Model Kit 60556 details 2")],
        )

    def test_manifest_scoped_existing_check_uses_exact_handle_and_sku_terms(self) -> None:
        admin = object.__new__(guly.ShopifyAdmin)
        calls = []

        def graphql(_query, variables):
            calls.append(variables)
            return {
                "products": {
                    "nodes": [
                        {
                            "handle": "guly-w16-engine-model-kit-60556",
                            "variants": {"nodes": [{"sku": "60556"}]},
                        }
                    ]
                }
            }

        admin.graphql = graphql
        handles, skus = admin.products_index_for_manifest(
            [
                {
                    "handle": "guly-w16-engine-model-kit-60556",
                    "variants": [{"sku": "60556"}],
                }
            ]
        )

        self.assertEqual(handles, {"guly-w16-engine-model-kit-60556"})
        self.assertEqual(skus, {"60556"})
        self.assertEqual(
            calls,
            [{"query": "handle:guly-w16-engine-model-kit-60556 OR sku:60556"}],
        )

    def test_80508_single_sku_root_uses_metadata_and_preferred_image_buckets(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "80508-中英推广图"
            upload = root / "英" / "电商上传图"
            (upload / "主图" / "800").mkdir(parents=True)
            (upload / "主图" / "750").mkdir(parents=True)
            (upload / "详情页" / "790").mkdir(parents=True)
            (upload / "详情页" / "750").mkdir(parents=True)
            (root / "英" / "白底尺寸图").mkdir(parents=True)
            (root / "英" / "推广图").mkdir(parents=True)

            for path in [
                upload / "白底图.jpg",
                root / "英" / "白底尺寸图" / "白底尺寸图.jpg",
                root / "英" / "推广图" / "80508-推广图.jpg",
            ]:
                path.write_bytes(b"image")
            for index in range(1, 6):
                (upload / "主图" / "800" / f"800主图-{index}.jpg").write_bytes(b"image")
                (upload / "主图" / "750" / f"750主图-{index}.jpg").write_bytes(b"image")
            for index in range(1, 13):
                (upload / "详情页" / "790" / f"80508-详情-790({index}).jpg").write_bytes(b"image")
                (upload / "详情页" / "750" / f"80508-详情-750({index}).jpg").write_bytes(b"image")

            metadata = {
                "80508": {
                    "sku": "80508",
                    "title": "GULY Shadowed Wing Mecha Model Kit 80508",
                    "original_name_cn": "机甲系列-魔兽多拉",
                    "product_type": "Mecha",
                    "series": "Mecha",
                    "piece_count": "3975",
                    "recommended_age": "8+",
                    "package_size": "42.7x14.3x49.8 cm",
                    "finished_model_size": "106x71.2x87 cm",
                    "source_note": "local promo image + size image",
                }
            }

            manifest, skipped, quote_rows = guly.build_manifest(
                source_root=root,
                metadata_rows=metadata,
                sku_filter={"80508"},
            )

        self.assertEqual(skipped, [])
        self.assertEqual(quote_rows, [])
        self.assertEqual(len(manifest), 1)
        item = manifest[0]
        self.assertEqual(item["base"], "80508")
        self.assertEqual(item["title"], "GULY Shadowed Wing Mecha Model Kit 80508")
        self.assertEqual(item["product_type"], "Mecha")
        self.assertEqual(item["metafields"]["specs.piece_count"], "3975")
        self.assertEqual(item["metafields"]["specs.recommended_age"], "8+")
        self.assertEqual(item["metafields"]["specs.package_size"], "42.7x14.3x49.8 cm")
        self.assertEqual(item["metafields"]["specs.finished_model_size"], "106x71.2x87 cm")
        self.assertEqual(item["metafields"]["custom.series"], "Mecha")
        self.assertEqual([Path(path).name for path in item["main_media"]], ["白底图.jpg"] + [f"800主图-{index}.jpg" for index in range(1, 6)])
        self.assertEqual([Path(path).name for path in item["sku_images"]], ["白底尺寸图.jpg"])
        self.assertEqual(len(item["detail_images"]), 12)
        self.assertTrue(all("790" in str(path) for path in item["detail_images"]))
        self.assertFalse(any(Path(path).name == "80508-推广图.jpg" for path in item["main_media"]))
        self.assertFalse(item["missing"]["sku_image_fallback_to_white"])


if __name__ == "__main__":
    unittest.main()
