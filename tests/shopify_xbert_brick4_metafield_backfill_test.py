from pathlib import Path
import sys
import unittest


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import shopify_xbert_brick4_metafield_backfill as backfill


class XbertBrick4BackfillTests(unittest.TestCase):
    def test_parse_detail_sizes_from_brick4_html(self) -> None:
        html = """
        <dl class="setparam_package_size" title="包装尺寸">
          <dd>包装尺寸 58 × 14.5 × 45.5 cm </dd>
        </dl>
        <dl class="setparam_size" title="成品尺寸">
          <dd>成品 25.5 × 17.6 × 43.2 cm</dd>
        </dl>
        """

        sizes = backfill.parse_detail_sizes(html)

        self.assertEqual(sizes["package_size"], "58x14.5x45.5")
        self.assertEqual(sizes["finished_size"], "25.5x17.6x43.2")

    def test_series_from_theme_uses_generic_english_categories(self) -> None:
        self.assertEqual(backfill.series_from_theme("哈利·波特"), "Fantasy & Wizardry")
        self.assertEqual(backfill.series_from_theme("创意百变高手"), "Creative Builds")
        self.assertEqual(backfill.series_from_theme("街景"), "Architecture & Street View")
        self.assertEqual(backfill.series_from_theme("赛车"), "Vehicles")
        self.assertEqual(backfill.series_from_theme("主题系列"), "Themed Builds")
        self.assertEqual(backfill.series_from_theme("艺术品"), "Art & Display")

    def test_missing_metafield_updates_do_not_overwrite_existing_values(self) -> None:
        spec = backfill.Brick4Spec(
            sku="66095",
            brick4_set_id="52697",
            title="海上要塞",
            theme="街景",
            piece_count="4567",
            recommended_age="14+",
            package_size="58x14.5x45.5",
            finished_size="25.5x17.6x43.2",
            source_url="https://brick4.com/set/52697/",
            confidence="exact_brand_sku",
        )
        current = {
            "specs.piece_count": "",
            "specs.recommended_age": "8+",
            "specs.finished_model_size": "",
            "specs.package_size": "",
            "custom.series": "",
        }

        updates = backfill.missing_metafield_updates(current, spec)

        self.assertEqual(
            updates,
            {
                "specs.piece_count": "4567",
                "specs.finished_model_size": "25.5x17.6x43.2",
                "specs.package_size": "58x14.5x45.5",
                "custom.series": "Architecture & Street View",
            },
        )


if __name__ == "__main__":
    unittest.main()
