#!/usr/bin/env python3

import argparse
import json
import os
import pathlib
import subprocess
import time


TASK_TITLE = "测试 agent bridge 功能，把当前task status设置为done"
EXPECTED_SESSION = "thread-e2e-agent-bridge"
PARALLEL_TASK_TITLES = [
    "测试 agent bridge 并行执行任务 1",
    "测试 agent bridge 并行执行任务 2",
]


def write_fake_codex(fake_bin):
    fake_codex = fake_bin / "codex"
    fake_codex.parent.mkdir(parents=True, exist_ok=True)
    fake_codex.write_text(
        """#!/usr/bin/env python3
import json
import os
import pathlib
import re
import sys
import time

args = sys.argv[1:]
if args == ["--version"]:
    print("codex-cli 0.0.0-e2e")
    sys.exit(0)

if args[:2] == ["exec", "--json"]:
    prompt = args[2] if len(args) > 2 else ""
    block_uuid_match = re.search(r"^Block UUID: (.+)$", prompt, re.MULTILINE)
    block_uuid = block_uuid_match.group(1) if block_uuid_match else None
    log_path = pathlib.Path(os.environ["CODEX_FAKE_LOG"])
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("a", encoding="utf8") as f:
        f.write(json.dumps(
            {"event": "start", "time": time.time(), "args": args, "prompt": prompt, "block_uuid": block_uuid},
            ensure_ascii=False) + "\\n")
    delay = float(os.environ.get("CODEX_FAKE_DELAY_SECONDS", "0"))
    if delay > 0:
        time.sleep(delay)
    if os.environ.get("CODEX_FAKE_SESSION_BY_UUID") == "1" and block_uuid:
        session_id = "thread-e2e-agent-bridge-" + re.sub(r"[^A-Za-z0-9]", "", block_uuid)[-12:]
    else:
        session_id = "thread-e2e-agent-bridge"
    with log_path.open("a", encoding="utf8") as f:
        f.write(json.dumps(
            {"event": "session", "time": time.time(), "session": session_id, "block_uuid": block_uuid},
            ensure_ascii=False) + "\\n")
    print(json.dumps({"type": "thread.started", "thread_id": session_id}), flush=True)
    sys.exit(0)

print("unexpected codex args: " + repr(args), file=sys.stderr)
sys.exit(2)
""",
        encoding="utf8",
    )
    fake_codex.chmod(0o755)


