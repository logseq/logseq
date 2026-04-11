#!/usr/bin/env python3
"""Manage local db-sync server process for cli-e2e sync suite."""

from __future__ import annotations

import argparse
import base64
import json
import os
import signal
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Dict, Optional

DEFAULT_COGNITO_ISSUER = "https://cognito-idp.us-east-2.amazonaws.com/us-east-2_kAqZcxIeM"
DEFAULT_COGNITO_CLIENT_ID = "1qi1uijg8b6ra70nejvbptis0q"


def fail(message: str, **context: object) -> None:
    payload = {"status": "error", "message": message}
    if context:
        payload["context"] = context
    print(json.dumps(payload), file=sys.stderr)
    raise SystemExit(1)


def load_pid(pid_file: Path) -> Optional[int]:
    if not pid_file.exists():
        return None
    raw = pid_file.read_text(encoding="utf-8").strip()
    if not raw:
        return None
    try:
        return int(raw)
    except ValueError:
        return None


def process_running(pid: int) -> bool:
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    else:
        return True


def parse_json_file(path: Path) -> Dict[str, Any]:
    if not path.exists():
        fail("sync auth file is missing", auth_path=str(path), hint="Run `logseq login` first.")
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        fail("sync auth file is invalid JSON", auth_path=str(path), detail=str(error))
    if not isinstance(payload, dict):
        fail("sync auth file must be a JSON object", auth_path=str(path))
    return payload


def decode_jwt_claims(token: str) -> Optional[Dict[str, Any]]:
    if not isinstance(token, str):
        return None
    parts = token.split(".")
    if len(parts) != 3:
        return None
    payload = parts[1]
    padded = payload + "=" * ((4 - (len(payload) % 4)) % 4)
    try:
        decoded = base64.urlsafe_b64decode(padded.encode("utf-8")).decode("utf-8")
        claims = json.loads(decoded)
    except (ValueError, UnicodeDecodeError, json.JSONDecodeError):
        return None
    return claims if isinstance(claims, dict) else None


def auth_cognito_from_auth_file(auth_path: Path) -> Dict[str, str]:
    payload = parse_json_file(auth_path)
    token = payload.get("id-token") or payload.get("access-token")
    claims = decode_jwt_claims(token) if isinstance(token, str) else None

    issuer = claims.get("iss") if isinstance(claims, dict) else None
    client_id = None
    if isinstance(claims, dict):
        client_id = claims.get("aud") or claims.get("client_id")

    return {
        "issuer": issuer if isinstance(issuer, str) and issuer else "",
        "client_id": client_id if isinstance(client_id, str) and client_id else "",
    }


def wait_health(base_url: str, timeout_s: float, interval_s: float) -> bool:
    deadline = time.time() + timeout_s
    url = base_url.rstrip("/") + "/health"
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=2) as response:
                if response.status == 200:
                    return True
        except (urllib.error.URLError, TimeoutError, socket.timeout):
            pass
        time.sleep(interval_s)
    return False


