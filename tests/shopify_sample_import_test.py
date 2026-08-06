import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError

from shopify_sample_import import upload_multipart


class FakeResponse:
    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self):
        return b""


class UploadMultipartTest(unittest.TestCase):
    def test_retries_transient_staged_upload_404(self):
        error = HTTPError(
            "https://staged-upload.example",
            404,
            "Not Found",
            {},
            io.BytesIO(b"not ready"),
        )

        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "image.jpg"
            path.write_bytes(b"jpeg")

            with (
                patch(
                    "shopify_sample_import.urllib.request.urlopen",
                    side_effect=[error, FakeResponse()],
                ) as urlopen,
                patch("shopify_sample_import.time.sleep"),
            ):
                upload_multipart(
                    "https://staged-upload.example",
                    [{"name": "key", "value": "value"}],
                    path,
                    "image/jpeg",
                )

        self.assertEqual(urlopen.call_count, 2)


if __name__ == "__main__":
    unittest.main()
