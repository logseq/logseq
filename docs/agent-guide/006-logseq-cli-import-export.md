# Logseq CLI Import/Export Plan

Goal: Add logseq-cli support for import/export with EDN and SQLite formats using the existing db-worker-node server.

Architecture: Extend logseq-cli command parsing and execution to invoke db-worker-node thread APIs for export and import, with minimal new APIs to handle EDN import and SQLite binary payloads over HTTP.

Tech Stack: ClojureScript, babashka/cli, db-worker-node HTTP /v1/invoke, datascript, sqlite-export helpers, Node fs/path.

Related: Builds on docs/agent-guide/004-logseq-cli-verb-subcommands.md and docs/agent-guide/003-db-worker-node-cli-orchestration.md.

## Requirements

- Import types: edn, sqlite.
- Export types: edn, sqlite.
- CLI must work against db-worker-node with repo binding and lock file behavior.
- Output files must be written to user-specified paths with clear success/error messages.

## Proposed CLI UX

Prefer graph-scoped subcommands to keep import/export with graph management:

- `logseq graph export --type edn --output <path> [--repo <graph>]`
- `logseq graph export --type sqlite --output <path> [--repo <graph>]`
- `logseq graph import --type edn --input <path> --repo <graph>`
- `logseq graph import --type sqlite --input <path> --repo <graph>`

Notes:
- `graph import` only supports importing into a new graph name; it must not overwrite an existing graph.
- `--repo` is required for import, and required unless the current graph is set in config for export.

## Current Capabilities (Baseline)

- db-worker-node supports `:thread-api/export-edn`, `:thread-api/export-db`, and `:thread-api/import-db`.
- logseq-cli can invoke db-worker-node via `src/main/logseq/cli/transport.cljs` and write files with `transport/write-output`.
- EDN import exists in the app layer (`frontend.handler.db-based.import`) but not in db-worker-node.
- SQLite import in db-worker-node writes the sqlite file, but CLI needs a full reload step to reflect new data.

## Implementation Plan

1. Review existing CLI command table and action pipeline in `src/main/logseq/cli/commands.cljs` and `src/main/logseq/cli/main.cljs` to locate insertion points for new graph import/export actions.
2. Add new CLI specs for import/export flags (type, input, output, export-type, mode) in `src/main/logseq/cli/commands.cljs`.
3. Extend the command table with `graph import` and `graph export` entries and ensure help output includes them.
4. Add action builders for import/export that validate repo presence, file paths, and allowed types (edn, sqlite).
5. Add CLI helpers for reading input files and writing output files in `src/main/logseq/cli/transport.cljs` (or a new helper namespace), keeping the existing `write-output` behavior for EDN and DB files.
6. Implement export execution:
   - EDN: call `thread-api/export-edn` (graph-only) and write EDN file.
   - SQLite: call a new db-worker-node export API that returns a base64 string or transit-safe binary; decode to Buffer and write `.sqlite` file.
7. Implement import execution:
   - EDN: read EDN file, pass data to a new db-worker-node `thread-api/import-edn` (see below), and return a summary message.
   - SQLite: read file as Buffer, pass to a new db-worker-node `thread-api/import-sqlite` (or reuse `import-db` with a wrapper that closes/reopens the repo).
   - Always stop and restart the db-worker-node server from the CLI around import to ensure a clean reload.
8. Add db-worker-node thread APIs in `src/main/frontend/worker/db_core.cljs`:
   - `:thread-api/import-edn` to convert export EDN into tx data via `logseq.db.sqlite.export/build-import` and transact with `:tx-meta` including `::sqlite-export/imported-data? true` so the pipeline rebuilds refs.
   - `:thread-api/export-db-base64` (or similar) to return a base64 string for SQLite export over HTTP.
   - `:thread-api/import-db-base64` (or similar) to accept base64 input, close existing sqlite connections, import db data, and reopen the repo (or invoke `:thread-api/create-or-open-db` with `:import-type :sqlite-db`).
9. Update db-worker-node server validation (repo binding) if the new thread APIs need special argument shapes.
10. Update CLI output formatting in `src/main/logseq/cli/format.cljs` to print concise success lines like `Exported <type> to <path>` and `Imported <type> from <path>`.
11. Update documentation in `docs/cli/logseq-cli.md` with new commands, examples, and file format notes.

## Testing Plan

- Add CLI parsing tests for `graph import` and `graph export` options in `src/test/logseq/cli/commands_test.cljs` (or a new namespace).
- Add integration tests in `src/test/logseq/cli/integration_test.cljs` to:
  - export EDN and SQLite from a test graph and assert output files exist and are non-empty.
  - import EDN into a new graph and verify a known page/block exists via CLI `show` or `list`.
  - import SQLite into a new graph and verify graph metadata or page count.
- Add db-worker-node tests in `src/test/frontend/worker/db_worker_node_test.cljs` for the new import/export thread APIs (EDN build-import path and base64 DB export/import).
- Follow @test-driven-development: write failing tests before implementation.

## Edge Cases

- Large SQLite exports may exceed JSON limits if not base64/transit encoded; ensure streaming-safe or chunked base64 handling.
- Import should fail fast if the repo is missing and `--repo` is not provided, or if input file does not exist.
- SQLite import while the repo is open must close/reopen connections to avoid stale datascript state.
- EDN import should validate the export shape and surface readable errors when EDN is invalid or incompatible.
- Overwrite behavior should be explicit for SQLite imports to prevent accidental data loss.

## Decisions

1. `graph import` only imports into a new graph; it must not overwrite an existing graph.
2. No `--mode` flag; both EDN and SQLite imports are replace-style imports.
3. CLI always stops and restarts db-worker-node around imports.
4. `graph export --type edn` is graph-only for now (no page/view/blocks).
