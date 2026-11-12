"""Import-closure plumbing with text fixtures, not native PE qualification."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location("windows_dependencies", Path(__file__).with_name("windows_dependencies.py"))
deps = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(deps)


class ClosureTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name).resolve()
        self.trusted = self.root / "trusted"
        self.system = self.root / "System32"
        self.trusted.mkdir()
        self.system.mkdir()
        self.seed = self.root / "app.exe"
        self.seed.write_text("fake code")

    def tearDown(self):
        self.temporary.cleanup()

    def collect(self, graph, roots=None):
        return deps.collect([(self.seed, self.root / "candidate")],
            roots=roots or [self.trusted], system_directory=self.system,
            inspect=lambda file: graph.get(file.name.casefold(), []))

    def test_imports_include_normal_and_delay_sections(self):
        self.assertEqual(deps.parse_imports("""Dump of file C:\\build\\app.exe
  Section contains the following imports:
    KERNEL32.dll
                  18C Sleep
  Section contains the following delay load imports:
    plugin.dll
"""), ["KERNEL32.dll", "plugin.dll"])
        with self.assertRaises(ValueError):
            deps.parse_imports("    ../escape.dll")

    def test_transitive_cycle_dedup_and_system_contracts(self):
        (self.system / "KERNEL32.dll").write_text("system")
        (self.trusted / "one.dll").write_text("one")
        (self.trusted / "two.dll").write_text("two")
        closure = self.collect({"app.exe":["one.dll", "KERNEL32.dll", "api-ms-win-core-file-l1-1-0.dll"],
            "one.dll":["two.dll"], "two.dll":["one.dll"]})
        self.assertEqual({item["destination"].name for item in closure}, {"one.dll", "two.dll"})
        deps.copy(closure)
        self.assertEqual((self.root / "candidate/two.dll").read_text(), "two")

    def test_missing_and_conflicting_toolchain_dlls_are_not_taken_from_path(self):
        (self.root / "elsewhere.dll").write_text("must not find")
        with self.assertRaisesRegex(ValueError, "trusted --dll-root"):
            self.collect({"app.exe":["elsewhere.dll"]})
        other = self.root / "other"
        other.mkdir()
        (self.trusted / "one.dll").write_text("old")
        (other / "one.dll").write_text("different")
        with self.assertRaisesRegex(ValueError, "Ambiguous"):
            self.collect({"app.exe":["one.dll"]}, [self.trusted, other])

    def test_vc_runtime_is_redistributed_even_if_installed_on_builder(self):
        (self.system / "vcruntime140.dll").write_text("builder runtime")
        with self.assertRaisesRegex(ValueError, "trusted --dll-root"):
            self.collect({"app.exe":["vcruntime140.dll"]})
        (self.trusted / "vcruntime140.dll").write_text("qualified redistributable")
        closure = self.collect({"app.exe":["vcruntime140.dll"]})
        self.assertEqual(len(closure), 1)
        self.assertEqual(closure[0]["source"], self.trusted / "vcruntime140.dll")

    def test_changed_sources_and_candidate_overwrite_fail_closed(self):
        dll = self.trusted / "one.dll"
        dll.write_text("qualified")
        closure = self.collect({"app.exe":["one.dll"]})
        dll.write_text("changed")
        with self.assertRaisesRegex(ValueError, "changed"):
            deps.copy(closure)
        dll.write_text("qualified")
        target = closure[0]["destination"]
        target.parent.mkdir()
        target.write_text("different candidate code")
        with self.assertRaisesRegex(ValueError, "overwrite different"):
            deps.copy(closure)


if __name__ == "__main__":
    unittest.main()
