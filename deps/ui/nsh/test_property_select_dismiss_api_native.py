"""Compile the property selector API against the actual native application CMIs.

Build the current native archives first. No Dune invocation, runtime process,
application window, daemon or clipboard access is performed by these cases.
"""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

from build_windows_dll import ARCHIVES, UI


class PropertySelectDismissTypes(unittest.TestCase):
    def test_optional_callback_is_compatible_and_wrong_shapes_fail_at_compilation(self):
        prefix = ["opam", "exec", "--switch=" + os.environ.get("OPAMSWITCH", "5.5.1"), "--"]
        includes = []
        for archive in ARCHIVES:
            relative = Path(archive)
            objects = UI / "_build/default" / relative.parent / ("." + relative.stem + ".objs")
            for kind in ("byte", "native"):
                includes.extend(("-I", str(objects / kind)))
        compiler = [*prefix, "ocamlfind", "ocamlopt", "-package", "lui", *includes, "-c"]
        with tempfile.TemporaryDirectory(prefix="property-select-callback-") as temporary:
            stage = Path(temporary)
            valid = stage / "valid.ml"
            valid.write_text('''let legacy : Lui_elements.t =
  Properties_select.view ~placeholder:"Property" []
let dismissible : Lui_elements.t =
  Properties_select.view ~placeholder:"Property"
    ~on_dismiss:(fun (_ : Lui_protocol.event) -> ()) []
''')
            subprocess.run([*compiler, str(valid)], cwd=stage, check=True)
            for name, callback, expected in (
                ("invalid_bool", "true", "bool"),
                ("invalid_payload", "(fun (_ : string) -> ())", "string"),
            ):
                source = stage / (name + ".ml")
                source.write_text('let value : Lui_elements.t =\n'
                    '  Properties_select.view ~placeholder:"Property"\n'
                    f'    ~on_dismiss:{callback} []\n')
                result = subprocess.run([*compiler, str(source)], cwd=stage,
                    capture_output=True, text=True)
                self.assertNotEqual(result.returncode, 0, name + " must not compile")
                self.assertIn(expected, result.stderr)
                self.assertIn("Lui_protocol.event", result.stderr)
                self.assertNotIn("Unbound", result.stderr)
