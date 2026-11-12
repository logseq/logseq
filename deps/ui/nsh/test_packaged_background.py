"""Local validation of isolation and screenshot evidence, not native UI proof."""
import base64
import importlib.util
from pathlib import Path
import struct
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location(
    "logseq_packaged_startup", Path(__file__).with_name("qualify_packaged_startup.py"))
QUALIFIER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(QUALIFIER)


class PackagedBackgroundTests(unittest.TestCase):
    def test_complete_linux_update_root_and_macos_bundle_resolve_their_own_resources(self):
        application = Path("outside checkout/installed app")
        for system, executable, library in (
                ("Linux", application / "logseq-nsh", application / "Resources/liblogseq_ui.so"),
                ("Darwin", application / "Contents/MacOS/logseq-nsh",
                 application / "Contents/Resources/liblogseq_ui.dylib")):
            with self.subTest(system=system):
                actual_executable, resources, actual_library = QUALIFIER.installed_artifacts(application, system)
                self.assertEqual(actual_executable, executable)
                self.assertEqual(actual_library, library)
                self.assertEqual(resources / "logseq-db-worker", library.parent / "logseq-db-worker")
                self.assertEqual(actual_library.parent, resources)
        with self.assertRaises(ValueError):
            QUALIFIER.installed_artifacts(application, "Windows")

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

    @staticmethod
    def native_bounds(bounds):
        return {"ok": True, "op": "native-bounds", "diagnostics": {
            "present": True, "contentBounds": bounds, "viewport": [0, 0, 1440, 900],
            "intersectsViewport": True, "windowVisible": True, "applicationHidden": False,
            "applicationActive": False, "windowKey": False, "scanTruncated": False,
            "ancestryTruncated": False,
            "coordinateSpace": "AppKit window content; not Core layout or desktop screen",
            "ancestors": [{"hidden": False, "hiddenByAncestor": False,
                           "alpha": 1.0, "layerOpacity": None, "isContentRoot": True}]}}

    def test_native_readiness_accepts_inactive_background_geometry_without_activation(self):
        reply = self.native_bounds([300, 60, 700, 40])
        self.assertEqual(QUALIFIER.visible_native_bounds(reply), [300, 60, 700, 40])

    def test_native_readiness_rejects_retained_but_missing_hidden_or_blank_views(self):
        cases = [
            {"present": False}, {"contentBounds": None}, {"contentBounds": [0, 0, 0, 40]},
            {"contentBounds": [0, 0, 40, float("nan")]},
            {"contentBounds": [2000, 0, 200, 40]}, {"intersectsViewport": False},
            {"windowVisible": False}, {"applicationHidden": True},
            {"scanTruncated": True}, {"ancestryTruncated": True}, {"ancestors": []},
            {"coordinateSpace": "Core layout"},
        ]
        for ancestor in ({"hidden": True}, {"hiddenByAncestor": True}, {"alpha": 0},
                         {"layerOpacity": 0}, {"alpha": float("nan")}, {"isContentRoot": False}):
            original = self.native_bounds([300, 60, 700, 40])["diagnostics"]["ancestors"][0]
            cases.append({"ancestors": [{**original, **ancestor}]})
        for change in cases:
            with self.subTest(change=change):
                reply = self.native_bounds([300, 60, 700, 40])
                reply["diagnostics"].update(change)
                self.assertIsNone(QUALIFIER.visible_native_bounds(reply))

    def test_journal_gate_requires_actual_bounds_for_all_three_canonical_regions(self):
        helper = type("TreeHelper", (), {"nodes": staticmethod(lambda tree: iter(tree["nodes"]))})
        tree = {"nodes": [{"id": 9, "props": {"text": "Nov 12th, 2026"}}]}
        requests = []
        replies = {
            "prop:accessibility-identifier=main-content-container": self.native_bounds([250, 40, 900, 800]),
            "prop:accessibility-identifier=journals": self.native_bounds([280, 50, 800, 750]),
            "id:9": self.native_bounds([300, 60, 700, 40]),
        }

        class Fixture:
            def request(self, **request):
                requests.append(request)
                if request["op"] == "find":
                    return {"nodes": [8]}
                if request["op"] == "tree":
                    return tree
                return replies[request["selector"]]

        with patch.object(QUALIFIER.time, "monotonic", return_value=0):
            subtree, result = QUALIFIER.wait_journal_body(Fixture(), helper, 1)
        self.assertIs(subtree, tree)
        self.assertEqual(result["nativeBounds"]["dateHeader"], replies["id:9"])
        self.assertEqual([request["selector"] for request in requests if request["op"] == "native-bounds"],
                         list(replies))
        for selector, bounds in (("id:9", [300, 60, 0, 40]),
                                 ("prop:accessibility-identifier=journals", [1200, 60, 200, 40]),
                                 ("prop:accessibility-identifier=main-content-container", [0, 0, 200, 900])):
            with self.subTest(selector=selector):
                previous = replies[selector]
                replies[selector] = self.native_bounds(bounds)
                with patch.object(QUALIFIER.time, "monotonic", side_effect=[0, 0, 2]), \
                        patch.object(QUALIFIER.time, "sleep"), \
                        self.assertRaisesRegex(RuntimeError, "natively visible"):
                    QUALIFIER.wait_journal_body(Fixture(), helper, 1)
                replies[selector] = previous

    def test_journal_capture_waits_for_full_sidebar_geometry_not_a_visible_strip(self):
        def layout(main, sidebar, contents):
            return {name: self.native_bounds(rect) for name, rect in
                    (("main", main), ("sidebar", sidebar), ("contents", contents))}

        final = layout([246, 0, 1194, 852], [0, 0, 246, 900], [0, 0, 245, 700])
        self.assertTrue(QUALIFIER.open_sidebar_layout_ready(final))
        # Both the sidebar shell and main pane have moved to 28pt, while the
        # actual sidebar contents still need 245pt. A visible strip is not ready.
        strip = layout([28, 0, 1412, 852], [0, 0, 28, 900], [0, 0, 245, 700])
        self.assertFalse(QUALIFIER.open_sidebar_layout_ready(strip))
        self.assertTrue(QUALIFIER.open_sidebar_layout_ready(
            layout([320, 0, 1120, 852], [0, 0, 320, 900], [0, 0, 319, 700])))
        for value in (
                layout([28, 0, 1194, 852], [0, 0, 246, 900], [0, 0, 245, 700]),
                layout([246, 0, 1400, 852], [0, 0, 246, 900], [0, 0, 245, 700])):
            with self.subTest(value=value):
                self.assertFalse(QUALIFIER.open_sidebar_layout_ready(value))
        for name in ("main", "sidebar", "contents"):
            for change in ({"ancestryTruncated": True}, {"present": False},
                           {"windowVisible": False}, {"viewport": [0, 0, 1200, 900]}):
                broken = layout([246, 0, 1194, 852], [0, 0, 246, 900], [0, 0, 245, 700])
                broken[name]["diagnostics"].update(change)
                with self.subTest(name=name, change=change):
                    self.assertFalse(QUALIFIER.open_sidebar_layout_ready(broken))

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
