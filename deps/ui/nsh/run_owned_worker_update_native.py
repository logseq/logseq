#!/usr/bin/env python3
"""Qualify owned-worker preparation and canonical native drops against real workers.

Uses already-built app archives and an explicitly selected native worker. All
storage, credentials and children belong to a fresh contained fixture process.
No Dune, shipping startup flag, installed app, signing or installer is involved.
The outliner case uses canonical events and fixture geometry, not physical Alt
or an NSH platform hit test. Its database operations use the real app session.
"""
from __future__ import annotations

import argparse
from contextlib import closing, contextmanager
import ctypes
import hashlib
import json
import os
from pathlib import Path
import queue
import signal
import socket
import sqlite3
import subprocess
import sys
import tempfile
import threading
import time

from build_windows_dll import ARCHIVES, PACKAGES, UI


class WindowsJob:
    """Own only the newly created, stdin-gated fixture and its descendants."""
    def __init__(self, process):
        from ctypes import wintypes as w

        class Limits(ctypes.Structure):
            _fields_ = [("process_time", ctypes.c_int64), ("job_time", ctypes.c_int64),
                        ("flags", w.DWORD), ("minimum_ws", ctypes.c_size_t),
                        ("maximum_ws", ctypes.c_size_t), ("active_limit", w.DWORD),
                        ("affinity", ctypes.c_size_t), ("priority", w.DWORD), ("schedule", w.DWORD)]

        class IoCounters(ctypes.Structure):
            _fields_ = [(name, ctypes.c_uint64) for name in
                        ("reads", "writes", "other", "read_bytes", "write_bytes", "other_bytes")]

        class Extended(ctypes.Structure):
            _fields_ = [("basic", Limits), ("io", IoCounters),
                        ("process_memory", ctypes.c_size_t), ("job_memory", ctypes.c_size_t),
                        ("peak_process_memory", ctypes.c_size_t), ("peak_job_memory", ctypes.c_size_t)]

        self.kernel = ctypes.WinDLL("kernel32", use_last_error=True)
        self.kernel.CreateJobObjectW.argtypes = [ctypes.c_void_p, w.LPCWSTR]
        self.kernel.CreateJobObjectW.restype = w.HANDLE
        self.kernel.SetInformationJobObject.argtypes = [w.HANDLE, ctypes.c_int, ctypes.c_void_p, w.DWORD]
        self.kernel.SetInformationJobObject.restype = w.BOOL
        self.kernel.AssignProcessToJobObject.argtypes = [w.HANDLE, w.HANDLE]
        self.kernel.AssignProcessToJobObject.restype = w.BOOL
        self.kernel.TerminateJobObject.argtypes = [w.HANDLE, w.UINT]
        self.kernel.TerminateJobObject.restype = w.BOOL
        self.kernel.CloseHandle.argtypes = [w.HANDLE]
        self.kernel.CloseHandle.restype = w.BOOL
        self.handle = self.kernel.CreateJobObjectW(None, None)
        if not self.handle:
            raise ctypes.WinError(ctypes.get_last_error())
        try:
            limits = Extended()
            limits.basic.flags = 0x2000  # JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
            if not self.kernel.SetInformationJobObject(self.handle, 9, ctypes.byref(limits), ctypes.sizeof(limits)):
                raise ctypes.WinError(ctypes.get_last_error())
            # Popen retains this exact native process HANDLE; never reopen by PID.
            if not self.kernel.AssignProcessToJobObject(self.handle, int(process._handle)):
                raise ctypes.WinError(ctypes.get_last_error())
        except BaseException:
            self.close()
            raise

    def terminate(self):
        if not self.kernel.TerminateJobObject(self.handle, 125):
            raise ctypes.WinError(ctypes.get_last_error())

    def close(self):
        if self.handle:
            self.kernel.CloseHandle(self.handle)
            self.handle = None


