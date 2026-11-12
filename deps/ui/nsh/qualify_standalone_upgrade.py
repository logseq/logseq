#!/usr/bin/env python3
"""Qualify the actual installed macOS App's signed HTTPS N1 -> N2 update.

No builds run here. Both authored versions must already have release hosts and
matching OCaml/worker resources. Only an explicitly opted-in disposable runner
may trust the owned loopback CA. The real Settings action, native NSAlert,
application preparation and standalone exec run unchanged. The private install,
graph and all evidence remain below RUNNER_TEMP, never /Applications.
"""
from __future__ import annotations

import argparse
from contextlib import contextmanager
import ctypes
import http.client
import importlib.util
import json
import os
from pathlib import Path
import platform
import shutil
import signal
import socket
import subprocess
import sys
import tempfile
import time
import uuid

import private_update_https as https
from qualify_packaged_startup import native_environment, save_png

CHECK = "prop:accessibility-identifier=settings-check-for-updates"


def wait_for(description, deadline, sample):
    while time.monotonic() < deadline:
        value = sample()
        if value:
            return value
        time.sleep(min(0.05, max(0, deadline - time.monotonic())))
    raise RuntimeError(f"Standalone upgrade did not reach: {description}")


def process_path(pid):
    # Public libproc API returns this exact live process's executable path. No
    # shell parsing or metadata file is used as loaded-image evidence.
    library = ctypes.CDLL("/usr/lib/libproc.dylib", use_errno=True)
    library.proc_pidpath.argtypes = [ctypes.c_int, ctypes.c_void_p, ctypes.c_uint32]
    library.proc_pidpath.restype = ctypes.c_int
    buffer = ctypes.create_string_buffer(4096)
    length = library.proc_pidpath(pid, buffer, len(buffer))
    if length <= 0:
        raise RuntimeError(f"Cannot inspect task-owned process image {pid}: {ctypes.get_errno()}")
    return Path(os.fsdecode(buffer.value)).resolve(strict=True)


def alive(pid):
    try:
        os.kill(pid, 0)
        return True
    except ProcessLookupError:
        return False
    except PermissionError:
        raise RuntimeError("Task-owned process identity became inaccessible") from None


@contextmanager
def owned_application(host, private, environment, log):
    with log.open("wb") as output:
        process = subprocess.Popen([str(host), "--startup-preflight", str(private)],
                                   cwd=private, env=environment, stdin=subprocess.DEVNULL,
                                   stdout=output, stderr=output, start_new_session=True)
        try:
            yield process
        finally:
            # Never poll/reap before group cleanup. The unreaped leader reserves
            # this exact PID even after a crash; exec intentionally retains it.
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            process.wait(timeout=10)


def connect(address, deadline):
    # The generic package helper polls Popen, which can reap its group leader;
    # this owner deliberately retains the leader until descendant cleanup.
    def attempt():
        try:
            return socket.create_connection(address, timeout=min(1, max(0.01, deadline-time.monotonic())))
        except (ConnectionError, TimeoutError):
            return None
    return wait_for("owned agent listener", deadline, attempt)


def loaded_start(log, version, pid):
    found = []
    for line in log.read_text(encoding="utf-8", errors="replace").splitlines():
        if not line.startswith('{'):
            continue
        try:
            value = json.loads(line)
        except json.JSONDecodeError:
            continue
        if value.get("event") == "logseq-native-start":
            found.append(value)
    matches = [record for record in found if record.get("compiledVersion") == version
               and record.get("processId") == pid]
    if len(matches) > 1:
        raise RuntimeError("One authored version emitted duplicate compiled startup markers")
    return matches[0] if matches else None


def attach_agent(helper, address, process, host, log, version, deadline, transcript):
    marker = wait_for("compiled standalone release marker", deadline,
                      lambda: loaded_start(log, version, process.pid))
    agent = helper.Agent(connect(address, deadline), deadline, transcript)
    try:
        hello = agent.request(op="hello")
        required = {"native-press", "native-dialog", "native-dialog-answer", "screenshot"}
        if (hello.get("protocol") != "lui-agent" or hello.get("host") != "logseq-native"
                or not required.issubset(hello.get("host_native_ops", []))
                or hello.get("backend_error")):
            raise RuntimeError(f"Actual standalone agent is incompatible or failed: {hello}")
        listeners = https.run(["lsof", "-nP", "-a", "-p", process.pid,
                               f"-iTCP:{address[1]}", "-sTCP:LISTEN", "-Fp"])
        if listeners.splitlines() != [f"p{process.pid}"]:
            raise RuntimeError("Agent endpoint does not belong to the exact standalone process")
        if process_path(process.pid) != host:
            raise RuntimeError("Actual standalone process loaded an unexpected executable")
        return agent, {"compiledRust": marker, "hello": hello}
    except BaseException:
        agent.close()
        raise


