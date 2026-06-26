# DB Sync Missing Entity Cases

## Root Cause

A graph download finalized the imported client cursor from a separate
`/sync/:graph-id/pull` response instead of from the snapshot stream itself. If
the snapshot content was older than that preflight cursor, the local DB could be
missing entities whose create tx was at or before the stored cursor. Later
catch-up txs would then reference a missing `[:block/uuid ...]` lookup ref and
fail before reaching a later `:db/retractEntity` for the same block.

The client-side symptom was an iOS startup remote apply failure with one local
pending auto-journal tx. That pending tx is not the missing entity, but it sends
remote apply through the reverse-remote-rebase path while the graph catches up.

## Fix Boundary

Snapshot import must use the cursor from the actual snapshot stream:

- `/snapshot/stream` returns `x-snapshot-t`.
- `download-graph-by-id!` finalizes import with that header value.
- `x-snapshot-t` is exposed through CORS.
- `/snapshot/download` also returns `:t` for protocol visibility.

Remote apply still repairs missing block refs whenever possible. It prunes
obsolete tx items only when all conditions hold:

1. The remote batch references a block UUID missing from the local DB.
2. The client requested server repair data for that UUID.
3. The repair data did not contain that UUID.
4. The same remote batch deletes that UUID.

The pruning applies only to tx items for that block UUID, including lookup refs
and remote temp ids assigned `:block/uuid` in the same pulled batch. Unrelated tx
items in the same batch must still apply.

## Related Incremental-Sync Cases

- Non-recoverable `tx/reject` rolls back the failed local graph mutation before
  marking the tx failed.
- Partial `tx/reject` advances the local cursor when the server committed a
  successful prefix and returns a newer `:t`.
- Accepted local delete replay after reload skips missing-block repair only when
  reversing local pending txs restores the block and the remote batch only
  deletes it.

## Regression Tests

```sh
bb dev:test -v frontend.worker.sync.download-test/download-finalizes-with-snapshot-t-not-preflight-pull-t-test
bb dev:test -v frontend.worker.db-sync-test/apply-remote-txs-skips-unrepaired-missing-block-deleted-in-batch-test
bb dev:test -v frontend.worker.db-sync-test/apply-remote-txs-with-local-changes-skips-unrepaired-missing-block-deleted-in-batch-test
bb dev:test -v frontend.worker.db-sync-test/apply-remote-txs-skips-missing-block-created-then-deleted-in-batch-test
bb dev:test -v frontend.worker.db-sync-test/tx-reject-rolls-back-failed-local-delete-before-later-remote-update-test
bb dev:test -v frontend.worker.db-sync-test/tx-reject-partial-success-advances-local-cursor-test
bb dev:test -v frontend.worker.db-sync-test/pull-ok-same-accepted-delete-after-reload-clears-local-pending-test
bb dev:test -v logseq.db-sync.worker-handler-sync-test/tx-batch-reject-includes-success-and-failed-tx-ids-test
```
