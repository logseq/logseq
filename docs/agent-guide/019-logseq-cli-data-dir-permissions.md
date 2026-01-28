# Logseq CLI Data-dir Permission Checks Plan

Goal: Make logseq-cli validate read/write access for `data-dir` before it tries to start or communicate with db-worker-node, and surface a clear error when permissions are missing.

Architecture: The CLI resolves `data-dir` in `logseq.cli.config` and uses it via `logseq.cli.server` to spawn and manage `db-worker-node`. `db-worker-node` also depends on `data-dir` for logs, locks, and SQLite storage via `frontend.worker.platform.node`.

Tech Stack: ClojureScript, Node.js fs APIs, promesa, logseq-cli, db-worker-node.

## Problem statement

`data-dir` is used for locks, logs, and the local SQLite DB. Today, permission issues show up as late runtime exceptions (e.g., during lock creation or log file writes) with unclear error output. The CLI should proactively check that `data-dir` is readable and writable and return a clear error before attempting db-worker-node actions.

## Current behavior summary

- `logseq.cli.config/resolve-config` defaults `:data-dir` to `~/.logseq/cli-graphs`.
- `logseq.cli.server` resolves and uses `data-dir` for locks and server discovery.
- `frontend.worker.db-worker-node` writes logs and lock files under `data-dir` and delegates storage to `frontend.worker.platform.node`, which creates directories as needed.
- No explicit read/write permission checks exist; errors bubble up from fs operations.

## Requirements

- CLI validates that `data-dir` is a directory with read and write permission.
- If `data-dir` does not exist, CLI attempts to create it (recursive). If creation or access fails, CLI returns an error.
- CLI surfaces a clear error code and message that includes the failing path.
- The check must run before any db-worker-node lifecycle or graph access that relies on `data-dir`.

## Non-goals

- Do not change db-worker-node storage layout or lock format.
- Do not add new CLI options for data-dir.
- Do not change API server behavior.

## Design decisions

- Treat `data-dir` as required to be read/write for all local-graph CLI commands.
- Convert permission failures into a consistent CLI error code (e.g., `:data-dir-permission`) and message.
- Reuse the same permission check in db-worker-node entrypoint to guard direct invocation.

## Implementation plan

### 1) Add a data-dir permission helper

- Create a helper namespace (e.g., `src/main/logseq/cli/data_dir.cljs`) that:
  - Expands `~` and normalizes the path.
  - If missing, attempts `fs.mkdirSync` with `{:recursive true}`.
  - Verifies the path is a directory (`fs.statSync`).
  - Verifies read/write access with `fs.accessSync` (R_OK | W_OK).
  - Throws `ex-info` with `{:code :data-dir-permission :path <path> :cause <node-code>}` on failure.

### 2) Wire the check into CLI flow

- In `src/main/logseq/cli/main.cljs`, after `config/resolve-config`, call the permission helper before `commands/build-action`/`commands/execute`.
- If the CLI supports API-token-only commands that do not touch local graphs, gate the check to only run for actions that require local graph access or server management.
- Map thrown permission errors into CLI error output with a clear message (e.g., "data-dir is not readable/writable: <path>").

### 3) Add a safety check in db-worker-node

- In `src/main/frontend/worker/db_worker_node.cljs`, run the same permission helper (or a small local equivalent) before `install-file-logger!` and before `platform-node/node-platform`.
- When this check fails, print a concise error to stderr and exit with code 1 to avoid partial startup.

### 4) Update CLI error formatting

- In `src/main/logseq/cli/format.cljs`, add an error hint for `:data-dir-permission` (e.g., "Check filesystem permissions or set LOGSEQ_CLI_DATA_DIR").
- Ensure error output contains the path and permission type (read/write).

### 5) Tests

- Add unit tests in `src/test/logseq/cli` for the permission helper:
  - Non-existent path that can be created succeeds.
  - Path that is a file (not directory) fails.
  - Read-only directory fails (use chmod to remove write permission in tmp dir).
- Add an integration test that runs CLI with `--data-dir` pointing to a non-writable directory and asserts the CLI returns error code `:data-dir-permission`.
- Add a graph-create case where `graph-dir` cannot be created (no mkdir permission) and assert a clear error is returned.
- Add a db-worker-node test (if there is a suitable harness) or extend existing CLI integration tests to assert db-worker-node start fails fast with the new error.

## Open questions

Resolved:
- Always check `data-dir` permissions, even when an API-server token is provided.
- Only create `data-dir` when a command needs it (local graph or server operations), not eagerly for all commands.

---
