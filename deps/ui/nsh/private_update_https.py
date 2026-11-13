#!/usr/bin/env python3
"""Shared private HTTPS/package support for disposable update qualification.

Extracted from the existing public-HTTPS pre-dispatch gate. This module never
runs on import. Trust mutation requires the explicit GitHub-hosted-runner guard;
production certificate, manifest signature and archive checks remain unchanged.
"""
from __future__ import annotations

from contextlib import contextmanager
import hashlib
import importlib.util
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import platform
import secrets
import shlex
import socket
import ssl
import subprocess
import sys
import threading
import uuid
import zipfile

# Public deterministic fixture material, never a distribution signing credential.
SECRET = "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE="
PUBLIC = "iojj3XQJ8ZX9UtstPLpdcspnCb8dlBIb83SIAbQPb1w="


def run(arguments, *, environment=None, directory=None, timeout=300):
    try:
        result = subprocess.run(list(map(str, arguments)), cwd=directory, env=environment,
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=False, timeout=timeout)
    except subprocess.TimeoutExpired:
        raise RuntimeError(f"{Path(arguments[0]).name} exceeded its finite command deadline") from None
    if result.returncode:
        # Do not dump process arguments: ephemeral private-key/keychain inputs
        # are fixture credentials, and need not appear in CI logs either.
        raise RuntimeError(f"{Path(arguments[0]).name} failed ({result.returncode}): {result.stderr[-8192:]}")
    return result.stdout.strip()


def require_disposable_ci(allow):
    if (not allow or os.environ.get("CI") != "true" or os.environ.get("GITHUB_ACTIONS") != "true"
            or os.environ.get("RUNNER_ENVIRONMENT") != "github-hosted"):
        raise ValueError("CA trust requires explicit opt-in on a disposable GitHub-hosted CI runner")
    temporary = os.environ.get("RUNNER_TEMP")
    if not temporary:
        raise ValueError("Disposable CI must provide its owned RUNNER_TEMP")
    root = Path(temporary).resolve(strict=True)
    if root == Path(root.anchor) or root == Path.home():
        raise ValueError("Disposable CI temporary directory is not sufficiently scoped")
    return root


class OwnedTrust:
    """Mutate only one ephemeral CA on a disposable runner, never developer trust."""
    def __init__(self, private, allow):
        runner = require_disposable_ci(allow)
        self.private = private.resolve(strict=True)
        if not self.private.is_relative_to(runner) or self.private == runner:
            raise ValueError("Fixture trust files must belong to its private runner directory")
        self.ca = self.private / "ca.pem"
        self.keychain = None
        self.previous_keychains = None
        self.linux_file = None
        self.thumbprint = None
        self.trust_attempted = False
        self.system = platform.system()

    def prepare(self):
        configuration = self.private / "ca.cnf"
        configuration.write_text("[req]\nprompt=no\ndistinguished_name=dn\nx509_extensions=ca\n"
                                 f"[dn]\nCN=Logseq private HTTPS fixture {uuid.uuid4()}\n"
                                 "[ca]\nbasicConstraints=critical,CA:TRUE\nkeyUsage=critical,keyCertSign,cRLSign\n", encoding="utf-8")
        run(["openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1",
             "-config", configuration, "-keyout", self.private / "ca.key", "-out", self.ca])
        run(["openssl", "req", "-newkey", "rsa:2048", "-nodes", "-subj", "/CN=localhost",
             "-keyout", self.private / "server.key", "-out", self.private / "server.csr"])
        extension = self.private / "server.ext"
        extension.write_text("basicConstraints=critical,CA:FALSE\nsubjectAltName=DNS:localhost,IP:127.0.0.1\nextendedKeyUsage=serverAuth\n", encoding="utf-8")
        run(["openssl", "x509", "-req", "-days", "1", "-in", self.private / "server.csr",
             "-CA", self.ca, "-CAkey", self.private / "ca.key", "-CAcreateserial",
             "-extfile", extension, "-out", self.private / "server.pem"])
        for name in ("ca.key", "server.key"):
            (self.private / name).chmod(0o600)
        if self.system == "Linux":
            self.linux_file = Path("/usr/local/share/ca-certificates") / f"logseq-https-{uuid.uuid4().hex}.crt"
            if self.linux_file.exists():
                raise ValueError("Refusing to replace an existing runner certificate")
            self.trust_attempted = True
            run(["sudo", "-n", "install", "-m", "644", self.ca, self.linux_file])
            run(["sudo", "-n", "update-ca-certificates"])
        elif self.system == "Darwin":
            self.previous_keychains = shlex.split(run(["security", "list-keychains", "-d", "user"]))
            self.keychain = self.private / "fixture.keychain-db"
            password = secrets.token_urlsafe(24)
            run(["security", "create-keychain", "-p", password, self.keychain])
            run(["security", "unlock-keychain", "-p", password, self.keychain])
            self.trust_attempted = True
            run(["security", "list-keychains", "-d", "user", "-s", self.keychain, *self.previous_keychains])
            run(["security", "add-trusted-cert", "-r", "trustRoot", "-k", self.keychain, self.ca])
        elif self.system == "Windows":
            der = ssl.PEM_cert_to_DER_cert(self.ca.read_text(encoding="utf-8"))
            self.thumbprint = hashlib.sha1(der).hexdigest().upper()
            environment = dict(os.environ, LOGSEQ_HTTPS_CA_CERT=str(self.ca), LOGSEQ_HTTPS_CA_THUMBPRINT=self.thumbprint)
            existing = run(["powershell", "-NoProfile", "-NonInteractive", "-Command",
                            "Test-Path ('Cert:\\CurrentUser\\Root\\' + $env:LOGSEQ_HTTPS_CA_THUMBPRINT)"], environment=environment)
            if existing.lower() != "false":
                raise ValueError("Refusing to take ownership of an already trusted certificate")
            self.trust_attempted = True
            imported = run(["powershell", "-NoProfile", "-NonInteractive", "-Command",
                            "Import-Certificate -FilePath $env:LOGSEQ_HTTPS_CA_CERT -CertStoreLocation Cert:\\CurrentUser\\Root | Select-Object -ExpandProperty Thumbprint"], environment=environment)
            if imported.upper() != self.thumbprint:
                raise ValueError("Runner imported a different certificate")
        else:
            raise ValueError("Public HTTPS qualification requires a maintained desktop CI target")

    def close(self):
        errors = []
        def attempt(arguments, **options):
            try:
                run(arguments, **options)
            except Exception as error:
                errors.append(error)
        if self.system == "Linux" and self.trust_attempted and self.linux_file.exists():
            if self.linux_file.read_bytes() != self.ca.read_bytes():
                errors.append(ValueError("Owned runner CA changed; refusing to remove another certificate"))
            else:
                attempt(["sudo", "-n", "rm", "--", self.linux_file])
                attempt(["sudo", "-n", "update-ca-certificates"])
        elif self.system == "Darwin":
            if self.trust_attempted:
                attempt(["security", "remove-trusted-cert", self.ca])
                attempt(["security", "list-keychains", "-d", "user", "-s", *self.previous_keychains])
            if self.keychain is not None and self.keychain.exists():
                attempt(["security", "delete-keychain", self.keychain])
        elif self.system == "Windows" and self.trust_attempted:
            environment = dict(os.environ, LOGSEQ_HTTPS_CA_THUMBPRINT=self.thumbprint)
            attempt(["powershell", "-NoProfile", "-NonInteractive", "-Command",
                     "$path = 'Cert:\\CurrentUser\\Root\\' + $env:LOGSEQ_HTTPS_CA_THUMBPRINT; if (Test-Path $path) { Remove-Item -LiteralPath $path -ErrorAction Stop }"], environment=environment)
        if errors:
            raise ExceptionGroup("Could not completely restore disposable runner trust", errors)


