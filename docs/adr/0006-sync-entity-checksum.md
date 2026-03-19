# ADR 0006: Sync Entity Checksum for Server/Client Parity

Date: 2026-03-16
Status: Accepted

## Context
DB sync currently treats matching `t` values as the main convergence signal.
That is necessary, but it is not sufficient to guarantee that the client and
server represent the same block graph.

We have seen cases where temp-id handling and rebase bugs produced logically
divergent entities while `t` still advanced normally. In those cases, the
server and client could believe they were in sync even though some entities had
different content or references.

We need a cheap parity check that works on both the frontend worker and the
Cloudflare Worker, and the server must stay within a 128 MB memory limit.

## Decision
1. Add a shared DB sync checksum over block entities only.
2. The compared attrs depend on whether the graph is E2EE:
   - Unencrypted graphs compare:
     - `:block/uuid`
     - `:block/title`
     - `:block/name`
     - `:block/parent`
     - `:block/page`
   - E2EE graphs compare:
     - `:block/uuid`
     - `:block/parent`
     - `:block/page`
3. Reference attrs are normalized to referenced block UUID strings before
   hashing, so client/server entity ids do not affect the result.
4. Runtime checksum is maintained incrementally from changed entities in tx
   reports and persisted locally:
   - client stores it in client-op metadata
   - server stores it in `sync_meta`
5. A full recompute checksum path is kept for simulation and test verification.
6. The server includes the checksum in state-bearing sync responses:
   - `hello`
   - `pull/ok`
   - `tx/batch/ok`
7. The client compares the remote checksum against its local checksum only when
   sync is expected to have converged:
   - local `t` equals remote `t`
   - no pending local txs
   - no inflight upload txs
8. On mismatch, the client fails fast with `:db-sync/checksum-mismatch` instead
   of silently continuing with a divergent graph.

## Consequences
- Positive:
  - Matching `t` is now backed by entity-level parity over the core sync attrs.
  - Runtime checksum is fast and memory-light on both client and server because
    it does not rescan the whole graph on each compare.
  - Divergence is detected immediately at the sync boundary instead of surfacing
    later as harder-to-debug invalid entities.
- Negative:
  - The checksum is a fast additive hash, not a cryptographic digest.
  - E2EE graphs intentionally do not compare encrypted title/name fields.
  - It intentionally ignores attrs outside the sync-invariant set above.
  - Mismatch handling is fail-fast in this change; it does not automatically
    repair a divergent graph.

## Verification
- Frontend worker coverage:
  - `bb dev:test -v frontend.worker.db-sync-test/hello-checksum-mismatch-fails-fast-test`
  - `bb dev:test -v frontend.worker.db-sync-test/pull-ok-out-of-order-stale-response-is-ignored-test`
- Sim parity coverage:
  - `bb dev:test -v frontend.worker.db-sync-sim-test/two-clients-cut-paste-random-sim-test`
- Sync compatibility coverage:
  - `bb dev:test -v frontend.worker.db-sync-test/pending-txs-rewrite-old-string-tempids-test`
  - `bb dev:test -v frontend.worker.db-sync-test/rebase-order-fix-for-new-blocks-does-not-keep-string-tempids-test`
