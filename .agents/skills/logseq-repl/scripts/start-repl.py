#!/usr/bin/env python3
import argparse
import json
import os
import re
import signal
import subprocess
import sys
import time
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_REPO_ROOT = SCRIPT_DIR.parents[3]
STANDARD_PORTS = (8701, 3001, 3002, 9630, 9631)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)
    sys.stderr.reconfigure(line_buffering=True)


def parse_args():
    parser = argparse.ArgumentParser(
        prog="start-repl.sh",
        description="Start the unified Logseq REPL workflow.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "This starts shared pnpm watch, the Desktop dev app, and the\n"
            "db-worker-node runtime, verifies the REPL targets, and exits."
        ),
    )
    parser.add_argument("--repo", default=os.environ.get("DB_REPO", "demo"),
                        help="Graph repo name passed to db-worker-node (default: demo)")
    parser.add_argument("--root-dir", default=os.environ.get("LOGSEQ_CLI_ROOT_DIR", str(Path.home() / "logseq")),
                        help="Logseq data root passed to db-worker-node (default: $LOGSEQ_CLI_ROOT_DIR or ~/logseq)")
    parser.add_argument("--repo-root", default=os.environ.get("REPO_ROOT", str(DEFAULT_REPO_ROOT)),
                        help="Logseq repository root (default: auto-detect from script location)")
    parser.add_argument("extra_node_args", nargs=argparse.REMAINDER,
                        help="Arguments after -- are passed to db-worker-node")
    args = parser.parse_args()
    if args.extra_node_args and args.extra_node_args[0] == "--":
        args.extra_node_args = args.extra_node_args[1:]
    return args


def require_command(name):
    if subprocess.run(["/usr/bin/env", "sh", "-c", f"command -v {name} >/dev/null 2>&1"]).returncode != 0:
        raise SystemExit(f"Error: {name} not found in PATH")


def read_pid(path):
    try:
        text = path.read_text().strip()
    except FileNotFoundError:
        return None
    return int(text) if re.fullmatch(r"\d+", text) else None


def is_running(pid):
    if not pid:
        return False
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def write_pid(path, pid):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(f"{pid}\n")


def wait_for_patterns(path, timeout, patterns, all_required=True):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if path.exists():
            text = path.read_text(errors="replace")
            if all_required and all(pattern in text for pattern in patterns):
                return True
            if not all_required and any(pattern in text for pattern in patterns):
                return True
        time.sleep(1)
    return False


def process_group_kwargs():
    if os.name == "nt":
        return {"creationflags": subprocess.CREATE_NEW_PROCESS_GROUP}
    return {"start_new_session": True}


def start_process(repo_root, log_path, command):
    log_path.parent.mkdir(parents=True, exist_ok=True)
    log_file = log_path.open("wb")
    return subprocess.Popen(
        command,
        cwd=repo_root,
        stdin=subprocess.DEVNULL,
        stdout=log_file,
        stderr=subprocess.STDOUT,
        **process_group_kwargs(),
    )


def port_listener_pid(port):
    try:
        output = subprocess.check_output(
            ["lsof", "-nP", f"-iTCP:{port}", "-sTCP:LISTEN", "-t"],
            text=True,
            stderr=subprocess.DEVNULL,
        )
    except (FileNotFoundError, subprocess.CalledProcessError):
        return None
    for line in output.splitlines():
        if line.strip().isdigit():
            return int(line.strip())
    return None


def has_managed_processes(paths):
    return any(is_running(read_pid(path)) for path in paths)


def read_json(path):
    try:
        return json.loads(path.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return None


def write_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, sort_keys=True) + "\n")


def require_clean_ports():
    had_conflict = False
    for port in STANDARD_PORTS:
        pid = port_listener_pid(port)
        if pid:
            had_conflict = True
            print(f"Port {port} is already listening (pid={pid})", file=sys.stderr)
    if had_conflict:
        print("Error: standard Logseq REPL ports are still occupied after cleanup.", file=sys.stderr)
        print("Resolve the external conflict first, then retry.", file=sys.stderr)
        return False
    return True


