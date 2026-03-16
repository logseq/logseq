# db-worker-node Node Built-in SQLite Migration Implementation Plan

Goal: Replace `better-sqlite3` in `db-worker-node` with Node.js built-in `node:sqlite` while keeping `logseq-cli` behavior and db-worker thread-api contracts unchanged.

Architecture: Keep the existing platform adapter boundary in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/platform/node.cljs` and swap only the Node SQLite backend implementation to a compatibility wrapper around `DatabaseSync` and `StatementSync`.
Architecture: Preserve daemon lifecycle and lock ownership semantics, then update bundle/test/doc assumptions that currently depend on native `.node` assets from `better-sqlite3`.

Tech Stack: ClojureScript, `shadow-cljs` `:node-script`, Node.js `>=22.20.0`, `node:sqlite`, `@vercel/ncc`, `logseq-cli` HTTP transport.

Related: Builds on `docs/agent-guide/033-desktop-db-worker-node-backend.md` and `docs/agent-guide/036-db-worker-node-ncc-bundling.md`.
Related: Relates to `docs/agent-guide/task--db-worker-nodejs-compatible.md` and `docs/cli/logseq-cli.md`.

## Problem statement

`db-worker-node` currently requires `better-sqlite3` from `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/platform/node.cljs`.

`logseq-cli` and Electron desktop both depend on this daemon runtime through `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs`, so backend driver replacement must not change daemon API behavior.

The current ncc bundle plan and tests assume native `.node` assets are emitted and copied next to `dist/db-worker-node.js`, which is specific to `better-sqlite3` and must be revised after migration.

Node.js in this repository is already pinned to `>=22.20.0` in `/Users/rcmerci/gh-repos/logseq/package.json`, so `node:sqlite` is available, but it is still experimental and emits runtime warnings that we need to account for.

## Current implementation map

| Area | Current implementation | Migration impact |
| --- | --- | --- |
| Node sqlite adapter | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/platform/node.cljs` wraps `better-sqlite3` with custom `exec` and `transaction` behavior. | Replace constructor and statement execution with `node:sqlite` API while preserving wrapper contract. |
| Daemon runtime contract | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs` exposes `/healthz`, `/readyz`, `/v1/invoke`, `/v1/events`. | No protocol change allowed. |
| CLI runtime spawn | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs` spawns `dist/db-worker-node.js`. | Behavior must remain unchanged. |
| Bundle smoke tests | `/Users/rcmerci/gh-repos/logseq/src/test/logseq/db_worker/ncc_bundle_test.cljs` expects a missing native `.node` asset failure mode. | Replace asset assertions to match built-in sqlite runtime with zero native assets. |
| Dependency declaration | `/Users/rcmerci/gh-repos/logseq/package.json` includes `better-sqlite3`. | Remove dependency and refresh lockfile. |
| CLI documentation | `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` references `dist/build/Release/better_sqlite3.node`. | Update build output description and troubleshooting text. |

## Target architecture

```text
logseq-cli / electron
  -> db-worker-node HTTP API
    -> frontend.worker.db-core
      -> frontend.worker.platform.node sqlite wrapper
        -> node:sqlite DatabaseSync
          -> graph-dir/*.sqlite files
```

The wrapper contract consumed by db-core remains `open-db`, `exec`, `transaction`, and `close`.

The wrapper implementation changes from `better-sqlite3` to `node:sqlite` internals only.

## Testing Plan

I will use `@test-driven-development` and add failing tests first for adapter behavior and bundle assumptions before modifying runtime code.

I will add focused Node adapter tests for parameter binding, array-row reads, commit behavior, and rollback behavior so the compatibility wrapper is behavior-locked.

I will keep existing daemon smoke tests and CLI sqlite import/export integration tests as end-to-end regression guards.

I will update ncc bundle tests so they validate standalone runtime startup without relying on native `.node` artifacts.

I will run `bb dev:test` for focused namespaces first, then run `bb dev:lint-and-test` for the repository checklist.

I will use `@clojure-debug` if any ClojureScript test fails unexpectedly while porting the adapter.

