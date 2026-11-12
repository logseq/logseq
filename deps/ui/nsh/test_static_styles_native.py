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
from unittest.mock import patch
from build_windows_dll import ARCHIVES, UI
import validate_static_styles as gate
from validate_static_styles import validate


class NativeStyleCompileTests(unittest.TestCase):
    def check_fixture(self, body, *, rejected, expected_diagnostic=None, expected_deferred=None,
                      ppx=False, source_rejected=False):
        executable = Path(os.environ["LOGSEQ_NSH_PREFLIGHT_EXECUTABLE"]).resolve(strict=True)
        prefix = ["opam", "exec", "--switch=" + os.environ.get("OPAMSWITCH", "5.5.1"), "--"]
        includes = []
        for archive in ARCHIVES:
            path = UI / "_build/default" / archive
            objects = path.parent / ("." + path.stem + ".objs")
            for kind in ("byte", "native"):
                includes += ["-I", objects / kind]
        with tempfile.TemporaryDirectory(prefix="native-style-rejected-call-") as temporary:
            stage = Path(temporary)
            source = stage / "target_fixture.ml"
            source.write_text(body, encoding="utf-8")
            subprocess.run([*map(str, prefix), "ocamlfind", "ocamlopt", "-package",
                "lui,lui.ppx" if ppx else "lui",
                *map(str, includes), "-bin-annot", "-c", str(source)], cwd=stage, check=True)
            # A supplied typed fixture must not trigger an unrelated archive
            # Dune build; it is already the exact unit under qualification.
            diagnostics = []
            real_command = gate.command

            def capture(arguments, *, cwd, stdout=None):
                if Path(arguments[0]).stem == "static_style_sites":
                    result = subprocess.run(list(map(str, arguments)), cwd=cwd,
                        stdout=stdout, stderr=subprocess.PIPE, text=True, check=True)
                    diagnostics.append(result.stderr)
                elif Path(arguments[0]) == executable:
                    subprocess.run(list(map(str, arguments)), cwd=cwd,
                        stdout=stdout, stderr=subprocess.PIPE, text=True, check=True)
                else:
                    real_command(arguments, cwd=cwd, stdout=stdout)

            with patch("validate_static_styles.ensure_archive_typedtrees",
                       side_effect=AssertionError("Unexpected archive CMT build")), \
                 patch("validate_static_styles.command", side_effect=capture):
                if rejected:
                    self.assertIsNotNone(expected_diagnostic)
                    with self.assertRaises(subprocess.CalledProcessError) as failure:
                        validate(executable, cmts=[source.with_suffix(".cmt")])
                    if source_rejected:
                        self.assertEqual(Path(failure.exception.cmd[0]).stem, "static_style_sites")
                        self.assertIn("target_fixture.ml", failure.exception.stderr)
                    else:
                        self.assertEqual(Path(failure.exception.cmd[0]), executable)
                    self.assertIn(expected_diagnostic, failure.exception.stderr)
                else:
                    validate(executable, cmts=[source.with_suffix(".cmt")])
            if expected_deferred:
                for expected in expected_deferred:
                    self.assertIn(expected, "\n".join(diagnostics))

    def test_actual_string_prop_reactive_contents_transition_fails_before_launch(self):
        self.check_fixture('''let value viewport =
  Ui_parts.string_prop Lui_protocol.DisplayValue
    ~value:(reactive (fun width -> if width >= 640. then "contents" else "none") viewport)
    (Lui_elements.box [])
''', ppx=True, rejected=True, source_rejected=True,
            expected_diagnostic="NSH reactive display can change between contents and a physical display")

    def test_reactive_constructor_contents_transition_fails_before_launch(self):
        self.check_fixture('''let value visible =
  Lui_elements.column ~display:(reactive (fun show -> if show then `contents else `none) visible) []
''', ppx=True, rejected=True, source_rejected=True,
            expected_diagnostic="NSH reactive display can change between contents and a physical display")

    def test_static_contents_and_physical_visibility_remain_valid(self):
        self.check_fixture('''let static = Lui_elements.box ~display:`contents []
let value visible =
  Ui_parts.string_prop Lui_protocol.DisplayValue
    ~value:(reactive (fun show -> if show then "block" else "none") visible)
    (Lui_elements.box [])
let constructor visible =
  Lui_elements.column ~display:(reactive (fun show -> if show then `block else `none) visible) []
let fixed visible =
  Ui_parts.string_prop Lui_protocol.DisplayValue
    ~value:(reactive (fun _ -> "contents") visible) (Lui_elements.box [])
''', ppx=True, rejected=False)

    def test_host_pruning_preserves_other_backend_contents_transitions(self):
        self.check_fixture('''let value context viewport =
  if Lui_ui.host context = Lui_protocol.NshHost then
    Ui_parts.string_prop Lui_protocol.DisplayValue
      ~value:(reactive (fun width -> if width >= 640. then "block" else "none") viewport)
      (Lui_elements.box [])
  else
    Ui_parts.string_prop Lui_protocol.DisplayValue
      ~value:(reactive (fun width -> if width >= 640. then "contents" else "none") viewport)
      (Lui_elements.box [])
''', ppx=True, rejected=False)

    def test_unknown_display_projection_stays_at_the_dynamic_boundary(self):
        self.check_fixture('''let value project visible =
  Ui_parts.string_prop Lui_protocol.DisplayValue
    ~value:(reactive project visible) (Lui_elements.box [])
''', ppx=True, rejected=False)

    def test_native_time_dismissal_is_rejected_before_launch(self):
        self.check_fixture('''let value = Lui_elements.input ~kind:`time ~text:"12:30"
  ~on_dismiss:(fun _ -> ()) []
''', rejected=True,
            expected_diagnostic="NSH TimeField does not expose dismiss-enabled")

    def test_native_text_dismissal_and_other_target_time_branch_are_valid(self):
        self.check_fixture('''let value context =
  if Lui_ui.host context = Lui_protocol.NshHost then
    Lui_elements.text_field ~on_dismiss:(fun _ -> ()) []
  else Lui_elements.input ~kind:`time ~on_dismiss:(fun _ -> ()) []
''', rejected=False)

    def test_native_time_dynamic_text_preserves_the_runtime_value_boundary(self):
        self.check_fixture('''let value text =
  Lui_elements.input ~kind:`time ~text []
''', rejected=False, expected_deferred=["(1 optional, 0 required)"])

    def test_native_time_known_callback_presence_does_not_execute_the_callback(self):
        self.check_fixture('''module Input = Lui_elements
let cancel _ = failwith "the application callback must never execute during preflight"
let value text = Input.input ~kind:`time ~text ?on_dismiss:(Some cancel) []
''', rejected=True, expected_diagnostic="NSH TimeField does not expose dismiss-enabled")

    def test_native_time_absent_dismissal_remains_valid(self):
        self.check_fixture('''let value = Lui_elements.input ~kind:`time ~text:"12:30"
  ?on_dismiss:None []
''', rejected=False)

    def test_native_time_known_options_are_rejected_with_unknown_text(self):
        for option, diagnostic in (("~read_only:true", "does not expose read-only"),
                ("~autofocus:true", "does not expose autofocus"),
                ("~on_navigate:(fun _ -> ())", "does not expose navigate-enabled"),
                ('~placeholder:"Time"', "does not expose a placeholder")):
            with self.subTest(option=option):
                self.check_fixture(f'''let value text =
  Lui_elements.input ~kind:`time ~text {option} []
''', rejected=True, expected_diagnostic="NSH TimeField " + diagnostic)

    def test_native_color_rejection_preserves_other_backend_color_calls(self):
        self.check_fixture('let value = Lui_elements.input ~kind:`color []\n',
            rejected=True, expected_diagnostic="NSH input-type=color is not implemented")
        self.check_fixture('''let value context =
  if Lui_ui.host context = Lui_protocol.NshHost then Lui_elements.text_field []
  else Lui_elements.input ~kind:`color []
''', rejected=False)

    def test_nsh_rejects_a_literal_native_style_grammar_error(self):
        self.check_fixture('let value = Ui_parts.Prop.font_size "not-a-font-size"\n',
            rejected=True, expected_diagnostic='unsupported font-size="not-a-font-size"')

    def test_nsh_rejects_auto_without_an_explicit_scroll_owner(self):
        self.check_fixture('let value = Ui_parts.Prop.overflow `auto\n',
            rejected=True, expected_diagnostic='does not support overflow="auto"')

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
''', rejected=True, expected_diagnostic='unsupported font-size="not-a-font-size"')

    def test_host_match_prunes_only_the_other_backend(self):
        self.check_fixture('''let value context =
  match Lui_ui.host context with
  | Lui_protocol.NshHost -> Ui_parts.Prop.overflow `hidden
  | _ -> Ui_parts.Prop.overflow `auto