def begin_tls_request(connection):
    # Accepted sockets perform their handshake on an owned request thread;
    # a client that never starts TLS cannot block listener shutdown.
    connection.settimeout(15)
    connection.do_handshake()


@contextmanager
def trusted_feed(private, allow):
    trust = OwnedTrust(private, allow)
    requests = []
    files = {}
    mode = {"case": "later"}
    class Handler(BaseHTTPRequestHandler):
        def setup(self):
            begin_tls_request(self.request)
            super().setup()
        def do_GET(self):
            source = files.get(self.path)
            if source is None:
                self.send_error(404)
                return
            case = mode["case"]
            tampered = case == "tampered-manifest" and self.path == "/latest.json"
            corrupt = case == "corrupt-archive" and self.path == "/" + files["archive"].name
            self.send_response(200)
            self.send_header("Content-Length", str(source.stat().st_size + int(tampered)))
            self.end_headers()
            digest = hashlib.sha256()
            sent = 0
            complete = False
            try:
                with source.open("rb") as content:
                    while chunk := content.read(65536):
                        if corrupt and sent == 0:
                            chunk = bytes([chunk[0] ^ 1]) + chunk[1:]
                        self.wfile.write(chunk)
                        digest.update(chunk)
                        sent += len(chunk)
                if tampered:
                    self.wfile.write(b" ")
                    digest.update(b" ")
                    sent += 1
                complete = True
            except (BrokenPipeError, ConnectionResetError, ssl.SSLError):
                pass  # A rejected/cancelled client owns closing its connection.
            finally:
                requests.append({"case":case, "path":self.path,
                                 "sha256":digest.hexdigest(), "bytes":sent, "complete":complete})
        def log_message(self, *_):
            pass
    server = None
    thread = None
    started = False
    try:
        trust.prepare()
        server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        server.daemon_threads = False  # server_close joins bounded owned request handlers.
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(private / "server.pem", private / "server.key")
        server.socket = context.wrap_socket(server.socket, server_side=True, do_handshake_on_connect=False)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        started = True
        yield f"https://127.0.0.1:{server.server_port}/latest.json", files, mode, requests
    finally:
        errors = []
        def close_owned(action, *arguments, **options):
            try:
                action(*arguments, **options)
            except Exception as error:
                errors.append(error)
        if server is not None:
            # BaseServer.shutdown waits for serve_forever's completion event;
            # calling it before a successful thread start can wait forever.
            if started:
                close_owned(server.shutdown)
            close_owned(server.server_close)
        if started:
            close_owned(thread.join, timeout=5)
            if thread.is_alive():
                errors.append(RuntimeError("Owned HTTPS listener did not finish during cleanup"))
        # Never let an earlier socket/thread cleanup error bypass our exact CA
        # cleanup. Preserve every ordinary cleanup failure as a failing result.
        close_owned(trust.close)
        if errors:
            raise ExceptionGroup("Could not completely close owned HTTPS qualification resources", errors)


