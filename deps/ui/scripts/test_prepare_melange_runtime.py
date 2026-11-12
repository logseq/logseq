"""Installed metadata planning tests; actual runtime loading is the helper's gate."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location(
    "prepare_melange_runtime", Path(__file__).with_name("prepare-melange-runtime.py"))
runtime = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(runtime)


class RuntimeMetadataTests(unittest.TestCase):
    def test_authoritative_source_names_preserve_case_and_aliases(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            library = root / "js"
            objects = library / "melange"
            objects.mkdir(parents=True)
            for name in ("js__Js_writableStream", "js__", "curry"):
                (objects / f"{name}.cmj").touch()
            (root / "dune-package").write_text('''
(library (name melange.js)
 (melange_modules (stdlib (modules
  ((obj_name js__Js_writableStream)
   (source (impl (path js/js_writableStream.ml))))
  ((obj_name js__) (kind alias)
   (source (impl (path js/js__.ml-gen))))
  ((obj_name curry) (source (impl (path js/curry.ml))))
  ((obj_name interface_only) (source (intf (path js/interface_only.mli))))))))
''', encoding="utf-8")
            records = runtime.runtime_modules(root, {"melange.js": library})
            self.assertEqual([str(output) for _, _, output in records],
                             ["js_writableStream.js", "js__.js", "curry.js"])
            self.assertTrue(all(cmj.parent == objects for _, cmj, _ in records))

    def test_missing_or_ambiguous_cmj_is_not_silently_skipped(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "dune-package").write_text('''
(library (name melange)
 (melange_modules (stdlib (modules
  ((obj_name stdlib__Queue) (source (impl (path queue.ml))))))))
''', encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "exactly one installed CMJ"):
                runtime.runtime_modules(root, {"melange": root})
            for directory in ("first", "second"):
                target = root / directory
                target.mkdir()
                (target / "stdlib__Queue.cmj").touch()
            with self.assertRaisesRegex(ValueError, "exactly one installed CMJ"):
                runtime.runtime_modules(root, {"melange": root})

    def test_malformed_metadata_fails_before_emission(self):
        for source in ("(library", ")"):
            with self.subTest(source=source), self.assertRaises(ValueError):
                runtime.sexps(source)

    def test_duplicate_fields_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "Duplicate installed metadata field"):
            runtime.field(runtime.sexps("(name melange) (name another)"), "name")


if __name__ == "__main__":
    unittest.main()
