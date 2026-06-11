from pathlib import Path
import sys
import tempfile
import unittest


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import shopify_cn_pending_import as cn_import


class ShopifyCnPendingImportTests(unittest.TestCase):
    def test_build_manifest_uses_custom_source_root_and_metadata_overrides(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            folder = root / "57026"
            folder.mkdir()
            for name in ["57026-白底.jpg", "57026-1.jpg", "57026-sku.jpg", "57026-详情.jpg"]:
                (folder / name).write_bytes(b"image")

            metadata = {
                "57026": {
                    "title": "JIESTAR Clock Tower Modular Building Block Set",
                    "product_type": "Architecture & Street View",
                    "variant_option_name": "57026 - Clock Tower",
                    "metafields": {
                        "specs.piece_count": "3023",
                        "specs.finished_model_size": "32x31.9x46.9 cm",
                        "specs.package_size": "58x13x47 cm",
                        "specs.recommended_age": "14+",
                        "custom.series": "Architecture & Street View",
                    },
                }
            }

            original = cn_import.base_import.load_workbook_rows
            cn_import.base_import.load_workbook_rows = lambda: {}
            try:
                manifest, skipped = cn_import.build_manifest(source_root=root, metadata=metadata)
            finally:
                cn_import.base_import.load_workbook_rows = original

        self.assertEqual(skipped, [])
        self.assertEqual(len(manifest), 1)
        item = manifest[0]
        self.assertEqual(item["title"], "JIESTAR Clock Tower Modular Building Block Set")
        self.assertEqual(item["product_type"], "Architecture & Street View")
        self.assertEqual(item["variants"][0]["option_name"], "57026 - Clock Tower")
        self.assertEqual(item["metafields"]["specs.piece_count"], "3023")
        self.assertEqual(item["metafields"]["specs.finished_model_size"], "32x31.9x46.9 cm")
        self.assertFalse(item["missing"]["workbook_rows"])


if __name__ == "__main__":
    unittest.main()
