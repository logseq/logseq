#!/usr/bin/env python3
"""Run randomized bidirectional block operations on two synced graph peers."""

from __future__ import annotations

import argparse
import json
import random
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List


class CliCommandError(RuntimeError):
    """Raised when a CLI command does not complete successfully."""

    def __init__(self, message: str, *, context: Dict[str, Any]) -> None:
        super().__init__(message)
        self.context = context


@dataclass(frozen=True)
class ClientContext:
    name: str
    config: Path
    data_dir: Path


def fail(message: str, **context: object) -> None:
    payload = {"status": "error", "message": message}
    if context:
        payload["context"] = context
    print(json.dumps(payload), file=sys.stderr)
    raise SystemExit(1)


def run_cli_json(
    *,
    cli_path: Path,
    graph: str,
    client: ClientContext,
    args: List[str],
) -> Dict[str, Any]:
    command = [
        "node",
        str(cli_path),
        "--data-dir",
        str(client.data_dir),
        "--config",
        str(client.config),
        "--output",
        "json",
        *args,
        "--graph",
        graph,
    ]
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        raise CliCommandError(
            "cli command exited with non-zero status",
            context={
                "client": client.name,
                "command": command,
                "exit": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
            },
        )

    try:
        payload = json.loads(result.stdout)
    except json.JSONDecodeError as error:
        raise CliCommandError(
            "cli command did not return valid json",
            context={
                "client": client.name,
                "command": command,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "detail": str(error),
            },
        ) from error

    if payload.get("status") != "ok":
        raise CliCommandError(
            "cli command returned non-ok status",
            context={
                "client": client.name,
                "command": command,
                "payload": payload,
            },
        )
    return payload


def page_block_ids(
    *,
    cli_path: Path,
    graph: str,
    client: ClientContext,
    page_title: str,
) -> List[int]:
    query = (
        "[:find [?e ...] "
        ":where "
        f"[?p :block/title {json.dumps(page_title)}] "
        "[?e :block/page ?p] "
        "[?e :block/uuid]]"
    )
    payload = run_cli_json(
        cli_path=cli_path,
        graph=graph,
        client=client,
        args=["query", "--query", query],
    )
    result = (payload.get("data") or {}).get("result")
    if not isinstance(result, list):
        return []
    output: List[int] = []
    for item in result:
        try:
            output.append(int(item))
        except (TypeError, ValueError):
            continue
    return output


def upsert_page(
    *,
    cli_path: Path,
    graph: str,
    client: ClientContext,
    page_title: str,
) -> None:
    run_cli_json(
        cli_path=cli_path,
        graph=graph,
        client=client,
        args=["upsert", "page", "--page", page_title],
    )


def create_block(
    *,
    cli_path: Path,
    graph: str,
    client: ClientContext,
    page_title: str,
    content: str,
    ids: List[int],
    rng: random.Random,
) -> None:
    if ids and rng.random() < 0.6:
        target_id = str(rng.choice(ids))
        run_cli_json(
            cli_path=cli_path,
            graph=graph,
            client=client,
            args=[
                "upsert",
                "block",
                "--target-id",
                target_id,
                "--pos",
                "first-child",
                "--content",
                content,
            ],
        )
        return

    run_cli_json(
        cli_path=cli_path,
        graph=graph,
        client=client,
        args=[
            "upsert",
            "block",
            "--target-page",
            page_title,
            "--content",
            content,
        ],
    )


def move_block(
    *,
    cli_path: Path,
    graph: str,
    client: ClientContext,
    page_title: str,
    ids: List[int],
    rng: random.Random,
) -> bool:
    if not ids:
        return False
    source_id = str(rng.choice(ids))
    run_cli_json(
        cli_path=cli_path,
        graph=graph,
        client=client,
        args=[
            "upsert",
            "block",
            "--id",
            source_id,
            "--target-page",
            page_title,
            "--pos",
            "last-child",
        ],
    )
    return True


def delete_block(
    *,
    cli_path: Path,
    graph: str,
    client: ClientContext,
    ids: List[int],
    rng: random.Random,
) -> bool:
    if len(ids) <= 2:
        return False
    source_id = str(rng.choice(ids))
    run_cli_json(
        cli_path=cli_path,
        graph=graph,
        client=client,
        args=["remove", "block", "--id", source_id],
    )
    return True


def feasible(operation: str, ids: List[int]) -> bool:
    if operation == "create":
        return True
    if operation == "move":
        return len(ids) >= 1
    if operation == "delete":
        return len(ids) > 2
    return False


def choose_operation(op_counts: Dict[str, int], ids: List[int], rng: random.Random) -> str:
    for required in ("create", "move", "delete"):
        if op_counts.get(required, 0) == 0 and feasible(required, ids):
            return required

    candidates = ["create", "create", "move"]
    if feasible("delete", ids):
        candidates.append("delete")
    if feasible("move", ids):
        candidates.append("move")
    return rng.choice(candidates)