def nodes(helper, agent):
    tree = agent.request(op="tree")
    if tree.get("backend_error"):
        raise RuntimeError(f"Actual application renderer failed: {tree['backend_error']}")
    return list(helper.nodes(tree))


def unique(values, description):
    if len(values) != 1:
        raise RuntimeError(f"Expected one {description}, got {len(values)}")
    return values[0]


def selector(node):
    if type(node.get("id")) is not int:
        raise RuntimeError("Canonical node omitted its integer identity")
    return f"id:{node['id']}"


def native_press(agent, target):
    reply = agent.request(op="native-press", selector=target)
    if reply.get("handled") is not True or reply.get("activation") != "native-controller":
        raise RuntimeError(f"Native controller did not handle {target}: {reply}")
    return reply


def has_text(helper, agent, text):
    return any(node.get("props", {}).get("text") == text for node in nodes(helper, agent))


def create_durable_block(helper, agent, deadline, text):
    def add_target():
        candidates = [node for node in nodes(helper, agent)
                      if "block-add-button" in node.get("props", {}).get("style-class", "").split()
                      and node.get("props", {}).get("opacity") != 0]
        return unique(candidates, "empty journal add-block controller") if candidates else None
    target = wait_for("real empty journal", deadline, add_target)
    native_press(agent, selector(target))
    editor = wait_for("actual journal editor", deadline, lambda:
        unique(found, "journal editor") if (found := [node for node in nodes(helper, agent)
            if node.get("kind") == "extension:logseq-editor"]) else None)
    target = selector(editor)
    # Existing typed extension events exercise the real OCaml editor/reducer;
    # they are not hardware/IME evidence and never contact the worker as a
    # foreign consumer (which would deliberately make update ownership shared).
    agent.request(op="ext", selector=target, identifier="logseq-editor", name="insert",
                  fields=json.dumps({"text": text}))
    wait_for("inserted editor source", deadline, lambda: has_text(helper, agent, text))
    agent.request(op="ext", selector=target, identifier="logseq-editor", name="key",
                  fields=json.dumps({"key": "Escape"}))
    wait_for("saved journal display", deadline, lambda:
        has_text(helper, agent, text) and not any(node.get("kind") == "extension:logseq-editor"
                                                 for node in nodes(helper, agent)))
    return {"text": text, "editorBlockId": editor.get("props", {}).get("block-id"),
            "inputBoundary": "canonical-editor-events"}


def open_settings(helper, agent, deadline, version):
    if not agent.request(op="find", selector=CHECK).get("nodes"):
        native_press(agent, "prop:accessibility-identifier=toolbar-dots-btn")
        wait_for("real Settings menu item", deadline, lambda:
            agent.request(op="find", selector="kind:menu-item&text:Settings").get("nodes"))
        native_press(agent, "kind:menu-item&text:Settings")
    def loaded_and_ready():
        current = nodes(helper, agent)
        checks = [node for node in current if node.get("props", {}).get("accessibility-identifier")
                  == "settings-check-for-updates"]
        return (len(checks) == 1 and checks[0].get("props", {}).get("disabled") is not True
                and any(node.get("props", {}).get("text") == version for node in current))
    wait_for("Settings loaded OCaml version and idle configured update action", deadline, loaded_and_ready)
    return {"loadedOcamlVersion": version, "source": "Settings Version.app / compiled Version_gen.app"}


def worker_health(private, app_pid, executable):
    registry = private / "root/server-list"
    if not registry.exists():
        return None
    records = []
    for line in registry.read_text(encoding="utf-8").splitlines():
        values = line.split()
        if len(values) != 2:
            raise RuntimeError("Private worker registry has an invalid entry")
        pid, port = map(int, values)
        connection = http.client.HTTPConnection("127.0.0.1", port, timeout=2)
        try:
            connection.request("GET", "/healthz")
            response = connection.getresponse()
            body = response.read(65537)
            if response.status == 503:
                return None
            if response.status != 200 or len(body) > 65536:
                raise RuntimeError("Actual worker health failed or exceeded its bound")
            record = json.loads(body)
        except (ConnectionError, TimeoutError, OSError):
            return None
        finally:
            connection.close()
        origin = record.get("nsh-app-ownership", {})
        storage = record.get("storage", {})
        if (record.get("pid") != pid or record.get("port") != port
                or record.get("status") != "ready"
                or not isinstance(record.get("ticket"), str) or not record["ticket"]
                or not isinstance(record.get("generation"), str) or not record["generation"]
                or Path(storage.get("root", "")).resolve() != private / "root"
                or Path(storage.get("graphsDir", "")).resolve() != private / "graphs"
                or origin.get("shared") is not False or origin.get("phase") != "open"
                or not isinstance(origin.get("instance"), str)
                or not isinstance(origin.get("session"), str)
                or Path(origin.get("executable", "")).resolve() != executable
                or process_path(pid) != executable):
            raise RuntimeError("Ready worker does not prove the expected private owned executable/storage")
        parent = https.run(["ps", "-p", pid, "-o", "ppid="])
        if parent.strip() != str(app_pid):
            raise RuntimeError("Ready worker is not a child of the exact standalone App")
        records.append(record)
    return unique(records, "owned private ready worker") if records else None


