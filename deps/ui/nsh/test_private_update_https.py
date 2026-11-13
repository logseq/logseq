"""Trust ownership guards and real local certificate generation; no trust changes."""
import hashlib
import importlib.util
from pathlib import Path
import ssl
import tempfile
import unittest
from unittest.mock import Mock, call, patch

SPEC = importlib.util.spec_from_file_location(
    "logseq_private_update_https", Path(__file__).with_name("private_update_https.py"))
GATE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(GATE)


class CertificateGenerationTests(unittest.TestCase):
    def test_long_owned_paths_have_bounded_unique_ca_subjects_and_valid_localhost_chains(self):
        with tempfile.TemporaryDirectory(prefix="private-https-certificates-") as temporary:
            root=Path(temporary)
            fingerprints=[]
            subjects=[]
            for suffix in ("a", "b"):
                private=root / ("owned-standalone-upgrade-" + "x" * 64 + suffix)
                private.mkdir()
                self.assertGreater(len(private.name),64)
                # Exercise the production OpenSSL file-generation path without
                # constructing OwnedTrust or calling any trust-store operation.
                GATE._prepare_certificates(private)
                ca=private / "ca.pem"
                subject=GATE.run(["openssl", "x509", "-in", ca, "-noout",
                                  "-subject", "-nameopt", "RFC2253"])
                common_name=subject.split("CN=",1)[1].strip()
                self.assertLessEqual(len(common_name.encode("utf-8")),64)
                self.assertRegex(common_name,r"\ALogseq private HTTPS fixture [0-9a-f]{32}\Z")
                self.assertNotIn(private.name,common_name)
                subjects.append(common_name)
                fingerprints.append(hashlib.sha256(
                    ssl.PEM_cert_to_DER_cert(ca.read_text(encoding="utf-8"))).hexdigest())
                verified=GATE.run(["openssl", "verify", "-CAfile", ca, private / "server.pem"])
                self.assertTrue(verified.endswith(": OK"))
                server=GATE.run(["openssl", "x509", "-in", private / "server.pem", "-noout", "-text"])
                self.assertIn("DNS:localhost",server)
                self.assertIn("IP Address:127.0.0.1",server)
            self.assertNotEqual(subjects[0],subjects[1])
            self.assertNotEqual(fingerprints[0],fingerprints[1])


