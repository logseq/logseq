# Sync Download Create Empty Db Implementation Plan

Goal: Ensure `sync download` never writes `db-initial-data` before snapshot import by starting `db-worker-node` with an explicit empty-db mode.

Architecture: Add a new db-worker startup flag `--create-empty-db` and plumb it through CLI server orchestration only for the `sync download` path.

Architecture: When the flag is enabled, `db-worker-node` will call `:thread-api/create-or-open-db` with `{:datoms []}` during daemon startup so `frontend.worker.db-core/<create-or-open-db!` skips `build-db-initial-data` writes.

Tech Stack: ClojureScript, Node child process args, db-worker daemon lock lifecycle, thread-api invoke path, babashka test runner.

Related: Relates to `docs/agent-guide/047-logseq-cli-sync-command.md`.

Related: Builds on `docs/agent-guide/048-sync-download-start-reliability.md`.

Related: Relates to `docs/agent-guide/033-desktop-db-worker-node-backend.md` and `docs/agent-guide/034-db-worker-node-owner-process-management.md`.

## Problem statement

`sync download` currently reaches remote graph listing by ensuring a db-worker runtime for the target repo before the snapshot is imported.

The startup call in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs` always invokes `:thread-api/create-or-open-db` with empty opts `{}`.

`/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` interprets `datoms=nil` as a signal to write `db-initial-data` when initial data does not already exist.

For download-first graph bootstrap, this creates local initialization writes before remote snapshot import, which is unnecessary and can introduce non-snapshot state.

The desired behavior is to create an empty DB for download bootstrap and let sync snapshot import be the only writer of initial graph content.

`sync download` must also verify the target graph DB is empty before importing snapshot data.

If the DB is not empty, `sync download` must fail fast with a clear error instead of continuing import.

This plan follows `@planning-documents`, `@writing-plans`, and executes implementation with `@test-driven-development` plus `@clojure-debug` on failures.

## Testing Plan

I will add daemon argument plumbing tests that fail first when `--create-empty-db` is missing from spawn and parse layers.

I will add sync command execution tests that fail first unless `sync download` asks server orchestration to enable create-empty mode.

I will add db-worker-node startup behavior tests that fail first unless startup uses `{:datoms []}` when create-empty mode is enabled.

I will add sync download safety tests that fail first unless the command rejects non-empty graph DB state.

I will run focused test namespaces after each phase and then run the full `bb dev:lint-and-test` regression suite.

NOTE: I will write *all* tests before I add any implementation behavior.

## Current integration map

```text
sync download
  -> /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs
  -> /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs
  -> /Users/rcmerci/gh-repos/logseq/src/main/logseq/db_worker/daemon.cljs
  -> /Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs
  -> /Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs
  -> :thread-api/db-sync-download-graph-by-id import path
```

## Scope and non-goals

In scope are CLI-to-daemon argument plumbing, db-worker startup behavior change behind a new flag, tests, and docs updates.

Out of scope are sync protocol changes, snapshot payload format changes, and non-download command behavior changes.

## Implementation plan

### Phase 0. Baseline and failure capture.

1. Run `bb dev:test -v logseq.db-worker.daemon-test` and record baseline.
2. Run `bb dev:test -v frontend.worker.db-worker-node-test` and record baseline.
3. Run `bb dev:test -v logseq.cli.server-test` and record baseline.
4. Run `bb dev:test -v logseq.cli.command.sync-test` and record baseline.

### Phase 1. RED tests for daemon flag plumbing.

5. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/db_worker/daemon_test.cljs` that `spawn-server!` appends `--create-empty-db` when `:create-empty-db? true` is passed.
6. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/db_worker/daemon_test.cljs` that `spawn-server!` keeps default args unchanged when `:create-empty-db?` is absent or false.
7. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_worker_node_test.cljs` that `parse-args` recognizes `--create-empty-db` and maps it to `:create-empty-db? true`.
8. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_worker_node_test.cljs` that help output documents `--create-empty-db` as a startup option.
9. Run `bb dev:test -v logseq.db-worker.daemon-test` and `bb dev:test -v frontend.worker.db-worker-node-test` and confirm RED.

### Phase 2. GREEN implementation for daemon flag plumbing.

10. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/db_worker/daemon.cljs` so `spawn-server!` accepts `:create-empty-db?` and conditionally appends `--create-empty-db`.
11. Keep process scanning in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/db_worker/daemon.cljs` compatible by ignoring unknown flags as today.
12. Update `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs` `parse-args` to set `:create-empty-db? true` when `--create-empty-db` is present.
13. Update `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs` `show-help!` to include one line for `--create-empty-db`.
14. Re-run `bb dev:test -v logseq.db-worker.daemon-test` and `bb dev:test -v frontend.worker.db-worker-node-test` and confirm green.

### Phase 3. RED tests for sync download orchestration.

15. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/sync_test.cljs` that `:sync-download` calls `cli-server/ensure-server!` with `:create-empty-db? true`.
16. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/server_test.cljs` that `spawn-server!` forwards `:create-empty-db?` from `ensure-server-started!` config when spawning a new daemon.
17. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` that `sync download` path keeps existing `graph-exists` guard unchanged while still enabling create-empty mode on success paths.
18. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/sync_test.cljs` that `sync download` fails fast with a dedicated error when the graph DB is not empty.
19. Run `bb dev:test -v logseq.cli.command.sync-test` and `bb dev:test -v logseq.cli.server-test` and confirm RED.

### Phase 4. GREEN implementation for sync download orchestration.

20. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs` so the `:sync-download` execution path enriches config with `:create-empty-db? true` before `invoke-global` and `invoke-with-repo`.
21. Add a DB emptiness guard in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs` or worker thread-api path that explicitly validates target graph DB is empty before calling `:thread-api/db-sync-download-graph-by-id`.
22. Keep non-download sync actions in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs` unchanged so default startup remains backward compatible.
23. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/server.cljs` and its internal `spawn-server!` wrapper to pass through `:create-empty-db?` to daemon spawn.
24. Re-run `bb dev:test -v logseq.cli.command.sync-test` and `bb dev:test -v logseq.cli.server-test` and confirm green.

### Phase 5. RED tests for startup create-or-open behavior.

25. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_worker_node_test.cljs` that startup invokes `thread-api/create-or-open-db` with `[repo {:datoms []}]` when `:create-empty-db? true`.
26. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_worker_node_test.cljs` that default startup still invokes `[repo {}]` when flag is not set.
27. Add a failing behavior test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_sync_test.cljs` or `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_worker_node_test.cljs` validating download bootstrap path does not depend on locally generated initial data.
28. Add a failing behavior test validating non-empty graph DB state is rejected before import starts.
29. Run targeted tests and confirm RED failures are behavior-based.

