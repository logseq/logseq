"""Local validation of isolation and screenshot evidence, not native UI proof."""
import base64
import importlib.util
from pathlib import Path
import struct
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location(
    "logseq_packaged_startup", Path(__file__).with_name("qualify_packaged_startup.py"))
QUALIFIER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(QUALIFIER)


class PackagedBackgroundTests(unittest.TestCase):
    def test_private_environment_removes_external_artifacts_and_preserves_input(self):
        inherited = {name: "/unrelated/user/artifact" for name in QUALIFIER.REMOVED_OVERRIDES}
        inherited.update(HOME="/user/home", LOGSEQ_ROOT_DIR="/user/graph", PATH="kept")
        before = inherited.copy()
        with tempfile.TemporaryDirectory() as outside:
            private = Path(outside).resolve()
            environment = QUALIFIER.native_environment(private, ("127.0.0.1", 49399), inherited)
            for name in QUALIFIER.REMOVED_OVERRIDES:
                self.assertNotIn(name, environment)
            for name in ("HOME", "LOGSEQ_ROOT_DIR", "LOGSEQ_GRAPHS_DIR", "LOGSEQ_UI_STATE_DIR"):
                self.assertTrue(Path(environment[name]).is_relative_to(private))
                self.assertTrue(Path(environment[name]).is_dir())
            self.assertEqual(environment["LUI_AGENT_BACKGROUND"], "1")
            self.assertEqual(environment["LOGSEQ_NO_LOGIN_DAEMON"], "1")
            self.assertEqual(environment["LUI_AGENT_LISTEN"], "127.0.0.1:49399")
            self.assertEqual(environment["PATH"], "kept")
        self.assertEqual(inherited, before)

    def test_journal_readiness_accepts_real_text_or_raw_headers_not_sidebar_labels(self):
        helper = type("TreeHelper", (), {"nodes": staticmethod(lambda tree: iter(tree["nodes"]))})
        for kind in ("text", "extension"):
            tree = {"nodes": [{"id": 9, "kind": kind, "props": {"text": "Nov 12th, 2026"}}]}
            self.assertEqual(QUALIFIER.dated_journal_header(tree, helper),
                             {"node": 9, "dateHeaderText": "Nov 12th, 2026"})
        for text in ("Journals", "Demo", "2026", "Loading 2026", "Nov 12th, "):
            tree = {"nodes": [{"props": {"text": text}}]}
            self.assertIsNone(QUALIFIER.dated_journal_header(tree, helper))

    def test_png_evidence_rejects_mismatched_dimensions_or_non_app_content(self):
        # A complete one-pixel PNG exercises evidence validation, not an app flow.
        png = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j89sAAAAASUVORK5CYII=")
        width, height = struct.unpack(">II", png[16:24])
        reply = {"format": "png", "capture": "appkit-content", "width": width,
                 "height": height, "data": base64.b64encode(png).decode("ascii")}
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "content.png"
            saved = QUALIFIER.save_png(reply, target)
            self.assertEqual(target.read_bytes(), png)
            self.assertEqual(saved["pixelAndUxParity"], "unqualified")
            for change in ({"width": 900}, {"capture": "desktop"}, {"data": "invalid!"},
                           {"data": base64.b64encode(b"not png").decode("ascii")}):
                with self.subTest(change=change), self.assertRaises(ValueError):
                    QUALIFIER.save_png({**reply, **change}, target)


if __name__ == "__main__":
    unittest.main()
