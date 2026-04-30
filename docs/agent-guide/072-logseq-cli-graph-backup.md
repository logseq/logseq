# Graph Backup Subcommands Implementation Plan

Goal: Add `graph backup` subcommands that create, list, restore, and remove backup graphs under `backup/` using SQLite backup API for backup creation.

Architecture: Keep command parsing and human/json/edn output behavior in `logseq-cli`, and keep backup file generation inside `db-worker-node` through a new thread API that calls Node SQLite backup API.
Architecture: Reuse the existing SQLite import path for restore to avoid introducing a second restore mechanism and to keep db bootstrap semantics aligned with current `graph import --type sqlite` behavior.

Tech Stack: ClojureScript, `babashka.cli`, `logseq-cli` command pipeline, `db-worker-node` `/v1/invoke`, Node `node:sqlite`, filesystem operations under CLI data dir.

Related: Builds on `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/006-logseq-cli-import-export.md`.
Related: Builds on `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/037-db-worker-node-node-sqlite.md`.
Related: Relates to `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/060-cli-graph-list-legacy-graph-dir-rename-command.md` and `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/061-graph-dir-space-preserve-canonical.md`.

## Problem statement

`logseq-cli` currently supports `graph export` and `graph import`, but it has no first-class backup lifecycle for graph snapshots.

Current SQLite export reads `db.sqlite` bytes through `:thread-api/export-db-base64` after `wal_checkpoint`, which is functional but does not use SQLite backup API.

We need backup-specific commands that treat backups as managed graph-like artifacts stored under `backup/` and independent from normal graph directories.

The requested command set is `graph backup list`, `graph backup create`, `graph backup restore --src <backup-name> --dst <new-graph-name>`, and `graph backup remove`.

The scope explicitly covers only `db.sqlite` and excludes `search-db.sqlite` and `client-ops-db.sqlite`.

## Requested command contract

| Command | Behavior | Notes |
| --- | --- | --- |
| `logseq graph backup list` | List all backup graphs under `<data-dir>/backup/`. | Returns metadata including name, created-at, and size-bytes. |
| `logseq graph backup create [--name <name>]` | Create a backup graph for `--graph <name>` or current graph from config. | Must use SQLite backup API for `db.sqlite`. |
| `logseq graph backup restore --src <backup-name> --dst <new-graph-name>` | Restore one backup graph into a new normal graph. | Destination must not already exist and must fail if it exists. |
| `logseq graph backup remove --src <backup-name>` | Remove one backup graph directory. | Physical delete of backup entry. |

`graph backup remove` uses `--src` to align with restore semantics.

## Current baseline and constraints

CLI graph subcommands are registered in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs` and routed in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`.

Graph list currently scans graph directories directly under `data-dir` using `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs`.

Node runtime storage list in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/platform/node.cljs` also scans top-level directories under `data-dir`.

If we add a top-level `backup/` directory, both scanners must explicitly ignore it to prevent `backup` from appearing as a normal graph.

Worker-side SQLite import/export thread APIs already exist in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` and are exercised in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_worker_node_test.cljs`.

Human formatting for graph commands is centralized in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs`.

Non-sync CLI e2e coverage is now shell-driven in `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn` and `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_inventory.edn`.

## Target architecture

```text
logseq graph backup create
  -> logseq.cli.command.graph/execute-graph-backup-create
    -> ensure db-worker-node for source repo
      -> /v1/invoke :thread-api/backup-db-sqlite [repo dst-db-path]
        -> node:sqlite backup API
          -> <data-dir>/backup/<encoded-backup-name>/db.sqlite

logseq graph backup restore --src A --dst B
  -> resolve <data-dir>/backup/<encoded-A>/db.sqlite
    -> reuse sqlite import flow into repo logseq_db_B
      -> graph becomes normal top-level graph directory
```

Backup listing and removal stay CLI-side filesystem operations and do not require new worker endpoints.

Backup creation is the only operation that must call SQLite backup API.

## Storage and naming model

Backup root path will be `<resolved-data-dir>/backup`.

Each backup graph will be stored as `<resolved-data-dir>/backup/<encoded-backup-name>/db.sqlite`.

Backup name is user-facing and decoded with existing graph-dir encode/decode helpers for consistency with current graph directory naming behavior.

`graph backup create` will auto-generate backup name as `<source-graph>-<UTC-timestamp>`.

When `--name <name>` is provided, backup name format becomes `<source-graph>-<name>-<UTC-timestamp>`.

A short suffix is appended on collision.

`graph backup list` returns decoded backup names with metadata including `created-at` and `size-bytes` derived from filesystem stat.

No search db or client-ops db files are copied into backup entries.

## Testing Plan

I will follow `@test-driven-development` and implement this feature with failing tests first.

I will start by adding failing CLI parse/build tests for all new commands and required options.

