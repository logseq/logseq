"""Record one isolated macOS native workload with a 200 MB GUI/worker guard.

Build before invoking this script. Do not run builds or tests during a recording.
The input library replays SDL events; it does not verify OS focus or IME behavior.
"""

import argparse
import ctypes
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shutil
import sqlite3
import subprocess
import threading
import time
import urllib.request

from native_profile_report import summarize


class RusageInfo(ctypes.Structure):
    _fields_ = [("uuid", ctypes.c_uint8 * 16)] + [(name, ctypes.c_uint64) for name in (
        "user_time", "system_time", "pkg_idle_wkups", "interrupt_wkups", "pageins",
        "wired_size", "resident_size", "phys_footprint", "proc_start_abstime", "proc_exit_abstime")]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def over_limit(row):
    return any(sum(item[name] for item in row["processes"].values()) > 200_000_000
               for name in ("rss_bytes", "footprint_bytes"))


def clone_graph(source, target):
    target.mkdir()
    for name in ("last-repo", "server-list"):
        shutil.copy2(source / name, target / name)
    for name in ("graphs/demo/db.sqlite", "graphs/demo/client-ops-/db.sqlite",
                 "graphs/logseq_db_demo-search.sqlite"):
        destination = target / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect((source / name).resolve().as_uri() + "?mode=ro", uri=True) as reader:
            with sqlite3.connect(destination) as writer:
                reader.backup(writer)


