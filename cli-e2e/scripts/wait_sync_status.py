#!/usr/bin/env python3
"""Poll `logseq sync status` until queues settle and tx converges."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Dict


def fail(message: str, **context: object) -> None:
    payload = {"status": "error", "message": message}
    if context:
        payload["context"] = context
    print(json.dumps(payload), file=sys.stderr)
    raise SystemExit(1)


def parse_int(value: Any) -> int:
    if value is None:
        return 0
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, (int, float)):
        return int(value)
    try:
        return int(str(value))
    except (TypeError, ValueError):
        return 0


def run_status(args: argparse.Namespace) -> Dict[str, Any]:
    command = [
        "node",
        str(Path(args.cli).expanduser().resolve()),
        "--data-dir",
        str(Path(args.data_dir).expanduser().resolve()),
        "--config",
        str(Path(args.config).expanduser().resolve()),
        "--output",
        "json",
        "sync",
        "status",
        "--graph",
        args.graph,
    ]

    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        fail(
            "sync status command failed",
            command=command,
            exit=result.returncode,
            stdout=result.stdout,
            stderr=result.stderr,
        )

    try:
        payload = json.loads(result.stdout)
    except json.JSONDecodeError as error:
        fail(
            "sync status command did not return valid JSON",
            command=command,
            stdout=result.stdout,
            stderr=result.stderr,
            detail=str(error),
        )

    if payload.get("status") != "ok":
        fail("sync status returned non-ok status", payload=payload)

    return payload


def pending_counts(status_payload: Dict[str, Any]) -> Dict[str, int]:
    data = status_payload.get("data") or {}
    return {
        "pending-local": parse_int(data.get("pending-local")),
        "pending-asset": parse_int(data.get("pending-asset")),
        "pending-server": parse_int(data.get("pending-server")),
    }


def all_settled(counts: Dict[str, int]) -> bool:
    required_keys = ("pending-local", "pending-asset", "pending-server")
    return all(counts.get(key, 0) == 0 for key in required_keys)


def parse_required_int(value: Any) -> int | None:
    if value is None:
        return None
    if isinstance(value, str) and value.strip() == "":
        return None
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, (int, float)):
        return int(value)
    try:
        return int(str(value))
    except (TypeError, ValueError):
        return None


def tx_sync_status(status_payload: Dict[str, Any]) -> Dict[str, Any]:
    data = status_payload.get("data") or {}
    local_tx = parse_required_int(data.get("local-tx"))
    remote_tx = parse_required_int(data.get("remote-tx"))
    synced = (
        local_tx is not None
        and remote_tx is not None
        and local_tx == remote_tx
    )
    return {
        "local-tx": local_tx,
        "remote-tx": remote_tx,
        "synced": synced,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Wait for sync status to settle"
    )
    parser.add_argument(
        "--cli",
        required=True,
        help="Path to static/logseq-cli.js",
    )
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--config", required=True)
    parser.add_argument("--graph", required=True)
    parser.add_argument("--timeout-s", type=float, default=120.0)
    parser.add_argument("--interval-s", type=float, default=1.0)
    args = parser.parse_args()

    started = time.time()
    deadline = started + args.timeout_s
    last_payload: Dict[str, Any] | None = None

    while time.time() < deadline:
        payload = run_status(args)
        last_payload = payload
        data = payload.get("data") or {}
        last_error = data.get("last-error")

        if last_error is not None:
            fail("sync status reports last-error", payload=payload)

        counts = pending_counts(payload)
        tx_status = tx_sync_status(payload)
        if all_settled(counts) and tx_status["synced"]:
            print(
                json.dumps(
                    {
                        "status": "ok",
                        "elapsed_s": round(time.time() - started, 3),
                        "counts": counts,
                        "tx": {
                            "local-tx": tx_status["local-tx"],
                            "remote-tx": tx_status["remote-tx"],
                        },
                        "payload": payload,
                    }
                )
            )
            return

        time.sleep(max(args.interval_s, 0.0))

    fail(
        "sync status polling timed out before queues settled and tx synced",
        timeout_s=args.timeout_s,
        last_payload=last_payload,
        last_tx=tx_sync_status(last_payload or {}),
    )


if __name__ == "__main__":
    main()
