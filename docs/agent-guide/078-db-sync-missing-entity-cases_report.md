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