def ensure_shadow_watch(repo_root, shadow_pid_file, shadow_log):
    pid = read_pid(shadow_pid_file)
    if is_running(pid):
        print(f"Reusing shared shadow-cljs watch (pid={pid})")
        return pid

    print("Starting shared shadow-cljs watch via pnpm watch ...")
    process = start_process(repo_root, shadow_log, ["pnpm", "watch"])
    write_pid(shadow_pid_file, process.pid)
    time.sleep(1)

    if process.poll() is not None:
        raise SystemExit(f"Error: pnpm watch exited early. Check {shadow_log}")

    if not wait_for_patterns(shadow_log, 180, [
        "[:electron] Build completed.",
        "[:app] Build completed.",
        "[:db-worker-node] Build completed.",
    ]):
        raise SystemExit(f"Error: pnpm watch did not finish the expected builds in time. Check {shadow_log}")

    listener_pid = port_listener_pid(8701)
    if listener_pid and is_running(listener_pid):
        write_pid(shadow_pid_file, listener_pid)
        pid = listener_pid
    else:
        pid = process.pid

    print("shadow-cljs watch builds are ready")
    return pid


def ensure_desktop_app(repo_root, desktop_pid_file, desktop_log):
    pid = read_pid(desktop_pid_file)
    if is_running(pid):
        print(f"Reusing Desktop dev app (pid={pid})")
        return pid

    print("Starting Desktop dev app via pnpm dev-electron-app ...")
    process = start_process(repo_root, desktop_log, ["pnpm", "dev-electron-app"])
    write_pid(desktop_pid_file, process.pid)
    time.sleep(1)

    if process.poll() is not None:
        raise SystemExit(f"Error: pnpm dev-electron-app exited early. Check {desktop_log}")

    if not wait_for_patterns(desktop_log, 120, ["shadow-cljs - #", "Logseq App("], all_required=False):
        raise SystemExit(f"Error: Desktop dev app did not report startup in time. Check {desktop_log}")

    print(f"Desktop dev app is running (pid={process.pid})")
    return process.pid


def ensure_db_worker_node(repo_root, db_pid_file, db_options_file, db_log, repo, root_dir, extra_args):
    pid = read_pid(db_pid_file)
    startup_options = {
        "repo": repo,
        "root_dir": str(root_dir),
        "owner_source": "cli",
        "extra_args": list(extra_args),
    }
    existing_options = read_json(db_options_file)

    if is_running(pid):
        if existing_options == startup_options:
            print(f"Reusing db-worker-node runtime (pid={pid}, repo={repo}, root-dir={root_dir})")
            return pid
        print(f"Stopping existing db-worker-node (pid={pid}) due to startup option mismatch")
        terminate_pid(pid)
        time.sleep(1)

    print(f"Starting db-worker-node (repo={repo}, root-dir={root_dir}) ...")
    process = start_process(
        repo_root,
        db_log,
        [
            "node",
            "./static/db-worker-node.js",
            "--repo",
            repo,
            "--root-dir",
            str(root_dir),
            "--owner-source",
            "cli",
            *extra_args,
        ],
    )
    write_pid(db_pid_file, process.pid)
    write_json(db_options_file, startup_options)
    time.sleep(1)

    if process.poll() is not None:
        raise SystemExit(f"Error: db-worker-node exited early. Check {db_log}")

    print(f"db-worker-node is running (pid={process.pid}, repo={repo}, root-dir={root_dir})")
    return process.pid


def runtime_count(repo_root, build_name):
    form = f"(do (require '[shadow.cljs.devtools.api :as api]) (println (count (api/repl-runtimes :{build_name}))))"
    proc = subprocess.run(
        ["pnpm", "exec", "shadow-cljs", "clj-eval", form],
        cwd=repo_root,
        text=True,
        capture_output=True,
    )
    if proc.returncode != 0:
        raise SystemExit(
            f"Error: failed to inspect :{build_name} runtimes.\n"
            f"--- clj-eval output ---\n{proc.stdout}{proc.stderr}\n-----------------------"
        )
    matches = re.findall(r"^(\d+)$", proc.stdout + proc.stderr, flags=re.MULTILINE)
    if not matches:
        raise SystemExit(
            f"Error: could not parse :{build_name} runtime count.\n"
            f"--- clj-eval output ---\n{proc.stdout}{proc.stderr}\n-----------------------"
        )
    return int(matches[-1])


