"""Check target orchestration; these mocks do not qualify native compilation."""
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import validate_static_styles as gate


class NativeTypedtreeTargets(unittest.TestCase):
    def test_one_batch_requests_only_units_returned_from_actual_archives(self):
        with tempfile.TemporaryDirectory() as temporary:
            ui = Path(temporary)
            archive = ui / "_build/default/src/contracts/logseq_ui_contracts.cmxa"
            units = [archive.parent / ".logseq_ui_contracts.objs/byte" / name
                     for name in ("ui_task.cmt", "ui_services.cmt")]
            units[0].parent.mkdir(parents=True)
            units[0].touch()
            # An unrelated stale module must not become an input or build target.
            (units[0].parent / "retired_module.cmt").touch()

            def build(arguments, *, cwd):
                self.assertEqual(cwd, ui)
                self.assertEqual(arguments, ["opam", "exec", "--", "dune", "build",
                    Path("src/contracts/.logseq_ui_contracts.objs/byte/ui_task.cmt"),
                    Path("src/contracts/.logseq_ui_contracts.objs/byte/ui_services.cmt")])
                units[1].touch()

            with patch.object(gate, "UI", ui), \
                 patch.object(gate.subprocess, "check_output", return_value=
                    "\n".join(map(str, units)) + "\n") as inventory, \
                 patch.object(gate, "command", side_effect=build) as command:
                gate.ensure_archive_typedtrees(["opam", "exec", "--"], "extractor", [archive])
                inventory.assert_called_once_with(
                    ["extractor", "--cmt-targets", str(archive)],
                    cwd=ui / "_build/default", text=True)
                command.assert_called_once()

    def test_missing_requested_native_unit_remains_a_failure(self):
        with tempfile.TemporaryDirectory() as temporary:
            ui = Path(temporary)
            missing = ui / "_build/default/native/.logseq_ui_native.objs/byte/view.cmt"
            with patch.object(gate, "UI", ui), \
                 patch.object(gate.subprocess, "check_output", return_value=str(missing)), \
                 patch.object(gate, "command"):
                with self.assertRaisesRegex(ValueError, "did not produce actual native typedtrees"):
                    gate.ensure_archive_typedtrees([], "extractor", ["actual.cmxa"])

    def test_an_empty_archive_inventory_cannot_skip_the_gate(self):
        with patch.object(gate.subprocess, "check_output", return_value=""), \
             patch.object(gate, "command") as command:
            with self.assertRaisesRegex(ValueError, "contain no typedtree units"):
                gate.ensure_archive_typedtrees([], "extractor", ["actual.cmxa"])
            command.assert_not_called()


if __name__ == "__main__":
    unittest.main()
