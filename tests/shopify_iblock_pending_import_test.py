from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "shopify_iblock_pending_import.py"


def load_module():
    sys.path.insert(0, str(SCRIPT_PATH.parent))
    spec = importlib.util.spec_from_file_location("shopify_iblock_pending_import", SCRIPT_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class ShopifyIblockPendingImportTest(unittest.TestCase):
    def test_product_type_maps_chinese_series_to_existing_english_types(self) -> None:
        module = load_module()

        cases = [
            ({"product_series": "十二生肖", "shopify_title_safe": "iBlock Zodiac Character 1 Building Block Set"}, "Constellation"),
            ({"product_series": "花愿祈", "shopify_title_safe": "iBlock Floral Wish Peony Building Block Set"}, "Flower"),
            ({"product_series": "虫界漫游", "shopify_title_safe": "iBlock Bee Building Block Set"}, "Animal"),
            ({"product_series": "极速方程", "shopify_title_safe": "iBlock Red Race Car Building Block Set"}, "Car Model"),
            ({"product_series": "瓶中童话", "shopify_title_safe": "iBlock Bottled Fairy Tale Queen Building Block Set"}, "Fairy Tale"),
            ({"product_series": "城市梦英雄", "shopify_title_safe": "iBlock Rescue Team Fire Truck Building Block Set"}, "Fire Rescue"),
            ({"product_series": "城市梦英雄", "shopify_title_safe": "iBlock Rapid Response Team Police Car Building Block Set"}, "Police"),
            ({"product_series": "国魂·重器崛起", "shopify_title_safe": "iBlock Aircraft Carrier Display Model Building Block Set"}, "Warship"),
            ({"product_series": "国魂·重器崛起", "shopify_title_safe": "iBlock Sixth Generation Fighter Display Model Building Block Set"}, "Aircraft"),
            ({"product_series": "MINI战线", "shopify_title_safe": "iBlock Battle Tank Mini Military Building Block Set"}, "Tank"),
            ({"product_series": "城市梦英雄", "shopify_title_safe": "iBlock Special Operations Team Building Block Set"}, "Military"),
            ({"product_series": "封神战甲录", "shopify_title_safe": "iBlock Mythic Fire Warrior Mecha Building Block Set"}, "Mecha"),
        ]

        for row, expected in cases:
            with self.subTest(expected=expected):
                actual = module.product_type_for_row(row)
                self.assertEqual(actual, expected)
                self.assertFalse(module.contains_cjk(actual))

    def test_group_title_uses_parent_title_for_parent_sourced_group(self) -> None:
        module = load_module()
        rows = {
            "IB2202": {"shopify_title_safe": "iBlock Display Set Building Block Set", "product_series": "虫界漫游"},
            "IB2202-1": {"shopify_title_safe": "iBlock Rhinoceros Beetle Building Block Set", "product_series": "虫界漫游"},
        }
        group = {"upload_group": "IB2202-1-IB2202-9", "parent_sku": "IB2202"}

        self.assertEqual(
            module.group_title(group, rows, ["IB2202-1"]),
            "iBlock Display Set Building Block Set",
        )

    def test_validate_source_tables_keeps_ib2202_as_parent_only_sku(self) -> None:
        module = load_module()
        variant_skus = [f"IB{i:04d}" for i in range(1000, 1120)]
        readiness = [{"sku": sku} for sku in variant_skus] + [{"sku": "IB2202"}]
        groups = [
            {
                "upload_group": f"G{i}",
                "variant_skus": "",
                "parent_sku": "",
            }
            for i in range(68)
        ]
        for index, sku in enumerate(variant_skus):
            target = groups[min(index, 67)]
            current = [part for part in target["variant_skus"].split(", ") if part]
            current.append(sku)
            target["variant_skus"] = ", ".join(current)
        groups[0]["parent_sku"] = "IB2202"
        integrity = [
            {"upload_group": f"G{i}", "unreadable_count": "0", "white_count": "1", "detail_count": "1"}
            for i in range(68)
        ]

        self.assertEqual(module.validate_source_tables(readiness, groups, integrity), [])

    def test_validate_source_tables_accepts_explicit_scoped_batch(self) -> None:
        module = load_module()
        readiness = [{"sku": "LL001"}, {"sku": "LL002"}]
        groups = [
            {"upload_group": "LL001", "variant_skus": "LL001", "parent_sku": ""},
            {"upload_group": "LL002", "variant_skus": "LL002", "parent_sku": ""},
        ]
        integrity = [
            {"upload_group": sku, "unreadable_count": "0", "white_count": "1", "detail_count": "1"}
            for sku in ["LL001", "LL002"]
        ]

        self.assertEqual(
            module.validate_source_tables(readiness, groups, integrity, strict_counts=False),
            [],
        )

    def test_build_manifest_filters_to_explicit_scoped_sku(self) -> None:
        module = load_module()
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            reports = root / "reports"
            reports.mkdir()
            (reports / "iblock-shopify-readiness.csv").write_text(
                "sku,vendor,category,shopify_price,shopify_title_safe,product_series,specs_piece_count,specs_recommended_age,specs_finished_model_size,specs_package_size\n"
                "LL001,iBlock,Interlocking Blocks,999,iBlock Galactic Tower Crane Base and Rover Building Set,Space,1000,8+,27.6x29.1x16.3 cm,30x7.5x23.5 cm\n"
                "LL002,iBlock,Interlocking Blocks,999,iBlock Robotic Arm Rover Building Set,Space,643,8+,24x14x14 cm,30x6x22 cm\n",
                encoding="utf-8",
            )
            (reports / "iblock-product-groups.csv").write_text(
                "upload_group,upload_mode,parent_sku,variant_skus\n"
                "LL001,SINGLE_SKU_PRODUCT,,LL001\n"
                "LL002,SINGLE_SKU_PRODUCT,,LL002\n",
                encoding="utf-8",
            )
            (reports / "iblock-upload-ready-integrity.csv").write_text(
                "upload_group,unreadable_count,white_count,main_count,detail_count\n"
                "LL001,0,1,1,1\n"
                "LL002,0,1,1,1\n",
                encoding="utf-8",
            )
            for sku in ["LL001", "LL002"]:
                images = root / "shopify-products-upload-ready" / sku / "images"
                images.mkdir(parents=True)
                for name in [f"{sku}__{sku}-白底.jpg", f"{sku}__{sku}-1.jpg", f"{sku}__{sku}-sku.jpg", f"{sku}__{sku}-详情-01.jpg"]:
                    (images / name).write_bytes(b"test")

            module.READINESS_CSV = reports / "iblock-shopify-readiness.csv"
            module.GROUPS_CSV = reports / "iblock-product-groups.csv"
            module.INTEGRITY_CSV = reports / "iblock-upload-ready-integrity.csv"
            module.UPLOAD_READY_ROOT = root / "shopify-products-upload-ready"
            module.OUT_DIR = root / "out"
            manifest, skipped, gaps, _plan = module.build_manifest(
                strict_counts=False,
                sku_filter={"LL002"},
            )

            self.assertEqual([item["folder"] for item in manifest], ["LL002"])
            self.assertEqual(skipped, [])
            self.assertEqual(gaps, [])

    def test_image_buckets_uses_white_as_variant_fallback_only(self) -> None:
        module = load_module()
        with tempfile.TemporaryDirectory() as tmp:
            images = Path(tmp)
            for name in [
                "LL001__LL001-白底.jpg",
                "LL001__LL001-1.jpg",
                "LL001__LL001-sku.jpg",
                "LL002__LL002-白底.jpg",
            ]:
                (images / name).write_bytes(b"test")

            buckets = module.image_buckets(
                images,
                {"upload_group": "LL-BATCH", "parent_sku": ""},
                ["LL001", "LL002"],
            )

            self.assertEqual(
                [path.name for path in buckets["sku"]],
                ["LL001__LL001-sku.jpg", "LL002__LL002-白底.jpg"],
            )


if __name__ == "__main__":
    unittest.main()
