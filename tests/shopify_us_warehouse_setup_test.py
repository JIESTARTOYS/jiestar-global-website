from __future__ import annotations

import importlib.util
import sys
import unittest
from decimal import Decimal
from pathlib import Path


SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))


def load_script():
    path = SCRIPTS_DIR / "shopify_us_warehouse_setup.py"
    spec = importlib.util.spec_from_file_location("shopify_us_warehouse_setup_test_module", path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class ShopifyUsWarehouseSetupTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.warehouse = load_script()

    def item(self, sku: str, weight_g: int, cost: str):
        return self.warehouse.EligibleSku(
            sku=sku,
            variant_id=f"variant-{sku}",
            inventory_item_id=f"inventory-{sku}",
            product_id=f"product-{sku}",
            product_handle=sku.lower(),
            product_title=f"Product {sku}",
            weight_g=weight_g,
            source_cost_usd=Decimal(cost),
            inventory_tracked=False,
        )

    def test_source_workbook_has_19_usd_skus_and_expected_cost_range(self) -> None:
        costs = self.warehouse.source_costs(self.warehouse.DEFAULT_WORKBOOK)
        self.assertEqual(len(costs), 19)
        self.assertEqual(min(costs.values()), Decimal("10.97"))
        self.assertEqual(max(costs.values()), Decimal("14.369"))

    def test_customer_rate_uses_formula_and_rounds_up_to_x_99(self) -> None:
        self.assertEqual(self.warehouse.customer_rate(Decimal("10.97")), Decimal("14.99"))
        self.assertEqual(self.warehouse.round_up_to_99(Decimal("20.991")), Decimal("21.99"))

    def test_rate_bands_enumerate_multi_item_combinations_and_never_decrease(self) -> None:
        bands = self.warehouse.build_rate_bands(
            [self.item("LIGHT", 800, "10.97"), self.item("HEAVY", 1500, "14.37")]
        )
        self.assertTrue(bands)
        self.assertEqual(len(bands), 20)
        self.assertEqual(bands[0].min_weight_kg, Decimal("0"))
        self.assertEqual(bands[0].max_weight_kg, Decimal("0.5"))
        self.assertTrue(all(band.max_weight_kg <= Decimal("10") for band in bands))
        self.assertTrue(
            all(
                next_band.target_rate_usd >= current.target_rate_usd
                for current, next_band in zip(bands, bands[1:])
            )
        )
        last = bands[-1]
        self.assertIn("LIGHT", last.witness_skus)
        self.assertGreater(last.max_source_cost_usd, Decimal("100"))

    def test_only_confirmed_first_wave_active_skus_are_eligible(self) -> None:
        variant = self.warehouse.ShopifyVariant(
            product_id="product-59159",
            product_handle="pirate-set",
            product_title="Pirate Set",
            product_status="ACTIVE",
            vendor="JIESTAR",
            variant_id="variant-59159",
            variant_title="59159",
            sku="59159",
            sku_key="59159",
            inventory_item_id="inventory-59159",
            inventory_tracked=False,
            requires_shipping=True,
            current_weight_g=795,
        )
        eligible, audit = self.warehouse.match_eligible_variants(
            [variant],
            {"59159": Decimal("10.97"), "JJ9219": Decimal("12.353")},
        )
        self.assertEqual([item.sku for item in eligible], ["59159"])
        self.assertEqual(next(row for row in audit if row["sku"] == "JJ9219")["shopify_status"], "deferred_not_in_first_collection")


if __name__ == "__main__":
    unittest.main()
