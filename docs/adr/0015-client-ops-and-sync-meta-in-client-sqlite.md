# ADR 0015: Store Client Ops in SQLite `client_ops` and Metadata in `sync_meta`

Date: 2026-04-10
Status: Accepted

## Context
Client sync state is currently persisted via a DataScript-backed store in the
dedicated `client-ops-*` sqlite database (`kvs` + DataScript entities).

This design has become a bottleneck for local sync hot paths:

1. DataScript entity/datoms read-write patterns add avoidable CPU overhead for
   client op persistence and lookup.
2. Persisting client ops as DataScript entities consumes more space than
   purpose-built relational rows for the same data.
3. Metadata (`local-tx`, checksum, graph uuid) and operation payloads are mixed
   in DataScript entity shape, which complicates low-level sqlite debugging and
   parity with server-side sync storage.

Server sync storage already uses explicit sqlite tables (`tx_log`,
`sync_meta`) over the same sqlite runtime. Client storage should follow the
same direction.

## Decision
1. Keep the existing dedicated `client-ops-*` sqlite database file.
   Do not merge this storage into the main graph sqlite DB in this change.
2. Replace DataScript persistence for client ops/metadata with direct sqlite
   tables:
   - `sync_meta` for key/value metadata rows
   - `client_ops` for operation rows
3. `sync_meta` schema:
   - `key TEXT PRIMARY KEY`
   - `value TEXT`
4. `sync_meta` keys for this ADR:
   - `local-tx`
   - `checksum`
   - `graph-uuid`
5. `client_ops` stores both local tx ops and asset ops (single table,
   discriminated by row kind).
6. `client_ops` minimum columns:
   - identity and ordering:
     - `id INTEGER PRIMARY KEY AUTOINCREMENT`
     - `kind TEXT NOT NULL` (`'tx'` or `'asset'`)
     - `created_at INTEGER NOT NULL`
   - local tx fields:
     - `tx_id TEXT` (uuid string)
     - `pending INTEGER NOT NULL DEFAULT 0`
     - `failed INTEGER NOT NULL DEFAULT 0`
     - `outliner_op TEXT`
     - `undo_redo TEXT` (`undo`/`redo`/`none`)
     - `forward_outliner_ops TEXT` (Transit string)
     - `inverse_outliner_ops TEXT` (Transit string)
     - `inferred_outliner_ops INTEGER`
     - `normalized_tx_data TEXT` (Transit string)
     - `reversed_tx_data TEXT` (Transit string)
   - asset fields:
     - `asset_uuid TEXT`
     - `asset_op TEXT` (`update-asset`/`remove-asset`)
     - `asset_t INTEGER`
     - `asset_value TEXT` (Transit or JSON string payload)
7. Required indexes/constraints:
   - unique tx identity for undo/redo lookup:
     - `UNIQUE(tx_id)` where `kind='tx'` and `tx_id IS NOT NULL`
   - pending tx scan in stable order:
     - index on `(kind, pending, created_at, id)`
   - asset op lookup by uuid:
     - index on `(kind, asset_uuid)`
8. `asset ops` must be stored in `client_ops` (not separate DataScript
   entities).
9. Client code must access this data via SQL adapter functions (insert/select/
   update/delete), not `d/datoms`/`d/entity` over client-op storage.
10. Keep payload encoding compatible with existing sync payload handling by
    storing complex fields as Transit strings.

## Consequences
### Positive
- Hot path operations (enqueue local tx, pending scan, tx-id lookup, asset-op
  mutation) become cheaper and more predictable.
- Storage is denser than DataScript entity persistence for client ops.
- Debugging and inspection are easier with explicit sqlite rows.
- Client layout aligns with server-style metadata table (`sync_meta`).

### Tradeoffs
- Introduces SQL adapter code replacing generic DataScript entity APIs.
- Requires new client-op table schema bootstrap and index management.
- Existing client-op DataScript rows are no longer read by new code.

## Safety and Integrity Rules
1. All mutating operations on `client_ops`/`sync_meta` use sqlite transactions.
2. Ordering guarantees for pending tx upload rely on `(created_at, id)` order.
3. Undo/redo lookup remains keyed by `tx_id` and must continue to read forward/
   inverse semantic ops from persisted local tx rows.
4. `pending` and `failed` flags are explicit row state and must not be inferred
   from absence.
5. This change does not alter checksum semantics; it only changes where client
   checksum metadata is stored.

## Migration
Chosen policy: no migration from old DataScript client-op entities.

On first open with this schema:
- initialize `sync_meta` + `client_ops` tables and indexes.
- start client-op state empty.

Rationale:
- client-op state is derived/operational, not authoritative graph content.
- normal sync flows (pull/upload/asset requeue) reconstruct operational state.
- avoids fragile one-time conversion logic across old entity layouts.

## Verification
Focused verification after implementation:

```bash
bb dev:test -v frontend.worker.db-sync-test/handle-local-tx-persists-pending-local-tx-test
bb dev:test -v frontend.worker.db-sync-test/flush-pending-clears-pending-local-tx-count-test
bb dev:test -v frontend.worker.undo-redo-test/undo-history-records-semantic-action-metadata-test
bb dev:test -v frontend.worker.db-sync-test/asset-ops-queue-coalesces-update-and-remove-test
```

Additional checks:
- pending tx query returns rows in deterministic `(created_at, id)` order.
- undo/redo can still resolve tx history by `tx_id`.
- `local-tx`, `checksum`, and `graph-uuid` read/write through `sync_meta`.