I will add failing worker-side tests that prove backup creation returns a valid sqlite file that can be imported into another repo.

I will add failing graph-directory scanner tests to ensure `backup/` is ignored by normal graph listing.

I will add failing formatting tests for new human output messages and list rendering.

I will add failing CLI e2e cases that run create -> list -> restore -> remove against a temp data dir.

I will update CLI docs after behavior is stabilized and tests pass.

NOTE: I will write *all* tests before I add any implementation behavior.

## Implementation plan

### Phase 1: Add failing tests for command parsing and action building.

1. Add parse tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` for `graph backup list`, `graph backup create`, `graph backup restore`, and `graph backup remove`.

2. Add parse tests asserting `graph backup create --name <name>` is accepted and passed through as optional naming input.

3. Add parse tests asserting backup name generation follows `<graph>-<name>-<timestamp>` when `--name` is provided.

4. Add parse tests asserting `graph backup restore` requires `--src` and `--dst`.

5. Add parse tests asserting `graph backup remove` requires `--src`.

6. Add build-action tests for each new command and assert resulting action `:type` values.

7. Add build-action tests asserting `graph backup create` resolves source repo from `--graph` or current config graph and fails with `:missing-repo` when no graph is available.

### Phase 2: Add failing tests for command execution and formatting.

8. Add execution unit tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/graph_test.cljs` for backup list/create/restore/remove with mocked filesystem and transport calls.

9. Add tests that backup create invokes new worker method `:thread-api/backup-db-sqlite` exactly once with source repo and destination sqlite path.

10. Add tests that backup restore rejects missing source backup and rejects existing destination graph.

11. Add tests that backup restore reuses sqlite import flow semantics and returns `new-graph? true` style success metadata.

12. Add formatting tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` for human output of backup list/create/restore/remove.

13. Add formatting tests for backup list metadata rendering (`name`, `created-at`, `size-bytes`) in human/json/edn output.

### Phase 3: Add failing tests for graph scanners and worker backup API.

14. Extend `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/server_test.cljs` so `list-graph-items` ignores top-level `backup` directory.

15. Add platform node tests in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/platform_node_test.cljs` for backup API wrapper behavior.

16. Add daemon-level test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_worker_node_test.cljs` that calls `thread-api/backup-db-sqlite` and verifies produced sqlite file can seed another repo via existing import API.

17. Add daemon-level lock test that backup API is treated as a write operation and fails for stale/non-owner lock states.

### Phase 4: Implement worker-side backup API.

18. Add a new thread API in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` named `:thread-api/backup-db-sqlite`.

19. Implement thread API behavior to backup only main db connection for repo and return deterministic metadata `{ :path <dst> }`.

20. Extend Node sqlite wrapper in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/platform/node.cljs` to expose backup capability from `DatabaseSync` through wrapped connection object.

21. Guard destination writes with existing `write-guard-fn` semantics so lock ownership is enforced for backup generation.

22. Ensure parent directory creation for destination file is handled before backup call.

23. Add new worker method to write-method allowlist in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs`.

24. Keep route protocol unchanged by continuing to use `/v1/invoke`.

### Phase 5: Implement CLI backup storage helpers and command handlers.

25. Add backup option specs and command entries in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs`, including optional `--name` for create and `--src` for remove.

26. Add action builders for `:graph-backup-list`, `:graph-backup-create`, `:graph-backup-restore`, and `:graph-backup-remove`.

27. Add execution functions in `graph.cljs` for list/create/restore/remove with focused responsibilities.

28. Implement backup root and backup item helper functions using resolved CLI data dir and graph-dir encoding/decoding.

29. Implement backup create execution to generate backup name from `<graph>-<timestamp>` or `<graph>-<name>-<timestamp>`, create target dir, and call `transport/invoke` with `:thread-api/backup-db-sqlite`.

30. Implement backup restore execution to map `--src` to backup sqlite path and then reuse sqlite import workflow for destination repo.

31. Implement backup remove execution to recursively remove target backup directory.

32. Add validation and dispatch wiring in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` for new commands and required flags.

33. Add context keys (`:src`, `:dst`, `:backup-name`) in execute result metadata for formatter use.

### Phase 6: Keep normal graph listing behavior correct.

34. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs` directory classification to ignore `backup` root.

35. Update `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/platform/node.cljs` list-graphs scanner to ignore `backup` root.

36. Verify that `graph list` and `thread-api/list-db` do not show `backup` as a graph.

### Phase 7: Update output, completion, docs, and e2e coverage.

37. Add formatter branches in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` for backup commands with concise human lines and metadata rendering for list output.