def query_count(runtime):
    payload = {"method": "thread-api/q", "args": ["logseq_db_demo", [
        "[:find (count ?b) . :where [?b :block/uuid]]"]]}
    request = urllib.request.Request(f"http://127.0.0.1:{runtime['port']}/v1/invoke",
                                     json.dumps(payload).encode(), {"Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=5) as response:
        body = json.load(response)
    if not body["ok"]:
        raise ValueError(f"Graph count query failed: {body}")
    value = json.loads(body["resultTransit"])
    if value[0] != "~#'" or type(value[1]) is not int:
        raise ValueError("Unexpected graph count result")
    return value[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("baseline", "output", "executable", "worker", "input-script", "input-library"):
        parser.add_argument("--" + name, type=Path, required=True)
    parser.add_argument("--scenario", choices=("idle", "enter"), required=True)
    parser.add_argument("--backend", choices=("metal", "cocoa"), required=True)
    parser.add_argument("--build-profile", required=True)
    parser.add_argument("--lui-revision", required=True)
    parser.add_argument("--duration-s", type=float, required=True)
    parser.add_argument("--expected-actions", type=int, required=True)
    args = parser.parse_args()
    for name in ("baseline", "output", "executable", "worker", "input_script", "input_library"):
        setattr(args, name, getattr(args, name).resolve())
    if not math.isfinite(args.duration_s) or args.duration_s <= 0 or args.expected_actions < 0:
        parser.error("Duration must be positive and expected actions nonnegative")
    forbidden = [name for name in os.environ if name.startswith("LOGSEQ_NATIVE_ALLOC_")]
    if forbidden or "DYLD_INSERT_LIBRARIES" in os.environ:
        parser.error("Run unprofiled recordings without allocation or injected-library environment overrides")
    args.output.mkdir()
    root = args.output / "root"
    clone_graph(args.baseline, root)
    provenance = {"scenario": args.scenario, "executable_sha256": digest(args.executable),
                  "worker_sha256": digest(args.worker), "graph_sha256": digest(root / "graphs/demo/db.sqlite"),
                  "input_sha256": digest(args.input_script), "input_library_sha256": digest(args.input_library),
                  "build_profile": args.build_profile, "lui_revision": args.lui_revision,
                  "backend": args.backend, "viewport": [1440, 900, 2880, 1800],
                  "raster_workers": 4, "profiler": False,
                  "logseq_revision": subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip(),
                  "source_diff_sha256": hashlib.sha256(subprocess.check_output(["git", "diff", "HEAD"])).hexdigest(),
                  "runner_sha256": digest(Path(__file__)), "replay_mode": "changes",
                  "inherited_runtime_environment": {key: value for key, value in os.environ.items()
                      if key.startswith(("LOGSEQ_NATIVE_", "LUI_")) or key == "OCAMLRUNPARAM"}}
    libproc = ctypes.CDLL("/usr/lib/libproc.dylib", use_errno=True)
    libproc.proc_pid_rusage.argtypes = [ctypes.c_int, ctypes.c_int, ctypes.c_void_p]
    libproc.proc_pid_rusage.restype = ctypes.c_int

    def memory_usage(pid):
        result = RusageInfo()
        if libproc.proc_pid_rusage(pid, 0, ctypes.byref(result)) != 0:
            raise OSError(ctypes.get_errno(), "proc_pid_rusage failed")
        return {"rss_bytes": result.resident_size, "footprint_bytes": result.phys_footprint}

    environment = dict(os.environ, LOGSEQ_ROOT_DIR=str(root), LOGSEQ_NO_LOGIN_DAEMON="1",
                       LOGSEQ_DB_WORKER_BIN=str(args.worker), LUI_GPU=args.backend,
                       LOGSEQ_NATIVE_RASTER_WORKERS="4", LOGSEQ_MEM_TRACE="1",
                       LOGSEQ_WIDTH="1440", LOGSEQ_HEIGHT="900")
    processes, memory, runtime = {}, [], None
    outcome = {"provenance": provenance, "exit_code": None, "protection_limit_bytes": 200_000_000,
               "sampling_interval_s": .05, "error": None}
    started = time.monotonic()

    def sample(channel):
        row = {"seconds": time.monotonic() - started,
               "processes": {role: memory_usage(process.pid) for role, process in list(processes.items())
                             if process.poll() is None}}
        memory.append(row)
        channel.write(json.dumps(row) + "\n")
        if over_limit(row):
            outcome["error"] = "protection_limit"
            outcome["trigger_sample"] = row
            for process in processes.values():
                if process.poll() is None:
                    process.kill()
            raise RuntimeError("Combined GUI/worker memory exceeded 200 MB")

    stopped = threading.Event()

    def monitor(channel):
        try:
            while not stopped.is_set():
                sample(channel)
                stopped.wait(.05)
        except Exception as error:
            outcome["error"] = outcome["error"] or str(error)
            for process in list(processes.values()):
                if process.poll() is None:
                    process.kill()

    sampler = None
    try:
        with (args.output / "worker.log").open("w") as worker_log, (args.output / "app.log").open("w") as app_log, \
                (args.output / "memory.jsonl").open("w", buffering=1) as channel:
            processes["worker"] = subprocess.Popen([str(args.worker), "--root-dir", str(root),
                "--graphs-dir", str(root / "graphs"), "--repo", "logseq_db_demo", "--owner-source", "electron"],
                env=environment, stdout=worker_log, stderr=subprocess.STDOUT)
            sampler = threading.Thread(target=monitor, args=(channel,))
            sampler.start()
            while runtime is None:
                if outcome["error"]:
                    raise RuntimeError(outcome["error"])
                if processes["worker"].poll() is not None or time.monotonic() - started > 20:
                    raise RuntimeError("Isolated worker did not become ready")
                for path in root.glob(".graph-lifecycle/**/runtime-*.json"):
                    state = json.loads(path.read_text())
                    if state["pid"] == processes["worker"].pid and state["phase"] == "ready":
                        runtime = state
                        break
                time.sleep(.05)
            outcome["before_blocks"] = query_count(runtime)
            environment.update(DYLD_INSERT_LIBRARIES=str(args.input_library),
                               LOGSEQ_TEST_INPUT_SCRIPT=str(args.input_script),
                               LOGSEQ_NATIVE_METRICS=str(args.output / "metrics.jsonl"),
                               LOGSEQ_NATIVE_MEMORY_REPLAY=str(args.duration_s),
                               LOGSEQ_NATIVE_MEMORY_REPLAY_MODE="changes")
            processes["gui"] = subprocess.Popen([str(args.executable)], env=environment,
                                                  stdout=app_log, stderr=subprocess.STDOUT)
            gui_started = time.monotonic()
            while processes["gui"].poll() is None:
                if outcome["error"]:
                    raise RuntimeError(outcome["error"])
                if time.monotonic() - gui_started > args.duration_s + 20:
                    raise RuntimeError("Native workload timed out")
                time.sleep(.05)
            outcome["exit_code"] = processes["gui"].returncode
            if outcome["error"]:
                raise RuntimeError(outcome["error"])
            outcome["after_blocks"] = query_count(runtime)
            stopped.set()
            sampler.join()
    except Exception as error:
        outcome["error"] = outcome["error"] or str(error)
    finally:
        stopped.set()
        if sampler is not None:
            sampler.join()
        for process in processes.values():
            if process.poll() is None:
                process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
        if "gui" in processes:
            outcome["exit_code"] = processes["gui"].returncode
        outcome["pids"] = {role: process.pid for role, process in processes.items()}
        outcome["elapsed_s"] = time.monotonic() - started
        (args.output / "outcome.json").write_text(json.dumps(outcome, indent=2) + "\n")

    if outcome["error"]:
        print(json.dumps(outcome), flush=True)
        return 1
    rows = [json.loads(line) for line in (args.output / "metrics.jsonl").read_text().splitlines()]
    log = (args.output / "app.log").read_text()
    inputs = re.findall(r"clock_s=([\d.]+) command=key args=13 0", log)
    injected = len(inputs)
    persisted = outcome["after_blocks"] - outcome["before_blocks"]
    if args.scenario == "enter":
        if not inputs:
            raise ValueError("Enter workload did not inject an Enter event")
        begin = float(inputs[0])
        before = [row for row in rows if row["time_s"] < begin]
        if not before:
            raise ValueError("No metrics boundary before Enter")
        first = before[-1]
        counter = "enter_downs"
    else:
        first = next(row for row in rows if row["time_s"] >= rows[0]["time_s"] + 5)
        counter = "enter_downs"
    run = {"provenance": provenance, "window": {"start_s": first["time_s"], "end_s": rows[-1]["time_s"]},
           "metrics": rows, "memory": [row for row in memory if set(row["processes"]) == {"gui", "worker"}],
           "actions": {"counter": counter, "expected": args.expected_actions, "injected": injected,
                       "persisted": persisted, "ui_settled": False}, "exit_code": outcome["exit_code"]}
    (args.output / "recording.json").write_text(json.dumps(run) + "\n")
    report = summarize(run)
    (args.output / "report.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"output": str(args.output), "host_allocated_bytes": report["host_allocated_bytes"],
                      "handled": report["handled_actions"], "persisted": persisted,
                      "memory": report["memory"]}), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
