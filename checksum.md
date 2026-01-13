# Tx-Chain Checksum

This project uses a transaction-chain checksum (sha256) to ensure both client and server process the same sequence of normalized transactions.

## Key Concepts

- Each tx only includes `:block/uuid`, `:block/parent`, `:block/page`, and `:block/title` (still ignoring `:block/tx-id` and RTC ignore attrs) before being turned into a deterministic string.  
- The checksum for a tx is `sha256(prev-checksum + tx-string)`, with a fixed `initial-checksum` seed.  
- The server persists the latest checksum in `sync_meta` and recomputes it from `tx_log` when needed.
- The client stores the checksum alongside its local metadata and validates pull/ok and tx/batch/ok responses before applying txs.

## Failure Handling

- When a pull or tx batch includes a checksum, the client compares it to the computed chain; mismatches throw `:db-sync/checksum-mismatch`.  
- The server includes the checksum in both pull/ok and tx/batch/ok responses so clients can stay in sync while applying retries or pending batches.

## Testing

- Coverage lives in `src/test/frontend/worker/db_sync_test.cljs`.  
- Run `bb dev:test -v frontend.worker.db-sync-test`.
