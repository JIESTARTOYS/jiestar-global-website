from decimal import Decimal
from pathlib import Path
import sys
import tempfile
import unittest

from openpyxl import Workbook


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import shopify_price_update_from_pricing as price_update


class ShopifyPriceUpdateFromPricingTests(unittest.TestCase):
    def test_load_pricing_rows_accepts_explicit_pricing_file(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "80508-pricing.xlsx"
            workbook = Workbook()
            c_sheet = workbook.active
            c_sheet.title = "C端_公开售价"
            c_sheet.append(["SKU", "品牌", "品名", "控价状态", "最终公开价USD_不含运", "最终CompareAtPriceUSD"])
            c_sheet.append(["80508", "锦童宝", "GULY Shadowed Wing Mecha Model Kit 80508", "PASS", 164.99, 194.99])
            shopify_sheet = workbook.create_sheet("Shopify导入价格")
            shopify_sheet.append(["Variant SKU", "Variant Price", "Variant Compare At Price", "Title"])
            shopify_sheet.append(["80508", 164.99, 194.99, "GULY Shadowed Wing Mecha Model Kit 80508"])
            workbook.save(path)

            rows = price_update.load_pricing_rows_from_files([path])

        self.assertEqual(sorted(rows), ["80508"])
        pricing = rows["80508"][0]
        self.assertEqual(pricing.brand, "锦童宝")
        self.assertEqual(pricing.status, "PASS")
        self.assertEqual(pricing.target_price, Decimal("164.99"))
        self.assertEqual(pricing.target_compare_at, Decimal("194.99"))
        self.assertEqual(pricing.source_file, "80508-pricing.xlsx")


if __name__ == "__main__":
    unittest.main()
