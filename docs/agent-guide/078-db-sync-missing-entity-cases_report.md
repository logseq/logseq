# DB Sync Missing Entity Cases

This note records local reproduction cases for checksum drift where the client can
be missing an entity while its sync cursor is not behind enough to naturally
recover from the server tx log.

Scope for this pass:

- Include normal incremental sync paths.
- Exclude download/import paths.
- Do not rely on whole-graph checksum computation on the server.

## Case 1: Non-Recoverable Reject Leaves Local Mutation Applied

Status: reproduced and fixed locally.

Test:

`frontend.worker.db-sync-test/tx-reject-rolls-back-failed-local-delete-before-later-remote-update-test`

Sequence:

1. Client and server both have block `B`.
2. Client deletes `B` locally. The delete is persisted in `client_ops` as a
   pending local tx, and `B` is removed from the client Datascript db.
3. The tx is sent to the server.
4. Server returns a non-recoverable `tx/reject` for that tx.
5. On master, the client marks the tx failed and clears inflight state, but does
   not reverse the already-applied local delete.
6. Client now has no pending local tx for `B`, while server still has `B`.
7. A later remote tx updates `B`.
8. Client detects that the remote tx needs a locally missing block and enters the
   missing-block repair path. In the test harness this surfaces as a
   `:db-sync/missing-field` for `:repair-blocks-url`; in production this is the
   same class of missing-entity state that later repair tries to hide.

Root cause:

`handle-tx-reject!` updated `client_ops` state but did not restore the graph db
to the last server-accepted state for the rejected local tx.

Fix direction:

Before marking a non-recoverable rejected tx failed, roll back its local graph
mutation using the tx's stored `reversed-tx`. Keep the recoverable
`missing-block-uuids` branch unchanged because that path intentionally keeps the
local mutation and uploads repair data.

Verification:

- The new RED test fails on master before the rollback change.
- The same test passes after rollback.
- Existing `tx/reject` tests for failed tx marking, selective success handling,
  recoverable missing-block repair, and stale reject behavior still pass.

## Case 2: Partial Reject Leaves Cursor Behind Accepted Local Txs

Status: reproduced and fixed locally.

Test:

`frontend.worker.db-sync-test/tx-reject-partial-success-advances-local-cursor-test`

Sequence:

1. Client and server both have block `B`.
2. Client deletes `B` locally, then makes another local edit.
3. The client sends both txs in one `tx/batch`.
4. Server accepts the delete and advances remote `t`, then rejects the later
   edit with `:success-tx-ids`, `:failed-tx-id`, and the new `:t`.
5. Before the fix, the client marked the successful tx non-pending and rolled
   back the failed tx, but did not advance `client_ops.local-tx`.
6. The client graph now correctly lacks `B`, because the server accepted that
   delete, but the next pull still starts from the old cursor.
7. That pull can replay the accepted delete as a remote tx. Since `B` is already
   missing locally, the replay can enter missing-block repair even though the
   graph state itself is not behind.

Root cause:

`handle-tx-reject!` treated all non-stale rejects as failure bookkeeping and did
not account for the successful prefix that the server had already committed.

Fix direction:

When a `tx/reject` includes successful tx ids and a newer remote `t`, advance the
local cursor to that `t` after rollback and pending-state updates. The server
also includes its stored sync checksum in partial reject responses so the client
can validate the accepted boundary without asking the server to recompute a
whole-graph checksum.

Verification:

- The RED test failed before the cursor change with `client_ops.local-tx` still
  at `0` after the partial reject.
- The same test passes after the cursor is advanced.
- `logseq.db-sync.worker-handler-sync-test/tx-batch-reject-includes-success-and-failed-tx-ids-test`
  now asserts that the partial reject response carries the stored server
  checksum.

## Checked But Not New Root Causes

These were inspected because they can also combine local pending state with
remote tx replay:

- `tx/batch/ok`: already advances local cursor with
  `max(current-local-tx, remote-tx)` and only clears inflight acked rows.
- Stale/out-of-order `pull/ok`: existing tests ensure older pull responses do
  not overwrite newer graph or cursor state.
- Duplicate local/remote `create-page`, including the iOS auto-journal shape:
  existing rebase tests preserve the page uuid and remote children instead of
  deleting the remote entity.
- Missing-block repair boundaries: existing tests cover normal repair and the
  obsolete created/deleted or updated/deleted block cases, both with and without
  local changes.

## Discarded Case: Pull Cursor Ahead of Debounced Graph Store

Status: tested and not reproduced for normal remote apply.

Hypothesis:

`pull/ok` applies remote txs to the graph db, then writes `client_ops.local-tx`.
If the graph db write were only debounced while `local-tx` persisted immediately,
a restart could restore a new cursor with old graph data.

Result:

Normal remote tx application goes through `ldb/batch-transact!`, which calls
`d/store` immediately before `client_ops.local-tx` is advanced. The simple
storage reload reproduction did not lose the remote block after `pull/ok`.

Conclusion:

This is not the confirmed incremental-sync root cause for the current pass.
