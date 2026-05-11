#!/usr/bin/env python3
"""Exercise `logseq sync asset download` in an isolated sync e2e graph."""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Dict, Iterable, List


def fail(message: str, **context: object) -> None:
    payload = {"status": "error", "message": message}
    if context:
        payload["context"] = context
    print(json.dumps(payload), file=sys.stderr)
    raise SystemExit(1)


def cli_base(cli: Path, root_dir: Path, config: Path) -> List[str]:
    return [
        "node",
        str(cli),
        "--root-dir",
        str(root_dir),
        "--config",
        str(config),
        "--output",
        "json",
    ]


def run_cli_json(command: List[str], *, allow_error: bool = False) -> Dict[str, Any]:
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0 and not allow_error:
        fail(
            "cli command failed",
            command=command,
            exit=result.returncode,
            stdout=result.stdout,
            stderr=result.stderr,
        )

    try:
        payload = json.loads(result.stdout)
    except json.JSONDecodeError as error:
        fail(
            "cli command did not return valid JSON",
            command=command,
            exit=result.returncode,
            stdout=result.stdout,
            stderr=result.stderr,
            detail=str(error),
        )

    if payload.get("status") != "ok" and not allow_error:
        fail("cli command returned non-ok status", command=command, payload=payload)

    return payload


def contains_key(value: Any, key: str) -> bool:
    if isinstance(value, dict):
        return key in value or any(contains_key(child, key) for child in value.values())
    if isinstance(value, list):
        return any(contains_key(child, key) for child in value)
    return False


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(8192), b""):
            digest.update(chunk)
    return digest.hexdigest()


def wait_for_checksum(path: Path, checksum: str, timeout_s: float = 60.0) -> None:
    deadline = time.time() + timeout_s
    last_state = "missing"
    while time.time() < deadline:
        if path.exists():
            current = sha256_file(path)
            if current == checksum:
                return
            last_state = f"checksum:{current}"
        time.sleep(1.0)
    fail("asset file did not reach expected checksum", path=str(path), expected=checksum, last_state=last_state)


def get_asset(cli: Path, root_dir: Path, config: Path, graph: str, title: str) -> Dict[str, Any]:
    query = (
        '[:find (pull ?e [:db/id :block/uuid '
        ':logseq.property.asset/type :logseq.property.asset/checksum '
        ':logseq.property.asset/remote-metadata]) . '
        f':where [?e :block/title "{title}"]]'
    )
    payload = run_cli_json(
        cli_base(cli, root_dir, config)
        + ["query", "--graph", graph, "--query", query]
    )
    asset = (payload.get("data") or {}).get("result")
    if not isinstance(asset, dict):
        fail("asset query did not return an entity", payload=payload)
    required = [
        "db/id",
        "block/uuid",
        "logseq.property.asset/type",
        "logseq.property.asset/checksum",
        "logseq.property.asset/remote-metadata",
    ]
    missing = [key for key in required if not asset.get(key)]
    if missing:
        fail("asset entity is missing required fields", asset=asset, missing=missing)
    return asset


def sync_asset_download_by_id(cli: Path, root_dir: Path, config: Path, graph: str, asset_id: Any) -> Dict[str, Any]:
    return run_cli_json(
        cli_base(cli, root_dir, config)
        + ["sync", "asset", "download", "--graph", graph, "--id", str(asset_id)]
    )


def sync_asset_download_by_uuid(cli: Path, root_dir: Path, config: Path, graph: str, asset_uuid: str) -> Dict[str, Any]:
    return run_cli_json(
        cli_base(cli, root_dir, config)
        + ["sync", "asset", "download", "--graph", graph, "--uuid", asset_uuid]
    )


def assert_data(payload: Dict[str, Any], expected: Dict[str, Any]) -> None:
    data = payload.get("data") or {}
    for key, value in expected.items():
        if data.get(key) != value:
            fail("unexpected sync asset download data", expected=expected, actual=data, payload=payload)
    if contains_key(payload, "local-path"):
        fail("sync asset download output leaked local-path", payload=payload)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run sync asset download e2e assertions")
    parser.add_argument("--cli", required=True)
    parser.add_argument("--graph", required=True)
    parser.add_argument("--asset-title", required=True)
    parser.add_argument("--config-b", required=True)
    parser.add_argument("--root-dir-b", required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    cli = Path(args.cli).expanduser().resolve()
    root_b = Path(args.root_dir_b).expanduser().resolve()
    config_b = Path(args.config_b).expanduser().resolve()

    asset = get_asset(cli, root_b, config_b, args.graph, args.asset_title)
    asset_id = asset["db/id"]
    asset_uuid = asset["block/uuid"]
    asset_type = asset["logseq.property.asset/type"]
    checksum = asset["logseq.property.asset/checksum"]
    asset_path = root_b / "graphs" / args.graph / "assets" / f"{asset_uuid}.{asset_type}"

    if asset_path.exists():
        asset_path.unlink()

    requested = sync_asset_download_by_uuid(cli, root_b, config_b, args.graph, asset_uuid)
    assert_data(
        requested,
        {
            "asset-id": asset_id,
            "asset-uuid": asset_uuid,
            "asset-type": asset_type,
            "download-requested?": True,
            "checksum-status": "missing",
        },
    )
    wait_for_checksum(asset_path, checksum)

    skipped = sync_asset_download_by_id(cli, root_b, config_b, args.graph, asset_id)
    assert_data(
        skipped,
        {
            "asset-id": asset_id,
            "asset-uuid": asset_uuid,
            "asset-type": asset_type,
            "download-requested?": False,
            "checksum-status": "match",
            "skipped-reason": "already-downloaded",
        },
    )

    asset_path.write_text("corrupted local asset", encoding="utf-8")
    mismatched = sync_asset_download_by_id(cli, root_b, config_b, args.graph, asset_id)
    assert_data(
        mismatched,
        {
            "asset-id": asset_id,
            "asset-uuid": asset_uuid,
            "asset-type": asset_type,
            "download-requested?": True,
            "checksum-status": "mismatch",
        },
    )
    hint = (mismatched.get("data") or {}).get("hint") or ""
    if "checksum" not in hint:
        fail("checksum mismatch hint is missing", payload=mismatched)
    wait_for_checksum(asset_path, checksum)

    run_cli_json(cli_base(cli, root_b, config_b) + ["sync", "stop", "--graph", args.graph])
    inactive = run_cli_json(
        cli_base(cli, root_b, config_b)
        + ["sync", "asset", "download", "--graph", args.graph, "--id", str(asset_id)],
        allow_error=True,
    )
    if inactive.get("status") != "error":
        fail("inactive sync command unexpectedly succeeded", payload=inactive)
    error = inactive.get("error") or {}
    if error.get("code") != "sync-not-started":
        fail("inactive sync command returned wrong error", payload=inactive)
    if "sync start" not in (error.get("hint") or ""):
        fail("inactive sync command did not include start hint", payload=inactive)

    print(
        json.dumps(
            {
                "status": "ok",
                "data": {
                    "asset-id": asset_id,
                    "asset-uuid": asset_uuid,
                    "asset-type": asset_type,
                    "download-requested?": True,
                    "checksum-status": "mismatch",
                    "pending-local": 0,
                    "pending-asset": 0,
                    "pending-server": 0,
                    "last-error": None,
                },
            }
        )
    )


if __name__ == "__main__":
    main()