def wait_for_runtime_count(repo_root, build_name, expected, timeout):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        count = runtime_count(repo_root, build_name)
        if expected == "exactly-one":
            if count == 1:
                print(f"Detected exactly one live :{build_name} runtime")
                return
            if count != 0:
                raise SystemExit(f"Error: Expected exactly one live :{build_name} runtime, found {count}.")
        elif expected == "nonzero" and count != 0:
            print(f"Detected live :{build_name} runtime count: {count}")
            return
        time.sleep(1)

    if expected == "exactly-one":
        raise SystemExit(f"Error: Expected exactly one live :{build_name} runtime, found 0 after waiting.")
    raise SystemExit(f"Error: expected a live :{build_name} runtime, but runtime count stayed 0.")


def verify_repls(repo_root):
    subprocess.run([str(SCRIPT_DIR / "verify-repls.sh"), "--repo-root", str(repo_root)], check=True)


def print_summary(shadow_log, desktop_log, db_log, shadow_pid_file, desktop_pid_file, db_pid_file):
    print()
    print("Logs:")
    print(f"  shared shadow-cljs: {shadow_log}")
    print(f"  desktop-app:        {desktop_log}")
    print(f"  db-worker-node:     {db_log}")
    print("PID files:")
    print(f"  {shadow_pid_file}")
    print(f"  {desktop_pid_file}")
    print(f"  {db_pid_file}")
    print()
    print("Attach commands:")
    print("  pnpm exec shadow-cljs cljs-repl app")
    print("  pnpm exec shadow-cljs cljs-repl electron")
    print("  pnpm exec shadow-cljs cljs-repl db-worker-node")
    print()
    print("Startup complete. Attach to the needed REPL manually.")


def terminate_pid(pid):
    if not pid:
        return
    try:
        if os.name == "nt":
            os.kill(pid, signal.CTRL_BREAK_EVENT)
        else:
            os.kill(pid, signal.SIGTERM)
    except OSError:
        pass


def main():
    args = parse_args()
    repo_root = Path(args.repo_root).resolve()
    db_root_dir = Path(args.root_dir).expanduser().resolve()
    if not repo_root.is_dir():
        raise SystemExit(f"Error: repo root not found: {repo_root}")

    require_command("pnpm")
    require_command("node")

    log_dir = repo_root / "tmp" / "logseq-repl"
    legacy_desktop_dir = repo_root / "tmp" / "desktop-app-repl"
    legacy_db_dir = repo_root / "tmp" / "db-worker-node-repl"
    log_dir.mkdir(parents=True, exist_ok=True)

    shadow_pid_file = log_dir / "shared-shadow-watch.pid"
    desktop_pid_file = log_dir / "desktop-electron.pid"
    db_pid_file = log_dir / "db-worker-node.pid"
    db_options_file = log_dir / "db-worker-node.options.json"
    shadow_log = log_dir / "shared-shadow-watch.log"
    desktop_log = log_dir / "desktop-electron.log"
    db_log = log_dir / "db-worker-node.log"

    managed_pid_files = [
        shadow_pid_file,
        desktop_pid_file,
        db_pid_file,
        legacy_desktop_dir / "shadow-watch.pid",
        legacy_desktop_dir / "desktop-electron.pid",
        legacy_db_dir / "shadow-db-worker-node.pid",
        legacy_db_dir / "db-worker-node.pid",
    ]

    if not has_managed_processes(managed_pid_files) and not require_clean_ports():
        return 1

    ensure_shadow_watch(repo_root, shadow_pid_file, shadow_log)
    ensure_desktop_app(repo_root, desktop_pid_file, desktop_log)
    ensure_db_worker_node(repo_root, db_pid_file, db_options_file, db_log, args.repo, db_root_dir, args.extra_node_args)
    wait_for_runtime_count(repo_root, "app", "exactly-one", 60)
    wait_for_runtime_count(repo_root, "electron", "nonzero", 60)
    wait_for_runtime_count(repo_root, "db-worker-node", "nonzero", 60)
    verify_repls(repo_root)
    print_summary(shadow_log, desktop_log, db_log, shadow_pid_file, desktop_pid_file, db_pid_file)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
