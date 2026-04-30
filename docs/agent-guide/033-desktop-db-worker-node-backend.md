# Desktop Db Worker Node Backend Implementation Plan

Goal: Switch the Electron desktop app graph database backend from OPFS plus periodic disk export to db-worker-node with direct disk SQLite access, so desktop app and logseq-cli can safely use the same data-dir at the same time.

Architecture: Reuse existing `logseq.cli.server` daemon orchestration and lock semantics, and add an Electron main process graph-scoped daemon manager.

Architecture: Replace the Electron renderer `PersistentDB` implementation from `frontend.persist-db.browser` to an HTTP plus SSE remote client that talks to `/v1/invoke` and `/v1/events` on db-worker-node.

Tech Stack: ClojureScript, Electron main plus renderer, Node child_process, db-worker-node HTTP plus SSE API, Electron IPC with transit-json payloads, SQLite files under data-dir, lock files.

Related: Builds on `docs/agent-guide/003-db-worker-node-cli-orchestration.md`.

Related: Relates to `docs/agent-guide/012-logseq-cli-graph-storage.md`.

Related: Relates to `docs/agent-guide/030-logseq-cli-db-graph-default-dir-locking.md`.

Related: Owner-aware lifecycle follow-up is documented in `docs/agent-guide/034-db-worker-node-owner-process-management.md`.

## Problem statement

The current desktop app uses an OPFS-backed SQLite worker in the renderer and periodically exports to disk through `persist-db/run-export-periodically!`.

The current logseq-cli starts and connects to db-worker-node, and directly reads and writes SQLite files in data-dir.

This split creates two write paths with eventual synchronization, and desktop plus CLI concurrent usage depends on export timing instead of one shared lock-governed write path.

The goal is to make desktop and CLI share db-worker-node semantics and lock behavior so disk SQLite becomes the single source of truth.

The desktop default DB graphs directory is `~/logseq/graphs`, defined in `deps/cli/src/logseq/cli/common/graph.cljs`, and used by Electron DB file operations in `src/electron/electron/db.cljs`.

This plan focuses on backend access flow and lifecycle management, and does not change business-level thread-api semantics or SQLite schema.

## Testing Plan

I will follow `@test-driven-development` for every phase and write failing tests before implementation changes.

I will prioritize pure-function and dependency-injected tests so core behavior can be validated without launching a full Electron GUI.

I will add Electron main db-worker manager lifecycle tests for first graph open, multi-window reuse, last-window close, and app shutdown cleanup.

I will add remote client transport tests for invoke success, invoke failure propagation, SSE disconnect and reconnect, and missing auth token handling.

I will extend db-worker-node tests with desktop plus CLI coexistence cases, including lock contention and stale lock recovery.

I will run targeted tests first and then run `bb dev:lint-and-test`, and I will apply the review checklist in `@prompts/review.md`.

NOTE: I will write *all* tests before I add any implementation behavior.

## Current behavior map

| Area | Current implementation | Target implementation |
|---|---|---|
| Desktop graph DB runtime | Renderer uses `frontend.persist-db.browser` and an OPFS worker. | Renderer uses a remote `PersistentDB` client against db-worker-node. |
| Desktop persistence model | OPFS acts as source of truth and is periodically exported to disk through Electron IPC. | Disk SQLite in data-dir is the source of truth with no OPFS periodic export flow. |
| CLI persistence model | CLI starts db-worker-node and calls `/v1/invoke`. | Keep unchanged and align desktop with the same daemon semantics. |
| Lock and ownership | Desktop OPFS path bypasses db-worker-node lock semantics during in-memory writes. | Desktop and CLI both go through db-worker-node lock and single-writer enforcement. |
| Process lifecycle | Desktop has no graph-scoped daemon manager in main process. | Electron main manages per-graph daemon start, reuse, health checks, and stop. |

## Integration sketch

```text
Desktop Renderer
  -> requests graph runtime from Electron Main via `electron.ipc/ipc` (transit-json)
  -> receives {base-url, auth-token, repo} for db-worker-node
  -> calls /v1/invoke and listens /v1/events through remote PersistentDB client

Electron Main
  -> on graph open: ensure db-worker-node started for graph in data-dir
  -> on graph close or app quit: stop graph daemon when the last window exits
  -> maintains graph -> daemon state cache

Logseq CLI
  -> uses existing logseq.cli.server ensure/start/stop
  -> talks to the same graph data-dir and lock protocol

db-worker-node
  -> provides the single write path to disk SQLite files
  -> enforces lock ownership and readiness checks
```

## Scope and non-goals

In scope are Electron main daemon lifecycle management, renderer persistence client switch, OPFS export-path removal, and required tests plus docs.

Out of scope are thread-api business behavior changes, SQLite schema changes, mobile behavior changes, and broad sync-system redesign.

