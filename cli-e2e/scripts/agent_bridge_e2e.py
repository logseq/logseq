#!/usr/bin/env python3

import argparse
import json
import os
import pathlib
import subprocess
import time


TASK_TITLE = "测试 agent bridge 功能，把当前task status设置为done"
EXPECTED_SESSION = "thread-e2e-agent-bridge"


def write_fake_codex(fake_bin):
    fake_codex = fake_bin / "codex"
    fake_codex.parent.mkdir(parents=True, exist_ok=True)
    fake_codex.write_text(
        """#!/usr/bin/env python3
import json
import os
import pathlib
import sys

args = sys.argv[1:]
if args == ["--version"]:
    print("codex-cli 0.0.0-e2e")
    sys.exit(0)

if args[:2] == ["exec", "--json"]:
    prompt = args[2] if len(args) > 2 else ""
    log_path = pathlib.Path(os.environ["CODEX_FAKE_LOG"])
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("a", encoding="utf8") as f:
        f.write(json.dumps({"args": args, "prompt": prompt}, ensure_ascii=False) + "\\n")
    print(json.dumps({"type": "thread.started", "thread_id": "thread-e2e-agent-bridge"}), flush=True)
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


def assign_task(cli, repo_root, root_dir, config, graph):
    task_id = run_json(
        cli,
        repo_root,
        root_dir,
        config,
        graph,
        '[:find ?e . :where [?e :block/title "{}"]]'.format(TASK_TITLE),
    )
    if task_id is None:
        raise SystemExit("task block was not found")
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

        lines = [
            json.loads(line)
            for line in codex_log.read_text(encoding="utf8").splitlines()
            if line.strip()
        ]
        assert len(lines) == 1, lines
        prompt = lines[0]["prompt"]
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
