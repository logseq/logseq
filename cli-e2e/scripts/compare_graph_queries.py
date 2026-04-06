#!/usr/bin/env python3
"""Compare normalized query payloads between two cli graph contexts."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict

IGNORED_KEYS = {
    "db/id",
    "db/created-at",
    "db/updated-at",
    "block/uuid",
    "block/updated-at",
    "block/created-at",
}


def fail(message: str, **context: object) -> None:
    payload = {"status": "error", "message": message}
    if context:
        payload["context"] = context
    print(json.dumps(payload), file=sys.stderr)
    raise SystemExit(1)


def normalize(value: Any) -> Any:
    if isinstance(value, dict):
        normalized = {}
        for key in sorted(value.keys(), key=str):
            key_str = str(key)
            if key_str in IGNORED_KEYS:
                continue
            normalized[key_str] = normalize(value[key])
        return normalized
    if isinstance(value, list):
        normalized_list = [normalize(item) for item in value]
        try:
            return sorted(normalized_list, key=lambda item: json.dumps(item, sort_keys=True))
        except TypeError:
            return normalized_list
    return value


def run_query(cli_path: Path, config_path: Path, data_dir: Path, graph: str, query: str) -> Dict[str, Any]:
    command = [
        "node",
        str(cli_path),
        "--data-dir",
        str(data_dir),
        "--config",
        str(config_path),
        "--output",
        "json",
        "query",
        "--graph",
        graph,
        "--query",
        query,
    ]

    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        fail(
            "query command failed",
            command=command,
            exit=result.returncode,
            stdout=result.stdout,
            stderr=result.stderr,
        )

    try:
        payload = json.loads(result.stdout)
    except json.JSONDecodeError as error:
        fail(
            "query command did not return valid JSON",
            command=command,
            stdout=result.stdout,
            stderr=result.stderr,
            detail=str(error),
        )

    if payload.get("status") != "ok":
        fail("query command returned non-ok status", command=command, payload=payload)

    data = payload.get("data") or {}
    return {
        "payload": payload,
        "result": data.get("result"),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Compare normalized query payloads between two cli contexts")
    parser.add_argument("--cli", required=True, help="Path to static/logseq-cli.js")
    parser.add_argument("--graph", required=True)
    parser.add_argument("--query", required=True)
    parser.add_argument("--config-a", required=True)
    parser.add_argument("--data-dir-a", required=True)
    parser.add_argument("--config-b", required=True)
    parser.add_argument("--data-dir-b", required=True)
    parser.add_argument("--require-result", action="store_true")
    args = parser.parse_args()

    cli_path = Path(args.cli).expanduser().resolve()
    if not cli_path.exists():
        fail("cli entry file does not exist", cli=str(cli_path))

    left = run_query(
        cli_path,
        Path(args.config_a).expanduser().resolve(),
        Path(args.data_dir_a).expanduser().resolve(),
        args.graph,
        args.query,
    )
    right = run_query(
        cli_path,
        Path(args.config_b).expanduser().resolve(),
        Path(args.data_dir_b).expanduser().resolve(),
        args.graph,
        args.query,
    )

    left_result = left["result"]
    right_result = right["result"]

    if args.require_result and (left_result is None or right_result is None):
        fail("query result is empty", left_result=left_result, right_result=right_result)

    left_normalized = normalize(left_result)
    right_normalized = normalize(right_result)

    if left_normalized != right_normalized:
        fail(
            "normalized query results differ",
            left_result=left_normalized,
            right_result=right_normalized,
            left_payload=left["payload"],
            right_payload=right["payload"],
        )

    print(
        json.dumps(
            {
                "status": "ok",
                "result": left_normalized,
            }
        )
    )


if __name__ == "__main__":
    main()
