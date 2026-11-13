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
            ("CAMLprim value logseq_lui_publish_patches(value encoded)",
             "void logseq_lui_publish_patches(value encoded)"),
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

    def test_callback_results_cannot_be_assigned_to_ocaml_roots(self):
        ui = Path(__file__).resolve().parent.parent
        source = (ui / "native/logseq_lui_bridge.c").read_text(encoding="utf-8")
        for callback in ("caml_callback_exn(Val_unit, Val_unit)",
                         "caml_callback2_exn(Val_unit, Val_unit, Val_unit)",
                         "caml_callback3_exn(Val_unit, Val_unit, Val_unit, Val_unit)",
                         "caml_callbackN_exn(Val_unit, 0, NULL)"):
            with self.subTest(callback=callback), tempfile.TemporaryDirectory() as temporary:
                bridge = Path(temporary) / "invalid_callback_root.c"
                bridge.write_text(source + "\nvoid invalid_callback_root(void) {\n"
                    "  CAMLparam0();\n  CAMLlocal1(root);\n  root = " + callback + ";\n"
                    "  CAMLreturn0;\n}\n", encoding="utf-8")
                with self.assertRaises(subprocess.CalledProcessError):
                    validate(ui=ui, bridge=bridge)


if __name__ == "__main__":
    unittest.main()