def start_server(args: argparse.Namespace) -> None:
    repo_root = Path(args.repo_root).expanduser().resolve()
    entry = repo_root / "deps" / "db-sync" / "worker" / "dist" / "node-adapter.js"
    if not entry.exists():
        fail("db-sync node adapter build artifact is missing", entry=str(entry), hint="Run: yarn --cwd deps/db-sync build:node-adapter")

    pid_file = Path(args.pid_file).expanduser().resolve()
    log_file = Path(args.log_file).expanduser().resolve()
    data_dir = Path(args.data_dir).expanduser().resolve()

    pid_file.parent.mkdir(parents=True, exist_ok=True)
    log_file.parent.mkdir(parents=True, exist_ok=True)
    data_dir.mkdir(parents=True, exist_ok=True)

    existing_pid = load_pid(pid_file)
    if existing_pid and process_running(existing_pid):
        fail("db-sync server already running", pid=existing_pid, pid_file=str(pid_file))

    auth_path = Path(args.auth_path).expanduser().resolve() if args.auth_path else None
    auth_derived = auth_cognito_from_auth_file(auth_path) if auth_path else {"issuer": "", "client_id": ""}

    issuer = args.cognito_issuer or auth_derived.get("issuer") or DEFAULT_COGNITO_ISSUER
    client_id = args.cognito_client_id or auth_derived.get("client_id") or DEFAULT_COGNITO_CLIENT_ID
    jwks_url = args.cognito_jwks_url or f"{issuer}/.well-known/jwks.json"

    env = os.environ.copy()
    env.update(
        {
            "DB_SYNC_PORT": str(args.port),
            "DB_SYNC_DATA_DIR": str(data_dir),
            "COGNITO_ISSUER": issuer,
            "COGNITO_CLIENT_ID": client_id,
            "COGNITO_JWKS_URL": jwks_url,
        }
    )

    with log_file.open("a", encoding="utf-8") as stream:
        stream.write(f"\n=== cli-e2e db-sync start {time.strftime('%Y-%m-%d %H:%M:%S')} ===\n")
        stream.flush()
        process = subprocess.Popen(
            ["node", str(entry)],
            stdout=stream,
            stderr=stream,
            cwd=str(repo_root),
            env=env,
            start_new_session=True,
        )

    base_url = f"http://{args.host}:{args.port}"
    if not wait_health(base_url, args.startup_timeout_s, args.poll_interval_s):
        try:
            os.kill(process.pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
        fail(
            "db-sync server failed health check before timeout",
            base_url=base_url,
            pid=process.pid,
            log_file=str(log_file),
        )

    pid_file.write_text(f"{process.pid}\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "status": "ok",
                "pid": process.pid,
                "pid_file": str(pid_file),
                "log_file": str(log_file),
                "base_url": base_url,
                "data_dir": str(data_dir),
                "cognito_issuer": issuer,
                "cognito_client_id": client_id,
                "auth_path": str(auth_path) if auth_path else None,
            }
        )
    )


def stop_server(args: argparse.Namespace) -> None:
    pid_file = Path(args.pid_file).expanduser().resolve()
    pid = load_pid(pid_file)

    if pid is None:
        print(json.dumps({"status": "ok", "stopped": False, "reason": "pid-file-missing-or-empty", "pid_file": str(pid_file)}))
        return

    if not process_running(pid):
        try:
            pid_file.unlink(missing_ok=True)
        except OSError:
            pass
        print(json.dumps({"status": "ok", "stopped": False, "reason": "process-not-running", "pid": pid, "pid_file": str(pid_file)}))
        return

    os.kill(pid, signal.SIGTERM)
    deadline = time.time() + args.shutdown_timeout_s
    while time.time() < deadline:
        if not process_running(pid):
            pid_file.unlink(missing_ok=True)
            print(json.dumps({"status": "ok", "stopped": True, "signal": "SIGTERM", "pid": pid, "pid_file": str(pid_file)}))
            return
        time.sleep(args.poll_interval_s)

    os.kill(pid, signal.SIGKILL)
    pid_file.unlink(missing_ok=True)
    print(json.dumps({"status": "ok", "stopped": True, "signal": "SIGKILL", "pid": pid, "pid_file": str(pid_file)}))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Manage db-sync local server for cli-e2e sync tests")
    subparsers = parser.add_subparsers(dest="command", required=True)

    start = subparsers.add_parser("start", help="Start server and wait for /health")
    start.add_argument("--repo-root", required=True)
    start.add_argument("--pid-file", required=True)
    start.add_argument("--log-file", required=True)
    start.add_argument("--data-dir", required=True)
    start.add_argument("--host", default="127.0.0.1")
    start.add_argument("--port", type=int, default=8080)
    start.add_argument("--startup-timeout-s", type=float, default=25.0)
    start.add_argument("--poll-interval-s", type=float, default=0.5)
    start.add_argument("--auth-path", default="~/logseq/auth.json")
    start.add_argument("--cognito-issuer")
    start.add_argument("--cognito-client-id")
    start.add_argument("--cognito-jwks-url")

    stop = subparsers.add_parser("stop", help="Stop server if running")
    stop.add_argument("--pid-file", required=True)
    stop.add_argument("--shutdown-timeout-s", type=float, default=10.0)
    stop.add_argument("--poll-interval-s", type=float, default=0.25)

    return parser


def main() -> None:
    args = build_parser().parse_args()
    if args.command == "start":
        start_server(args)
    elif args.command == "stop":
        stop_server(args)
    else:
        fail("unknown command", command=args.command)


if __name__ == "__main__":
    main()