38. Update completion tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/completion_generator_test.cljs` so graph group includes backup subcommands and restore/remove flags.

39. Update `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_inventory.edn` to include new graph backup commands and options (`--name`, `--src`, `--dst`).

40. Add e2e cases in `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn` for create/list/restore/remove flows, including one create case with `--name`.

41. Update `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` command list and examples for graph backup commands.

42. Add one doc note that backup commands copy only `db.sqlite` and intentionally skip search/client-ops sqlite files.

## File-by-file change map

| File | Planned change |
| --- | --- |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/graph.cljs` | Add backup command entries, option specs, action builders, filesystem helper functions, and execute logic for list/create/restore/remove. |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` | Add parser validation for backup flags, build-action routing, execute dispatch, and context key propagation. |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` | Add human output formatting for backup list/create/restore/remove and ensure machine outputs remain stable. |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs` | Ignore top-level `backup` directory when listing normal graphs. |
| `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` | Add `:thread-api/backup-db-sqlite` implementation for main sqlite db backup generation. |
| `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/platform/node.cljs` | Expose Node sqlite backup capability and ensure list-graphs ignores backup root. |
| `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs` | Register backup API as write method for lock-owner enforcement. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` | Add parse/build/execute tests for backup commands and required option errors. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/graph_test.cljs` | Add unit tests for backup command execution behaviors and transport invocation contract. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` | Add human/json/edn formatting tests for backup command outputs. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/server_test.cljs` | Add scanner tests proving `backup` root is excluded from graph list. |
| `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/platform_node_test.cljs` | Add unit tests for backup API wrapper behavior and destination file creation. |
| `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_worker_node_test.cljs` | Add integration test covering backup API correctness and lock enforcement behavior. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/completion_generator_test.cljs` | Assert completion includes graph backup subcommands and options. |
| `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_inventory.edn` | Include graph backup command and option coverage inventory entries. |
| `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn` | Add end-to-end graph backup lifecycle cases. |
| `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` | Document backup commands and db.sqlite-only scope note. |

## Edge cases and behavior guarantees

Backup names with spaces and slashes are supported through existing graph-dir encode/decode helpers.

Optional `--name` values with spaces and symbols are supported and encoded through the same helpers.

Backup creation must fail clearly when source graph does not exist or backup target path cannot be created.

Backup restore must fail clearly when source backup does not exist.

Backup restore must fail clearly when destination graph already exists.

Backup remove must fail clearly when source backup does not exist.

`graph list` must not include backup entries.

`graph backup list` metadata fields (`created-at`, `size-bytes`) must remain present and stable even when sorting order changes.

Backup API must preserve binary integrity for large sqlite files and not truncate output.

Backup operations must respect lock ownership semantics already enforced for write methods.

## Verification commands

```bash
bb dev:test -v logseq.cli.command.graph-test
bb dev:test -v logseq.cli.commands-test
bb dev:test -v logseq.cli.format-test
bb dev:test -v logseq.cli.server-test
bb dev:test -v frontend.worker.platform-node-test
bb dev:test -v frontend.worker.db-worker-node-test/db-worker-node-import-db-base64
bb dev:test -v frontend.worker.db-worker-node-test/db-worker-node-write-mutation-fails-for-non-owner-pid
bb -f cli-e2e/bb.edn test --skip-build
bb dev:lint-and-test
```

Expected results are passing tests for parser behavior, backup API correctness, lock safety, graph-list isolation, and CLI end-to-end backup lifecycle.

## Testing Details

I will add tests that validate end-user behavior of backup command parsing, execution, output, and restore correctness.

I will assert backup file validity by actually importing the generated sqlite backup into a new graph and querying known content.

I will assert list isolation behavior by verifying backup root never appears in normal graph listings.

I will keep lock-related assertions behavior-driven by invoking through daemon HTTP APIs rather than testing private internals.

## Implementation Details

- Add `graph backup` command entries under existing graph command group instead of creating a new top-level command.
- Use existing global `--graph` resolution as backup source selector for `graph backup create`.
- Introduce optional `--name` for create, `--src` and `--dst` for restore, and `--src` for remove.
- Store backups under `<data-dir>/backup/<encoded-backup-name>/db.sqlite`.
- Generate backup names as `<graph>-<timestamp>` by default and `<graph>-<name>-<timestamp>` when `--name` is provided, with collision suffix when needed.
- Use a new worker thread API to call Node SQLite backup API for backup creation.
- Reuse existing sqlite import flow for restore to keep db bootstrap behavior consistent.
- Mark worker backup method as write operation so lock ownership checks remain enforced.
- Ignore top-level `backup` directory in both CLI and node platform graph scanners.
- Return backup list metadata including `created-at` and `size-bytes` in machine output and render it in human output.
- Update completion, docs, and e2e specs together so command contract is synchronized.

## Question

Do we reserve the top-level graph name `backup` going forward, or do we need a migration strategy for users who already have a normal graph named `backup` in the same data dir?

---
