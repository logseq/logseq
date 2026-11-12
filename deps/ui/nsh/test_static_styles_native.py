"""Compile-failure regressions for the actual native build presentation gate.

Requires the current native archives and freshly compiled candidate executable.
Run with LOGSEQ_NSH_PREFLIGHT_EXECUTABLE=/absolute/path/to/logseq-nsh.
No application window, daemon, graph or system clipboard is opened.
"""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from build_windows_dll import ARCHIVES, UI
from validate_static_styles import validate


class NativeStyleCompileTests(unittest.TestCase):
    def check_fixture(self, body, *, rejected):
        executable = Path(os.environ["LOGSEQ_NSH_PREFLIGHT_EXECUTABLE"]).resolve(strict=True)
        prefix = ["opam", "exec", "--switch=" + os.environ.get("OPAMSWITCH", "5.5.1"), "--"]
        includes = []
        for archive in ARCHIVES:
            path = UI / "_build/default" / archive
            includes += ["-I", path.parent / ("." + path.stem + ".objs/byte")]
        with tempfile.TemporaryDirectory(prefix="native-style-rejected-call-") as temporary:
            stage = Path(temporary)
            source = stage / "target_fixture.ml"
            source.write_text(body, encoding="utf-8")
            subprocess.run([*map(str, prefix), "ocamlfind", "ocamlopt", "-package", "lui",
                *map(str, includes), "-bin-annot", "-c", str(source)], cwd=stage, check=True)
            if rejected:
                with self.assertRaises(subprocess.CalledProcessError):
                    validate(executable, cmts=[source.with_suffix(".cmt")])
            else:
                validate(executable, cmts=[source.with_suffix(".cmt")])

    def test_nsh_rejects_a_literal_native_style_grammar_error(self):
        self.check_fixture('let value = Ui_parts.Prop.font_size "not-a-font-size"\n', rejected=True)

    def test_nsh_rejects_auto_without_an_explicit_scroll_owner(self):
        self.check_fixture('let value = Ui_parts.Prop.overflow `auto\n', rejected=True)

    def test_nsh_host_alias_keeps_web_only_css_calls_valid(self):
        self.check_fixture('''module Props = Ui_parts.Prop
let value context =
  let native = Lui_ui.host context = Lui_protocol.NshHost in
  if not native then Props.overflow `auto else Props.overflow `hidden
''', rejected=False)

    def test_nsh_target_checks_the_selected_branch(self):
        self.check_fixture('''let value context =
  if Lui_ui.host context = Lui_protocol.NshHost
  then Ui_parts.Prop.font_size "not-a-font-size"
  else Ui_parts.Prop.font_size "16px"
''', rejected=True)

    def test_host_match_prunes_only_the_other_backend(self):
        self.check_fixture('''let value context =
  match Lui_ui.host context with
  | Lui_protocol.NshHost -> Ui_parts.Prop.overflow `hidden
  | _ -> Ui_parts.Prop.overflow `auto
''', rejected=False)

    def test_literal_constructor_props_use_the_actual_encoder(self):
        self.check_fixture('let value = Lui_elements.text ~font_size:"not-a-font-size" []\n', rejected=True)


if __name__ == "__main__":
    unittest.main()
