# ADR 0013: Worker-Owned Undo/Redo Test Ownership

Date: 2026-03-21
Status: Proposed

## Context
ADR 0012 moves DB undo/redo ownership from the main thread to the db worker.

That architectural move is not complete if the test suite still treats
`src/test/frontend/undo_redo_test.cljs` as the primary place to assert DB
history behavior.

Today the old main-thread file still contains most undo/redo tests, including:

- local tx recording
- semantic forward and inverse metadata
- insert/save/delete replay sequences
- replay conflict and skip behavior
- validation behavior tied to DB replay

Those tests were correct for the old design, but they now encourage the wrong
ownership boundary.

The worker already owns:

- worker datascript DB mutation
- client-op persistence
- semantic replay
- pending action identity
- replay safety decisions

The main thread now mainly owns:

- route/sidebar UI restoration
- cursor restoration from worker result metadata
- thin browser-facing proxy calls

The test suite should reflect that split directly.

## Decision
1. `src/test/frontend/worker/undo_redo_test.cljs` becomes the primary home for
   DB-history-focused undo/redo tests.
2. `src/test/frontend/undo_redo_test.cljs` is reduced to main-thread-only
   coordination tests.
3. Replay, conflict, and rebase-heavy assertions that are really worker replay
   behavior belong in `src/test/frontend/worker/db_sync_test.cljs`, not in
   either undo-redo namespace test file.
4. No new DB-history behavior test should be added to
   `src/test/frontend/undo_redo_test.cljs`.

## Test Ownership Rules

### Keep in `src/test/frontend/worker/undo_redo_test.cljs`

- local tx recording gates
- semantic metadata persistence
- worker-owned undo stack and redo stack mutation
- canonical action-id and semantic op persistence
- worker-owned DB-history entries that include pending editor-info and UI-state
  metadata

### Keep in `src/test/frontend/worker/db_sync_test.cljs`

- `apply-history-action!` replay behavior
- semantic replay correctness
- conflict and skip behavior caused by worker replay safety
- rebase interactions
- client-op row persistence and rewrite behavior

### Keep in `src/test/frontend/undo_redo_test.cljs`

- route/sidebar UI-state restoration on the main thread
- cursor restoration from worker result metadata
- browser-facing proxy semantics in `frontend.undo-redo` and
  `frontend.handler.history`
- any pure coordination helper that still lives only on the main thread

## Migration Buckets

### Bucket 1. Recording and metadata tests.

Move these first:

- `undo-records-only-local-txs-test`
- `undo-history-records-semantic-action-metadata-test`
- `undo-history-records-forward-ops-for-editor-save-block-test`
- `undo-history-canonicalizes-insert-block-uuids-test`

These tests map directly to worker history ownership and do not require route or
cursor restoration.

### Bucket 2. Basic local replay tests.

Move next, but only after the worker fixture persists matching client-op rows:

- `undo-works-for-local-graph-test`
- `repeated-save-block-content-undo-redo-test`
- `repeated-editor-save-block-content-undo-redo-test`
- `editor-save-two-blocks-undo-targets-latest-block-test`
- `new-local-save-clears-redo-stack-test`

If a test still depends on browser-only helpers, rewrite it to assert worker DB
behavior directly or leave it temporarily unmoved.

### Bucket 3. Delete/recycle sequence tests.

Reclassify before moving:

- `insert-save-delete-sequence-undo-redo-test`
- `undo-redo-works-for-recycle-delete-test`

If the real behavior under test is semantic replay, keep or move it to
`src/test/frontend/worker/db_sync_test.cljs`.

### Bucket 4. Conflict and skip tests.

Reclassify these into worker replay coverage unless they are truly worker stack
mutation tests:

- `undo-conflict-clears-history-test`
- `undo-works-with-remote-updates-test`
- `undo-skips-when-parent-missing-test`
- `undo-skips-when-block-deleted-remote-test`
- `undo-skips-when-undo-would-create-cycle-test`
- `undo-skips-conflicted-move-and-keeps-earlier-history-test`
- `redo-builds-reversed-tx-when-target-parent-is-recycled-test`
- `undo-skips-move-when-original-parent-is-recycled-test`

### Bucket 5. Main-thread leftovers.

After Buckets 1-4:

- keep only route restoration
- keep only cursor restoration
- keep only proxy/coordination tests
- add a namespace comment in `src/test/frontend/undo_redo_test.cljs` that it is
  no longer the DB-history source-of-truth test file

## Implementation Rules

1. Every moved worker test must use a fixture that owns both:
   - worker datascript conn
   - worker client-ops conn
2. That fixture must route tx reports through both:
   - `frontend.worker.sync/enqueue-local-tx!`
   - `frontend.worker.undo-redo/gen-undo-ops!`
3. Tests that expect persisted action lookup must attach a stable
   `:db-sync/tx-id`.
4. Do not duplicate replay tests between `worker/undo_redo_test.cljs` and
   `worker/db_sync_test.cljs`.
5. Delete the original test only after the worker version passes.

## Consequences

### Positive

- The test suite matches the actual runtime ownership boundary.
- Worker replay regressions are caught where they actually happen.
- The old main-thread test file becomes much easier to reason about.

### Negative

- Some existing tests need adaptation rather than straight copy because they
  implicitly relied on old main-thread stack storage.
- The migration requires explicit decisions about whether a test is about
  worker history ownership or worker replay behavior.

## Verification

Representative focused commands during migration:

```bash
bb dev:test -v frontend.worker.undo-redo-test/undo-records-only-local-txs-test
bb dev:test -v frontend.worker.undo-redo-test/undo-history-records-semantic-action-metadata-test
bb dev:test -v frontend.worker.undo-redo-test/undo-history-canonicalizes-insert-block-uuids-test
bb dev:test -v frontend.worker.db-sync-test/apply-history-action-redo-replays-save-block-test
bb dev:test -v frontend.worker.db-sync-test/apply-history-action-redo-replays-block-concat-test
bb dev:test -v frontend.worker.db-sync-test/apply-history-action-redo-replays-paste-into-empty-target-test
```

## Exit Criteria

- `src/test/frontend/worker/undo_redo_test.cljs` owns the DB-history recording
  tests.
- `src/test/frontend/undo_redo_test.cljs` contains only main-thread coordination
  tests.
- No worker-owned DB-history scenario is tested only in the main-thread file.