def run_json(cli, repo_root, root_dir, config, graph, query):
    result = subprocess.run(
        cli
        + [
            "--root-dir",
            root_dir,
            "--config",
            config,
            "--output",
            "json",
            "query",
            "--graph",
            graph,
            "--query",
            query,
        ],
        cwd=repo_root,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if result.returncode != 0:
        return None
    return json.loads(result.stdout).get("data", {}).get("result")


def run_cli(cli, repo_root, root_dir, config, graph, extra_args):
    result = subprocess.run(
        cli
        + [
            "--root-dir",
            root_dir,
            "--config",
            config,
            "--output",
            "json",
        ]
        + extra_args,
        cwd=repo_root,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if result.returncode != 0:
        raise SystemExit(
            "CLI command failed: {}\nstdout:\n{}\nstderr:\n{}".format(
                " ".join(extra_args), result.stdout, result.stderr
            )
        )
    return json.loads(result.stdout) if result.stdout.strip() else None


def deref_session_value(cli, repo_root, root_dir, config, graph, value):
    if not isinstance(value, int):
        return value
    return run_json(
        cli,
        repo_root,
        root_dir,
        config,
        graph,
        f"[:find ?title . :where [{value} :block/title ?title]]",
    )


def read_text(path):
    return path.read_text(encoding="utf8", errors="replace")


def wait_for_log(path, text, process):
    deadline = time.time() + 30
    while time.time() < deadline:
        if path.exists() and text in read_text(path):
            return
        if process.poll() is not None:
            raise SystemExit(
                "agent bridge exited before {}\nstdout:\n{}".format(
                    text, read_text(path)
                )
            )
        time.sleep(0.2)
    raise SystemExit("agent bridge did not log {!r}\nstdout:\n{}".format(text, read_text(path)))


def find_task_id(cli, repo_root, root_dir, config, graph, title):
    task_id = run_json(
        cli,
        repo_root,
        root_dir,
        config,
        graph,
        '[:find ?e . :where [?e :block/title "{}"]]'.format(title),
    )
    if task_id is None:
        raise SystemExit("task block was not found: {}".format(title))
    return task_id


def create_task(cli, repo_root, root_dir, config, graph, title):
    run_cli(
        cli,
        repo_root,
        root_dir,
        config,
        graph,
        [
            "upsert",
            "task",
            "--graph",
            graph,
            "--target-page",
            "AgentBridgeE2E",
            "--content",
            title,
            "--status",
            "todo",
        ],
    )


def assign_task(cli, repo_root, root_dir, config, graph, title=TASK_TITLE):
    task_id = find_task_id(cli, repo_root, root_dir, config, graph, title)
    run_cli(
        cli,
        repo_root,
        root_dir,
        config,
        graph,
        [
            "upsert",
            "block",
            "--graph",
            graph,
            "--id",
            str(task_id),
            "--update-properties",
            '{{"Assignee" "{}"}}'.format(os.uname().nodename),
        ],
    )


def read_codex_events(codex_log):
    if not codex_log.exists():
        return []
    return [
        json.loads(line)
        for line in codex_log.read_text(encoding="utf8").splitlines()
        if line.strip()
    ]


def session_query_for_title(title):
    return (
        '[:find ?session . :where [?e :block/title "{}"] '
        '[?p :block/name "agent-session-id"] '
        "[?p :db/ident ?attr] [?e ?attr ?session]]"
    ).format(title)


def wait_for_task_sessions(cli, repo_root, root_dir, config, graph, titles, bridge, bridge_log, bridge_err):
    deadline = time.time() + 45
    sessions = {}
    while time.time() < deadline:
        sessions = {
            title: deref_session_value(
                cli,
                repo_root,
                root_dir,
                config,
                graph,
                run_json(cli, repo_root, root_dir, config, graph, session_query_for_title(title)),
            )
            for title in titles
        }
        if all(sessions.values()):
            return sessions
        if bridge.poll() is not None:
            raise SystemExit(
                "agent bridge exited early with {}\nstdout:\n{}\nstderr:\n{}".format(
                    bridge.returncode, read_text(bridge_log), read_text(bridge_err)
                )
            )
        time.sleep(0.5)
    raise SystemExit(
        "agent-session-id was not written for every task; last sessions={!r}\nstdout:\n{}\nstderr:\n{}".format(
            sessions, read_text(bridge_log), read_text(bridge_err)
        )
    )


def run_parallel_assignment_check(cli, repo_root, root_dir, config, graph, tmp_dir):
    for title in PARALLEL_TASK_TITLES:
        create_task(cli, repo_root, root_dir, config, graph, title)

    fake_bin = tmp_dir / "fake-bin"
    bridge_log = tmp_dir / "agent-bridge.log"
    bridge_err = tmp_dir / "agent-bridge.err"
    codex_log = tmp_dir / "codex-invocations.jsonl"

    env = os.environ.copy()
    env["PATH"] = str(fake_bin) + os.pathsep + env.get("PATH", "")
    env["CODEX_FAKE_LOG"] = str(codex_log)
    env["CODEX_FAKE_DELAY_SECONDS"] = "5"
    env["CODEX_FAKE_SESSION_BY_UUID"] = "1"

    with bridge_log.open("wb") as out, bridge_err.open("wb") as err:
        bridge = subprocess.Popen(
            cli
            + [
                "--root-dir",
                root_dir,
                "--config",
                config,
                "--output",
                "human",
                "agent",
                "bridge",
                "--graph",
                graph,
            ],
            cwd=repo_root,
            env=env,
            stdout=out,
            stderr=err,
        )

    try:
        wait_for_log(bridge_log, "listening graph changes", bridge)
        for title in PARALLEL_TASK_TITLES:
            assign_task(cli, repo_root, root_dir, config, graph, title)

        sessions = wait_for_task_sessions(
            cli, repo_root, root_dir, config, graph, PARALLEL_TASK_TITLES, bridge, bridge_log, bridge_err
        )
        events = read_codex_events(codex_log)
        start_events = [event for event in events if event.get("event") == "start"]
        session_events = [event for event in events if event.get("event") == "session"]
        if len(start_events) != 2 or len(session_events) != 2:
            raise SystemExit("expected two codex starts and sessions, got: {!r}".format(events))

        first_session_time = min(event["time"] for event in session_events)
        latest_start_time = max(event["time"] for event in start_events)
        if latest_start_time >= first_session_time:
            raise SystemExit(
                "codex exec did not overlap; starts={!r}, sessions={!r}".format(
                    [event["time"] for event in start_events],
                    [event["time"] for event in session_events],
                )
            )

        prompts = "\n".join(event["prompt"] for event in start_events)
        for title in PARALLEL_TASK_TITLES:
            assert title in prompts, prompts
        print("agent bridge routed tasks concurrently: " + ", ".join(sorted(sessions.values())))
    finally:
        if bridge.poll() is None:
            bridge.terminate()
            try:
                bridge.wait(timeout=5)
            except subprocess.TimeoutExpired:
                bridge.kill()
                bridge.wait(timeout=5)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cli", required=True)
    parser.add_argument("--root-dir", required=True)
    parser.add_argument("--config", required=True)
    parser.add_argument("--graph", required=True)
    parser.add_argument("--tmp-dir", required=True)
    parser.add_argument("--repo-root", required=True)
    parser.add_argument("--prepare-fake-codex-only", action="store_true")
    parser.add_argument("--assign-after-start", action="store_true")
    parser.add_argument("--parallel-assignment-check", action="store_true")
    args = parser.parse_args()

    repo_root = pathlib.Path(args.repo_root)
    tmp_dir = pathlib.Path(args.tmp_dir)
    fake_bin = tmp_dir / "fake-bin"
    bridge_log = tmp_dir / "agent-bridge.log"
    bridge_err = tmp_dir / "agent-bridge.err"
    codex_log = tmp_dir / "codex-invocations.jsonl"
    cli = ["node", args.cli]

    write_fake_codex(fake_bin)
    if args.prepare_fake_codex_only:
        return

    if args.parallel_assignment_check:
        run_parallel_assignment_check(cli, repo_root, args.root_dir, args.config, args.graph, tmp_dir)
        return

    env = os.environ.copy()
    env["PATH"] = str(fake_bin) + os.pathsep + env.get("PATH", "")
    env["CODEX_FAKE_LOG"] = str(codex_log)

    with bridge_log.open("wb") as out, bridge_err.open("wb") as err:
        bridge = subprocess.Popen(
            cli
            + [
                "--root-dir",
                args.root_dir,
                "--config",
                args.config,
                "--output",
                "human",
                "agent",
                "bridge",
                "--graph",
                args.graph,
            ],
            cwd=repo_root,
            env=env,
            stdout=out,
            stderr=err,
        )

    try:
        if args.assign_after_start:
            wait_for_log(bridge_log, "listening graph changes", bridge)
            assign_task(cli, repo_root, args.root_dir, args.config, args.graph)

        deadline = time.time() + 30
        session = None
        query = (
            '[:find ?session . :where [?e :block/title "{}"] '
            '[?p :block/name "agent-session-id"] '
            "[?p :db/ident ?attr] [?e ?attr ?session]]"
        ).format(TASK_TITLE)

        while time.time() < deadline:
            session = deref_session_value(
                cli,
                repo_root,
                args.root_dir,
                args.config,
                args.graph,
                run_json(cli, repo_root, args.root_dir, args.config, args.graph, query),
            )
            if session == EXPECTED_SESSION:
                break
            if bridge.poll() is not None:
                raise SystemExit(
                    "agent bridge exited early with {}\nstdout:\n{}\nstderr:\n{}".format(
                        bridge.returncode, read_text(bridge_log), read_text(bridge_err)
                    )
                )
            time.sleep(0.5)
        else:
            raise SystemExit(
                "agent-session-id was not written; last session={!r}\nstdout:\n{}\nstderr:\n{}".format(
                    session, read_text(bridge_log), read_text(bridge_err)
                )
            )

        start_events = [event for event in read_codex_events(codex_log) if event.get("event") == "start"]
        assert len(start_events) == 1, start_events
        prompt = start_events[0]["prompt"]
        assert TASK_TITLE in prompt, prompt
        assert "Graph: " + args.graph in prompt, prompt
        assert "Block UUID:" in prompt, prompt
        print("agent bridge routed task to " + session)
    finally:
        if bridge.poll() is None:
            bridge.terminate()
            try:
                bridge.wait(timeout=5)
            except subprocess.TimeoutExpired:
                bridge.kill()
                bridge.wait(timeout=5)


if __name__ == "__main__":
    main()
