from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "iblock_shopify_readiness.py"


def load_module():
    spec = importlib.util.spec_from_file_location("iblock_shopify_readiness", SCRIPT_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class IblockShopifyReadinessTest(unittest.TestCase):
    def test_upload_group_uses_multi_sku_except_guohun_singles(self) -> None:
        module = load_module()

        self.assertEqual(module.upload_group_for_sku("IB1076"), ("IB1076-IB1081", "MULTI_SKU_PRODUCT"))
        self.assertEqual(module.upload_group_for_sku("IB1081"), ("IB1076-IB1081", "MULTI_SKU_PRODUCT"))
        self.assertEqual(module.upload_group_for_sku("IB1101"), ("IB1101", "SINGLE_SKU_PRODUCT"))
        self.assertEqual(module.upload_group_for_sku("IB1101-1"), ("IB1101-1-IB1101-4", "MULTI_SKU_PRODUCT"))
        self.assertEqual(module.upload_group_for_sku("IB1104-4"), ("IB1104-1-IB1104-4", "MULTI_SKU_PRODUCT"))
        self.assertEqual(module.upload_group_for_sku("IB1401-6"), ("IB1401-1-IB1401-6", "MULTI_SKU_PRODUCT"))
        self.assertEqual(module.upload_group_for_sku("IB1401-8"), ("IB1401-8", "SINGLE_SKU_PRODUCT"))
        self.assertEqual(module.upload_group_for_sku("IB2001-12"), ("IB2001-1-IB2001-12", "MULTI_SKU_PRODUCT"))
        self.assertEqual(module.upload_group_for_sku("IB2202-9"), ("IB2202-1-IB2202-9", "MULTI_SKU_PRODUCT"))
        self.assertEqual(module.upload_group_for_sku("IB1204"), ("IB1204", "SINGLE_SKU_PRODUCT"))

    def test_safe_title_replaces_ip_sensitive_terms(self) -> None:
        module = load_module()

        self.assertEqual(
            module.safe_shopify_title("IB1063", "封神战甲录", "齐天圣甲-悟空"),
            "iBlock Mythic Monkey Warrior Mecha Building Block Set",
        )
        self.assertEqual(
            module.safe_shopify_title("IB1207", "国魂·重器崛起", "军事无人机"),
            "iBlock Military Drone Model Building Block Set",
        )
        self.assertEqual(
            module.safe_shopify_title("IB1117", "城市梦英雄之治愈小队", "治愈小队-救护车"),
            "iBlock Medical Care Team Ambulance Building Block Set",
        )
        self.assertEqual(
            module.safe_shopify_title("IB1301-1", "MINI战线", "T-25战线坦克"),
            "iBlock Military Tank Mini Building Block Set",
        )
        self.assertEqual(
            module.safe_shopify_title("IB2101-1", "四时花境", "春-花予新生"),
            "iBlock Seasonal Flower Garden 1 Building Block Set",
        )
        self.assertEqual(module.ip_sensitive_terms_found("T-25战线坦克"), "T-25")

    def test_local_aliases_include_model_codes(self) -> None:
        module = load_module()

        self.assertIn("T25", module.local_aliases("IB1301-1", "T-25战线坦克"))
        self.assertIn("Z10", module.local_aliases("IB1301-5", "Z-10武装直升机"))
        self.assertIn("救护车", module.local_aliases("IB1117", "治愈小队-救护车"))
        self.assertEqual(module.explicit_sku_bases_in_text("iB1204_99A坦克机甲"), {"IB1204"})

    def test_subsku_local_search_does_not_match_parent_only_assets(self) -> None:
        from tempfile import TemporaryDirectory

        module = load_module()
        with TemporaryDirectory() as temp_dir:
            source = Path(temp_dir)
            parent_only = source / "iB1001_玩酷份子十二生肖_(1-12)" / "iblock_ib1001-十二生肖_兔_电商_JPG" / "兔_白底图_800x800.jpg"
            exact_child = source / "iB1001_玩酷份子十二生肖_(1-12)" / "iblock_ib1001-10_电商_JPG" / "IB1001-10_白底图_800x800.jpg"
            parent_only.parent.mkdir(parents=True)
            parent_only.write_bytes(b"fake")
            exact_child.parent.mkdir(parents=True)
            exact_child.write_bytes(b"fake")

            original_source_root = module.SOURCE_ROOT
            module.SOURCE_ROOT = source
            try:
                row = {"sku": "IB1001-10", "name_cn": "龙(领航机师)"}
                candidates = [path for path, _role in module.local_deep_candidates(row)]
            finally:
                module.SOURCE_ROOT = original_source_root

        self.assertIn(exact_child, candidates)
        self.assertNotIn(parent_only, candidates)

    def test_model_alias_does_not_cross_match_different_explicit_sku(self) -> None:
        from tempfile import TemporaryDirectory

        module = load_module()
        with TemporaryDirectory() as temp_dir:
            source = Path(temp_dir)
            wrong = source / "iB1204_99A坦克机甲" / "ib1204_99A坦克机甲_sku图800x800" / "ib1204_99A白底.jpg"
            right = source / "iB1301_Mini战线_(1-6)" / "iblock_ib1301-6_Mini战线_99A_电商_头图_800x800" / "ib1301_99A.jpg"
            wrong.parent.mkdir(parents=True)
            wrong.write_bytes(b"fake")
            right.parent.mkdir(parents=True)
            right.write_bytes(b"fake")

            original_source_root = module.SOURCE_ROOT
            module.SOURCE_ROOT = source
            try:
                row = {"sku": "IB1301-4", "name_cn": "99A主战坦克"}
                candidates = [path for path, _role in module.local_deep_candidates(row)]
            finally:
                module.SOURCE_ROOT = original_source_root

        self.assertIn(right, candidates)
        self.assertNotIn(wrong, candidates)

    def test_existing_local_main_image_counts_as_main_role(self) -> None:
        from tempfile import TemporaryDirectory

        module = load_module()
        with TemporaryDirectory() as temp_dir:
            folder = Path(temp_dir)
            (folder / "IB1301-2-local-01.jpg").write_bytes(b"fake")

            self.assertTrue(module.has_role(folder, "main"))

    def test_excludes_nonexistent_display_box_skus_from_upload_rows(self) -> None:
        module = load_module()

        self.assertTrue(module.is_excluded_sku("IB1101-5"))
        self.assertTrue(module.is_excluded_sku("IB1102-5"))
        self.assertFalse(module.is_excluded_sku("IB1101"))

    def test_missing_piece_count_uses_display_fallback_not_review_gap(self) -> None:
        module = load_module()

        state, reason = module.readiness(
            {
                "white_image_count_final": 1,
                "main_image_count_final": 1,
                "sku_image_count_final": 0,
                "detail_image_count_final": 1,
            },
            "SINGLE_SKU_PRODUCT",
            {"exact": "yes", "brick4_pcs": ""},
        )

        self.assertEqual(state, "READY_FOR_UPLOAD_PREP")
        self.assertNotIn("piece count", reason)
        self.assertEqual(module.piece_count_display_value({"brick4_pcs": ""}), "See product package")

    def test_multi_sku_grouping_is_not_a_review_gap_after_rules_are_known(self) -> None:
        module = load_module()

        state, reason = module.readiness(
            {
                "white_image_count_final": 1,
                "main_image_count_final": 1,
                "sku_image_count_final": 1,
                "detail_image_count_final": 1,
            },
            "MULTI_SKU_PRODUCT",
            {"exact": "yes", "brick4_pcs": ""},
        )

        self.assertEqual(state, "READY_FOR_UPLOAD_PREP")
        self.assertEqual(reason, "")

    def test_brick4_cover_can_fill_missing_main_image(self) -> None:
        from tempfile import TemporaryDirectory

        module = load_module()
        with TemporaryDirectory() as temp_dir:
            target_root = Path(temp_dir)
            folder = target_root / "images" / "IB1001-10"
            folder.mkdir(parents=True)
            (folder / "IB1001-10-白底.jpg").write_bytes(b"fake")

            original_target_root = module.TARGET_ROOT
            module.TARGET_ROOT = target_root
            try:
                downloads = module.download_brick4_images(
                    {"sku": "IB1001-10"},
                    {"exact": "yes", "cover": "https://cdn.brick4.com/example.jpg", "richtext": [], "album": []},
                    apply=False,
                )
            finally:
                module.TARGET_ROOT = original_target_root

        self.assertIn("IB1001-10-brick4-main.jpg", {Path(item["target"]).name for item in downloads})

    def test_shared_parent_main_assets_can_fill_known_subsku_groups(self) -> None:
        from tempfile import TemporaryDirectory

        module = load_module()
        with TemporaryDirectory() as temp_dir:
            source = Path(temp_dir)
            parent_main = source / "iB2202_虫界漫游_(1-9)" / "ib2202_虫界_电商_JPG" / "ib2002_虫界_电商_头图_800x800_jpg_out" / "ib2002_虫界_电商_头图_800x800_jpg_out (1).jpg"
            parent_main.parent.mkdir(parents=True)
            parent_main.write_bytes(b"fake")

            original_source_root = module.SOURCE_ROOT
            module.SOURCE_ROOT = source
            try:
                row = {"sku": "IB2202-1", "name_cn": "独角仙"}
                candidates = module.local_deep_candidates(row)
            finally:
                module.SOURCE_ROOT = original_source_root

        self.assertIn((parent_main, "main"), candidates)

    def test_product_group_assets_are_combined_into_group_folder(self) -> None:
        from tempfile import TemporaryDirectory

        module = load_module()
        with TemporaryDirectory() as temp_dir:
            target_root = Path(temp_dir)
            for sku in ["IB1065", "IB1066"]:
                folder = target_root / "images" / sku
                folder.mkdir(parents=True)
                (folder / f"{sku}-1.jpg").write_bytes(b"fake")

            rows = [
                {"sku": "IB1065", "upload_group": "IB1065-IB1068", "upload_mode": "MULTI_SKU_PRODUCT"},
                {"sku": "IB1066", "upload_group": "IB1065-IB1068", "upload_mode": "MULTI_SKU_PRODUCT"},
            ]
            original_target_root = module.TARGET_ROOT
            module.TARGET_ROOT = target_root
            try:
                groups, assets = module.write_product_group_assets(rows, apply=True)
                self.assertEqual(groups[0]["variant_skus"], "IB1065, IB1066")
                self.assertTrue(
                    (target_root / "shopify-products" / "IB1065-IB1068" / "images" / "IB1065__IB1065-1.jpg").exists()
                )
                self.assertTrue(
                    (target_root / "shopify-products" / "IB1065-IB1068" / "images" / "IB1066__IB1066-1.jpg").exists()
                )
            finally:
                module.TARGET_ROOT = original_target_root


if __name__ == "__main__":
    unittest.main()