NOTE: I will write *all* tests before I add any implementation behavior.

## Implementation plan

### Phase 1: Lock behavior with failing tests.

1. Add a new test namespace at `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/platform_node_test.cljs` to cover Node sqlite wrapper behavior in isolation.
2. Add a failing test that `exec` with SQL string creates schema and writes data through the wrapper.
3. Add a failing test that `exec` with `{:sql ... :bind ... :rowMode "array"}` returns array rows in the same shape used by `restore-data-from-addr`.
4. Add a failing test that named bindings with `$name` and `:name` styles are both accepted by the wrapper.
5. Add a failing test that wrapper `transaction` commits writes on success.
6. Add a failing test that wrapper `transaction` rolls back writes when callback throws.
7. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/db_worker/ncc_bundle_test.cljs` asserting bundled runtime can start even when bundle manifest has zero assets.
8. Replace the current missing-native-asset expectation test with a failing test that checks bundle manifest format and actionable errors for missing manifest or missing entry script instead.
9. Run `bb dev:test -v 'frontend.worker.platform-node-test'` and confirm failures before implementation.
10. Run `bb dev:test -v 'logseq.db-worker.ncc-bundle-test'` and confirm failures before implementation.

### Phase 2: Port Node sqlite adapter to node:sqlite.

11. Edit `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/platform/node.cljs` to replace `"better-sqlite3"` require with `"node:sqlite"`.
12. Build a `DatabaseSync` constructor resolver compatible with Shadow-CLJS interop and avoid default-export assumptions.
13. Keep `open-sqlite-db` async shape unchanged and create `DatabaseSync` after ensuring parent directory exists.
14. Re-implement statement execution so `:rowMode "array"` maps to `StatementSync#setReturnArrays(true)`.
15. Re-implement positional and named parameter passing for array and object binds without changing db-core callsites.
16. Preserve existing bind key normalization behavior for `$name` and `:name` forms to avoid hidden regressions.
17. Re-implement wrapper `transaction` semantics using explicit SQL transaction control with rollback on exceptions.
18. Add nested-transaction safety via savepoint naming or equivalent deterministic strategy to avoid partial writes from nested calls.
19. Keep wrapper `close` idempotent and compatible with existing shutdown paths in `db-core` and daemon stop.
20. Keep all public platform map keys unchanged in `node-platform`.

### Phase 3: Update dependency and bundle assumptions.

21. Remove `better-sqlite3` from `/Users/rcmerci/gh-repos/logseq/package.json` dependencies.
22. Run `yarn install` to refresh `/Users/rcmerci/gh-repos/logseq/yarn.lock` and verify `better-sqlite3` is removed from runtime dependency graph.
23. Verify no remaining runtime require for `better-sqlite3` via `rg -n "better-sqlite3" /Users/rcmerci/gh-repos/logseq/src /Users/rcmerci/gh-repos/logseq/package.json /Users/rcmerci/gh-repos/logseq/yarn.lock`.
24. Keep `/Users/rcmerci/gh-repos/logseq/scripts/package.json` unchanged in this task because scope is limited to `logseq-cli` and `db-worker-node` runtime paths.
25. Update `/Users/rcmerci/gh-repos/logseq/scripts/build-db-worker-node-bundle.mjs` only if manifest handling needs explicit support for empty asset arrays.

### Phase 4: Refresh tests and docs around runtime packaging.

26. Update `/Users/rcmerci/gh-repos/logseq/src/test/logseq/db_worker/ncc_bundle_test.cljs` to stop asserting a required `.node` asset exists.
27. Keep startup smoke test that runs copied `db-worker-node.js` from a temporary runtime directory with no `node_modules`.
28. Add assertions that `/healthz`, `/readyz`, and `/v1/shutdown` still work under bundled runtime.
29. Update `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` build section to remove `better_sqlite3.node` runtime-asset example.
30. Update `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` troubleshooting text to describe expected bundle output when native assets are absent.
31. Update references in `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/task--db-worker-nodejs-compatible.md` to reflect that Node runtime now uses built-in sqlite.

