from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts"


def load_script(name: str):
    sys.path.insert(0, str(SCRIPTS_DIR))
    path = SCRIPTS_DIR / f"{name}.py"
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class IblockShippingAuditTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.audit = load_script("iblock_shipping_audit")
        cls.shipping = load_script("shopify_shipping_update_from_template")

    def test_dimension_parser_handles_units_newlines_and_display_pack(self) -> None:
        self.assertEqual(self.audit.sellable_box_dimensions("IB1076", "22*5*14CM"), (22.0, 5.0, 14.0))
        self.assertEqual(
            self.audit.sellable_box_dimensions("IB2201", "端盒：27.5*18.4*14.5\n单盒：9*9*14"),
            (27.5, 18.4, 14.5),
        )
        self.assertEqual(
            self.audit.sellable_box_dimensions("IB2202-1", "9×9×14"),
            (9.0, 9.0, 14.0),
        )

    def test_fixed_chargeable_weight_examples(self) -> None:
        cases = [
            (197.9, (22.0, 5.0, 14.0), 308),
            (2831.9, (50.0, 36.0, 10.0), 3600),
            (1350.0, (40.0, 29.0, 11.0), 2552),
            (2150.0, (45.0, 36.0, 12.0), 3888),
            (1393.4, (27.5, 18.4, 14.5), 1468),
        ]
        for actual, dimensions, expected in cases:
            with self.subTest(dimensions=dimensions):
                _, target = self.audit.chargeable_weight_g(actual, dimensions)
                self.assertEqual(target, expected)

    def test_manual_and_audit_only_skus_never_become_weight_updates(self) -> None:
        product = self.audit.SourceProduct
        rows = [
            product("IB1001-1", "series", "eligible", "1*1*1", 1, 1, 1, 100, 100, 100, None, None, "Standard goods", "eligible_if_active"),
            product("IB1101获奖版", "series", "manual", "1*1*1", 1, 1, 1, 100, 100, 100, None, None, "Standard goods", "manual_review"),
            product("IB1101-5", "series", "display", "1*1*1", 1, 1, 1, 100, 100, 100, None, None, "Standard goods", "audit_only"),
            product("IB1102-5", "series", "display", "1*1*1", 1, 1, 1, 100, 100, 100, None, None, "Standard goods", "audit_only"),
            product("IB2202", "series", "parent", "1*1*1", 1, 1, 1, 100, 100, 100, None, None, "Standard goods", "audit_only"),
        ]
        shopify = [{"sku": "IB1001-1", "status": "ACTIVE", "current_weight_g": 50, "requires_shipping": True}]
        result = self.audit.build_audit(rows, shopify)
        self.assertEqual([row["sku"] for row in result["weight_updates"]], ["IB1001-1"])
        self.assertEqual({row["sku"] for row in result["manual_review"]}, {"IB1101获奖版", "IB1101-5", "IB1102-5", "IB2202"})

    def test_vendor_filter_is_case_insensitive(self) -> None:
        variant = self.shipping.ShopifyVariant
        rows = [
            variant("p1", "h1", "one", "ACTIVE", "iBlock", "v1", "Default", "IB1", "IB1", "i1", True, True, 100),
            variant("p2", "h2", "two", "ACTIVE", "JIESTAR", "v2", "Default", "2", "2", "i2", True, True, 100),
        ]
        filtered = self.shipping.filter_variants_by_vendor(rows, "IBLOCK")
        self.assertEqual([row.variant_id for row in filtered], ["v1"])

    def test_skip_rate_sync_only_associates_variants(self) -> None:
        class FakeAdmin:
            def __init__(self):
                self.updates = []

            def delivery_profiles(self, include_profile_items=False):
                self.include_profile_items = include_profile_items
                return [{"id": "profile-1", "name": "JIESTAR Standard goods"}]

            def delivery_profile_update(self, profile_id, payload):
                self.updates.append((profile_id, payload))
                return {"userErrors": []}

        admin = FakeAdmin()
        results = self.shipping.associate_variants_without_rate_sync(
            admin,
            [{"target_profile": "JIESTAR Standard goods", "variant_id": "variant-1"}],
        )
        self.assertEqual(admin.updates, [("profile-1", {"variantsToAssociate": ["variant-1"]})])
        self.assertTrue(results[0]["ok"])


if __name__ == "__main__":
    unittest.main()