@contextmanager
def owned_fixture(executable, private, environment):
    stderr = (private / "fixture.stderr").open("w+", encoding="utf-8")
    process = subprocess.Popen([str(executable)], cwd=private, env=environment,
                               stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=stderr,
                               text=True, encoding="utf-8", bufsize=1,
                               start_new_session=os.name != "nt",
                               creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0)
    job = None
    reader = None
    try:
        if os.name == "nt":
            job = WindowsJob(process)
        messages = queue.Queue()

        def read_messages():
            try:
                for line in process.stdout:
                    messages.put(line)
            finally:
                messages.put(None)

        reader = threading.Thread(target=read_messages, daemon=True)
        reader.start()
        # The fixture cannot spawn a worker until containment has been established.
        process.stdin.write("start\n")
        process.stdin.flush()
        yield process, messages
    finally:
        try:
            if process.returncode is None:
                # Do not poll/reap before POSIX group cleanup: the unreaped exact
                # leader keeps its PID reserved even if it crashed unexpectedly.
                if job is not None:
                    job.terminate()
                elif os.name == "nt":
                    process.terminate()  # Assignment failed before the startup gate.
                else:
                    try:
                        os.killpg(process.pid, signal.SIGKILL)
                    except ProcessLookupError:
                        pass
                process.wait(timeout=10)
        finally:
            if job is not None:
                job.close()
            process.stdin.close()
            if reader is not None:
                reader.join(timeout=1)
            process.stdout.close()
            stderr.flush()
            stderr.seek(0)
            diagnostics = stderr.read()
            stderr.close()
            if diagnostics:
                print(diagnostics, file=sys.stderr, end="")


def private_environment(private, worker):
    # Keep the compiler/OS runtime search path, but inherit no application
    # overrides or authentication environment into this private graph fixture.
    environment = {name: value for name, value in os.environ.items()
                   if not name.upper().startswith(("LOGSEQ_", "LUI_"))
                   and not any(part in name.upper() for part in ("TOKEN", "SECRET", "PASSWORD", "API_KEY", "AUTH", "CREDENTIAL", "ACCESS_KEY"))}
    directories = {
        "HOME": private / "home", "USERPROFILE": private / "home",
        "LOGSEQ_ROOT_DIR": private / "store", "LOGSEQ_GRAPHS_DIR": private / "store/graphs",
        "LOGSEQ_UI_STATE_DIR": private / "ui-state", "XDG_CONFIG_HOME": private / "home/.config",
        "XDG_DATA_HOME": private / "home/.local/share", "XDG_STATE_HOME": private / "home/.local/state",
        "XDG_CACHE_HOME": private / "home/.cache", "APPDATA": private / "home/AppData/Roaming",
        "LOCALAPPDATA": private / "home/AppData/Local",
    }
    for name, directory in directories.items():
        directory.mkdir(parents=True, exist_ok=True)
        environment[name] = str(directory.resolve())
    environment.update(LOGSEQ_NO_LOGIN_DAEMON="1", LOGSEQ_DB_WORKER_BIN=str(worker),
                       LOGSEQ_TEST_PRIVATE_ROOT=str(private))
    return environment


def private_path(private, value):
    path = Path(value).resolve(strict=True)
    if path == private or not path.is_relative_to(private):
        raise ValueError(f"Fixture path escaped its private root: {path}")
    return path


def ownership_file(private, environment, raw_graph):
    private_path(private, raw_graph)
    home = Path(environment["HOME"])
    if sys.platform == "darwin":
        root = home / "Library/Application Support/Logseq/runtime-locks"
    elif os.name == "nt":
        root = home / "AppData/Local/Logseq/runtime-locks"
    else:
        root = home / ".local/state/Logseq/runtime-locks"
    # Hash the native canonical spelling, including its Windows separators.
    return private_path(private, root / hashlib.sha256(raw_graph.encode()).hexdigest() / "lock.sqlite")


def assert_ownership(file, *, held):
    with closing(sqlite3.connect(file.as_uri() + "?mode=rw", uri=True, timeout=0)) as connection:
        try:
            connection.execute("BEGIN IMMEDIATE")
        except sqlite3.OperationalError as error:
            if not held or (getattr(error, "sqlite_errorcode", 0) & 255) not in (sqlite3.SQLITE_BUSY, sqlite3.SQLITE_LOCKED):
                raise
        else:
            connection.rollback()
            if held:
                raise AssertionError("Actual worker did not hold its graph ownership lock")