### Phase 5: Run regression and verification commands.

32. Run `bb dev:test -v 'frontend.worker.platform-node-test'` and expect `0 failures, 0 errors`.
33. Run `bb dev:test -v 'frontend.worker.db-worker-node-test/db-worker-node-daemon-smoke-test'` and expect daemon startup and query path to pass.
34. Run `bb dev:test -v 'frontend.worker.db-worker-node-test/db-worker-node-import-db-base64'` and expect sqlite export/import behavior to pass.
35. Run `bb dev:test -v 'logseq.db-worker.ncc-bundle-test'` and expect standalone bundle smoke tests to pass.
36. Run `bb dev:test -v 'logseq.cli.integration-test/test-cli-graph-export-import-sqlite'` and expect end-to-end CLI sqlite flow to pass.
37. Run `clojure -M:cljs compile db-worker-node logseq-cli` and expect successful node-script builds.
38. Run `yarn db-worker-node:release:bundle` and verify `dist/db-worker-node.js` still starts with `node ./dist/db-worker-node.js --help`.
39. Run `bb dev:lint-and-test` and expect full lint and test checks to pass.
40. Review changed files against `/Users/rcmerci/gh-repos/logseq/prompts/review.md` checklist before merge.

## Edge cases to validate during implementation

| Scenario | Expected behavior |
| --- | --- |
| Named parameter binding uses `$name` keys from current callsites. | Statement executes without bind-key mismatch errors. |
| Named parameter binding uses `:name` keys from normalized callsites. | Statement executes and returns same data as before. |
| `rowMode` is `"array"` for kv restore reads. | First row remains index-addressable for existing `first` and destructuring logic. |
| Transaction callback throws mid-write. | All writes in that transaction scope are rolled back. |
| Nested transaction callback occurs inside outer transaction. | Inner failure does not commit partial data and outer behavior is deterministic. |
| ncc bundle emits zero extra assets. | Bundle tests and CLI docs still treat runtime as valid standalone output. |
| Daemon starts under Node 22 and emits experimental sqlite warning. | Warning does not break health/readiness checks or CLI invoke flow. |
| Graph sqlite import/export uses large payloads. | Base64 transport and file writes still preserve binary integrity. |

## Decisions confirmed

1. Keep Node experimental `node:sqlite` warning output as-is for this migration phase; warning suppression and logging policy changes are out of scope.
2. Scope is limited to `logseq-cli` and `db-worker-node`; do not modify `/Users/rcmerci/gh-repos/logseq/scripts/package.json` in this task.
3. No temporary fallback flag to `better-sqlite3`; enforce one-way migration to built-in `node:sqlite`.
4. Treat Node.js `>=22.20.0` as a hard prerequisite for local and CI runtime to ensure `node:sqlite` availability.

## Testing Details

The adapter unit tests will validate observable behavior for SQL execution, parameter binding, row shape, and transaction semantics instead of testing internal helper structure.

The daemon smoke tests will validate real process startup and thread-api calls so platform wiring and lock behavior stay stable.

The CLI integration sqlite export/import test will verify user-visible behavior from command surface to db-worker storage backend.

The bundle tests will validate standalone runtime packaging assumptions that changed because native `.node` assets are no longer required.

## Implementation Details

- Keep `db-worker-node` HTTP and SSE API contracts unchanged.
- Keep platform adapter keys unchanged to avoid db-core callsite churn.
- Implement a compatibility wrapper over `DatabaseSync` instead of refactoring db-core.
- Preserve bind normalization semantics for backward compatibility.
- Implement explicit rollback-safe transaction handling with nested safety.
- Remove `better-sqlite3` only from main runtime dependency declarations.
- Update bundle tests to assert behavior, not driver-specific artifact names.
- Update CLI docs and historical planning notes that mention native sqlite assets.
- Require Node.js `>=22.20.0` in local and CI verification environments.
- Run focused tests first, then repository-wide lint and tests.
- Follow `@test-driven-development` and `@clojure-debug` for implementation and debugging workflow.

---
