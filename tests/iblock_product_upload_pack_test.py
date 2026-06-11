from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

from PIL import Image


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "iblock_product_upload_pack.py"


def load_module():
    spec = importlib.util.spec_from_file_location("iblock_product_upload_pack", SCRIPT_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def make_image(path: Path, size: tuple[int, int] = (800, 800), color: tuple[int, int, int] = (255, 255, 255)) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.new("RGB", size, color).save(path)


class IblockProductUploadPackTest(unittest.TestCase):
    def test_skips_unreadable_images_and_dedupes_main_detail_only(self) -> None:
        from tempfile import TemporaryDirectory

        module = load_module()
        with TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            source = root / "shopify-products"
            target = root / "shopify-products-upload-ready"
            image_dir = source / "IB1065-IB1068" / "images"

            make_image(image_dir / "IB1065__IB1065-1.jpg")
            make_image(image_dir / "IB1066__IB1066-1.jpg")
            make_image(image_dir / "IB1065__IB1065-详情-01.jpg", size=(800, 1200))
            make_image(image_dir / "IB1066__IB1066-详情-01.jpg", size=(800, 1200))
            make_image(image_dir / "IB1065__IB1065-详情-02.jpg")
            make_image(image_dir / "IB1065__IB1065-白底.jpg")
            make_image(image_dir / "IB1066__IB1066-白底.jpg")
            bad = image_dir / "IB1065__IB1065-详情-03.png"
            bad.write_bytes(b"")

            summary, assets, skipped = module.build_upload_ready_pack(source, target)

            kept_names = {Path(row["target"]).name for row in assets}
            skipped_names = {Path(row["source"]).name for row in skipped}

        self.assertEqual(summary[0]["input_image_count"], 8)
        self.assertEqual(summary[0]["kept_image_count"], 4)
        self.assertIn("IB1065__IB1065-1.jpg", kept_names)
        self.assertNotIn("IB1066__IB1066-1.jpg", kept_names)
        self.assertIn("IB1065__IB1065-详情-01.jpg", kept_names)
        self.assertNotIn("IB1066__IB1066-详情-01.jpg", kept_names)
        self.assertIn("IB1065__IB1065-白底.jpg", kept_names)
        self.assertIn("IB1066__IB1066-白底.jpg", kept_names)
        self.assertNotIn("IB1065__IB1065-详情-02.jpg", kept_names)
        self.assertIn("IB1065__IB1065-详情-03.png", skipped_names)


if __name__ == "__main__":
    unittest.main()