### Phase 6. GREEN implementation for empty-db startup.

30. Update `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs` `start-daemon!` to pass startup opts `{:datoms []}` to `:thread-api/create-or-open-db` only when `:create-empty-db? true`.
31. Keep lock lifecycle and health endpoints unchanged in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs`.
32. Add a tiny helper in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs` if needed to keep startup opts construction testable.
33. Implement or expose a reusable DB emptiness check in worker/CLI path and return a stable error code for non-empty DB.
34. Re-run `bb dev:test -v frontend.worker.db-worker-node-test` and the selected download behavior test namespace until green.

### Phase 7. Docs and regression.

35. Update `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` to document that `sync download` starts db-worker in create-empty mode and rejects non-empty DB state.
36. Update `/Users/rcmerci/gh-repos/logseq/docs/developers/desktop-db-worker-node.md` with a note that create-empty mode is CLI download bootstrap behavior and does not change desktop default startup.
37. Run `bb dev:lint-and-test` from `/Users/rcmerci/gh-repos/logseq` and ensure full suite passes.
38. Run final review checklist in `/Users/rcmerci/gh-repos/logseq/prompts/review.md` before merge.

## Edge cases to cover explicitly

| Scenario | Expected behavior |
|---|---|
| `sync download` for a brand-new graph. | Daemon starts with `--create-empty-db` and startup `create-or-open-db` uses `{:datoms []}`. |
| `sync start`, `sync upload`, and graph CRUD commands. | No `--create-empty-db` flag is used, and existing startup behavior stays unchanged. |
| Existing local graph (`graph-exists`). | Command fails before daemon startup as it does today. |
| Existing ready daemon lock for the same repo. | Command must validate DB emptiness before download and fail fast when DB is not empty. |
| Missing remote graph. | `remote-graph-not-found` response remains unchanged, and no behavior regression in error shape occurs. |
| Flag typo or absent flag. | Startup remains backward compatible with default `create-or-open-db` opts `{}`. |

## Verification command matrix

| Command | Expected outcome |
|---|---|
| `bb dev:test -v logseq.db-worker.daemon-test` | Spawn arg and parser tests for `--create-empty-db` pass. |
| `bb dev:test -v frontend.worker.db-worker-node-test` | Startup invoke args and help text tests pass. |
| `bb dev:test -v logseq.cli.server-test` | CLI server pass-through tests for `:create-empty-db?` pass. |
| `bb dev:test -v logseq.cli.command.sync-test` | `sync download` ensures server with create-empty mode. |
| `bb dev:test -v logseq.cli.commands-test` | Existing `graph-exists` guard and command dispatch remain stable. |
| `bb dev:test -v logseq.cli.integration-test/test-cli-sync-download-and-start-readiness-with-mocked-sync` | Integration path remains green with download plus start readiness behavior. |
| `bb dev:lint-and-test` | Full lint and unit test suite exits with code `0`. |

## Rollout notes

This change is intentionally scoped to startup behavior for `sync download` and does not alter runtime sync protocol.

If regressions appear, rollback is to remove `:create-empty-db?` wiring in sync command and keep daemon/parser support dormant until retried.

## Testing Details

Tests focus on externally visible behavior, namely which startup args are passed and whether startup create-or-open uses empty datoms in download bootstrap mode.

Tests also verify `sync download` rejects non-empty graph DB state before any import side effect.

Tests avoid asserting private implementation internals except where argument boundaries are the behavior contract.

Integration coverage confirms existing sync download and sync start semantics remain stable after plumbing changes.

## Implementation Details

- Add `:create-empty-db?` option plumbing from sync command to CLI server spawn path.
- Add `--create-empty-db` process arg emission in daemon spawn helper.
- Parse `--create-empty-db` in db-worker-node entrypoint args.
- When create-empty is enabled, startup invoke payload uses `[repo {:datoms []}]`.
- Add a strict pre-download emptiness check and fail with a stable error code when DB is not empty.
- Keep default startup invoke payload `[repo {}]` for all other flows.
- Keep lock ownership and stale-lock cleanup behavior unchanged.
- Keep command-level `graph-exists` and `remote-graph-not-found` behaviors unchanged.
- Update CLI and developer docs with exact scope of the new flag.
- Run targeted tests first, then full `bb dev:lint-and-test`.
- Use `@test-driven-development` workflow and `@clojure-debug` when failures are non-obvious.

## Question

No open question.

---
