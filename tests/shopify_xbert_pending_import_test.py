from pathlib import Path
import sys
import tempfile
import unittest


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import shopify_xbert_pending_import as xbert


class XbertImportTests(unittest.TestCase):
    def test_title_uses_xbert_prefix_and_removes_sensitive_brand_terms(self) -> None:
        row = xbert.XbertWorkbookRow(
            sku="66002",
            series="SUV",
            name="THOROUGH HORSE/法拉利纯血",
            package_size="27.5*20*5.5",
            finished_size="8.1*17.2*5.8",
            age="14+",
            notes="451块颗粒数",
            factory_price="26.8",
        )

        title = xbert.title_for_product("66002", row, "66002英文")

        self.assertEqual(title, "Xbert Thorough Horse Building Block Set")
        self.assertNotRegex(title, r"(?i)ferrari|法拉利")

    def test_title_removes_vehicle_model_identifiers(self) -> None:
        row = xbert.XbertWorkbookRow(
            sku="66004",
            series="SUV",
            name="F-150 RAPTOR/福特F-150猛禽",
            package_size="27.5*20*5.5",
            finished_size="19.6*8.1*7.2",
            age="14+",
            notes="457块颗粒数",
            factory_price="29.8",
        )

        title = xbert.title_for_product("66004", row, "66004英文")

        self.assertEqual(title, "Xbert Off-Road Vehicle Building Block Set")
        self.assertNotRegex(title, r"(?i)f-?150|raptor|ford|福特|猛禽")

    def test_title_uses_manual_name_for_local_image_sku_missing_workbook_row(self) -> None:
        title = xbert.title_for_product("66095", None, "66095英文")

        self.assertEqual(title, "Xbert Sierra Madre Fortress Building Block Set")

    def test_image_buckets_moves_vertical_numbered_images_to_detail_images(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            for name in ["66095-1-copy2.jpg", "66095-1.jpg", "66095-2.jpg", "66095-详情.jpg"]:
                (folder / name).write_bytes(b"image")

            sizes = {
                "66095-1-copy2.jpg": (1600, 1600),
                "66095-1.jpg": (790, 9389),
                "66095-2.jpg": (1600, 1600),
                "66095-详情.jpg": (1200, 8000),
            }

            original = xbert.image_dimensions
            xbert.image_dimensions = lambda path: sizes[path.name]
            try:
                buckets = xbert.image_buckets(folder, "66095")
            finally:
                xbert.image_dimensions = original

        self.assertEqual([path.name for path in buckets["numbered"]], ["66095-1-copy2.jpg", "66095-2.jpg"])
        self.assertEqual([path.name for path in buckets["detail"]], ["66095-1.jpg", "66095-详情.jpg"])

    def test_image_buckets_supports_xbert_062_plain_file_names(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            for name in ["1.jpg", "2.jpg", "6-白底.jpg", "66076详情（英）.jpg", "7-透明.png", "尺寸.jpg"]:
                (folder / name).write_bytes(b"image")

            original = xbert.image_dimensions
            xbert.image_dimensions = lambda _path: (1600, 1600)
            try:
                buckets = xbert.image_buckets(folder, "66076")
            finally:
                xbert.image_dimensions = original

        self.assertEqual([path.name for path in buckets["white"]], ["6-白底.jpg"])
        self.assertEqual([path.name for path in buckets["numbered"]], ["1.jpg", "2.jpg"])
        self.assertEqual([path.name for path in buckets["detail"]], ["66076详情（英）.jpg"])
        self.assertEqual([path.name for path in buckets["sku"]], ["尺寸.jpg"])
        self.assertEqual([path.name for path in buckets["transparent"]], ["7-透明.png"])

    def test_title_replaces_vault_33_reference(self) -> None:
        row = xbert.XbertWorkbookRow(
            sku="66145",
            series="摆件系列",
            name="Vault 33/避难所大门",
            package_size="42*30*10.5",
            finished_size="31.0*33.6*15.0",
            age="8+",
            notes="1739块颗粒数",
            factory_price="179",
        )

        title = xbert.title_for_product("66145", row, "66145英文")

        self.assertEqual(title, "Xbert Vault Door Building Block Set")
        self.assertNotRegex(title, r"(?i)vault\\s*33")

    def test_product_type_maps_xbert_062_series_to_website_collections(self) -> None:
        rows = {
            "66076": xbert.XbertWorkbookRow(
                sku="66076",
                series="皇家海盗系列",
                name="rocky reef/岩石礁",
                package_size="23*18*6",
                finished_size="18.6*28.8*18.0",
                age="8+",
                notes="322块颗粒数",
                factory_price="28.5",
            ),
            "66145": xbert.XbertWorkbookRow(
                sku="66145",
                series="摆件系列",
                name="Vault 33/避难所大门",
                package_size="42*30*10.5",
                finished_size="31.0*33.6*15.0",
                age="8+",
                notes="1739块颗粒数",
                factory_price="179",
            ),
            "66223": xbert.XbertWorkbookRow(
                sku="66223",
                series="街景系列",
                name="HAUNTED HOUSE/鬼屋",
                package_size="44*15*30",
                finished_size="24.4*33.3*46.1",
                age="14+",
                notes="2233块颗粒数",
                factory_price="233",
            ),
        }

        self.assertEqual(xbert.product_type_for_row(rows["66076"]), "Pirates")
        self.assertEqual(xbert.product_type_for_row(rows["66145"]), "Movie & Game")
        self.assertEqual(xbert.product_type_for_row(rows["66223"]), "Street View")

    def test_manifest_uses_xbert_vendor_and_reports_workbook_only_skus(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            folder = root / "66001英文"
            folder.mkdir()
            for name in ["66001-白底.jpg", "66001-1.jpg", "66001-sku.jpg", "66001-详情.jpg"]:
                (folder / name).write_bytes(b"image")

            rows = {
                "66001": xbert.XbertWorkbookRow(
                    sku="66001",
                    series="SUV",
                    name="1956 VINTAGE C1/雪佛兰科尔维特 C1",
                    package_size="19.5*15.5*6",
                    finished_size="7.2*16.1*4.7",
                    age="6+",
                    notes="250块颗粒数",
                    factory_price="22.8",
                ),
                "66122": xbert.XbertWorkbookRow(
                    sku="66122",
                    series="飞机",
                    name="航天飞机",
                    package_size="",
                    finished_size="",
                    age="8+",
                    notes="",
                    factory_price="",
                ),
            }

            manifest, skipped, supplements = xbert.build_manifest(root=root, workbook_rows=rows)

        self.assertEqual(len(manifest), 1)
        self.assertEqual(manifest[0]["vendor"], "Xbert")
        self.assertEqual(manifest[0]["price"], "999")
        self.assertEqual(manifest[0]["status"], "ACTIVE")
        self.assertEqual(manifest[0]["variants"][0]["sku"], "66001")
        self.assertEqual(skipped, [])
        self.assertEqual([row["sku"] for row in supplements], ["66122"])
        self.assertEqual(supplements[0]["reason"], "workbook_row_without_local_images")


if __name__ == "__main__":
    unittest.main()
