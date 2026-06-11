from pathlib import Path
import sys
import tempfile
import unittest


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import shopify_xbert_brick4_white_image_backfill as white_backfill


class XbertBrick4WhiteImageBackfillTests(unittest.TestCase):
    def test_parse_cover_url_prefers_cover_data_image(self) -> None:
        html = """
        <meta property="og:image" content="https://cdn.brick4.com/upload/set/fallback.jpg!setcover">
        <div class="cover" data-imgurl="upload/set/cover.jpg"></div>
        """

        self.assertEqual(
            white_backfill.parse_cover_url(html),
            "https://cdn.brick4.com/upload/set/cover.jpg",
        )

    def test_parse_cover_url_accepts_og_image(self) -> None:
        html = '<meta property="og:image" content="https://cdn.brick4.com/upload/set/fallback.jpg!setcover">'

        self.assertEqual(
            white_backfill.parse_cover_url(html),
            "https://cdn.brick4.com/upload/set/fallback.jpg",
        )

    def test_white_image_path_skips_existing_local_white_image(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp) / "66002英文"
            folder.mkdir()
            (folder / "66002-白底.jpg").write_bytes(b"existing")

            self.assertIsNone(white_backfill.missing_white_target(folder, "66002"))

    def test_white_image_path_uses_standard_file_name_when_missing(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp) / "66002英文"
            folder.mkdir()

            self.assertEqual(
                white_backfill.missing_white_target(folder, "66002"),
                folder / "66002-白底.jpg",
            )


if __name__ == "__main__":
    unittest.main()