def check_phase(private, environment, message, *, closed):
    graph = private_path(private, message["graph"])
    runtime = private_path(private, message["runtime"])
    record = json.loads(runtime.read_text(encoding="utf-8"))
    if record.get("pid") != message["pid"] or record.get("phase") != ("closed" if closed else "ready"):
        raise AssertionError("Actual graph runtime lifecycle record disagrees with its exact child")
    if closed and record.get("error") is not None:
        raise AssertionError("Actual worker recorded an unsuccessful graph close")
    assert_ownership(ownership_file(private, environment, message["graph"]), held=not closed)
    database = private_path(private, graph / "db.sqlite")
    if closed:
        with closing(sqlite3.connect(database.as_uri() + "?mode=ro", uri=True)) as connection:
            if connection.execute("PRAGMA quick_check").fetchall() != [("ok",)]:
                raise AssertionError("Graph SQLite integrity failed after actual worker shutdown")
        try:
            with socket.create_connection(("127.0.0.1", message["port"]), timeout=0.5):
                raise AssertionError("Actual stopped worker endpoint is still accepting connections")
        except ConnectionRefusedError:
            pass


def compile_fixture(stage):
    prefix = ["opam", "exec", "--switch=" + os.environ.get("OPAMSWITCH", "5.5.1"), "--"]
    archives = [UI / "_build/default" / name for name in ARCHIVES]
    if missing := [str(path) for path in archives if not path.is_file()]:
        raise ValueError("Build the actual native app archives first: " + ", ".join(missing))
    extension = subprocess.check_output([*prefix, "ocamlopt", "-config-var", "ext_obj"], text=True).strip()
    if extension not in (".o", ".obj"):
        raise ValueError("Unsupported native object suffix: " + extension)
    includes = []
    for name in ARCHIVES:
        path = Path(name)
        objects = UI / "_build/default" / path.parent / f".{path.stem}.objs"
        for kind in ("byte", "native"):
            includes.extend(("-I", str(objects / kind)))
    bridge = stage / ("logseq_lui_bridge" + extension)
    subprocess.run([*prefix, "ocamlopt", "-c", "-o", str(bridge),
                    str(UI / "native/logseq_lui_bridge.c")], cwd=stage, check=True)
    compiler = [*prefix, "ocamlfind", "ocamlopt", "-thread", "-package", PACKAGES + ",lui.ppx", *includes]
    # The executable's Dune interface deliberately hides Native_embed internals.
    # Compile the real source, as in the native admission driver, to use its
    # production lifecycle without adding a shipping inspection API.
    embed = stage / "native_embed.cmx"
    subprocess.run([*compiler, "-c", "-o", str(embed),
                    str(UI / "native/native_embed.ml")], cwd=stage, check=True)
    source = stage / "owned_worker_update_native.ml"
    source.write_bytes((UI / "nsh/tests/owned_worker_update_native.ml").read_bytes())
    executable = stage / ("owned-worker-update.exe" if os.name == "nt" else "owned-worker-update")
    subprocess.run([*compiler, "-I", str(stage), "-linkall", "-linkpkg",
                    *map(str, archives), str(embed), str(source), str(bridge),
                    "-o", str(executable)], cwd=stage, check=True)
    return executable


def digest(file):
    with file.open("rb") as content:
        return hashlib.file_digest(content, "sha256").hexdigest()


def qualify_case(executable, private, worker, mode, expected_events):
    environment = private_environment(private, worker)
    environment["LOGSEQ_TEST_WORKER_MODE"] = mode
    deadline = time.monotonic() + 180
    phases = []
    with owned_fixture(executable, private, environment) as (process, messages):
        for expected in expected_events:
            line = messages.get(timeout=max(0.01, deadline - time.monotonic()))
            if line is None:
                raise RuntimeError("Private fixture exited without its expected lifecycle proof")
            message = json.loads(line)
            if message.get("event") != expected:
                raise AssertionError(f"Expected {expected} lifecycle proof: {message}")
            if mode in ("protocol", "outliner"):
                check_phase(private, environment, message,
                            closed=expected in ("stopped", "closed", "outliner-stopped", "outliner-closed"))
            else:
                workers = message.get("workers", [])
                closed = {
                    "coordinator-opened": [False, False], "coordinator-stopped": [True, True],
                    "coordinator-restored": [False, False], "coordinator-partial-stopped": [True, False],
                    "coordinator-partial-restored": [False, False], "coordinator-closed": [True, True],
                }[expected]
                if len(workers) != 2 or [worker["closed"] for worker in workers] != closed:
                    raise AssertionError("Coordinator proof requires both exact worker lifecycle states")
                for sample, is_closed in zip(workers, closed, strict=True):
                    check_phase(private, environment, sample, closed=is_closed)
                if phases and [sample["graph"] for sample in workers] != [sample["graph"] for sample in phases[0]["workers"]]:
                    raise AssertionError("Coordinator restoration changed its captured private graph owners")
            phases.append(message)
            process.stdin.write("exit\n" if expected == expected_events[-1] else "continue\n")
            process.stdin.flush()
        if process.wait(timeout=10) != 0:
            raise RuntimeError("Actual owned-worker fixture failed")
    return phases


