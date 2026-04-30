# CLI Sync Upload Graph UUID Alignment Implementation Plan

Goal: Make `logseq sync upload` persist local graph UUID metadata so CLI and web app upload flows leave the graph in the same sync-ready state.

Architecture: Keep `:thread-api/db-sync-upload-graph` as the single upload contract used by both CLI and web app.
Architecture: Align identity persistence inside `frontend.worker.sync` so every resolved graph id is written to both client-op storage and graph KV metadata.
Architecture: Use web app graph identity persistence semantics from `frontend.handler.db_based.sync/<rtc-create-graph!` as the source of truth for what local metadata must exist after upload bootstrap.

Tech Stack: ClojureScript, Promesa, Datascript, db-worker-node HTTP invoke API, logseq-cli sync command stack.

Related: Builds on `docs/agent-guide/051-logseq-cli-sync-upload-fix.md`.
Related: Relates to `docs/agent-guide/047-logseq-cli-sync-command.md`.

## Problem statement

`logseq sync upload` currently reaches `frontend.worker.sync/upload-graph!` through `db-worker-node` and can complete snapshot upload while local graph KV metadata still does not contain `:logseq.kv/graph-uuid`.

The current worker persistence path writes graph id to `frontend.worker.sync.client-op` but does not write `:logseq.kv/graph-uuid` into the graph database.

The web app has an established graph identity persistence pattern in `frontend.handler.db_based.sync/<rtc-create-graph!`, where graph creation persists `:logseq.kv/graph-uuid` and related sync metadata into graph KV.

This mismatch causes CLI-uploaded graphs to remain partially initialized from the local metadata perspective even though remote upload succeeded.

The practical symptom is that features reading graph UUID from `logseq.db/get-graph-rtc-uuid` still see nil after upload.

I will use @test-driven-development for every implementation step and keep CLI behavior aligned with @logseq-cli command contracts.

## Current flow comparison

| Dimension | CLI upload flow today | Web app reference behavior | Gap to close |
|---|---|---|---|
| Entry point | `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs` via `execute-sync-upload`. | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/handler/db_based/sync.cljs` via `<rtc-upload-graph!` and `<rtc-create-graph!`. | None on entry API shape. |
| Worker API | Calls `:thread-api/db-sync-upload-graph` through `/v1/invoke`. | Calls the same `:thread-api/db-sync-upload-graph` for upload. | None on worker method selection. |
| Graph id resolution | `frontend.worker.sync/<ensure-upload-graph-identity!` resolves from DB KV, client-op, remote list, or remote create. | Same worker resolution path during upload bootstrap. | None on resolution source order. |
| Graph id persistence | `frontend.worker.sync/persist-upload-graph-identity!` writes client-op graph UUID and sync flags but not `:logseq.kv/graph-uuid`. | Web app graph create flow writes `:logseq.kv/graph-uuid` into graph KV. | Missing graph UUID write in worker upload persistence path. |
| Post-upload local state | Graph may still miss `:logseq.kv/graph-uuid`. | Expected local graph identity metadata is complete after remote bootstrap. | CLI path is not fully sync-ready for UUID readers. |

## Target aligned behavior

After `logseq sync upload --graph <name>` succeeds, local graph metadata must contain a stable `:logseq.kv/graph-uuid` value in graph KV and the same graph id in client-op storage.

The persistence rule must be enforced by worker sync code so both CLI and web app callers inherit identical behavior.

When upload finds graph id from client-op fallback, worker must backfill missing graph KV UUID before returning success.

Repeated uploads must be idempotent and must not create a new graph id or rewrite to a different value unexpectedly.

## Architecture and integration points

```text
CLI path
  logseq.cli.command.sync/execute-sync-upload
    -> logseq.cli.transport/invoke POST /v1/invoke
    -> frontend.worker.db_worker_node /v1/invoke
    -> :thread-api/db-sync-upload-graph in frontend.worker.db_core
    -> frontend.worker.sync/<ensure-upload-graph-identity!
    -> frontend.worker.sync/upload-graph!

Web app path
  frontend.handler.db_based.sync/<rtc-upload-graph!
    -> state/<invoke-db-worker :thread-api/db-sync-upload-graph
    -> frontend.worker.sync/<ensure-upload-graph-identity!
    -> frontend.worker.sync/upload-graph!

Web app source-of-truth identity persistence reference
  frontend.handler.db_based.sync/<rtc-create-graph!
    -> ldb/transact! with :logseq.kv/graph-uuid
```

## Testing Plan

I will add worker unit tests that fail first when upload identity resolution does not persist `:logseq.kv/graph-uuid` into the graph database.

I will add worker unit tests that fail first for the three identity branches, which are graph id from remote create, graph id from remote name match, and graph id from client-op fallback.

I will add regression assertions that verify the persisted graph UUID is readable through `logseq.db/get-graph-rtc-uuid` and matches `client-op/get-graph-uuid`.

I will add a CLI-facing regression check that validates upload success is followed by graph info data containing `logseq.kv/graph-uuid` in real or staged integration coverage.

I will run targeted tests after each micro-change, then run broad lint and test commands before final review.

NOTE: I will write *all* tests before I add any implementation behavior.

## Implementation plan

### Phase 1. Add failing worker tests for UUID persistence parity.

1. Add a failing assertion in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_sync_test.cljs` for remote-create upload bootstrap to assert `ldb/get-graph-rtc-uuid` is set after `<ensure-upload-graph-identity!`.
2. Add a failing assertion in the same file for remote-name-match bootstrap to assert graph KV UUID is also set.
3. Add a failing test for the client-op-fallback branch where graph id exists only in client-op and graph KV UUID is missing before upload identity resolution.
4. Add a failing idempotency assertion that repeated identity ensure calls keep the same graph UUID value.
5. Run `bb dev:test -v frontend.worker.db-sync-test` and confirm the new assertions fail before implementation.