## Implementation plan

### Phase 1: Add failing tests for the new desktop backend contract.

1. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/server_test.cljs` that verifies stable lock-conflict error reporting from daemon orchestration.
2. Add `/Users/rcmerci/gh-repos/logseq/src/test/electron/db_worker_manager_test.cljs` and write a failing test for `ensure-started!` idempotency.
3. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/electron/db_worker_manager_test.cljs` that verifies one daemon is reused across multiple windows for the same graph.
4. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/electron/db_worker_manager_test.cljs` that verifies stop on last-window close.
5. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/electron/db_worker_manager_test.cljs` that verifies stop-all behavior on app quit.
6. Add `/Users/rcmerci/gh-repos/logseq/src/test/frontend/persist_db/remote_test.cljs` and write failing tests for invoke success and invoke error propagation.
7. Add failing tests in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/persist_db/remote_test.cljs` for SSE parsing and reconnect behavior.
8. Run `bb dev:test -v 'electron.db-worker-manager-test'` and confirm new assertions fail first.
9. Run `bb dev:test -v 'frontend.persist-db.remote-test'` and confirm new assertions fail first.

### Phase 2: Extract shared daemon orchestration for CLI and Electron.

10. Extract CLI-output-independent daemon orchestration logic from `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs`.
11. Add `/Users/rcmerci/gh-repos/logseq/src/main/logseq/db_worker/daemon.cljs` and move `spawn`, `wait-ready`, `read-lock`, and `cleanup-stale-lock` core functions into it.
12. Keep command-facing API shape in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs` stable and delegate internally to the new helper.
13. Extend `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/server_test.cljs` with regression tests for unchanged CLI behavior.
14. Run `bb dev:test -v 'logseq.cli.server-test'` and confirm green.

### Phase 3: Implement Electron main db-worker manager.

15. Add `/Users/rcmerci/gh-repos/logseq/src/electron/electron/db_worker.cljs` with graph-to-daemon state cache and reference counting.
16. Implement `ensure-started!` in `/Users/rcmerci/gh-repos/logseq/src/electron/electron/db_worker.cljs` using the shared daemon helper and return `base-url` plus `auth-token`.
17. Implement `ensure-stopped!` and `stop-all!` in `/Users/rcmerci/gh-repos/logseq/src/electron/electron/db_worker.cljs`.
18. Add `electron.ipc/ipc` handlers in `/Users/rcmerci/gh-repos/logseq/src/electron/electron/handler.cljs` for renderer requests of graph runtime configuration, encoded with transit-json.
19. Hook `stop-all!` into app lifecycle in `/Users/rcmerci/gh-repos/logseq/src/electron/electron/core.cljs` at `before-quit` and `window-all-closed`.
20. Hook graph last-window stop logic into close flow in `/Users/rcmerci/gh-repos/logseq/src/electron/electron/core.cljs`.
21. Run `bb dev:test -v 'electron.db-worker-manager-test'` and confirm lifecycle tests pass.

### Phase 4: Add Electron renderer remote PersistentDB client.

22. Add `/Users/rcmerci/gh-repos/logseq/src/main/frontend/persist_db/remote.cljs` implementing `protocol/PersistentDB` with HTTP plus SSE transport.
23. Implement browser-safe invoke transport in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/persist_db/remote.cljs` and avoid Node-only `http` dependency in the renderer.
24. Implement event subscription and reconnect policy in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/persist_db/remote.cljs` compatible with current event handler signatures.
25. Extend runtime implementation selection in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/persist_db.cljs` to explicitly use remote client for Electron.
26. Add initialization flow in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/persist_db.cljs` that fetches runtime config from `electron.ipc/ipc` via transit-json before creating the remote client.
27. Update `/Users/rcmerci/gh-repos/logseq/src/test/frontend/persist_db/remote_test.cljs` to green after implementation.
28. Run `bb dev:test -v 'frontend.persist-db.remote-test'` and confirm green.

### Phase 5: Replace OPFS startup path and remove periodic export workflow.

