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


def status_command(args: argparse.Namespace) -> list[str]:
    existing = getattr(args, "status_command", None)
    if existing is not None:
        return existing

    command = [
        "node",
        str(Path(args.cli).expanduser().resolve()),
        "--root-dir",
        str(Path(args.root_dir).expanduser().resolve()),
        "--config",
        str(Path(args.config).expanduser().resolve()),
        "--output",
        "json",
        "sync",
        "status",
        "--graph",
        args.graph,
    ]
    args.status_command = command
    return command



def run_status(args: argparse.Namespace) -> Dict[str, Any]:
    command = status_command(args)

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


def tx_deltas(
    tx_status: Dict[str, Any],
    baseline_tx: Dict[str, Any],
) -> Dict[str, int | None]:
    local_tx = tx_status.get("local-tx")
    remote_tx = tx_status.get("remote-tx")
    baseline_local_tx = baseline_tx.get("local-tx")
    baseline_remote_tx = baseline_tx.get("remote-tx")

    local_tx_delta = (
        None
        if local_tx is None or baseline_local_tx is None
        else local_tx - baseline_local_tx
    )
    remote_tx_delta = (
        None
        if remote_tx is None or baseline_remote_tx is None
        else remote_tx - baseline_remote_tx
    )

    return {
        "local-tx-delta": local_tx_delta,
        "remote-tx-delta": remote_tx_delta,
    }


def min_tx_delta_reached(
    tx_status: Dict[str, Any],
    baseline_tx: Dict[str, Any],
    min_tx_delta: int,
) -> bool:
    if min_tx_delta <= 0:
        return True

    deltas = tx_deltas(tx_status, baseline_tx)
    local_tx_delta = deltas.get("local-tx-delta")
    remote_tx_delta = deltas.get("remote-tx-delta")
    if local_tx_delta is None or remote_tx_delta is None:
        return False

    return local_tx_delta >= min_tx_delta and remote_tx_delta >= min_tx_delta


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Wait for sync status to settle"
    )
    parser.add_argument(
        "--cli",
        required=True,
        help="Path to static/logseq-cli.js",
    )
    parser.add_argument("--root-dir", required=True)
    parser.add_argument("--config", required=True)
    parser.add_argument("--graph", required=True)
    parser.add_argument("--timeout-s", type=float, default=120.0)
    parser.add_argument("--interval-s", type=float, default=1.0)
    parser.add_argument(
        "--min-tx-delta",
        type=int,
        default=0,
        help=(
            "Require synced tx delta to be >= this value: "
            "(new-tx - old-tx) >= min-tx-delta "
            "(default: 0)"
        ),
    )
    parser.add_argument(
        "--baseline-tx",
        type=int,
        default=None,
        help=(
            "Optional explicit baseline tx used as old-tx for both local "
            "and remote; if omitted, first observed tx values "
            "are used"
        ),
    )
    args = parser.parse_args()

    if args.min_tx_delta < 0:
        invalid_min_tx_delta = args.min_tx_delta
        fail(
            "min-tx-delta must be non-negative",
            min_tx_delta=invalid_min_tx_delta,
        )

    started = time.time()
    deadline = started + args.timeout_s
    last_payload: Dict[str, Any] | None = None
    baseline_tx: Dict[str, Any] | None = (
        {
            "local-tx": args.baseline_tx,
            "remote-tx": args.baseline_tx,
        }
        if args.baseline_tx is not None
        else None
    )

    while time.time() < deadline:
        payload = run_status(args)
        last_payload = payload
        data = payload.get("data") or {}
        last_error = data.get("last-error")

        if last_error is not None:
            fail("sync status reports last-error", payload=payload)

        counts = pending_counts(payload)
        tx_status = tx_sync_status(payload)
        if baseline_tx is None:
            baseline_tx = {
                "local-tx": tx_status.get("local-tx"),
                "remote-tx": tx_status.get("remote-tx"),
            }

        deltas = tx_deltas(tx_status, baseline_tx)
        if (
            all_settled(counts)
            and tx_status["synced"]
            and min_tx_delta_reached(
                tx_status,
                baseline_tx,
                args.min_tx_delta,
            )
        ):
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
                        "tx-delta": deltas,
                        "baseline-tx": baseline_tx,
                        "min_tx_delta": args.min_tx_delta,
                        "payload": payload,
                    }
                )
            )
            return

        time.sleep(max(args.interval_s, 0.0))

    last_tx_status = tx_sync_status(last_payload or {})
    last_baseline_tx = baseline_tx or {"local-tx": None, "remote-tx": None}
    fail(
        (
            "sync status polling timed out before queues settled, tx synced, "
            "and min tx delta reached"
        ),
        timeout_s=args.timeout_s,
        min_tx_delta=args.min_tx_delta,
        baseline_tx=last_baseline_tx,
        last_payload=last_payload,
        last_counts=pending_counts(last_payload or {}),
        last_tx=last_tx_status,
        last_tx_delta=tx_deltas(
            last_tx_status,
            last_baseline_tx,
        ),
    )


if __name__ == "__main__":
    main()