def answer_sheet(agent, button, deadline):
    def ready():
        dialog = agent.request(op="native-dialog", selector=CHECK).get("dialog")
        if dialog is None:
            return None
        visible = [item for item in dialog.get("buttons", [])
                   if item.get("label") == button and item.get("enabled") is True
                   and item.get("hidden") is False]
        return dialog if len(visible) == 1 else None
    dialog = wait_for(f"actual NSAlert {button} button", deadline, ready)
    answer = agent.request(op="native-dialog-answer", token=dialog["token"], button=button)
    if answer.get("activation") != "native-controller" or answer.get("dispatched") is not True:
        raise RuntimeError("Updater NSAlert did not dispatch its native button")
    return {"dialog": dialog, "answer": answer}


def qualify(args):
    if platform.system() != "Darwin":
        raise ValueError("Actual native-sheet upgrade qualification currently requires macOS")
    runner = https.require_disposable_ci(args.allow_disposable_ci_trust)
    for name in ("n1_source", "n1_host", "n2_source", "n2_host", "lui_source", "pinned_cli"):
        setattr(args, name, getattr(args, name).resolve(strict=True))
    versions = [json.loads((source / "resources/package.json").read_text(encoding="utf-8"))["version"]
                for source in (args.n1_source, args.n2_source)]
    https.run(["node", "-e", "const s=require('semver'); if(s.valid(process.argv[1])!==process.argv[1] || "
               "s.valid(process.argv[2])!==process.argv[2] || !s.lt(process.argv[1],process.argv[2])) "
               "throw Error('Authored N2 canonical version must be greater than N1');", *versions],
              directory=args.n1_source)
    revisions = [https.run(["git", "rev-parse", "HEAD"], directory=source)
                 for source in (args.n1_source, args.n2_source)]
    if revisions[0] == revisions[1]:
        raise ValueError("N1 and N2 must be distinct authored source revisions")
    args.evidence = args.evidence.resolve()
    args.evidence.parent.mkdir(parents=True, exist_ok=True)
    private = Path(tempfile.mkdtemp(prefix="logseq-standalone-upgrade-", dir=runner)).resolve()
    private.chmod(0o700)
    if any(private.is_relative_to(source) for source in (args.n1_source, args.n2_source, args.lui_source)):
        raise ValueError("Private installation and working directory must be outside every checkout")
    result = {"qualified": False, "platform": "macos", "privateRoot": str(private),
              "authoredSourceRevisions": revisions,
              "evidenceBoundary": "actual-standalone-app-public-https-update",
              "windowsAndLinux": "unqualified", "hardwareInputAndVisualParity": "unqualified"}
    logs = args.evidence.parent / (args.evidence.stem + "-logs")
    logs.mkdir(exist_ok=True)
    try:
        public, secret = private / "public-key.txt", private / "secret-key.txt"
        public.write_text(https.PUBLIC + "\n", encoding="utf-8")
        secret.write_text(https.SECRET + "\n", encoding="utf-8")
        secret.chmod(0o600)
        with https.trusted_feed(private, args.allow_disposable_ci_trust) as (url, files, mode, requests):
            mode["case"] = "standalone-install"
            archives = [https.package(source, host, url, public, private / f"package-{role}", args.lui_source)
                        for role, source, host in (("n1", args.n1_source, args.n1_host),
                                                  ("n2", args.n2_source, args.n2_host))]
            manifest = private / "manifest"
            https.run([sys.executable, args.lui_source / "tooling/nsh_delivery.py", "manifest", archives[1],
                       "--app", str(archives[1]) + ".release", "--cli-directory", args.pinned_cli,
                       "--key", secret, "--output", manifest])
            files.update({"/latest.json": manifest / "latest.json", "/latest.json.sig": manifest / "latest.json.sig",
                          "/" + archives[1].name: archives[1], "archive": archives[1]})
            old = https.extract(archives[0], private / "installation")
            expected = https.code_markers(https.extract(archives[1], private / "expected-n2"))
            previous = https.code_markers(old)
            if [previous["application"]["version"], expected["application"]["version"]] != versions:
                raise ValueError("Packaged release versions differ from their authored source revisions")
            if (previous["application"]["version"] == expected["application"]["version"]
                    or previous["hostSha256"] == expected["hostSha256"]
                    or previous["ocamlSha256"] == expected["ocamlSha256"]):
                raise ValueError("Two authored release versions need distinct actual host and OCaml code")
            result.update(n1CodeMarkers=previous, n2ExpectedCodeMarkers=expected,
                          archiveSha256=[https.file_hash(archive) for archive in archives])
            for role, archive in zip(("n1", "n2"), archives):
                shutil.copyfile(Path(str(archive) + ".lui-build.json"), logs / f"{role}-archive.lui-build.json")
            shutil.copyfile(manifest / "latest.json", logs / "latest.json")
            shutil.copyfile(manifest / "latest.json.sig", logs / "latest.json.sig")
            with socket.socket() as reservation:
                reservation.bind(("127.0.0.1", 0))
                address = reservation.getsockname()
            inherited = {name: value for name, value in os.environ.items()
                         if not name.upper().startswith(("LOGSEQ_", "LUI_"))}
            environment = native_environment(private, address, inherited)
            # Keep the runner's ephemeral keychain trust/search environment while
            # isolating app storage. No developer token or app override survives.
            environment = {name: value for name, value in environment.items()
                           if not any(part in name.upper() for part in
                                      ("TOKEN", "SECRET", "PASSWORD", "API_KEY", "AUTH", "CREDENTIAL", "ACCESS_KEY"))}
            agent_path = args.lui_source / "tooling/test_nsh_packaged_app.py"
            specification = importlib.util.spec_from_file_location("logseq_upgrade_agent", agent_path)
            helper = importlib.util.module_from_spec(specification)
            specification.loader.exec_module(helper)
            log = logs / "standalone.log"
            deadline = time.monotonic() + args.timeout
            with (logs / "agent.jsonl").open("w", encoding="utf-8") as transcript, \
                    owned_application(old[0], private, environment, log) as process:
                agent = None
                try:
                    agent, result["n1Runtime"] = attach_agent(helper, address, process, old[0], log,
                        previous["application"]["version"], deadline, transcript)
                    result["durableBlock"] = create_durable_block(helper, agent, deadline,
                        "Standalone durable upgrade " + uuid.uuid4().hex)
                    n1_worker = wait_for("N1 exact owned worker", deadline,
                        lambda: worker_health(private, process.pid, old[2]))
                    result["n1Worker"] = n1_worker
                    result["n1Runtime"].update(open_settings(helper, agent, deadline,
                        previous["application"]["version"]))
                    native_press(agent, CHECK)
                    result["download"] = answer_sheet(agent, "Download", deadline)
                    result["install"] = answer_sheet(agent, "Install and Restart", deadline)
                    agent.close()
                    agent = None
                    wait_for("N1 worker exited before N2", deadline, lambda: not alive(n1_worker["pid"]))
                    agent, result["n2Runtime"] = attach_agent(helper, address, process, old[0], log,
                        expected["application"]["version"], deadline, transcript)
                    if https.code_markers(old) != expected:
                        raise RuntimeError("Installed code differs from signed N2 archive payload")
                    n2_worker = wait_for("new N2 exact owned worker", deadline,
                        lambda: worker_health(private, process.pid, old[2]))
                    if (n2_worker["pid"] == n1_worker["pid"]
                            or n2_worker["nsh-app-ownership"]["instance"] == n1_worker["nsh-app-ownership"]["instance"]
                            or n2_worker["nsh-app-ownership"]["session"] == n1_worker["nsh-app-ownership"]["session"]):
                        raise RuntimeError("N2 adopted a prior worker/application origin")
                    result["n2Worker"] = n2_worker
                    wait_for("N2 actual durable journal content", deadline,
                        lambda: has_text(helper, agent, result["durableBlock"]["text"]))
                    result["n2Runtime"].update(open_settings(helper, agent, deadline,
                        expected["application"]["version"]))
                    result["screenshot"] = save_png(agent.request(op="screenshot"), logs / "installed-n2.png")
                    https.verify_requests(requests, mode["case"], archives[1].name)
                    result.update(qualified=True, requests=requests, sameProcessId=process.pid,
                                  oldWorkerExited=True, newWorkerOwnsDurableGraph=True)
                finally:
                    if agent is not None:
                        agent.close()
        return result
    except BaseException as error:
        result["error"] = str(error)
        raise
    finally:
        # Preserve installation, graph, native log and every partial proof for
        # review. The task-owned group is gone before the disposable CA closes.
        args.evidence.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--allow-disposable-ci-trust", action="store_true")
    for name in ("n1-source", "n1-host", "n2-source", "n2-host", "lui-source", "pinned-cli", "evidence"):
        parser.add_argument("--" + name, type=Path, required=True)
    parser.add_argument("--timeout", type=float, default=180)
    print(json.dumps(qualify(parser.parse_args()), indent=2))
