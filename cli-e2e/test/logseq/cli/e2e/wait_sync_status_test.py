from __future__ import annotations

import importlib.util
from pathlib import Path
from types import SimpleNamespace


MODULE_PATH = Path(__file__).resolve().parents[4] / "scripts" / "wait_sync_status.py"
spec = importlib.util.spec_from_file_location("wait_sync_status", MODULE_PATH)
wait_sync_status = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(wait_sync_status)


def test_resolved_status_command_is_built_once_and_reused() -> None:
    args = SimpleNamespace(
        cli="~/repo/static/logseq-cli.js",
        root_dir="~/tmp/root",
        config="~/tmp/cli.edn",
        graph="demo",
    )

    command = wait_sync_status.status_command(args)

    assert command[0] == "node"
    assert command[2] == "--root-dir"
    assert command[-2:] == ["--graph", "demo"]
    assert Path(command[1]).is_absolute()
    assert Path(command[3]).is_absolute()
    assert Path(command[5]).is_absolute()
    assert wait_sync_status.status_command(args) is command


def test_run_status_uses_precomputed_command() -> None:
    command = ["node", "/abs/cli.js", "--graph", "demo"]
    args = SimpleNamespace(status_command=command)
    calls = []

    def fake_run(cmd, capture_output, text):
        calls.append(cmd)
        return SimpleNamespace(
            returncode=0,
            stdout='{"status":"ok","data":{"pending-local":0,"pending-asset":0,"pending-server":0}}',
            stderr="",
        )

    original_run = wait_sync_status.subprocess.run
    wait_sync_status.subprocess.run = fake_run
    try:
        payload = wait_sync_status.run_status(args)
    finally:
        wait_sync_status.subprocess.run = original_run

    assert payload["status"] == "ok"
    assert calls == [command]
