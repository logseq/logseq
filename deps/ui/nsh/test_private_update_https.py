"""Trust ownership guards only; no certificates, commands or native apps run."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, call, patch

SPEC = importlib.util.spec_from_file_location(
    "logseq_private_update_https", Path(__file__).with_name("private_update_https.py"))
GATE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(GATE)


class DisposableTrustTests(unittest.TestCase):
    def test_cached_ready_retry_cannot_download_the_archive_twice(self):
        def request(path, complete=True):
            return {"case":"later", "path":path, "complete":complete}
        metadata = [request("/latest.json"), request("/latest.json.sig")]
        archive = request("/N2.zip")
        GATE.verify_requests([*metadata, archive], "later", "N2.zip")
        with self.assertRaisesRegex(ValueError, "archive boundary"):
            GATE.verify_requests([*metadata, archive, archive], "later", "N2.zip")
        with self.assertRaisesRegex(ValueError, "HTTPS metadata"):
            GATE.verify_requests([metadata[0], archive], "later", "N2.zip")
        tampered = [dict(item, case="tampered-manifest") for item in metadata]
        GATE.verify_requests(tampered, "tampered-manifest", "N2.zip")
        with self.assertRaisesRegex(ValueError, "archive boundary"):
            GATE.verify_requests([*tampered, dict(archive, case="tampered-manifest")],
                                 "tampered-manifest", "N2.zip")

    def test_tls_handshake_is_owned_by_a_timeout_bounded_request(self):
        connection = Mock(spec=GATE.ssl.SSLSocket)
        GATE.begin_tls_request(connection)
        self.assertEqual(connection.method_calls, [call.settimeout(15), call.do_handshake()])

    def test_developer_and_self_hosted_contexts_cannot_mutate_trust(self):
        for environment, allow in (({}, True),
                ({"CI":"true", "GITHUB_ACTIONS":"true", "RUNNER_ENVIRONMENT":"self-hosted"}, True),
                ({"CI":"true", "GITHUB_ACTIONS":"true", "RUNNER_ENVIRONMENT":"github-hosted"}, False)):
            with self.subTest(environment=environment, allow=allow), \
                    patch.dict(GATE.os.environ, environment, clear=True), patch.object(GATE, "run") as run:
                with self.assertRaisesRegex(ValueError, "disposable"):
                    GATE.require_disposable_ci(allow)
                run.assert_not_called()

    def environment(self, runner):
        return {"CI":"true", "GITHUB_ACTIONS":"true", "RUNNER_ENVIRONMENT":"github-hosted",
                "RUNNER_TEMP":str(runner)}

    def test_trust_state_must_be_owned_beneath_the_runner_temporary_root(self):
        with tempfile.TemporaryDirectory() as runner, tempfile.TemporaryDirectory() as elsewhere, \
                patch.dict(GATE.os.environ, self.environment(runner)), patch.object(GATE, "run") as run:
            with self.assertRaisesRegex(ValueError, "private runner directory"):
                GATE.OwnedTrust(Path(elsewhere), True)
            run.assert_not_called()

    def test_macos_cleanup_restores_search_list_and_deletes_only_owned_keychain_even_after_error(self):
        with tempfile.TemporaryDirectory() as runner, \
                patch.dict(GATE.os.environ, self.environment(runner)), patch.object(GATE.platform, "system", return_value="Darwin"):
            private = Path(runner) / "case"
            private.mkdir()
            trust = GATE.OwnedTrust(private, True)
            trust.ca.write_text("owned fixture certificate", encoding="utf-8")
            trust.keychain = private / "fixture.keychain-db"
            trust.keychain.touch()
            trust.previous_keychains = ["/runner/home/keychain with spaces"]
            trust.trust_attempted = True
            def fail_first(arguments, **_):
                if arguments[1] == "remove-trusted-cert":
                    raise RuntimeError("fixture trust removal failed")
                return ""
            with patch.object(GATE, "run", side_effect=fail_first) as run:
                with self.assertRaises(ExceptionGroup):
                    trust.close()
                self.assertEqual([call.args[0] for call in run.call_args_list], [
                    ["security", "remove-trusted-cert", trust.ca],
                    ["security", "list-keychains", "-d", "user", "-s", *trust.previous_keychains],
                    ["security", "delete-keychain", trust.keychain],
                ])

    def test_linux_cleanup_refuses_to_remove_a_changed_certificate(self):
        with tempfile.TemporaryDirectory() as runner, \
                patch.dict(GATE.os.environ, self.environment(runner)), patch.object(GATE.platform, "system", return_value="Linux"):
            private = Path(runner) / "case"
            private.mkdir()
            trust = GATE.OwnedTrust(private, True)
            trust.ca.write_text("our certificate", encoding="utf-8")
            trust.linux_file = private / "test-owned-system-certificate.crt"
            trust.linux_file.write_text("different certificate", encoding="utf-8")
            trust.trust_attempted = True
            with patch.object(GATE, "run") as run:
                with self.assertRaises(ExceptionGroup):
                    trust.close()
                run.assert_not_called()
                self.assertEqual(trust.linux_file.read_text(encoding="utf-8"), "different certificate")


if __name__ == "__main__":
    unittest.main()
