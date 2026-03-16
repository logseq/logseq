# ADR 0004: Sync batches are ordered tx entries with persisted `:outliner-op`

Date: 2026-03-16
Status: Accepted

## Context
DB sync previously treated a client upload batch as one transit-encoded tx blob
and the client pull path could flatten remote tx entries into one local apply.
That made sync failures hard to debug because:
- a failed sync apply did not clearly identify which tx entry failed
- the server did not persist the original `:outliner-op`
- the client carried cross-batch tempid repair logic to make split txs work

We want sync errors to point to one specific tx entry and one specific
operation intent.

We also want the server and client to follow the same mental model:
- a batch is an ordered list of tx entries
- each tx entry is applied one by one
- each tx entry may carry its own `:outliner-op`

## Decision
1) `tx/batch` now sends a list of tx entries instead of one encoded tx blob.
2) Each tx entry contains:
   - `:tx`
   - optional `:outliner-op`
3) The server applies tx entries one by one, in order.
4) The server persists `:outliner-op` in `tx_log` and returns it in `pull/ok`.
5) The client applies pulled tx entries one by one and includes the returned
   `:outliner-op` in tx-meta for remote apply.
6) Cross-batch tempid reuse is unsupported by contract. A tempid must be fully
   resolved within a single tx entry.

## Storage and Protocol Notes
- The persisted sync tx log is the per-graph SQLite store initialized in
  `logseq.db-sync.storage`, not the Cloudflare D1 graph index schema.
- Because of that, `outliner_op` is added via runtime SQLite schema setup for
  the per-graph store, not a D1 migration under `worker/migrations/`.
- `pull/ok` entries now have shape:
  - `{:t ... :tx ... :outliner-op ...}`
- `tx/batch` entries now have shape:
  - `{:tx ... :outliner-op ...}`

## Consequences
- Positive:
  - Sync failures can be traced to one tx entry and its `:outliner-op`.
  - Client and server now share the same ordered per-entry apply model.
  - The protocol is simpler than carrying cross-batch tempid repair logic.
- Negative:
  - Older assumptions that tempids can be reused across tx entries are no
    longer valid.
  - The wire format changed for `tx/batch` and `pull/ok`.

## Follow-up Constraints
- New sync producers must keep each tx entry self-contained.
- If a future feature needs cross-entry references again, it must be introduced
  explicitly as protocol behavior rather than repaired implicitly by the
  client.

## Verification
- Updated frontend worker db-sync tests.
- Updated `deps/db-sync` storage, handler, and node-adapter tests.
- Passed:
  - `bb dev:test -v frontend.worker.db-sync-test`
  - `yarn test` in `deps/db-sync`
  - `bb dev:lint-and-test`
