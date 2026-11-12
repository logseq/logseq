"""Authored byte/ownership checks only; these do not load or parse PDFium."""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from prepare_pdf_probe import MARKER, authored_pdf, prepare


class PrivatePdfFixture(unittest.TestCase):
    def test_byte_offsets_and_stream_lengths_survive_platform_line_endings(self):
        payload = authored_pdf()
        self.assertNotIn(b"\r", payload)
        xref = int(payload.split(b"startxref\n")[1].splitlines()[0])
        lines = payload[xref:].splitlines()
        self.assertEqual(lines[:3], [b"xref", b"0 8", b"0000000000 65535 f "])
        for index, row in enumerate(lines[3:10], 1):
            offset = int(row.split()[0])
            self.assertTrue(payload[offset:].startswith(f"{index} 0 obj\n".encode("ascii")))
        for section in payload.split(b"/Length ")[1:]:
            size = int(section.split(b" ", 1)[0])
            content = section.split(b"stream\n", 1)[1].split(b"endstream", 1)[0]
            self.assertEqual(size, len(content))
        self.assertIn(MARKER.encode("ascii"), payload)
        self.assertIn(b"/Rotate 90", payload)

    def test_receipt_matches_private_bytes_and_existing_output_is_never_replaced(self):
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary).resolve() / "owned"
            receipt = prepare(output)
            payload = (output / "original.pdf").read_bytes()
            self.assertEqual(receipt, json.loads((output / "receipt.json").read_text()))
            self.assertEqual(receipt["bytes"], len(payload))
            self.assertEqual(receipt["sha256"], hashlib.sha256(payload).hexdigest())
            with self.assertRaisesRegex(ValueError, "new absolute directory"):
                prepare(output)
            self.assertEqual((output / "original.pdf").read_bytes(), payload)

    def test_relative_output_is_rejected_before_writing(self):
        with self.assertRaisesRegex(ValueError, "new absolute directory"):
            prepare(Path("not-an-owned-absolute-fixture"))


if __name__ == "__main__":
    unittest.main()