def qualify(worker):
    worker = worker.resolve(strict=True)
    worker_hash = digest(worker)
    with tempfile.TemporaryDirectory(prefix="logseq-owned-worker-update-") as temporary:
        private = Path(temporary).resolve()
        executable = compile_fixture(private)
        protocol = qualify_case(executable, private / "protocol", worker, "protocol",
                                ("opened", "aborted", "stopped", "reopened", "closed"))
        coordinator = qualify_case(executable, private / "coordinator", worker, "coordinator",
                                   ("coordinator-opened", "coordinator-stopped", "coordinator-restored",
                                    "coordinator-partial-stopped", "coordinator-partial-restored", "coordinator-closed"))
        outliner = qualify_case(executable, private / "outliner", worker, "outliner",
                                ("outliner-opened", "outliner-dropped", "outliner-stopped",
                                 "outliner-reopened", "outliner-closed"))
        outliner_cases = ["after-target", "before-first-target", "append-child", "dirty-save"]
        if (outliner[1].get("cases") != outliner_cases
                or not isinstance(outliner[1].get("recordedHostCommands"), int)
                or outliner[1]["recordedHostCommands"] <= 0
                or outliner[0]["instance"] != outliner[2]["instance"]
                or outliner[3]["instance"] != outliner[4]["instance"]
                or outliner[0]["instance"] == outliner[3]["instance"]
                or any(phase["graph"] != outliner[0]["graph"] for phase in outliner)):
            raise AssertionError("Canonical native drops require every case and one exact durable worker replacement")
        instances = [[sample["instance"] for sample in phase["workers"]] for phase in coordinator]
        if (instances[0] != instances[1] or instances[2] != instances[3]
                or instances[4] != instances[5]
                or any(before == after for before, after in zip(instances[0], instances[2], strict=True))
                or instances[4][0] == instances[2][0] or instances[4][1] != instances[2][1]):
            raise AssertionError("Actual full/partial rollback did not retain the expected exact worker generations")
        if digest(worker) != worker_hash:
            raise RuntimeError("The selected native worker changed during qualification")
        return {"stage2Qualified": True, "coordinatorQualified": True, "outlinerDropQualified": True,
                "installerEnabled": False, "platform": sys.platform,
                "worker": str(worker), "workerSha256": worker_hash,
                "checks": ["actual-child-and-storage", "active-graph-ownership", "seal-refusal",
                           "abort-reopen", "SSE-does-not-block-stop", "exact-child-clean-exit",
                           "runtime-closed", "SQLite-ownership-released", "durable-write-after-restart",
                           "two-worker-production-lifecycle", "all-exits-before-prepared",
                           "full-rollback-and-durable-reads", "partial-stop-cancellation",
                           "exited-worker-replacement-and-live-worker-abort",
                           "captured-transport-SSE-readiness-and-finite-probe",
                           "canonical-native-Alt-reference-controller-to-database",
                           "reference-zone-order-and-source-retention", "dirty-save-before-reference-insert",
                           "reference-editor-after-canonical-refresh", "reference-durability-after-worker-restart"],
                "instances": [protocol[0]["instance"], protocol[3]["instance"]],
                "outlinerInstances": [outliner[0]["instance"], outliner[3]["instance"]],
                "outlinerCases": outliner_cases, "outlinerInput": "canonical-events-with-fixture-geometry",
                "coordinatorInstances": instances}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--worker", required=True, type=Path, help="Actual newly built native DB worker binary")
    args = parser.parse_args()
    print(json.dumps(qualify(args.worker), indent=2))
