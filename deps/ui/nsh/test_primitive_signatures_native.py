"""Real C compile-failure checks, using the actual OCaml external declarations.

Run separately from mocked publication tests; a native OCaml toolchain is required.
"""
from pathlib import Path
import subprocess
import tempfile
import unittest

from validate_primitive_signatures import validate


class NativePrimitiveSignatures(unittest.TestCase):
    def test_actual_bridge_matches_all_native_external_bindings(self):
        validate()

    def test_void_and_wrong_arity_definitions_are_compile_errors(self):
        ui = Path(__file__).resolve().parent.parent
        source = (ui / "native/logseq_lui_bridge.c").read_text(encoding="utf-8")
        replacements = (
            ("CAMLprim value logseq_lui_wakeup(value unit)",
             "void logseq_lui_wakeup(value unit)"),
            ("CAMLprim value logseq_lui_platform_request(value payload)",
             "void logseq_lui_platform_request(value payload)"),
            ("CAMLprim value caml_logseq_worker_process_id(value child_process)",
             "CAMLprim value caml_logseq_worker_process_id(value child_process, value extra)"),
        )
        for original, invalid in replacements:
            with self.subTest(invalid=invalid), tempfile.TemporaryDirectory() as temporary:
                self.assertIn(original, source)
                bridge = Path(temporary) / "invalid_bridge.c"
                bridge.write_text(source.replace(original, invalid, 1), encoding="utf-8")
                with self.assertRaises(subprocess.CalledProcessError):
                    validate(ui=ui, bridge=bridge)


if __name__ == "__main__":
    unittest.main()
