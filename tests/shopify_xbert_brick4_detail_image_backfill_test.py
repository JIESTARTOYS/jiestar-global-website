from pathlib import Path
import sys
import tempfile
import unittest


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import shopify_xbert_brick4_detail_image_backfill as detail_backfill


class XbertBrick4DetailImageBackfillTests(unittest.TestCase):
    def test_parse_album_urls_reads_only_set_album_images(self) -> None:
        html = """
        <div class="cover" data-imgurl="upload/set/cover.jpg"></div>
        <div class="set_album card folded">
          <div id="list_setpic_share" class="list_setpic">
            <a class="item_setpic" data-imgurl="upload/set/detail-1.jpg"></a>
            <a class="item_setpic" data-imgurl="upload/set/detail-2.png"></a>
          </div>
        </div>
        <div class="relset"><a data-imgurl="upload/set/related.jpg"></a></div>
        """

        self.assertEqual(
            detail_backfill.parse_album_urls(html),
            [
                "https://cdn.brick4.com/upload/set/detail-1.jpg",
                "https://cdn.brick4.com/upload/set/detail-2.png",
            ],
        )

    def test_parse_album_urls_deduplicates_album_images(self) -> None:
        html = """
        <div id="list_setpic_share" class="list_setpic">
          <a class="item_setpic" data-imgurl="upload/set/detail-1.jpg"></a>
          <a class="item_setpic" data-imgurl="upload/set/detail-1.jpg"></a>
        </div>
        """

        self.assertEqual(
            detail_backfill.parse_album_urls(html),
            ["https://cdn.brick4.com/upload/set/detail-1.jpg"],
        )

    def test_missing_detail_targets_skip_existing_local_detail_image(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp) / "66028英文"
            folder.mkdir()
            (folder / "66028-详情.jpg").write_bytes(b"existing")

            self.assertEqual(detail_backfill.missing_detail_targets(folder, "66028", 2), [])

    def test_missing_detail_targets_use_standard_numbered_names(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp) / "66028英文"
            folder.mkdir()

            self.assertEqual(
                detail_backfill.missing_detail_targets(folder, "66028", 2),
                [folder / "66028-详情-1.jpg", folder / "66028-详情-2.jpg"],
            )


if __name__ == "__main__":
    unittest.main()