29. Remove Electron-path dependency on `frontend.persist-db.browser/start-db-worker!` in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/handler.cljs`.
30. Start remote `PersistentDB` initialization flow in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/handler.cljs`.
31. Remove Electron-path invocation of `persist-db/run-export-periodically!` in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/handler.cljs`.
32. Adjust `:graph/save-db-to-disk` behavior in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/handler/events.cljs` to a no-op or user guidance path.
33. Adjust shortcut behavior for `:graph/db-save` in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/modules/shortcut/config.cljs` so it no longer triggers legacy export flow.
34. Mark `:db-get` and `:db-export` `electron.ipc/ipc` endpoints in `/Users/rcmerci/gh-repos/logseq/src/electron/electron/handler.cljs` as compatibility-only or remove unused entry points.
35. Clean up OPFS-export-only logic in `/Users/rcmerci/gh-repos/logseq/src/electron/electron/db.cljs` while preserving needed utility paths.
36. Run `bb dev:test -v 'frontend.handler.route-test'` and `bb dev:test -v 'frontend.handler.common.config-edn-test'` for regression coverage.

### Phase 6: Add desktop and CLI coexistence verification.

37. Add concurrency tests in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_worker_node_test.cljs` covering desktop plus CLI access to the same graph.
38. Add stale-lock recovery tests in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_worker_node_test.cljs`.
39. Add tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/server_test.cljs` for CLI reuse or conflict reporting when desktop already started the graph daemon.
40. Run `bb dev:test -v 'frontend.worker.db-worker-node-test'` and confirm green for coexistence tests.
41. Run `bb dev:test -v 'logseq.cli.server-test'` and confirm green for coexistence tests.

### Phase 7: Docs and rollout safety.

42. Update `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` to document shared db-worker-node semantics between desktop and CLI.
43. Add `/Users/rcmerci/gh-repos/logseq/docs/developers/desktop-db-worker-node.md` describing Electron main lifecycle and renderer remote-client init ordering.
44. Add release notes describing that Electron no longer uses OPFS as the primary database storage path.
45. Add rollback notes for a temporary fallback switch if emergency recovery is required.
46. Run `bb dev:lint-and-test` and confirm zero failures and zero errors.
47. Run a final review against `@prompts/review.md` and fix findings before merge.

## Edge cases

| Scenario | Expected behavior |
|---|---|
| Desktop opens a graph before daemon readiness completes. | Renderer waits for main-process ready runtime or receives a retryable error, and does not silently fall back to OPFS. |
| Desktop and CLI both attempt first start for the same graph daemon. | Exactly one owner acquires lock and the other path reuses the existing daemon or retries after a `:repo-locked` status check. |
| Graph name contains special characters. | Existing graph-dir encoding resolves to the same on-disk directory for desktop and CLI. |
| SSE connection drops. | Remote client reconnects and keeps event handling consistent, while invoke calls remain independent. |
| App exits abnormally and leaves a stale lock. | Next startup cleans stale lock via existing lock housekeeping logic without manual lock deletion. |
| Version switch from OPFS-backed desktop behavior. | No one-time migration is required because desktop already writes to disk data-dir, and startup verification should check disk DB readability before enabling the new backend. |

## Verification commands and expected outputs

```bash
bb dev:test -v 'electron.db-worker-manager-test'
bb dev:test -v 'frontend.persist-db.remote-test'
bb dev:test -v 'logseq.cli.server-test'
bb dev:test -v 'frontend.worker.db-worker-node-test'
clojure -M:cljs compile db-worker-node
bb dev:lint-and-test
```

Each test command should finish with `0 failures, 0 errors`.

`clojure -M:cljs compile db-worker-node` should produce a runnable `static/db-worker-node.js`.

In manual smoke tests, desktop and CLI reads and writes for the same graph should be immediately visible to each other without periodic export dependency.

## Rollout strategy

Phase one ships behind a feature flag and enables by default in development builds for coexistence and recovery telemetry.

Phase two enables by default in stable builds and keeps a short-lived rollback switch.

Phase three removes legacy OPFS export-path code and removes the rollback switch.

## Clarity required before implementation

Confirm product-level messaging for desktop and CLI lock-contention conflicts on the same graph.

Confirm whether `:graph/db-save` is removed or redefined as a checkpoint action in the new model.

Confirm rollback-switch lifecycle and target removal release.

## Testing Details

Tests focus on behavior, not implementation details, by validating daemon lifecycle, invoke responses, and event-stream consistency.

Core coexistence tests validate lock ownership, recovery, and cross-client visibility for the same graph instead of mock call counts.

Regression tests ensure existing CLI behavior stays stable and Electron startup plus shutdown does not leave zombie processes or lock files.

## Implementation Details

- Reuse and extract daemon orchestration from `logseq.cli.server` to avoid duplicate process-management logic.
- Add a dedicated Electron main db-worker manager with graph-scoped daemon state cache.
- Use a renderer remote `PersistentDB` client against db-worker-node HTTP plus SSE endpoints.
- Use transit-json for frontend and Electron communication through `electron.ipc/ipc` (see also `ldb/write-transit-str`).
- Remove periodic OPFS export workflow in Electron so disk SQLite is the only source of truth.
- Keep thread-api and database schema unchanged to limit application-level regressions.
- Keep lock-file and `:repo-locked` semantics identical for desktop and CLI.
- Add reconnect and stale-lock recovery tests to cover availability risks.
- Roll out with feature-flag phases and a short rollback window.
- Follow `@test-driven-development` and `@prompts/review.md` through implementation and verification.

## Question

---