''', rejected=False)

    def test_literal_constructor_props_use_the_actual_encoder(self):
        self.check_fixture('let value = Lui_elements.text ~font_size:"not-a-font-size" []\n',
            rejected=True, expected_diagnostic='unsupported font-size="not-a-font-size"')

    def test_immutable_font_alias_chain_is_rejected(self):
        self.check_fixture('''let font = "not-a-font-size"
let value () =
  let local = font in
  Ui_parts.Prop.font_size local
''', rejected=True, expected_diagnostic='unsupported font-size="not-a-font-size"')

    def test_immutable_overflow_alias_is_rejected(self):
        self.check_fixture('''let overflow = `auto
let value = Ui_parts.Prop.overflow overflow
''', rejected=True, expected_diagnostic='does not support overflow="auto"')

    def test_immutable_constructor_overflow_alias_is_rejected(self):
        self.check_fixture('''let overflow = "auto"
let value = Lui_elements.text ~overflow []
''', rejected=True, expected_diagnostic='does not support overflow="auto"')

    def test_some_optional_forwarding_alias_is_rejected(self):
        self.check_fixture('''let font_size = Some "not-a-font-size"
let forwarded = font_size
let value = Lui_elements.text ?font_size:forwarded []
''', rejected=True, expected_diagnostic='unsupported font-size="not-a-font-size"')

    def test_module_alias_rejection_reports_the_actual_provider_error(self):
        self.check_fixture('''module Props = Ui_parts.Prop
let baseline = Ui_parts.Prop.overflow `hidden
let value = Props.overflow `auto
''', rejected=True, expected_diagnostic='does not support overflow="auto"')

    def test_nested_module_aliases_keep_the_native_branch_valid(self):
        self.check_fixture('''module Parts = Ui_parts
module Controls = struct module Props = Parts.Prop end
module Host = Lui_ui
let value context =
  let native = Host.host context = Lui_protocol.NshHost in
  if not native then Controls.Props.overflow `auto else Controls.Props.overflow `hidden
''', rejected=False)

    def test_module_alias_shadowing_keeps_each_compiler_identity(self):
        self.check_fixture('''module Props = Ui_parts.Prop
let baseline = Props.overflow `hidden
let value () =
  let module Props = struct let overflow _ = Ui_parts.Prop.overflow `hidden end in
  Props.overflow `auto
