from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

from PIL import Image


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "iblock_asset_quality_audit.py"


def load_module():
    spec = importlib.util.spec_from_file_location("iblock_asset_quality_audit", SCRIPT_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def make_image(path: Path, size: tuple[int, int] = (800, 800), color: tuple[int, int, int] = (255, 255, 255)) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.new("RGB", size, color).save(path)


class IblockAssetQualityAuditTest(unittest.TestCase):
    def test_classifies_standard_normalized_image_roles(self) -> None:
        module = load_module()

        self.assertEqual(module.classify_role("IB1065-白底.jpg"), "white")
        self.assertEqual(module.classify_role("IB1065-sku.jpg"), "sku")
        self.assertEqual(module.classify_role("IB1065-详情-01.jpg"), "detail")
        self.assertEqual(module.classify_role("IB1065-1.jpg"), "main")

    def test_flags_exact_duplicates_inside_one_product_group(self) -> None:
        from tempfile import TemporaryDirectory

        module = load_module()
        with TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            make_image(root / "shopify-products" / "IB1065-IB1068" / "images" / "IB1065__IB1065-1.jpg")
            make_image(root / "shopify-products" / "IB1065-IB1068" / "images" / "IB1066__IB1066-1.jpg")

            issues, summaries = module.audit_product_root(root / "shopify-products")

        duplicate_issues = [issue for issue in issues if issue["issue_type"] == "exact_duplicate_in_product_group"]
        self.assertEqual(len(duplicate_issues), 1)
        self.assertEqual(summaries[0]["exact_duplicate_file_count"], 2)

    def test_flags_short_landscape_detail_image_as_review_only_warning(self) -> None:
        from tempfile import TemporaryDirectory

        module = load_module()
        with TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            make_image(root / "shopify-products" / "IB1065" / "images" / "IB1065__IB1065-详情-01.jpg", size=(1200, 700))

            issues, _summaries = module.audit_product_root(root / "shopify-products")

        self.assertEqual(issues[0]["issue_type"], "detail_image_shape_review")


if __name__ == "__main__":
    unittest.main()
