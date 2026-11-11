"""Source guards only; these do not qualify Windows compilation or startup."""
import importlib.util
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
        self.assertNotIn("lui_ocaml_last_error", exports)


if __name__ == "__main__":
    unittest.main()
