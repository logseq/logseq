"""Pure ownership/proof guard cases; no native app, HTTPS or trust mutation."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, call, patch

SPEC = importlib.util.spec_from_file_location(
    "logseq_standalone_upgrade", Path(__file__).with_name("qualify_standalone_upgrade.py"))
GATE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(GATE)


class StandaloneUpgradeTests(unittest.TestCase):
    def test_non_macos_refuses_before_any_trust_or_process(self):
        with patch.object(GATE.platform, "system", return_value="Linux"), \
                patch.object(GATE.https, "require_disposable_ci") as trust, \
                patch.object(GATE.subprocess, "Popen") as spawn:
            with self.assertRaisesRegex(ValueError, "macOS"):
                GATE.qualify(Mock())
            trust.assert_not_called()
            spawn.assert_not_called()

    def test_group_cleanup_precedes_any_reap_even_when_the_app_fails(self):
        with tempfile.TemporaryDirectory() as directory:
            private = Path(directory)
            process = Mock(pid=12345, spec=["pid", "wait"])
            calls = Mock()
            calls.attach_mock(process.wait, "wait")
            with patch.object(GATE.subprocess, "Popen", return_value=process), \
                    patch.object(GATE.os, "killpg") as kill:
                calls.attach_mock(kill, "kill")
                with self.assertRaisesRegex(RuntimeError, "app failure"):
                    with GATE.owned_application(private / "host", private, {}, private / "native.log"):
                        raise RuntimeError("app failure")
            self.assertEqual(calls.mock_calls, [call.kill(12345, GATE.signal.SIGKILL), call.wait(timeout=10)])

    def test_compiled_marker_requires_actual_version_and_same_live_app_pid(self):
        with tempfile.TemporaryDirectory() as directory:
            log = Path(directory) / "native.log"
            records = [{"event":"logseq-native-start", "compiledVersion":"2.0.1", "processId":123},
                       {"event":"logseq-native-start", "compiledVersion":"2.0.2", "processId":123}]
            log.write_text("diagnostic\n" + "\n".join(map(json.dumps, records)), encoding="utf-8")
            self.assertEqual(GATE.loaded_start(log, "2.0.2", 123), records[1])
            self.assertIsNone(GATE.loaded_start(log, "2.0.2", 999))
            self.assertIsNone(GATE.loaded_start(log, "metadata-only-version", 123))
            with log.open("a", encoding="utf-8") as output:
                output.write("\n" + json.dumps(records[1]))
            with self.assertRaisesRegex(RuntimeError, "duplicate"):
                GATE.loaded_start(log, "2.0.2", 123)

    def test_actual_dialog_token_is_answered_only_for_a_visible_enabled_exact_label(self):
        agent = Mock()
        agent.request.side_effect = [
            {"dialog":{"token":"stale", "buttons":[{"label":"Download", "enabled":False, "hidden":False}]}},
            {"dialog":{"token":"fresh", "buttons":[{"label":"Download", "enabled":True, "hidden":False}]}},
            {"activation":"native-controller", "dispatched":True},
        ]
        with patch.object(GATE.time, "sleep"):
            proof = GATE.answer_sheet(agent, "Download", GATE.time.monotonic()+2)
        self.assertEqual(proof["dialog"]["token"], "fresh")
        self.assertEqual(agent.request.call_args_list[-1],
                         call(op="native-dialog-answer", token="fresh", button="Download"))

    def health(self, private):
        return {"pid":456, "port":23456, "status":"ready", "ticket":"ticket", "generation":"generation",
                "storage":{"root":str(private/"root"), "graphsDir":str(private/"graphs")},
                "nsh-app-ownership":{"executable":str(private/"worker"), "instance":"worker-instance",
                                     "session":"app-session", "shared":False, "phase":"open"}}

    def test_read_only_health_requires_current_exact_child_origin_storage_and_executable(self):
        with tempfile.TemporaryDirectory() as directory:
            private = Path(directory).resolve()
            (private/"root").mkdir()
            (private/"root/server-list").write_text("456 23456\n", encoding="utf-8")
            record = self.health(private)
            response = Mock(status=200)
            response.read.side_effect = lambda _: json.dumps(record).encode()
            connection = Mock()
            connection.getresponse.return_value = response
            with patch.object(GATE.http.client, "HTTPConnection", return_value=connection), \
                    patch.object(GATE, "process_path", return_value=private/"worker"), \
                    patch.object(GATE.https, "run", return_value="123"):
                self.assertEqual(GATE.worker_health(private, 123, private/"worker"), record)
                connection.request.assert_called_once_with("GET", "/healthz")
                for field, value in (("shared", True), ("phase", "sealed"), ("executable", "/unrelated/worker")):
                    previous = record["nsh-app-ownership"][field]
                    record["nsh-app-ownership"][field] = value
                    with self.assertRaisesRegex(RuntimeError, "owned executable/storage"):
                        GATE.worker_health(private, 123, private/"worker")
                    record["nsh-app-ownership"][field] = previous
                record["storage"]["root"] = str(private.parent)
                with self.assertRaisesRegex(RuntimeError, "owned executable/storage"):
                    GATE.worker_health(private, 123, private/"worker")

    def test_foreign_parent_does_not_prove_current_application_ownership(self):
        with tempfile.TemporaryDirectory() as directory:
            private = Path(directory).resolve()
            (private/"root").mkdir()
            (private/"root/server-list").write_text("456 23456\n", encoding="utf-8")
            response = Mock(status=200)
            response.read.return_value = json.dumps(self.health(private)).encode()
            connection = Mock()
            connection.getresponse.return_value = response
            with patch.object(GATE.http.client, "HTTPConnection", return_value=connection), \
                    patch.object(GATE, "process_path", return_value=private/"worker"), \
                    patch.object(GATE.https, "run", return_value="999"):
                with self.assertRaisesRegex(RuntimeError, "exact standalone App"):
                    GATE.worker_health(private, 123, private/"worker")


if __name__ == "__main__":
    unittest.main()