def package(source, host, url, key, output, lui):
    environment = dict(os.environ, LUI_SOURCE_ROOT=str(lui))
    for name in ("NSH_CODESIGN_IDENTITY", "NSH_NOTARY_PROFILE"):
        environment.pop(name, None)  # Private fixtures use no distribution signing identity.
    if platform.system() == "Windows":
        return Path(run([sys.executable, source / "deps/ui/nsh/package_windows.py", "--built-host", host,
                         "--lui-source", lui, "--output", output, "--update-url", url,
                         "--update-public-key", key], environment=environment)).resolve(strict=True)
    return Path(run(["bash", source / "deps/ui/scripts/package-nsh.sh", "--built-host", host,
                     "--update-url", url, "--update-public-key", key], environment=environment)).resolve(strict=True)


def signed_app_manifest(source, archive, lui, cli_directory, key, output):
    """Compose the actual App receipt owner with the pinned public NSH signer.

    LUI's generic package manifest command requires its own Cargo application
    and delivery receipt. An App archive instead belongs to package-nsh.mjs;
    never manufacture a generic application/receipt to satisfy that command.
    """
    environment = dict(os.environ, LUI_SOURCE_ROOT=str(lui))
    check = ["node", source / "deps/ui/scripts/package-nsh.mjs", "check-release", archive]
    run(check, environment=environment)
    specification = importlib.util.spec_from_file_location(
        "logseq_upgrade_delivery", lui / "tooling/nsh_delivery.py")
    delivery = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(delivery)
    pinned = delivery.pinned_source(source / "deps/ui/nsh")
    cli, _ = delivery.verified_cli(cli_directory, pinned)
    run([cli, "update-manifest", archive, "--entry", Path(str(archive) + ".release"),
         "--key", key, "-o", output], directory=source)
    # The signer reads the final archive and sidecar. A concurrent byte/source
    # change must still fail this attempt rather than bless mixed inputs.
    run(check, environment=environment)


def extract(archive, destination):
    destination.mkdir()
    system = platform.system()
    if system == "Darwin":
        run(["ditto", "-x", "-k", archive, destination])
        application = destination / "Logseq NSH.app"
        run(["codesign", "--verify", "--deep", "--strict", application])
        resources = application / "Contents/Resources"
        executable = application / "Contents/MacOS/logseq-nsh"
    elif system == "Linux":
        run(["tar", "-xzf", archive, "-C", destination])
        application = destination / "Logseq-NSH"
        resources = application / "Resources"
        executable = application / "logseq-nsh"
    else:
        with zipfile.ZipFile(archive) as files:
            for member in files.namelist():
                if Path(member).is_absolute() or ".." in Path(member).parts:
                    raise ValueError("Generated fixture archive escaped its root")
            files.extractall(destination)
        application = destination / "Logseq-NSH"
        resources = application / "Resources"
        executable = application / "logseq-nsh.exe"
    library = resources / {"Darwin":"liblogseq_ui.dylib", "Linux":"liblogseq_ui.so", "Windows":"logseq_ui.dll"}[system]
    worker = resources / ("logseq-db-worker.exe" if system == "Windows" else "logseq-db-worker")
    return executable.resolve(strict=True), library.resolve(strict=True), worker.resolve(strict=True), resources.resolve(strict=True)


def code_markers(artifacts):
    host, library, worker, resources = artifacts
    metadata = (resources if platform.system() == "Darwin" else host.parent) / "nsh/app.json"
    application = json.loads(metadata.read_text(encoding="utf-8"))
    if application.get("id") != "com.logseq.logseq" or not isinstance(application.get("version"), str):
        raise ValueError("Private package does not have the actual Logseq release identity")
    return {"application":application,
            "hostSha256":file_hash(host), "ocamlSha256":file_hash(library), "workerSha256":file_hash(worker)}

def file_hash(path):
    with path.open("rb") as content:
        return hashlib.file_digest(content, "sha256").hexdigest()


def verify_requests(requests, case, archive_name):
    actual = [request for request in requests if request["case"] == case]
    for path in ("/latest.json", "/latest.json.sig"):
        if not any(request["path"] == path and request["complete"] for request in actual):
            raise ValueError("Public updater did not fetch its authenticated HTTPS metadata")
    archives = [request for request in actual if request["path"] == "/" + archive_name]
    expected_archives = 0 if case == "tampered-manifest" else 1
    if len(archives) != expected_archives:
        raise ValueError("Public updater archive boundary disagrees with metadata verification")
