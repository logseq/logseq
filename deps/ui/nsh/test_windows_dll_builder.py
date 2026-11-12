"""Source guards only; these do not qualify Windows compilation or startup."""
import importlib.util
import json
import tempfile
from pathlib import Path
import unittest
from unittest.mock import patch

MODULE = Path(__file__).with_name("build_windows_dll.py")
SPEC = importlib.util.spec_from_file_location("logseq_windows_dll", MODULE)
builder = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(builder)


class WindowsDllGuards(unittest.TestCase):
    def test_other_hosts_fail_before_any_tool_or_application_work(self):
        with patch.object(builder.platform, "system", return_value="Linux"), \
                patch.object(builder, "execute") as execute:
            with self.assertRaisesRegex(ValueError, "requires native Windows"):
                builder.build(Path("not-created-by-this-test"))
            execute.assert_not_called()

    def test_cygwin_ocaml_is_not_accepted_as_native_windows(self):
        config = "version: 5.5.1\nos_type: Cygwin\next_dll: .dll\narchitecture: amd64\next_obj: .o\n"
        with patch.object(builder.platform, "system", return_value="Windows"), \
                patch.object(builder, "execute", return_value=config):
            with self.assertRaisesRegex(ValueError, "native Windows x86_64"):
                builder.native_config()

    def test_generic_start_export_cannot_substitute_for_logseq_service_abi(self):
        with self.assertRaisesRegex(ValueError, "typed Logseq service ABI"):
            builder.bridge_exports("LUI_EXPORT int32_t lui_ocaml_start(void) {}")
        source = (builder.UI / "native/logseq_lui_bridge.c").read_text(encoding="utf-8")
        exports = builder.bridge_exports(source)
        self.assertIn("lui_ocaml_pump", exports)
        self.assertIn("lui_ocaml_platform_event", exports)
        self.assertIn("lui_ocaml_editor_snapshot_utf8", exports)
        self.assertIn("lui_ocaml_virtual_window", exports)
        self.assertIn("lui_ocaml_focus_within_changed", exports)
        self.assertNotIn("lui_ocaml_last_error", exports)

    def test_missing_sparse_window_export_is_rejected_before_compilation(self):
        source = (builder.UI / "native/logseq_lui_bridge.c").read_text(encoding="utf-8")
        source = source.replace("LUI_EXPORT int32_t lui_ocaml_virtual_window(",
                                "static int32_t omitted_sparse_window(")
        with self.assertRaisesRegex(ValueError, "typed Logseq service ABI"):
            builder.bridge_exports(source)

    def test_missing_container_focus_export_is_rejected_before_compilation(self):
        source = (builder.UI / "native/logseq_lui_bridge.c").read_text(encoding="utf-8")
        declaration = "LUI_EXPORT int32_t lui_ocaml_focus_within_changed("
        self.assertIn(declaration, source)
        source = source.replace(declaration, "static int32_t omitted_focus_within(")
        with self.assertRaisesRegex(ValueError, "lui_ocaml_focus_within_changed"):
            builder.bridge_exports(source)

    def test_all_pointer_macro_exports_are_probed_as_byte_length_functions(self):
        source = (builder.UI / "native/logseq_lui_bridge.c").read_text(encoding="utf-8")
        exports = builder.bridge_exports(source)
        for name in ("press_detail", "pointer_down", "pointer_up", "pointer_move",
                     "pointer_cancel", "context_menu_press"):
            symbol = "lui_ocaml_" + name
            with self.subTest(symbol=symbol):
                self.assertIn(symbol, exports)
                self.assertIn(symbol + "_utf8", exports)
                without = source.replace("LUI_POINTER_DETAIL_EXPORT(" + symbol + ")", "")
                with self.assertRaisesRegex(ValueError, symbol + "_utf8"):
                    builder.bridge_exports(without)

    def test_legacy_macro_definition_is_rejected_before_compilation(self):
        source = (builder.UI / "native/logseq_lui_bridge.c").read_text(encoding="utf-8")
        source = source.replace("LUI_EXPORT int32_t c_name##_utf8(",
                                "static int32_t omitted_utf8(")
        with self.assertRaisesRegex(ValueError, "pointer macro must export byte-length"):
            builder.bridge_exports(source)

    def test_c_string_only_pointer_macros_cannot_pass_the_nsh_contract(self):
        source = (builder.UI / "native/logseq_lui_bridge.c").read_text(encoding="utf-8")
        # A maintained C-string function is insufficient for the NSH pointer ABI.
        symbol = "lui_ocaml_pointer_down"
        source = source.replace("LUI_POINTER_DETAIL_EXPORT(" + symbol + ")",
                                "LUI_EXPORT int32_t " + symbol + "(void) {}")
        with self.assertRaisesRegex(ValueError, symbol + "_utf8"):
            builder.bridge_exports(source)

    def test_worker_handle_boundaries_preserve_legacy_close_and_exact_child_waiting(self):
        source = (builder.UI / "native/logseq_lui_bridge.c").read_text(encoding="utf-8")
        boundary = source.split("CAMLprim value caml_logseq_worker_process_id", 1)[1].split(
            "/* Read-only editor state", 1)[0]
        self.assertIn("#if defined(_WIN32)", boundary)
        self.assertLess(boundary.index("GetProcessId(process)"), boundary.index("GetLastError()"))
        self.assertLess(boundary.index("DWORD pid_error"), boundary.index("CloseHandle(process)"))
        self.assertIn("DWORD close_error = closed ? ERROR_SUCCESS : GetLastError()", boundary)
        self.assertIn("if (pid == 0)", boundary)
        self.assertIn("if (!closed)", boundary)
        self.assertIn("CAMLreturn(Val_long(pid))", boundary)
        self.assertIn("#else\n  CAMLreturn(child_process)", boundary)
        daemon = (builder.UI / "native/daemon_client.ml").read_text(encoding="utf-8")
        spawn = daemon.split("let spawn_daemon", 1)[1].split("(* ---------- daemon reuse", 1)[0]
        self.assertIn('if Sys.os_type = "Win32" then "NUL" else "/dev/null"', spawn)
        self.assertIn('Child_process.spawn', spawn)
        self.assertNotRegex(spawn, r"\bworker_process_id\s")
        self.assertNotRegex(spawn, r"Unix\.(?:waitpid|kill)\s")
        retained = source.split(
            "CAMLprim value caml_logseq_worker_process_id_retained", 1)[1].split(
                "/* Read-only editor state", 1)[0]
        self.assertIn("GetProcessId((HANDLE)(intnat)Long_val(child_process))", retained)
        self.assertNotIn("CloseHandle", retained)
        self.assertIn('"caml_logseq_worker_process_id_retained"', daemon)
        self.assertIn("Unix.waitpid [Unix.WNOHANG] child.wait_identity", daemon)

    def test_windows_default_home_and_state_do_not_require_a_posix_shell_home(self):
        source = (builder.UI / "native/services/platform_native.ml").read_text(encoding="utf-8")
        home = source.split("let home_directory ()", 1)[1].split("let packaged_resource_dir", 1)[0]
        self.assertIn('Sys.os_type = "Win32"', home)
        self.assertIn('Sys.getenv_opt "USERPROFILE"', home)
        state = source.split("let app_support_dir =", 1)[1].split("let state_file", 1)[0]
        self.assertIn('Sys.getenv_opt "APPDATA"', state)
        self.assertLess(state.index('Sys.os_type = "Win32"'), state.index('native_system = "Linux"'))


