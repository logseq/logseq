# Logseq CLI Default Paths Move Plan

Goal: Move the default `--data-dir` location to `~/logseq/cli-graphs` and the default `cli.edn` location to `~/logseq/cli.edn`, keeping logseq-cli and db-worker-node consistent.

Architecture: logseq-cli resolves defaults in `logseq.cli.config` and `logseq.cli.data-dir`, then hands `data-dir` into `logseq.cli.server` which spawns and manages db-worker-node. db-worker-node itself also resolves `data-dir` for logs, locks, and SQLite storage via `frontend.worker.platform.node` and `frontend.worker.db-worker-node-lock`.

Tech Stack: ClojureScript, Node.js fs/path, logseq-cli, db-worker-node.

## Problem statement

Defaults currently live under `~/.logseq/`, but CLI data is not the same as desktop app data and should live under `~/logseq/` for better discoverability and separation. We need to update the defaults in both logseq-cli and db-worker-node, and update docs/help text to match.

## Current behavior summary

- logseq-cli uses `~/logseq/cli-graphs` as the default data dir.
- db-worker-node help text and internal resolution also default to `~/logseq/cli-graphs`.
- logseq-cli defaults config path to `~/logseq/cli.edn`.
- Docs reference `~/logseq/cli.edn` and `~/logseq/cli-graphs`.

## Requirements

- Default `data-dir` becomes `~/logseq/cli-graphs` everywhere it is derived.
- Default config path becomes `~/logseq/cli.edn`.
- `--data-dir` and `--config` flags continue to override defaults.
- `LOGSEQ_CLI_DATA_DIR` and `LOGSEQ_CLI_CONFIG` (if present) continue to override defaults.
- Help text and docs must match the new defaults.

## Non-goals

- Do not migrate existing data automatically.
- Do not change CLI flags, env var names, or db-worker-node storage layout.
- Do not change runtime behavior beyond the default locations.

## Design decisions

- Keep default paths defined in a single place per subsystem (CLI vs db-worker-node), but ensure they resolve to the same new location.
- Do not auto-detect the old location as a fallback to avoid surprises; users can pass `--data-dir` / `--config` explicitly if needed.
- Document the change and provide a brief migration note in CLI docs.

## Implementation plan

### 1) Update default `data-dir` constants and resolution

- `src/main/logseq/cli/data_dir.cljs`
  - Change `default-data-dir` from `~/logseq/cli-graphs` to `~/logseq/cli-graphs`.
- `src/main/logseq/cli/server.cljs`
  - Update `resolve-data-dir` default to `~/logseq/cli-graphs` (keeps server defaults aligned when config is absent).
- `src/main/frontend/worker/db_worker_node_lock.cljs`
  - Update `resolve-data-dir` default to `~/logseq/cli-graphs`.
- `src/main/frontend/worker/platform/node.cljs`
  - Update `node-platform` default for `data-dir` to `~/logseq/cli-graphs`.
- `src/main/frontend/worker/db_worker_node.cljs`
  - Update the `--data-dir` help text default to `~/logseq/cli-graphs`.

### 2) Update default config path for CLI

- `src/main/logseq/cli/config.cljs`
  - Change `config-path` default from `~/logseq/cli.edn` to `~/logseq/cli.edn`.
  - Update any inline default map (`resolve-config` default options) to match if present.

### 3) Update docs and internal references

- `docs/cli/logseq-cli.md`
  - Replace references to `~/logseq/cli.edn` and `~/logseq/cli-graphs` with the new paths.
  - Add a short migration note: existing data/config can be used by passing `--data-dir` / `--config`.
- `docs/agent-guide/*.md`
  - Update any references to the old defaults (notably `docs/agent-guide/002-logseq-cli-subcommands.md`, `docs/agent-guide/003-db-worker-node-cli-orchestration.md`, `docs/agent-guide/012-logseq-cli-graph-storage.md`, `docs/agent-guide/019-logseq-cli-data-dir-permissions.md`, and `docs/agent-guide/task--db-worker-nodejs-compatible.md`).

### 4) Tests

- Unit tests likely unaffected, but adjust any tests or snapshots that assert default path strings (search for `~/logseq/cli-graphs` or `~/logseq/cli.edn` in tests).
- If tests assert CLI help output or default config path, update expected strings accordingly.

## Notes

- Do not add a one-time warning for the old `~/logseq/cli-graphs` location. If a config is needed, prefer `cli.edn` under the selected `data-dir`.
- Do not add any fallback or compatibility for `~/logseq/cli.edn`. The old location is ignored.
