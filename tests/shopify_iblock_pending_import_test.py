from __future__ import annotations

import importlib.util
import sys
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


if __name__ == "__main__":
    unittest.main()
