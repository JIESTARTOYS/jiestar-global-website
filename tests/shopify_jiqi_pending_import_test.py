from pathlib import Path
import sys
import tempfile
import unittest

from openpyxl import Workbook


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import shopify_jiqi_pending_import as jiqi


def quote_row(sku: str, name: str, piece_count: str = "100PCS") -> dict[str, str]:
    return {
        "sheet": "Sheet1",
        "sku": sku,
        "original_sku_cell": sku,
        "original_name_cn": name,
        "factory_price": "10",
        "carton_qty": "6",
        "package_size": "30*20*10",
        "outer_carton_size": "60*40*40",
        "gross_net_weight": "10/9",
        "piece_count": piece_count,
        "finished_model_size": "12*10*8",
        "recommended_age": "14+",
        "power": "静态",
    }


def write_images(folder: Path, sku: str, *, detail: bool = True) -> None:
    (folder / "主图").mkdir(parents=True)
    (folder / "白底尺寸图").mkdir()
    (folder / "详情页").mkdir()
    (folder / "主图" / f"{sku}-1.jpg").write_bytes(b"main")
    (folder / "白底尺寸图" / f"{sku}白底.jpg").write_bytes(b"white")
    if detail:
        (folder / "详情页" / f"{sku}-详情.jpg").write_bytes(b"detail")


