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

if args[:3] == ["exec", "resume", "--json"]:
    session_id = args[3] if len(args) > 3 else ""
    prompt = args[4] if len(args) > 4 else ""
    comment_uuid_match = re.search(r"^Comment UUID: (.+)$", prompt, re.MULTILINE)
    comment_uuid = comment_uuid_match.group(1) if comment_uuid_match else None
    log_path = pathlib.Path(os.environ["CODEX_FAKE_LOG"])
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("a", encoding="utf8") as f:
        f.write(json.dumps(
            {"event": "resume", "time": time.time(), "args": args, "prompt": prompt, "comment_uuid": comment_uuid, "session": session_id},
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


def run_cli_with_env(cli, repo_root, root_dir, config, extra_args, env):
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
        env=env,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return result


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


def find_task_uuid(cli, repo_root, root_dir, config, graph, title):
    task_uuid = run_json(
        cli,
        repo_root,
        root_dir,
        config,
        graph,
        '[:find ?uuid . :where [?e :block/title "{}"] [?e :block/uuid ?uuid]]'.format(title),
    )
    if task_uuid is None:
        raise SystemExit("task block uuid was not found: {}".format(title))
    return task_uuid


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


def wait_for_codex_event(codex_log, event_name, bridge, bridge_log, bridge_err):
    deadline = time.time() + 30
    events = []
    while time.time() < deadline:
        events = read_codex_events(codex_log)
        matches = [event for event in events if event.get("event") == event_name]
        if matches:
            return matches
        if bridge.poll() is not None:
            raise SystemExit(
                "agent bridge exited early with {}\nstdout:\n{}\nstderr:\n{}".format(
                    bridge.returncode, read_text(bridge_log), read_text(bridge_err)
                )
            )
        time.sleep(0.5)
    raise SystemExit("codex event {!r} was not observed; events={!r}".format(event_name, events))


def write_comment_blocks_file(path, task_uuid, hostname):
    path.write_text(
        """[{{:block/title "Comments"
   :block/tags [:logseq.class/Comments]
   :logseq.property.comments/blocks [[:block/uuid #uuid "{task_uuid}"]]
   :block/children [{{:block/title "[[{hostname}]] please continue from the comment"
                     :block/tags [:logseq.class/Comment]}}]}}]""".format(
            task_uuid=task_uuid,
            hostname=hostname,
        ),
        encoding="utf8",
    )


def run_comment_mention_check(cli, repo_root, root_dir, config, graph, tmp_dir):
    create_task(cli, repo_root, root_dir, config, graph, TASK_TITLE)

    fake_bin = tmp_dir / "fake-bin"
    bridge_log = tmp_dir / "agent-bridge.log"
    bridge_err = tmp_dir / "agent-bridge.err"
    codex_log = tmp_dir / "codex-invocations.jsonl"

    env = os.environ.copy()
    env["PATH"] = str(fake_bin) + os.pathsep + env.get("PATH", "")
    env["CODEX_FAKE_LOG"] = str(codex_log)

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
        assign_task(cli, repo_root, root_dir, config, graph)
        session = wait_for_task_sessions(
            cli, repo_root, root_dir, config, graph, [TASK_TITLE], bridge, bridge_log, bridge_err
        )[TASK_TITLE]

        task_id = find_task_id(cli, repo_root, root_dir, config, graph, TASK_TITLE)
        task_uuid = find_task_uuid(cli, repo_root, root_dir, config, graph, TASK_TITLE)
        blocks_file = tmp_dir / "comment-blocks.edn"
        write_comment_blocks_file(blocks_file, task_uuid, os.uname().nodename)
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
                "--target-id",
                str(task_id),
                "--pos",
                "last-child",
                "--blocks-file",
                str(blocks_file),
            ],
        )

        resume_events = wait_for_codex_event(codex_log, "resume", bridge, bridge_log, bridge_err)
        if resume_events[0].get("session") != session:
            raise SystemExit("comment resumed the wrong session: {!r}".format(resume_events[0]))
        prompt = resume_events[0].get("prompt", "")
        assert "You are handling a Logseq AgentBridge comment request." in prompt, prompt
        assert "Comment target context:" in prompt, prompt
        assert "Requesting comment:" in prompt, prompt
        print("agent bridge resumed comment request in " + session)
    finally:
        if bridge.poll() is None:
            bridge.terminate()
            try:
                bridge.wait(timeout=5)
            except subprocess.TimeoutExpired:
                bridge.kill()
                bridge.wait(timeout=5)


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


def edn_string(value):
    return json.dumps(value, ensure_ascii=False)


def write_task_template_file(path, marker):
    template = "\n".join(
        [
            marker,
            "Graph: {{graph}}",
            "Block UUID: {{block-uuid}}",
            "AgentBridge name: {{agent-name}}",
            "{{task-block-tree}}",
        ]
    )
    path.write_text(
        """[{:block/title "Task prompt template"
   :block/children [{:block/title "Description: Custom task template for this graph."}
                    {:block/title "Template variables: {{graph}}, {{block-uuid}}, {{agent-name}}, and {{task-block-tree}}."}
                    {:block/title %s}]}]"""
        % edn_string("```text\n" + template + "\n```"),
        encoding="utf8",
    )


def write_invalid_task_template_file(path):
    path.write_text(
        """[{:block/title "Task prompt template"
   :block/children [{:block/title "Description: Invalid task template for lint coverage."}
                    {:block/title %s}]}]"""
        % edn_string("```text\nBroken {{graph}} {{unknown-var}}\n```"),
        encoding="utf8",
    )


