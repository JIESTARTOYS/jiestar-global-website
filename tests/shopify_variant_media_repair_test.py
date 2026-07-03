from pathlib import Path
import csv
import sys
import tempfile
import unittest

from PIL import Image


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import shopify_variant_media_repair as repair


class ShopifyVariantMediaRepairTests(unittest.TestCase):
    def test_xbert_repair_prefers_square_dimension_image_over_tall_sku_image(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            folder = root / "66058英文"
            folder.mkdir()
            tall_sku = root / "66058.jpg"
            square_size = folder / "尺寸.jpg"
            self._image(tall_sku, (1279, 3191))
            self._image(square_size, (2000, 2000))
            self._image(folder / "1.jpg", (2000, 2000))

            item = {
                "folder_path": str(folder),
                "sku_images": [str(tall_sku)],
                "main_media": [str(folder / "1.jpg")],
            }

            choice = repair.choose_local_variant_image(item)

        self.assertIsNotNone(choice)
        self.assertEqual(Path(choice["source_path"]).name, "尺寸.jpg")
        self.assertEqual(choice["source_kind"], "local_dimension_image")

    def test_detail_parts_slice_tall_detail_image(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            detail = Path(tmp) / "66058详情（英）.jpg"
            self._image(detail, (200, 7201))
            item = {"detail_images": [str(detail)]}

            parts = repair.detail_upload_paths_for_item(item)

        self.assertGreaterEqual(len(parts), 2)
        self.assertTrue(all(path.exists() for path in parts))

    def test_single_variant_jie_star_missing_image_uses_first_existing_media(self) -> None:
        product = self._product(
            vendor="JieStar",
            media=[
                self._media("gid://shopify/MediaImage/1", "https://cdn.example/main_0.webp"),
                self._media("gid://shopify/MediaImage/2", "https://cdn.example/main_1.jpg"),
            ],
            variants=[self._variant("gid://shopify/ProductVariant/1", "JJ9236", "Default Title")],
        )
        issue = {
            "verdict": "REVIEW",
            "reason": "variant_missing_image",
            "variant_sku": "JJ9236",
            "handle": "flowers",
            "product_title": "JIESTAR Flowers Building Set",
        }

        row = repair.build_plan_row(product, product["variants"]["nodes"][0], issue, {})

        self.assertEqual(row["action"], "attach_existing_media")
        self.assertEqual(row["replacement_media_id"], "gid://shopify/MediaImage/1")
        self.assertEqual(row["replacement_source_kind"], "fallback_first_media")

    def test_tall_variant_image_detach_uses_product_media_id_not_legacy_product_image_id(self) -> None:
        product = self._product(
            vendor="Xbert",
            media=[
                self._media("gid://shopify/MediaImage/9", "https://cdn.example/66058.jpg"),
            ],
            variants=[
                self._variant(
                    "gid://shopify/ProductVariant/1",
                    "66058",
                    "66058 - Chainaxe",
                    image={"id": "gid://shopify/ProductImage/9", "url": "https://cdn.example/66058.jpg"},
                )
            ],
        )
        issue = {
            "verdict": "FAIL",
            "reason": "variant_image_is_tall",
            "variant_sku": "66058",
            "image_url": "https://cdn.example/66058.jpg",
        }

        row = repair.build_plan_row(product, product["variants"]["nodes"][0], issue, {})

        self.assertEqual(row["old_media_id"], "gid://shopify/MediaImage/9")

    def test_approved_report_rejects_unapproved_missing_ids_and_missing_replacement(self) -> None:
        source_rows = [
            {
                "approved": "true",
                "action": "upload_local_media",
                "product_id": "gid://shopify/Product/1",
                "variant_id": "gid://shopify/ProductVariant/1",
                "variant_sku": "66058",
                "replacement_source_path": "/tmp/66058-size.jpg",
                "replacement_media_id": "",
            }
        ]

        with tempfile.TemporaryDirectory() as tmp:
            replacement = Path(tmp) / "66058-size.jpg"
            self._image(replacement, (2000, 2000))
            source_rows[0]["replacement_source_path"] = str(replacement)
            path = Path(tmp) / "approved.csv"
            with path.open("w", encoding="utf-8", newline="") as file:
                writer = csv.DictWriter(file, fieldnames=repair.PLAN_FIELDNAMES)
                writer.writeheader()
                writer.writerow(source_rows[0])
                invalid = dict(source_rows[0])
                invalid["variant_id"] = ""
                writer.writerow(invalid)
                unapproved = dict(source_rows[0])
                unapproved["approved"] = "false"
                writer.writerow(unapproved)

            approved, errors = repair.load_approved_plan(path)

        self.assertEqual(len(approved), 1)
        self.assertEqual(len(errors), 1)
        self.assertIn("missing_variant_id", errors[0]["error"])

    def _image(self, path: Path, size: tuple[int, int]) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        Image.new("RGB", size, "white").save(path, format="JPEG")

    def _product(self, vendor: str, media: list[dict], variants: list[dict]) -> dict:
        return {
            "id": "gid://shopify/Product/1",
            "title": "JIESTAR Flowers Building Set",
            "handle": "flowers",
            "vendor": vendor,
            "descriptionHtml": "",
            "media": {"nodes": media},
            "variants": {"nodes": variants},
        }

    def _media(self, media_id: str, url: str) -> dict:
        return {
            "id": media_id,
            "alt": "",
            "mediaContentType": "IMAGE",
            "image": {"url": url},
        }

    def _variant(self, variant_id: str, sku: str, title: str, image=None) -> dict:
        return {
            "id": variant_id,
            "sku": sku,
            "title": title,
            "image": image,
            "media": {"nodes": []},
        }


if __name__ == "__main__":
    unittest.main()