class SchemaExportPlumbing(unittest.TestCase):
    """Fake native tools test schema ordering/rollback, not OCaml compilation."""

    def test_exported_schema_matches_before_candidate_receipt_and_mismatch_preserves_old(self):
        for matches in (False, True):
            with self.subTest(matches=matches), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary).resolve()
                ui = root / "deps/ui"
                output = ui / "_build/candidate"
                output.mkdir(parents=True)
                target = output / "logseq_ui.dll"
                target.write_text("previous DLL")
                module = ui / "nsh/build_windows_dll.py"
                module.parent.mkdir(parents=True)
                module.write_text("builder fixture")
                schemas = [{"identifier":"real-export-fixture", "fingerprint":"exact"}]
                (module.parent / "schemas.json").write_text(json.dumps(schemas))
                native = ui / "native"
                native.mkdir()
                (native / "native_embed.ml").write_text("compiled entry fixture")
                (native / "logseq_lui_bridge.c").write_text(
                    "\n".join(f"LUI_EXPORT int {name}(void) {{}}" for name in
                        sorted(builder.NSH_REQUIRED_EXPORTS)))
                for archive in builder.ARCHIVES:
                    file = ui / "_build/default" / archive
                    file.parent.mkdir(parents=True, exist_ok=True)
                    file.write_text("compiled archive fixture")
                exported = []
                def execute(command, **kwargs):
                    command = list(map(str, command))
                    if command[0].endswith("export_schemas.exe"):
                        source = Path(command[0]).with_suffix(".ml").read_text()
                        self.assertEqual(source, "let () = print_endline (Native_embed.extension_schemas ())\n")
                        exported.append(True)
                        return json.dumps(schemas if matches else [])
                    if "-o" in command:
                        Path(command[command.index("-o") + 1]).write_text("compiled candidate")
                config = {"version":"5.5.1", "ext_obj":".obj"}
                with patch.multiple(builder, UI=ui, REPO=root, __file__=str(module)), \
                     patch.object(builder, 'native_config', return_value=config), \
                     patch.object(builder, 'execute', side_effect=execute):
                    if matches:
                        self.assertEqual(builder.build(output), target)
                        self.assertEqual(target.read_text(), "compiled candidate")
                        receipt = json.loads((output / "ocaml-toolchain.json").read_text())
                        self.assertIn("schemasSha256", receipt)
                        self.assertEqual(json.loads((output / "schemas.json").read_text()), schemas)
                    else:
                        with self.assertRaisesRegex(ValueError, "compiled Windows schemas differ"):
                            builder.build(output)
                        self.assertEqual(target.read_text(), "previous DLL")
                        self.assertFalse((output / "ocaml-toolchain.json").exists())
                self.assertEqual(exported, [True])


if __name__ == "__main__":
    unittest.main()