class DisposableTrustTests(unittest.TestCase):
    def test_actual_app_receipt_precedes_exact_pinned_cli_signing_and_is_rechecked(self):
        source, archive, lui, cli_directory, key, output = map(Path, (
            "/owned/n2", "/owned/N2.zip", "/owned/lui", "/owned/cli", "/owned/key", "/owned/manifest"))
        delivery, specification = Mock(), Mock()
        delivery.verified_cli.return_value = (cli_directory / "nsh", {"verified": True})
        pinned = {"repository": "https://github.com/logseq/nsh", "revision": "a" * 40}
        delivery.pinned_source.return_value = pinned
        owner = Mock()
        with patch.object(GATE.importlib.util, "spec_from_file_location", return_value=specification), \
                patch.object(GATE.importlib.util, "module_from_spec", return_value=delivery), \
                patch.object(GATE, "run") as run:
            owner.attach_mock(run, "command")
            owner.attach_mock(delivery.verified_cli, "verified_cli")
            GATE.signed_app_manifest(source, archive, lui, cli_directory, key, output)
        delivery.pinned_source.assert_called_once_with(source / "deps/ui/nsh")
        specification.loader.exec_module.assert_called_once_with(delivery)
        check = ["node", source / "deps/ui/scripts/package-nsh.mjs", "check-release", archive]
        calls = owner.mock_calls
        self.assertEqual(calls[0].args[0], check)
        self.assertEqual(calls[0].kwargs["environment"]["LUI_SOURCE_ROOT"], str(lui))
        self.assertEqual(calls[1], call.verified_cli(cli_directory, pinned))
        self.assertEqual(calls[2], call.command([cli_directory / "nsh", "update-manifest", archive,
            "--entry", Path(str(archive) + ".release"), "--key", key, "-o", output], directory=source))
        self.assertEqual(calls[3].args[0], check)

    def test_bad_actual_app_receipt_never_loads_or_invokes_a_signer(self):
        with patch.object(GATE, "run", side_effect=RuntimeError("stale actual App receipt")) as run, \
                patch.object(GATE.importlib.util, "spec_from_file_location") as load:
            with self.assertRaisesRegex(RuntimeError, "stale actual App receipt"):
                GATE.signed_app_manifest(*map(Path, ("/n2", "/N2.zip", "/lui", "/cli", "/key", "/manifest")))
        self.assertEqual(run.call_count, 1)
        load.assert_not_called()

    def test_unverified_cli_or_post_sign_archive_change_cannot_pass(self):
        inputs = tuple(map(Path, ("/n2", "/N2.zip", "/lui", "/cli", "/key", "/manifest")))
        delivery = Mock()
        delivery.verified_cli.side_effect = RuntimeError("changed pinned CLI")
        with patch.object(GATE.importlib.util, "spec_from_file_location"), \
                patch.object(GATE.importlib.util, "module_from_spec", return_value=delivery), \
                patch.object(GATE, "run") as run:
            with self.assertRaisesRegex(RuntimeError, "changed pinned CLI"):
                GATE.signed_app_manifest(*inputs)
            self.assertEqual(run.call_count, 1)
            delivery.verified_cli.side_effect = None
            delivery.verified_cli.return_value = (Path("/cli/nsh"), {})
            run.reset_mock()
            run.side_effect = ["", "", RuntimeError("archive changed after signing")]
            with self.assertRaisesRegex(RuntimeError, "archive changed after signing"):
                GATE.signed_app_manifest(*inputs)
            self.assertEqual(run.call_count, 3)

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

    def test_tls_setup_failure_closes_socket_and_trust_without_shutdown_of_unstarted_server(self):
        server, trust, context = Mock(), Mock(), Mock()
        context.load_cert_chain.side_effect = RuntimeError("TLS setup failed")
        with patch.object(GATE, "OwnedTrust", return_value=trust), \
                patch.object(GATE, "ThreadingHTTPServer", return_value=server), \
                patch.object(GATE.ssl, "SSLContext", return_value=context), \
                patch.object(GATE.threading, "Thread") as thread:
            with self.assertRaisesRegex(RuntimeError, "TLS setup failed"):
                with GATE.trusted_feed(Path("/private/owned-ci-case"), True):
                    self.fail("failed TLS setup cannot expose a ready feed")
            thread.assert_not_called()
        server.shutdown.assert_not_called()
        server.server_close.assert_called_once_with()
        trust.close.assert_called_once_with()

    def test_thread_start_failure_does_not_wait_for_an_unstarted_listener_or_skip_trust_cleanup(self):
        server, trust, context, thread = Mock(), Mock(), Mock(), Mock()
        thread.start.side_effect = RuntimeError("thread start failed")
        with patch.object(GATE, "OwnedTrust", return_value=trust), \
                patch.object(GATE, "ThreadingHTTPServer", return_value=server), \
                patch.object(GATE.ssl, "SSLContext", return_value=context), \
                patch.object(GATE.threading, "Thread", return_value=thread):
            with self.assertRaisesRegex(RuntimeError, "thread start failed"):
                with GATE.trusted_feed(Path("/private/owned-ci-case"), True):
                    self.fail("failed listener cannot expose a ready feed")
        server.shutdown.assert_not_called()
        server.server_close.assert_called_once_with()
        thread.join.assert_not_called()
        trust.close.assert_called_once_with()

    def test_server_cleanup_failure_still_closes_owned_trust_and_refuses_success(self):
        server, trust, context, thread = Mock(), Mock(), Mock(), Mock()
        thread.is_alive.return_value = False
        server.server_close.side_effect = RuntimeError("server close failed")
        with patch.object(GATE, "OwnedTrust", return_value=trust), \
                patch.object(GATE, "ThreadingHTTPServer", return_value=server), \
                patch.object(GATE.ssl, "SSLContext", return_value=context), \
                patch.object(GATE.threading, "Thread", return_value=thread):
            with self.assertRaises(ExceptionGroup) as caught:
                with GATE.trusted_feed(Path("/private/owned-ci-case"), True):
                    pass
        self.assertEqual([str(error) for error in caught.exception.exceptions], ["server close failed"])
        server.shutdown.assert_called_once_with()
        thread.join.assert_called_once_with(timeout=5)
        trust.close.assert_called_once_with()

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
