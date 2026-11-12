"""Private preparer checks: authored archives only, no network or native code."""
import io
import json
from pathlib import Path
import tarfile
import tempfile
import unittest

from prepare_pdfium import MANIFEST, sha256, stage_archive


class PdfiumPreparation(unittest.TestCase):
    def archive(self, extra=(), missing=None, flags=None):
        files = {
            "lib/libpdfium.so": b"authored native-library placeholder; never loaded",
            "LICENSE": b"authored test license",
            "licenses/pdfium.txt": b"authored PDFium license fixture",
            "licenses/third-party.txt": b"preserve every supplied notice",
            "args.gn": flags or b"pdf_enable_v8 = false\npdf_enable_xfa = false\nis_debug = false\n",
        }
        if missing:
            files.pop(missing)
        buffer = io.BytesIO()
        with tarfile.open(fileobj=buffer, mode="w:gz") as archive:
            for name, payload in list(files.items()) + list(extra):
                info = tarfile.TarInfo(name)
                info.size = len(payload)
                archive.addfile(info, io.BytesIO(payload))
        return buffer.getvalue()

    def prepare(self, archive, path, digest=None):
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        artifact = dict(manifest["artifacts"]["linux-x64"], bytes=len(archive),
                        sha256=digest or sha256(archive))
        return stage_archive(archive, artifact, "linux-x64", manifest, path)

    def test_preserves_license_closure_and_hashes_exact_staged_bytes(self):
        with tempfile.TemporaryDirectory() as root:
            target = Path(root) / "prepared"
            receipt = self.prepare(self.archive(), target)
            self.assertEqual(receipt, json.loads((target / "receipt.json").read_text()))
            for name, digest in receipt["files"].items():
                self.assertEqual(digest, sha256((target / name).read_bytes()))
            self.assertIn("licenses/third-party.txt", receipt["files"])
            self.assertFalse((target / "include").exists())
            with self.assertRaisesRegex(ValueError, "new directory"):
                self.prepare(self.archive(), target)

    def test_wrong_digest_creates_no_output(self):
        with tempfile.TemporaryDirectory() as root:
            target = Path(root) / "prepared"
            with self.assertRaisesRegex(ValueError, "SHA-256"):
                self.prepare(self.archive(), target, "0" * 64)
            self.assertFalse(target.exists())

    def test_missing_license_or_library_never_becomes_ready(self):
        for required in ["lib/libpdfium.so", "LICENSE", "licenses/pdfium.txt", "args.gn"]:
            with self.subTest(required=required), tempfile.TemporaryDirectory() as root:
                target = Path(root) / "prepared"
                with self.assertRaisesRegex(ValueError, "missing"):
                    self.prepare(self.archive(missing=required), target)
                self.assertFalse(target.exists())

    def test_traversal_and_duplicate_files_are_rejected_before_writing(self):
        for member in ["../outside", "/absolute", "licenses/../../outside", "LICENSE"]:
            with self.subTest(member=member), tempfile.TemporaryDirectory() as root:
                target = Path(root) / "prepared"
                with self.assertRaises(ValueError):
                    self.prepare(self.archive(extra=[(member, b"untrusted")]), target)
                self.assertFalse(target.exists())

    def test_v8_xfa_and_debug_are_explicitly_disabled(self):
        for flag in ["pdf_enable_v8", "pdf_enable_xfa", "is_debug"]:
            flags = b"pdf_enable_v8 = false\npdf_enable_xfa = false\nis_debug = false\n"
            flags = flags.replace(f"{flag} = false".encode(), f"{flag} = true".encode())
            with self.subTest(flag=flag), tempfile.TemporaryDirectory() as root:
                with self.assertRaisesRegex(ValueError, flag):
                    self.prepare(self.archive(flags=flags), Path(root) / "prepared")


if __name__ == "__main__":
    unittest.main()