''', rejected=False)

    def test_host_guard_preserves_web_only_constant_alias(self):
        self.check_fixture('''let overflow = `auto
let value context =
  if Lui_ui.host context = Lui_protocol.NshHost
  then Ui_parts.Prop.overflow `hidden
  else Ui_parts.Prop.overflow overflow
''', rejected=False)

    def test_local_shadowing_does_not_reuse_the_outer_literal(self):
        self.check_fixture('''let font = "not-a-font-size"
let value () =
  let font = "16px" in
  Ui_parts.Prop.font_size font
''', rejected=False)

    def test_unknown_optional_and_property_values_are_reported_as_deferred(self):
        self.check_fixture('''let baseline = Ui_parts.Prop.font_size "16px"
let property font_size = Ui_parts.Prop.font_size font_size
let constructor font_size = Lui_elements.text ~font_size []
''', rejected=False, expected_deferred=[
            "1 property calls deferred",
            "1 constructor calls contain deferred arguments (1 optional, 0 required)"])

    def test_mutable_storage_does_not_reuse_its_initial_literal(self):
        self.check_fixture('''let baseline = Ui_parts.Prop.font_size "16px"
let value () =
  let font = ref "not-a-font-size" in
  font := "16px";
  Ui_parts.Prop.font_size !font
''', rejected=False, expected_deferred=["1 property calls deferred"])


if __name__ == "__main__":
    unittest.main()