def install_task_template(cli, repo_root, root_dir, config, graph, tmp_dir, marker):
    run_cli(
        cli,
        repo_root,
        root_dir,
        config,
        graph,
        ["upsert", "page", "--graph", graph, "--page", "AgentBridge"],
    )
    blocks_file = tmp_dir / ("task-template-" + graph + ".edn")
    write_task_template_file(blocks_file, marker)
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
            "--target-page",
            "AgentBridge",
            "--blocks-file",
            str(blocks_file),
        ],
    )


def install_invalid_task_template(cli, repo_root, root_dir, config, graph, tmp_dir):
    run_cli(
        cli,
        repo_root,
        root_dir,
        config,
        graph,
        ["upsert", "page", "--graph", graph, "--page", "AgentBridge"],
    )
    blocks_file = tmp_dir / ("invalid-task-template-" + graph + ".edn")
    write_invalid_task_template_file(blocks_file)
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
            "--target-page",
            "AgentBridge",
            "--blocks-file",
            str(blocks_file),
        ],
    )


def dry_run_prompt(cli, repo_root, root_dir, config, graph, env):
    result = run_cli_with_env(
        cli,
        repo_root,
        root_dir,
        config,
        ["agent", "bridge", "--graph", graph, "--dry-run"],
        env,
    )
    if result.returncode != 0:
        raise SystemExit(
            "agent bridge dry-run failed for {}\nstdout:\n{}\nstderr:\n{}".format(
                graph, result.stdout, result.stderr
            )
        )
    payload = json.loads(result.stdout)
    commands = payload.get("data", {}).get("commands", [])
    if len(commands) != 1:
        raise SystemExit("expected one dry-run command for {}, got {!r}".format(graph, commands))
    command = commands[0].get("command", [])
    if len(command) < 4:
        raise SystemExit("dry-run command did not contain a prompt: {!r}".format(command))
    return command[3]


def assert_contains(text, expected):
    if expected not in text:
        raise SystemExit("expected {!r} in:\n{}".format(expected, text))


def assert_not_contains(text, unexpected):
    if unexpected in text:
        raise SystemExit("did not expect {!r} in:\n{}".format(unexpected, text))


def run_prompt_template_graph_check(cli, repo_root, root_dir, config, graph, tmp_dir):
    graph_a = graph
    graph_b = graph + "-other"
    graph_bad = graph + "-invalid"
    marker_a = "CUSTOM GRAPH A TEMPLATE"
    marker_b = "CUSTOM GRAPH B TEMPLATE"

    fake_bin = tmp_dir / "fake-bin"
    env = os.environ.copy()
    env["PATH"] = str(fake_bin) + os.pathsep + env.get("PATH", "")
    env["CODEX_FAKE_LOG"] = str(tmp_dir / "codex-dry-run.jsonl")

    for graph_name in [graph_b, graph_bad]:
        run_cli(
            cli,
            repo_root,
            root_dir,
            config,
            graph_name,
            ["graph", "create", "--graph", graph_name],
        )

    for graph_name in [graph_a, graph_b, graph_bad]:
        create_task(cli, repo_root, root_dir, config, graph_name, TASK_TITLE)
        assign_task(cli, repo_root, root_dir, config, graph_name)

    install_task_template(cli, repo_root, root_dir, config, graph_a, tmp_dir, marker_a)
    prompt_a = dry_run_prompt(cli, repo_root, root_dir, config, graph_a, env)
    assert_contains(prompt_a, marker_a)
    assert_contains(prompt_a, "Graph: " + graph_a)
    assert_not_contains(prompt_a, marker_b)
    assert_not_contains(prompt_a, "You are handling a Logseq AgentBridge task.")

    prompt_b_default = dry_run_prompt(cli, repo_root, root_dir, config, graph_b, env)
    assert_contains(prompt_b_default, "You are handling a Logseq AgentBridge task.")
    assert_contains(prompt_b_default, "Graph: " + graph_b)
    assert_not_contains(prompt_b_default, marker_a)

    install_task_template(cli, repo_root, root_dir, config, graph_b, tmp_dir, marker_b)
    prompt_b = dry_run_prompt(cli, repo_root, root_dir, config, graph_b, env)
    assert_contains(prompt_b, marker_b)
    assert_contains(prompt_b, "Graph: " + graph_b)
    assert_not_contains(prompt_b, marker_a)
    assert_not_contains(prompt_b, "You are handling a Logseq AgentBridge task.")

    prompt_a_again = dry_run_prompt(cli, repo_root, root_dir, config, graph_a, env)
    assert_contains(prompt_a_again, marker_a)
    assert_not_contains(prompt_a_again, marker_b)

    install_invalid_task_template(cli, repo_root, root_dir, config, graph_bad, tmp_dir)
    bad_result = run_cli_with_env(
        cli,
        repo_root,
        root_dir,
        config,
        ["agent", "bridge", "--graph", graph_bad, "--dry-run"],
        env,
    )
    if bad_result.returncode == 0:
        raise SystemExit("invalid graph prompt template unexpectedly passed:\n" + bad_result.stdout)
    assert_contains(bad_result.stdout + bad_result.stderr, "agent-prompt-template-invalid")

    print("agent bridge graph prompt templates are isolated and linted")


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
    parser.add_argument("--comment-mention-check", action="store_true")
    parser.add_argument("--prompt-template-graph-check", action="store_true")
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

    if args.comment_mention_check:
        run_comment_mention_check(cli, repo_root, args.root_dir, args.config, args.graph, tmp_dir)
        return

    if args.prompt_template_graph_check:
        run_prompt_template_graph_check(cli, repo_root, args.root_dir, args.config, args.graph, tmp_dir)
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
