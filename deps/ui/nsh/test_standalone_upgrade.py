"""Pure ownership/proof guard cases; no native app, HTTPS or trust mutation."""
from contextlib import contextmanager
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

    def test_dirty_authored_version_and_noncommit_head_are_rejected(self):
        source = Path("/private/authored-source")
        with patch.object(GATE.https, "run", side_effect=["a"*40, " M resources/package.json"]):
            with self.assertRaisesRegex(ValueError, "unchanged tracked"):
                GATE.source_snapshots([source])
        with patch.object(GATE.https, "run", return_value="main"):
            with self.assertRaisesRegex(ValueError, "exact authored commit"):
                GATE.source_snapshots([source])
        with patch.object(GATE.https, "run", side_effect=["a"*40, "", "b"*40, ""]):
            first = GATE.source_snapshots([source])
            second = GATE.source_snapshots([source])
            self.assertNotEqual(first, second, "end-of-gate source snapshots detect checkout replacement")

    def test_native_or_trust_cleanup_failure_cannot_leave_a_passing_receipt(self):
        @contextmanager
        def failing_cleanup():
            yield
            raise RuntimeError("owned cleanup failed")
        with tempfile.TemporaryDirectory() as directory:
            evidence = Path(directory) / "evidence.json"
            result = {"qualified": False}
            with self.assertRaisesRegex(RuntimeError, "owned cleanup failed"):
                with GATE.proof_record(evidence, result):
                    with failing_cleanup():
                        result["runtimeValidated"] = True
            saved = json.loads(evidence.read_text(encoding="utf-8"))
            self.assertIs(saved["qualified"], False)
            self.assertIs(saved["runtimeValidated"], True)
            self.assertEqual(saved["error"], "owned cleanup failed")
            result = {"qualified": False}
            evidence.write_text(json.dumps({"qualified": True, "priorRun": True}), encoding="utf-8")
            with GATE.proof_record(evidence, result):
                self.assertIs(json.loads(evidence.read_text(encoding="utf-8"))["qualified"], False,
                              "a new attempt clears a prior passing receipt before any owned actions")
                self.assertIs(result["qualified"], False, "passing status waits for all owner scopes")
                result["runtimeValidated"] = True
            self.assertIs(json.loads(evidence.read_text(encoding="utf-8"))["qualified"], True)

    def test_evidence_cannot_write_into_a_checkout_or_outside_owned_runner_root(self):
        with tempfile.TemporaryDirectory() as directory:
            runner = Path(directory).resolve()
            source = runner / "source"
            source.mkdir()
            for evidence in (source/"receipt.json", runner.parent/"unowned.json", runner):
                with self.subTest(evidence=evidence), self.assertRaisesRegex(ValueError, "outside checkouts"):
                    GATE.evidence_path(evidence, runner, [source])
            self.assertEqual(GATE.evidence_path(runner/"proof/receipt.json", runner, [source]),
                             runner/"proof/receipt.json")

    def test_durable_content_is_scoped_to_the_original_block_uuid(self):
        helper = Mock()
        helper.nodes.side_effect = lambda tree: tree["nodes"]
        agent = Mock()
        agent.request.side_effect = [{"nodes":[]}, {"nodes":[42]},
            {"nodes":[{"props":{"text":"unrelated content"}}]}, {"nodes":[42]},
            {"nodes":[{"props":{"text":"durable marker"}}]}]
        block_id = "12345678-1234-4234-8234-123456789abc"
        self.assertIs(GATE.persisted_block_visible(helper, agent, block_id, "durable marker"), False)
        self.assertIs(GATE.persisted_block_visible(helper, agent, block_id, "durable marker"), False)
        self.assertIs(GATE.persisted_block_visible(helper, agent, block_id, "durable marker"), True)
        target = "prop:accessibility-identifier=block-content-"+block_id
        self.assertEqual(agent.request.call_args_list[-1], call(op="tree", selector=target))

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