def apply_operation(
    *,
    cli_path: Path,
    graph: str,
    client: ClientContext,
    page_title: str,
    op_counts: Dict[str, int],
    round_index: int,
    rng: random.Random,
) -> None:
    last_error: Dict[str, Any] | None = None
    for attempt in range(1, 7):
        ids = page_block_ids(
            cli_path=cli_path,
            graph=graph,
            client=client,
            page_title=page_title,
        )
        operation = choose_operation(op_counts, ids, rng)
        content = f"{client.name}-rnd-{round_index:03d}-{rng.randint(100000, 999999)}"

        try:
            if operation == "create":
                create_block(
                    cli_path=cli_path,
                    graph=graph,
                    client=client,
                    page_title=page_title,
                    content=content,
                    ids=ids,
                    rng=rng,
                )
                op_counts["create"] = op_counts.get("create", 0) + 1
                return

            if operation == "move":
                moved = move_block(
                    cli_path=cli_path,
                    graph=graph,
                    client=client,
                    page_title=page_title,
                    ids=ids,
                    rng=rng,
                )
                if moved:
                    op_counts["move"] = op_counts.get("move", 0) + 1
                    return
                continue

            if operation == "delete":
                deleted = delete_block(
                    cli_path=cli_path,
                    graph=graph,
                    client=client,
                    ids=ids,
                    rng=rng,
                )
                if deleted:
                    op_counts["delete"] = op_counts.get("delete", 0) + 1
                    return
                continue
        except CliCommandError as error:
            last_error = {
                "attempt": attempt,
                "operation": operation,
                "context": error.context,
            }
            continue

    fail(
        "failed to apply random operation after retries",
        client=client.name,
        round_index=round_index,
        last_error=last_error,
    )


def ensure_non_empty_page(
    *,
    cli_path: Path,
    graph: str,
    client: ClientContext,
    page_title: str,
    rng: random.Random,
) -> None:
    ids = page_block_ids(
        cli_path=cli_path,
        graph=graph,
        client=client,
        page_title=page_title,
    )
    if ids:
        return
    content = f"{client.name}-reseed-{rng.randint(100000, 999999)}"
    create_block(
        cli_path=cli_path,
        graph=graph,
        client=client,
        page_title=page_title,
        content=content,
        ids=[],
        rng=rng,
    )


PROFILE_DEFAULT_ROUNDS = {
    "default": 40,
    "high-stress": 100,
}



def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run randomized bidirectional block operations on two synced graph clients"
    )
    parser.add_argument("--cli", required=True, help="Path to static/logseq-cli.js")
    parser.add_argument("--graph", required=True)
    parser.add_argument("--config-a", required=True)
    parser.add_argument("--data-dir-a", required=True)
    parser.add_argument("--config-b", required=True)
    parser.add_argument("--data-dir-b", required=True)
    parser.add_argument("--page", required=True)
    parser.add_argument(
        "--profile",
        choices=sorted(PROFILE_DEFAULT_ROUNDS.keys()),
        default="default",
        help="Execution profile controlling default stress level",
    )
    parser.add_argument("--rounds-per-client", type=int, default=None)
    parser.add_argument("--seed", type=int, default=424242)
    args = parser.parse_args()
    if args.rounds_per_client is None:
        args.rounds_per_client = PROFILE_DEFAULT_ROUNDS[args.profile]
    return args


def main() -> None:
    args = parse_args()
    cli_path = Path(args.cli).expanduser().resolve()
    if not cli_path.exists():
        fail("cli path does not exist", cli=str(cli_path))

    rng = random.Random(args.seed)
    client_a = ClientContext(
        name="a",
        config=Path(args.config_a).expanduser().resolve(),
        data_dir=Path(args.data_dir_a).expanduser().resolve(),
    )
    client_b = ClientContext(
        name="b",
        config=Path(args.config_b).expanduser().resolve(),
        data_dir=Path(args.data_dir_b).expanduser().resolve(),
    )
    clients = [client_a, client_b]

    for client in clients:
        upsert_page(
            cli_path=cli_path,
            graph=args.graph,
            client=client,
            page_title=args.page,
        )

    # Seed both peers so move/delete have available targets from the beginning.
    for seed_round in range(3):
        for client in clients:
            create_block(
                cli_path=cli_path,
                graph=args.graph,
                client=client,
                page_title=args.page,
                content=f"{client.name}-seed-{seed_round}-{rng.randint(100000, 999999)}",
                ids=[],
                rng=rng,
            )

    op_stats: Dict[str, Dict[str, int]] = {
        client.name: {"create": 0, "move": 0, "delete": 0} for client in clients
    }

    for round_index in range(args.rounds_per_client):
        for client in clients:
            apply_operation(
                cli_path=cli_path,
                graph=args.graph,
                client=client,
                page_title=args.page,
                op_counts=op_stats[client.name],
                round_index=round_index,
                rng=rng,
            )

    for client in clients:
        ensure_non_empty_page(
            cli_path=cli_path,
            graph=args.graph,
            client=client,
            page_title=args.page,
            rng=rng,
        )

    print(
        json.dumps(
            {
                "status": "ok",
                "graph": args.graph,
                "page": args.page,
                "rounds_per_client": args.rounds_per_client,
                "seed": args.seed,
                "stats": op_stats,
                "total_operations": args.rounds_per_client * len(clients),
            }
        )
    )


if __name__ == "__main__":
    main()