### Phase 2. Implement shared worker identity persistence aligned with web app semantics.

6. Update `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync.cljs` to persist graph UUID into graph KV when graph id is resolved.
7. Reuse the same UUID coercion semantics as web app reference code by converting graph-id string to UUID before writing `:logseq.kv/graph-uuid`.
8. Extend `set-graph-sync-metadata!` or a new helper to write `:logseq.kv/graph-uuid`, `:logseq.kv/graph-remote?`, and `:logseq.kv/graph-rtc-e2ee?` in one place.
9. Keep `client-op/update-graph-uuid` writes unchanged so existing fallback behavior remains compatible.
10. Ensure `<ensure-upload-graph-identity!` calls the persistence helper even when graph id is resolved from local fallback, so backfill works for previously uploaded graphs.
11. Preserve return payload shape from upload identity functions to avoid CLI output contract changes.
12. Run `bb dev:test -v frontend.worker.db-sync-test` until all new and existing sync tests pass.

### Phase 3. Guard CLI and web caller alignment.

13. Add or extend tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/sync_test.cljs` to assert CLI upload still delegates to `:thread-api/db-sync-upload-graph` without introducing a divergent bootstrap branch.
14. Add or extend tests in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/handler/db_based/sync_test.cljs` to assert web app upload path continues to defer bootstrap to worker.
15. Add a regression check in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs` that verifies graph metadata reported after upload includes a graph UUID field when the worker upload path succeeds.
16. Run `bb dev:test -v logseq.cli.command.sync-test` and `bb dev:test -v frontend.handler.db-based.sync-test`.
17. Run `bb dev:test -v logseq.cli.integration-test` and confirm sync upload behavior remains green.

### Phase 4. Document and verify user-visible behavior.

18. Update `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` to state that successful `sync upload` persists local graph UUID metadata.
19. Add a short troubleshooting note that graph UUID should be visible in graph info output after upload.
20. Run `bb dev:lint-and-test` from `/Users/rcmerci/gh-repos/logseq` and confirm exit code `0`.

## Edge cases to cover

| Edge case | Expected behavior |
|---|---|
| Graph id resolved from client-op only. | Worker backfills `:logseq.kv/graph-uuid` in graph KV during upload identity ensure. |
| Graph datascript conn is unavailable. | Worker still keeps client-op graph UUID and returns a structured error or deferred persistence path without false success. |
| Graph id string is malformed. | Worker fails fast with a sync-specific error code instead of writing invalid KV data. |
| Repeated upload on same graph. | Graph UUID stays stable and no duplicate graph identity writes change semantic value. |
| Remote graph list returns multiple same-name matches. | Existing ambiguous-match error remains and CLI surfaces deterministic failure. |

## Clarifications needed before coding

Should the fix include automatic backfill on `sync start` and `sync status` in addition to `sync upload`, or is upload-only backfill sufficient for now.

Should malformed graph-id values be rejected hard or stored as raw strings if UUID coercion fails.

For this iteration, rely on upload-triggered backfill on the next upload; do not add a one-time migration or dedicated backfill command.

## Verification commands

| Command | Expected outcome |
|---|---|
| `bb dev:test -v frontend.worker.db-sync-test` | New UUID persistence tests fail first, then pass after implementation. |
| `bb dev:test -v logseq.cli.command.sync-test` | CLI upload delegation contract stays unchanged. |
| `bb dev:test -v frontend.handler.db-based.sync-test` | Web app upload path remains worker-centered. |
| `bb dev:test -v logseq.cli.integration-test` | Sync upload integration remains green with graph UUID metadata visible post-upload. |
| `bb dev:lint-and-test` | Full lint and test suite passes. |
| `node ./dist/logseq.js --graph demo sync upload --output json` | Returns `status=ok` with graph id on success. |
| `node ./dist/logseq.js --graph demo graph info --output json` | Output includes `logseq.kv/graph-uuid` for the uploaded graph. |

## Testing Details

The primary behavior test is that graph identity is fully persisted locally after upload, not just remotely acknowledged.

Tests will verify externally observable behavior through `ldb/get-graph-rtc-uuid`, `client-op/get-graph-uuid`, and CLI graph info output.

Tests will avoid asserting private implementation internals and will focus on identity outcomes across the three upload identity branches.

## Implementation Details

- Keep all orchestration inside `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync.cljs` so CLI and web callers stay aligned.
- Preserve `:thread-api/db-sync-upload-graph` as the single cross-surface upload API in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs`.
- Reuse existing metadata transaction style from `frontend.handler.db_based.sync/<rtc-create-graph!` for graph UUID persistence semantics.
- Ensure UUID persistence helper is idempotent and safe to call multiple times.
- Keep client-op UUID persistence as a compatibility fallback.
- Do not introduce new cloud API endpoints or protocol changes.
- Keep CLI upload call sequence unchanged in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/sync.cljs`.
- Add regression tests before implementation and run them incrementally with @test-driven-development.
- Update CLI docs to reflect guaranteed local graph UUID persistence after successful upload.

## Decision

For this iteration, upload-triggered backfill is sufficient. Do not add a dedicated backfill command for previously uploaded graphs missing `:logseq.kv/graph-uuid` yet.

---
