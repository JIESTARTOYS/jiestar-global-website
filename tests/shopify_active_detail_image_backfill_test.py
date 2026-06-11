from pathlib import Path
import struct
import sys
import tempfile
import unittest
import zlib


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import shopify_active_detail_image_backfill as backfill


def write_png(path: Path, width: int, height: int) -> None:
    raw = b"".join(b"\x00" + b"\xff\xff\xff" * width for _ in range(height))

    def chunk(kind: bytes, data: bytes) -> bytes:
        checksum = zlib.crc32(kind + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", checksum)

    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw))
        + chunk(b"IEND", b"")
    )


class ShopifyActiveDetailImageBackfillTests(unittest.TestCase):
    def test_exact_sku_long_image_is_detail_candidate(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            folder = root / "92000"
            folder.mkdir()
            write_png(folder / "92000.png", 900, 3000)
            write_png(folder / "1.png", 800, 800)

            row = {"handle": "p", "title": "Product", "product_id": "gid://shopify/Product/1", "skus": "92000"}
            candidates = backfill.find_detail_candidates(row, [root])

            self.assertEqual([candidate.path.name for candidate in candidates], ["92000.png"])
            self.assertEqual(candidates[0].reason, "long_exact_sku_or_combo_file")

    def test_square_main_image_is_not_detail_candidate(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            folder = root / "92000"
            folder.mkdir()
            write_png(folder / "92000.png", 800, 800)

            row = {"handle": "p", "title": "Product", "product_id": "gid://shopify/Product/1", "skus": "92000"}
            candidates = backfill.find_detail_candidates(row, [root])

            self.assertEqual(candidates, [])

    def test_chinese_named_long_image_in_sku_folder_is_detail_candidate(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            folder = root / "89143带人仔"
            folder.mkdir()
            write_png(folder / "克劳斯89143.png", 900, 3000)
            write_png(folder / "89143-sku.png", 800, 800)

            row = {"handle": "p", "title": "Product", "product_id": "gid://shopify/Product/1", "skus": "89143"}
            candidates = backfill.find_detail_candidates(row, [root])

            self.assertEqual([candidate.path.name for candidate in candidates], ["克劳斯89143.png"])
            self.assertEqual(candidates[0].reason, "long_image_in_matched_sku_folder")

    def test_bundle_can_use_long_image_from_matched_bundle_folder(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            bundle_folder = root / "51000-51008"
            bundle_folder.mkdir()
            write_png(bundle_folder / "工程车组合长图.png", 900, 4000)

            row = {
                "handle": "bundle",
                "title": "Bundle",
                "product_id": "gid://shopify/Product/2",
                "skus": "51000|51001|51002|51003|51004|51005|51006|51007|51008",
            }
            candidates = backfill.find_detail_candidates(row, [root])

            self.assertEqual([candidate.path.name for candidate in candidates], ["工程车组合长图.png"])
            self.assertEqual(candidates[0].reason, "long_image_in_matched_sku_folder")

    def test_dry_run_does_not_write_to_shopify(self) -> None:
        class FakeAdmin:
            def __init__(self) -> None:
                self.calls: list[str] = []

            def file_create(self, path: Path, alt: str) -> str:
                self.calls.append(f"file_create:{path.name}:{alt}")
                return "https://cdn.example/detail.png"

            def product_update_description(self, product_id: str, description_html: str) -> None:
                self.calls.append(f"product_update_description:{product_id}:{description_html}")

        admin = FakeAdmin()
        row = {
            "action": "ready_to_backfill",
            "product_id": "gid://shopify/Product/3",
            "handle": "dry-run-product",
            "title": "Dry Run Product",
            "detail_paths": '["/tmp/detail.png"]',
        }

        results = backfill.apply_plan_rows([row], admin, dry_run=True)

        self.assertEqual(admin.calls, [])
        self.assertEqual(results[0]["result"], "dry_run_ready")

    def test_write_admin_class_has_upload_methods(self) -> None:
        admin_class = backfill.write_admin_class()

        self.assertTrue(hasattr(admin_class, "file_create"))
        self.assertTrue(hasattr(admin_class, "product_update_description"))

    def test_select_plan_rows_filters_ready_rows_by_limit_and_handle(self) -> None:
        rows = [
            {"action": "manual_review_no_detail_candidate", "handle": "manual"},
            {"action": "ready_to_backfill", "handle": "first"},
            {"action": "ready_to_backfill", "handle": "second"},
        ]

        selected = backfill.select_plan_rows(rows, limit=1, handles={"second"})

        self.assertEqual([row["handle"] for row in selected], ["second"])


if __name__ == "__main__":
    unittest.main()