class JiqiImportTests(unittest.TestCase):
    def test_july_2_new_products_use_specific_english_titles(self) -> None:
        expected_titles = {
            "JQ1167": ("机械马", "JIQI Mechanical Horse Display Model Kit JQ1167"),
            "JQ1168": ("机械蜗牛", "JIQI Mechanical Snail Display Model Kit JQ1168"),
            "JQ1150": ("月球基地", "JIQI Moon Base Space Building Set JQ1150"),
            "JQ1152": ("机械凤凰", "JIQI Mechanical Phoenix Display Model Kit JQ1152"),
            "JQ1153": ("深邃星空画", "JIQI Deep Space Starry Sky Wall Art Building Set JQ1153"),
        }

        for sku, (name, title) in expected_titles.items():
            with self.subTest(sku=sku):
                self.assertEqual(jiqi.title_for_row(quote_row(sku, name)), title)

    def test_build_manifest_can_filter_to_explicit_skus(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_images(root / "积琪—JQ1167图片", "JQ1167")
            write_images(root / "积琪—JQ1168图片", "JQ1168")
            rows = [
                quote_row("JQ1167", "机械马", "991PCS"),
                quote_row("JQ1168", "机械蜗牛", "458PCS"),
            ]

            manifest, skipped, _quote_rows = jiqi.build_manifest(
                image_root=root,
                quote_rows=rows,
                sku_filter={"JQ1167"},
            )

        self.assertEqual(skipped, [])
        self.assertEqual([item["base"] for item in manifest], ["JQ1167"])

    def test_pricing_workbook_sets_initial_price_and_compare_at_price(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_images(root / "积琪—JQ1167图片", "JQ1167")
            pricing_path = Path(tmp) / "jiqi-pricing.xlsx"
            workbook = Workbook()
            c_sheet = workbook.active
            c_sheet.title = "C端_公开售价"
            c_sheet.append(["SKU", "品牌", "品名", "控价状态", "最终公开价USD_不含运", "最终CompareAtPriceUSD"])
            c_sheet.append(["JQ1167", "积琪", "机械马", "REVIEW: 缺品牌/平台控价", 30.99, 36.99])
            shopify_sheet = workbook.create_sheet("Shopify导入价格")
            shopify_sheet.append(["Variant SKU", "Variant Price", "Variant Compare At Price", "Title"])
            shopify_sheet.append(["JQ1167", 30.99, 36.99, "JIQI Mechanical Horse Display Model Kit JQ1167"])
            workbook.save(pricing_path)

            pricing_rows = jiqi.load_initial_pricing_rows(pricing_path)
            manifest, skipped, _quote_rows = jiqi.build_manifest(
                image_root=root,
                quote_rows=[quote_row("JQ1167", "机械马", "991PCS")],
                pricing_rows=pricing_rows,
            )

        self.assertEqual(skipped, [])
        self.assertEqual(len(manifest), 1)
        self.assertEqual(manifest[0]["price"], "30.99")
        self.assertEqual(manifest[0]["compare_at_price"], "36.99")
        self.assertEqual(manifest[0]["pricing_status"], "REVIEW: 缺品牌/平台控价")

    def test_product_set_includes_compare_at_price_when_available(self) -> None:
        class CapturingAdmin(jiqi.ShopifyAdmin):
            def __init__(self) -> None:
                self.variables = None

            def graphql(self, _query: str, variables: dict) -> dict:
                self.variables = variables
                return {
                    "productSet": {
                        "product": {"id": "gid://shopify/Product/1", "title": "Created"},
                        "userErrors": [],
                    }
                }

        admin = CapturingAdmin()
        item = {
            "title": "JIQI Mechanical Horse Display Model Kit JQ1167",
            "handle": "jiqi-mechanical-horse-display-model-kit-jq1167",
            "vendor": "JIQI",
            "status": "ACTIVE",
            "product_type": "Animal",
            "price": "30.99",
            "compare_at_price": "36.99",
            "option_name": "Model",
            "variants": [{"sku": "JQ1167", "option_name": "JQ1167 - Mechanical Horse Display"}],
            "metafields": {},
        }

        admin.product_set(item, "")

        variant_input = admin.variables["input"]["variants"][0]
        self.assertEqual(variant_input["price"], "30.99")
        self.assertEqual(variant_input["compareAtPrice"], "36.99")

    def test_build_manifest_skips_ip_risk_rows_even_when_assets_are_complete(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_images(root / "积琪—JQ1108图片", "JQ1108")
            write_images(root / "积琪—JQ1109图片", "JQ1109")
            rows = [
                quote_row("JQ1108", "吃豆人"),
                quote_row("JQ1109", "库霸王"),
            ]

            manifest, skipped, quote_rows = jiqi.build_manifest(image_root=root, quote_rows=rows)

        self.assertEqual(quote_rows, rows)
        self.assertEqual(manifest, [])
        self.assertEqual({row["sku"] for row in skipped}, {"JQ1108", "JQ1109"})
        for row in skipped:
            self.assertIn("ip_risk_skip", row["issues"])

    def test_jq1144_to_jq1147_are_skipped_instead_of_created_as_variants(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            folder = root / "积琪—JQ1144-JQ1147图片"
            (folder / "主图").mkdir(parents=True)
            (folder / "白底尺寸图").mkdir()
            (folder / "详情页").mkdir()
            for index, sku in enumerate(["JQ1144", "JQ1145", "JQ1146", "JQ1147"], start=1):
                (folder / "主图" / f"{index}.jpg").write_bytes(b"main")
                (folder / "白底尺寸图" / f"{sku}白底.jpg").write_bytes(b"white")
            (folder / "详情页" / "JQ1144-JQ1147英文详情.jpg").write_bytes(b"detail")
            rows = [
                quote_row("JQ1144", "烧烧电话虫"),
                quote_row("JQ1145", "三刀电话虫"),
                quote_row("JQ1146", "线线电话虫"),
                quote_row("JQ1147", "橡胶电话虫"),
            ]

            manifest, skipped, _quote_rows = jiqi.build_manifest(image_root=root, quote_rows=rows)

        self.assertEqual(manifest, [])
        self.assertEqual({row["sku"] for row in skipped}, {"JQ1144", "JQ1145", "JQ1146", "JQ1147"})
        for row in skipped:
            self.assertIn("ip_risk_skip", row["issues"])

    def test_ready_row_uses_jiqi_defaults_and_quote_metafields(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_images(root / "积琪—JQ1101图片", "JQ1101")
            rows = [quote_row("JQ1101", "破镜•独角兽", "2200PCS")]

            manifest, skipped, _quote_rows = jiqi.build_manifest(image_root=root, quote_rows=rows)

        self.assertEqual(skipped, [])
        self.assertEqual(len(manifest), 1)
        item = manifest[0]
        self.assertEqual(item["vendor"], "JIQI")
        self.assertEqual(item["status"], "ACTIVE")
        self.assertEqual(item["price"], "999")
        self.assertEqual(item["category_name"], "Interlocking Blocks")
        self.assertEqual(item["variants"][0]["sku"], "JQ1101")
        self.assertEqual(item["metafields"]["specs.piece_count"], "2200")
        self.assertEqual(item["metafields"]["specs.recommended_age"], "14+")
        self.assertEqual(item["metafields"]["specs.package_size"], "30*20*10")
        self.assertEqual(item["metafields"]["specs.finished_model_size"], "12*10*8")
        self.assertNotRegex(item["title"], r"[\u3400-\u9fff]")

    def test_missing_detail_image_is_skipped(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_images(root / "积琪—JQ1165图片", "JQ1165", detail=False)
            rows = [quote_row("JQ1165", "悬浮大宝剑", "1515PCS")]

            manifest, skipped, _quote_rows = jiqi.build_manifest(image_root=root, quote_rows=rows)

        self.assertEqual(manifest, [])
        self.assertEqual(len(skipped), 1)
        self.assertEqual(skipped[0]["sku"], "JQ1165")
        self.assertIn("missing_detail_image", skipped[0]["issues"])

    def test_main_folder_images_are_not_reclassified_as_detail_by_filename(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            folder = root / "积琪—JQ1101图片"
            (folder / "主图").mkdir(parents=True)
            (folder / "白底尺寸图").mkdir()
            (folder / "详情页").mkdir()
            (folder / "主图" / "JQ1101独角兽长图-02.jpg").write_bytes(b"main")
            (folder / "白底尺寸图" / "JQ1101独角兽长图-07.jpg").write_bytes(b"white")
            (folder / "详情页" / "JQ1101独角兽长图_画板-1_01.jpg").write_bytes(b"detail")
            rows = [quote_row("JQ1101", "破镜•独角兽", "2200PCS")]

            manifest, skipped, _quote_rows = jiqi.build_manifest(image_root=root, quote_rows=rows)

        self.assertEqual(skipped, [])
        self.assertEqual(len(manifest), 1)
        self.assertEqual(manifest[0]["media_status"]["main_count"], 1)

    def test_expected_first_media_alt_uses_manifest_first_media_name(self) -> None:
        item = {
            "title": "JIQI Mirror Unicorn Display Building Set JQ1101",
            "main_media": ["/tmp/JQ1101独角兽长图-07.jpg", "/tmp/JQ1101独角兽长图-02.jpg"],
        }

        self.assertEqual(
            jiqi.expected_first_media_alt(item),
            "JIQI Mirror Unicorn Display Building Set JQ1101 - JQ1101独角兽长图-07.jpg",
        )

    def test_detail_upload_errors_include_image_path(self) -> None:
        class FailingAdmin:
            def file_create(self, _path: Path, _alt: str) -> str:
                raise RuntimeError("Shopify HTTP 404: Not Found")

        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "JQ1102-宇航员_01.jpg"
            path.write_bytes(b"detail")
            item = {
                "base": "JQ1102",
                "title": "JIQI Astronaut Display Model Kit JQ1102",
                "detail_images": [str(path)],
            }

            with self.assertRaisesRegex(RuntimeError, r"JQ1102 detail upload failed .*JQ1102-宇航员_01.jpg"):
                jiqi.upload_detail_images_for_item(FailingAdmin(), item)

    def test_description_html_only_contains_detail_images(self) -> None:
        item = {
            "base": "JQ1101",
            "title": "JIQI Mirror Unicorn Display Building Set JQ1101",
            "metafields": {
                "specs.piece_count": "2200",
                "specs.recommended_age": "14+",
            },
        }

        description = jiqi.description_html(item, ["https://cdn.example.com/detail.jpg"])

        self.assertNotIn("Interested in wholesale or custom versions of this product?", description)
        self.assertNotIn("<h2>", description)
        self.assertNotIn("<ul>", description)
        self.assertNotIn("<li>", description)
        self.assertNotIn("SKU:", description)
        self.assertNotIn("Pieces:", description)
        self.assertIn('<img src="https://cdn.example.com/detail.jpg"', description)

    def test_remove_generated_intro_keeps_only_detail_image_paragraphs(self) -> None:
        description = """
        <h2>JIQI Retro Film Camera Building Set JQ1130</h2>
        <ul>
        <li><strong>SKU:</strong> JQ1130</li>
        <li><strong>Pieces:</strong> 805</li>
        </ul>
        <p><img src="https://cdn.example.com/detail-1.jpg" alt="detail 1"></p>
        <p><img src="https://cdn.example.com/detail-2.jpg" alt="detail 2"></p>
        """

        cleaned = jiqi.remove_generated_intro(description)

        self.assertNotIn("<h2>", cleaned)
        self.assertNotIn("<ul>", cleaned)
        self.assertNotIn("SKU:", cleaned)
        self.assertEqual(cleaned.count("<img"), 2)


if __name__ == "__main__":
    unittest.main()
