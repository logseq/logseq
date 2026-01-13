# Remote Rebase (Client)

This doc describes how the client rebases and applies remote tx data in
`rebase-apply-remote-tx!` to keep the server thin and to tolerate offline
conflicts.

## Goals

- Apply remote tx data on top of the local DB even when the client made offline
  changes that would otherwise invalidate the tx.
- Keep server-side logic minimal; the client is responsible for sanitizing and
  repairing remote txs before transact.

## Flow Summary

1. Collect pending local txs and derive a reversed tx set.
2. Build a rebase DB by applying reversed local txs to the current DB. This
   represents the server base state.
3. Sanitize the remote tx data against the current DB (with offline changes)
   so it can be safely transacted.
4. Compute a tx-report on the rebase DB to identify deletes and handle them
   first (pages before blocks).
5. Transact the sanitized remote tx data and fix duplicate orders.

## Sanitation Rules

Remote tx data is transformed before transact to avoid invalid operations:

- Convert :block/uuid retracts into :db.fn/retractEntity.
- Keep only the last :block/parent update per entity.
- Drop datoms that reference missing entities or missing ref targets.
- Repair parent cycles by reparenting to the page root.
- Drop class extends updates that would introduce a cycle.

## Delete Semantics

Deletes are detected using the rebase DB. When a parent is deleted on the
server, the client deletes that parent and all of its children, even if the
client moved some of those children offline.

## Testing

See `src/test/frontend/worker/db_sync_test.cljs` for rebase-related tests, such
as cycle handling and invalid parent updates.
