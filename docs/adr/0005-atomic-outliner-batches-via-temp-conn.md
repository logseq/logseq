# ADR 0005: Atomic Outliner Batches via Temp Conn

Date: 2026-03-16
Status: Accepted

## Context
Outliner batch operations previously used a "batch-tx mode" that wrote each
inner transaction to the real conn immediately, then reconstructed one logical
batch in the db listener by collecting tx reports and emitting a synthetic
batch exit event.

That approach had two problems:
- it was not truly atomic because intermediate writes were visible on the real
  conn before the batch finished
- batch flattening in `transact-with-temp-conn!` did not normalize logical
  entity identity the same way sync already does, which made some multi-step
  batches generate invalid final tx data

The failing db-sync sim showed this clearly: multi-step outliner batches could
leave the final merged tx with conflicting entity ids for the same block uuid.

## Decision
1. Outliner batch execution now uses `logseq.db/transact-with-temp-conn!`.
2. A batch writes to a temp conn for the full duration of the batch and commits
   once to the real conn at the end.
3. Nested outliner batches reuse the current temp conn instead of opening a
   second batch.
4. The final tx emitted from `transact-with-temp-conn!` is normalized with the
   existing `logseq.db.common.normalize/normalize-tx-data` helper before it is
   committed to the real conn.
5. Worker db listeners no longer reconstruct batch tx reports from
   `:batch-tx/*` metadata, because the real conn now receives one final tx.

## Consequences
- Positive:
  - Outliner batches are actually atomic from the real conn's perspective.
  - Listener code is simpler because it no longer has to stitch together a
    logical batch from multiple intermediate tx reports.
  - Temp-id and lookup-id conflicts are handled by the existing tx
    normalization path instead of a batch-specific merge.
- Negative:
  - Batch execution now depends on temp-conn context instead of tx-meta flags,
    so any future code that expects `:batch-tx/*` metadata must not be readded.

## Verification
- Passed targeted regression:
  - `bb dev:test -v frontend.worker.db-sync-sim-test/three-clients-single-repo-sim-test`
- Passed focused batch helper coverage:
  - `bb dev:test -v logseq.db-test/test-transact-with-temp-conn!`
