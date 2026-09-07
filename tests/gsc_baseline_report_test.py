import csv
import tempfile
import unittest
from pathlib import Path

from scripts.gsc_baseline_report import (
    build_report,
    classify_query,
    read_dimension,
    summarize_query_intents,
)


class GscBaselineReportTest(unittest.TestCase):
    def write_csv(self, directory: Path, name: str, headers: list[str], rows: list[list[str]]) -> None:
        with (directory / name).open("w", encoding="utf-8", newline="") as handle:
            writer = csv.writer(handle)
            writer.writerow(headers)
            writer.writerows(rows)

    def test_classifies_brand_before_b2b_and_keeps_nonbrand_b2b_separate(self) -> None:
        self.assertEqual(classify_query("JIESTAR wholesale catalog"), "brand")
        self.assertEqual(classify_query("building block manufacturer"), "nonbrand_b2b")
        self.assertEqual(classify_query("best building block model kit"), "dtc")

    def test_brand_aliases_and_word_boundaries(self) -> None:
        for query in ["ji star", "jie-star bricks", "GULY car", "JIQI ship", "Xbert kits", "iblock wholesale", "TK TWO", "Zoin", "jei star"]:
            self.assertEqual(classify_query(query), "brand", query)
        self.assertEqual(classify_query("gulywood"), "other")
        self.assertEqual(classify_query("best model car kits for sale"), "dtc")

    def test_property_totals_and_unattributed_queries_are_not_nonbrand(self) -> None:
        with tempfile.TemporaryDirectory() as temp_root:
            root = Path(temp_root)
            self.write_csv(root, "图表.csv", ["日期", "点击次数", "展示", "点击率", "排名"], [["2026-09-01", "10", "100", "10%", "5"]])
            self.write_csv(root, "查询数.csv", ["热门查询", "点击次数", "展示", "点击率", "排名"], [["jiestar", "6", "50", "12%", "3"], ["wholesale blocks", "1", "10", "10%", "8"]])
            report = build_report(root)
            self.assertIn("| Clicks | 10 | N/A | N/A |", report)
            self.assertIn("Unattributed difference: 3 clicks / 40 impressions", report)
            self.assertIn("Visible non-brand (B2B + DTC + other): 1 clicks / 10 impressions", report)
            self.assertIn("2026-09-01 to 2026-09-01", report)

    def test_missing_exports_are_unavailable_not_zero(self) -> None:
        with tempfile.TemporaryDirectory() as temp_root:
            report = build_report(Path(temp_root))
            self.assertIn("| Clicks | N/A | N/A | N/A |", report)
            self.assertIn("segmentation unavailable, not zero traffic", report)
            self.assertIn("| Non-brand B2B | N/A | N/A", report)

    def test_builds_bilingual_export_report_with_weighted_metrics(self) -> None:
        with tempfile.TemporaryDirectory() as temp_root:
            root = Path(temp_root)
            current = root / "current"
            previous = root / "previous"
            current.mkdir()
            previous.mkdir()

            self.write_csv(
                current,
                "Queries.csv",
                ["Top queries", "Clicks", "Impressions", "CTR", "Position"],
                [
                    ["building block manufacturer", "4", "100", "4%", "18.0"],
                    ["JIESTAR toys", "6", "50", "12%", "3.0"],
                    ["best building block model kit", "2", "20", "10%", "9.0"],
                ],
            )
            self.write_csv(
                current,
                "Pages.csv",
                ["Top pages", "Clicks", "Impressions", "CTR", "Position"],
                [["https://www.jiestartoys.com/wholesale", "4", "100", "4%", "18"]],
            )
            self.write_csv(
                current,
                "Countries.csv",
                ["Country", "Clicks", "Impressions", "CTR", "Position"],
                [["United States", "4", "80", "5%", "16"]],
            )
            self.write_csv(
                current,
                "Devices.csv",
                ["Device", "Clicks", "Impressions", "CTR", "Position"],
                [["Mobile", "3", "70", "4.29%", "17"]],
            )
            self.write_csv(
                previous,
                "查询.csv",
                ["热门查询", "点击次数", "展示次数", "点击率", "排名"],
                [["building block manufacturer", "1", "40", "2.5%", "24"]],
            )

            query_rows = read_dimension(current, "queries")
            intents = summarize_query_intents(query_rows)
            report = build_report(current, previous)

            self.assertEqual(intents["nonbrand_b2b"].impressions, 100)
            self.assertIn("building block manufacturer", report)
            self.assertIn("United States", report)
            self.assertIn("Mobile", report)
            self.assertIn("+150.0%", report)
            self.assertNotIn("private@example.com", report)


if __name__ == "__main__":
    unittest.main()
