# DB-Sync Large Op Batched Apply Implementation Plan

Goal: Prevent large db-sync outliner operations from OOMing the Cloudflare Worker while preserving one logical upload request, final DB validation, and atomic externally visible sync state.

Architecture: Keep the existing upload shape so a client can still send one `tx/batch` message containing a large op.
The server will detect large tx entries and execute them in bounded chunks, first against an isolated temp conn and then against the real conn inside one SQLite transaction.
The real conn and persisted storage must either both reach the final validated state or both remain at the previous state.

Tech Stack: ClojureScript, DataScript, `logseq.db/transact!`, Durable Object SQLite, db-sync Worker tests, and a dedicated Node memory regression test with a 128 MB heap limit.

Related: Relates to `docs/agent-guide/db-sync/protocol.md` and `docs/agent-guide/db-sync/db-sync-guide.md`.

## Problem statement

Large outliner ops can produce very large normalized tx data.

The current server path accepts the full batch, parses each tx entry, and applies each entry through one `ldb/transact!` call in `deps/db-sync/src/logseq/db_sync/worker/handler/sync.cljs`.

That makes the Worker allocate the full transaction application at once.

When a single op is large enough, the Worker can exceed the Cloudflare 128 MB memory budget before it can send `tx/batch/ok` or `tx/reject`.

The fix must not change the user-visible sync semantics into partial ops.

The client may upload one large op in one request.

The server may execute the large op in chunks internally.

The DB must still be validated after the whole logical op.

The persisted sync state must remain atomic.

If any chunk fails, the graph must keep its previous `kvs`, `tx_log`, `t`, checksum, and live conn state.

## Testing Plan

I will add a focused server unit test in `deps/db-sync/test/logseq/db_sync/worker_handler_sync_test.cljs` that builds one large tx entry, calls `sync-handler/handle-tx-batch!`, and asserts the response is `tx/batch/ok`.

The same test will assert that the resulting graph contains all expected blocks, that `t` advanced exactly once for the logical op unless the implementation explicitly documents chunked tx-log rows, and that the final checksum is present.

I will add a failure-path server unit test that injects an invalid datom in a later chunk and asserts that `handle-tx-batch!` returns `tx/reject`.

The failure-path test will assert that no earlier chunk remains visible in `kvs`, that `tx_log` did not advance, that `sync_meta :t` did not advance, and that the live conn can still answer from the pre-op DB.

I will add a final-validation test where intermediate chunk execution would succeed but the final logical DB is invalid.

That test will assert the whole logical op is rejected and no chunk is persisted.

I will add a dedicated memory regression namespace under `deps/db-sync/test/logseq/db_sync/worker_large_op_memory_test.cljs`.

That test will run in a separate Node process with `--max-old-space-size=128`.

The test will apply a representative large `insert-blocks` style tx that previously forced one huge transact.

The pass condition is that the process exits successfully under the 128 MB heap limit and the graph reaches the complete final state.

I will add a script to `deps/db-sync/package.json`.

```json
"test:large-op-128m": "clojure -M:cljs compile db-sync-large-op-memory-test && node --max-old-space-size=128 worker/dist/large-op-memory-test.js"
```

I will add a matching `:db-sync-large-op-memory-test` build to `deps/db-sync/shadow-cljs.edn`.

The memory test should report peak `js/process.memoryUsage().heapUsed` before and after each chunk.

The assertion should fail if peak heap usage reaches 120 MiB, which leaves room below the 128 MiB process limit for runtime overhead.

I will keep the normal server suite green with `rtk pnpm --dir deps/db-sync test:node-adapter`.

I will run the focused memory suite with `rtk pnpm --dir deps/db-sync test:large-op-128m`.

NOTE: I will write *all* tests before I add any implementation behavior.

## Current flow

```text
client pending txs
  -> frontend.worker.sync.apply-txs/flush-pending!
  -> one WebSocket tx/batch message
  -> logseq.db-sync.worker.handler.ws/handle-ws-message!
  -> logseq.db-sync.worker.handler.sync/handle-tx-batch!
  -> apply-tx!
  -> apply-tx-entry!
  -> ldb/transact! with the full tx-data
  -> storage listener writes kvs, tx_log, t, checksum
```

The upload batching code currently reads at most 50 pending tx rows in `src/main/frontend/worker/sync/apply_txs.cljs`.

The server problem is not only the count of tx entries.

One tx entry can itself contain a very large outliner op.

The first fix should target the server execution of one large tx entry.

## Design constraints

Do not require the client to split one logical op before upload.

Do not change the `tx/batch` request shape for the primary fix.

Do not make partial chunks externally visible after a failure.

Do not skip final DB validation.

Do not commit a huge final `ldb/transact!` after doing chunked dry-run work.

Do not store partial tx-log rows unless the pull client is updated to apply them atomically.

Do not add fallback behavior that hides invalid tx data.

## Implementation tasks

1. Add `@Skill(test-driven-development)` to the implementation checklist.

2. Add the focused happy-path large-op test in `deps/db-sync/test/logseq/db_sync/worker_handler_sync_test.cljs`.

3. Run the focused test and confirm it fails because the current implementation uses the single full-entry transact path.

4. Add the focused failure-path atomicity test in `deps/db-sync/test/logseq/db_sync/worker_handler_sync_test.cljs`.

5. Run the focused test and confirm it fails because partial chunk rollback does not exist yet.

6. Add the final-validation test in `deps/db-sync/test/logseq/db_sync/worker_handler_sync_test.cljs`.

7. Run the focused test and confirm it fails because there is no chunked final validation path yet.

8. Add `deps/db-sync/test/logseq/db_sync/worker_large_op_memory_test.cljs`.

9. Add the `:db-sync-large-op-memory-test` build to `deps/db-sync/shadow-cljs.edn`.

10. Add `test:large-op-128m` to `deps/db-sync/package.json`.

11. Run `rtk pnpm --dir deps/db-sync test:large-op-128m` and confirm it fails under the current single-transact implementation.

12. Export or add a transaction helper in `deps/db-sync/src/logseq/db_sync/storage.cljs`.

13. The helper should run a function inside the Worker SQL transaction primitive already used by `with-sql-transaction!`.

14. Rename the helper to a public name such as `with-sql-transaction!` if it remains generally useful.

15. Add a chunk planner in `deps/db-sync/src/logseq/db_sync/worker/handler/sync.cljs`.

16. The chunk planner should split sanitized tx data into ordered chunks by tx item count.

17. The chunk planner must preserve input order.

18. The chunk planner must not reorder tx items.

19. The chunk planner should keep tx items that depend on the same negative tempid in the same ordered chunk.

20. The chunk planner must not reject a large tx only because it needs chunked execution.

21. Add constants in `deps/db-sync/src/logseq/db_sync/worker/handler/sync.cljs` for the chunk thresholds.

22. Start conservatively with `large-op-min-tx-count` and `large-op-max-chunk-items`.

23. Do not make the first implementation configurable by user input.

24. Add a helper that classifies a tx entry as normal or large after `protocol/transit->tx` and `tx-sanitize/sanitize-tx`.

25. Keep the normal small-op path on the existing `ldb/transact!` code path.

26. Add `apply-large-tx-entry!` in `deps/db-sync/src/logseq/db_sync/worker/handler/sync.cljs`.

27. The helper should create an isolated temp conn from the current live DB.

28. The helper should transact each chunk into the temp conn with validation and storage writes disabled.

29. The helper should run final DB validation against the temp conn result after all chunks have applied.

30. The helper should reject the logical op if final validation fails.

31. The helper should then commit to the live conn in chunks inside one SQL transaction.

32. The live commit must not perform another single huge `ldb/transact!`.

33. The live commit should suppress intermediate validation and run only after the dry-run final validation has passed.

34. If live commit throws, the helper must reset `self.conn` to nil and reopen it from persisted storage.

35. If live commit throws, the SQL transaction must roll back all `kvs`, `tx_log`, `t`, and checksum writes.

36. Preserve one logical tx-log entry for the first implementation if this can be done without a large final live transact.

37. If preserving one tx-log entry requires retaining the full normalized tx in memory, do not do it blindly.

38. In that case, keep the implementation blocked behind the chunked tx-log protocol described below.

39. Update `apply-tx-entry!` to dispatch to `apply-large-tx-entry!` only for large entries.

40. Keep `:db-migrate` on the existing path because it intentionally uses `:skip-validate-db? true`.

41. Keep stale `:rebase` and `:fix` missing-entity no-op semantics unchanged.

42. Update `apply-tx!` so a large logical entry still contributes one `tx-id` to `successful-tx-ids`.

43. Update the `tx/reject` error data so large-op failure still reports the original `failed-tx-id`.

44. Add structured logs around large-op execution.

45. The logs should include graph id, outliner op, tx id, tx item count, chunk count, threshold values, elapsed time, and whether the failure happened during dry-run, validation, or live commit.

46. Update `docs/agent-guide/db-sync/protocol.md` only if the final implementation adds new response reasons or tx-log chunk fields.

47. Run the focused server tests.

48. Run the 128 MB memory test.

49. Run `rtk pnpm --dir deps/db-sync test:node-adapter`.

50. Run `rtk clojure -M:clj-kondo --parallel --lint deps/db-sync/src deps/db-sync/test --cache false`.

## Atomicity model

The dry-run phase is allowed to mutate only an isolated temp conn.

The dry-run phase must not write Durable Object SQLite storage.

The dry-run phase must not advance `t`.

The dry-run phase must not append `tx_log`.

The final validation phase must validate the final temp DB after every chunk has been applied.

The live commit phase must run inside one SQL transaction.

The live commit phase may execute multiple `ldb/transact!` calls, but external storage must commit all chunks together.

If any live chunk fails, SQL rollback must remove all persisted chunk writes.

If any live chunk fails after the in-memory conn changed, the handler must discard the mutated live conn and reopen it from storage.

The Durable Object request handler should not process another sync message in the middle of this synchronous commit path.

## Chunked tx-log fallback design

This fallback is needed only if one logical tx-log row is still too large under the 128 MB test.

Add chunk metadata to tx-log rows.

The metadata should include a logical op id, chunk index, chunk count, original tx id, and original outliner op.

Update pull responses to include chunk metadata.

Update `src/main/frontend/worker/sync/handle_message.cljs` to preserve chunk metadata when parsing `pull/ok`.

Update `src/main/frontend/worker/sync/apply_txs.cljs` so remote chunks with the same logical op id are applied through one atomic temp-conn transaction.

Do not expose partial logical chunks to local rebasing or checksum verification.

Checksum should still represent the final DB state after the logical op.

This fallback is larger than the primary fix and should not be implemented unless the 128 MB test proves a single tx-log row is still the bottleneck.

## Edge cases

A single tx item or tempid group may be larger than the nominal chunk limit.

That case should stay intact and be processed as one oversized chunk rather than rejected.

The server should reject it with a clear reason and a log that identifies the tx id and outliner op.

Delete ops may depend on descendant expansion.

Chunking must happen after delete-op sanitization has produced the final set of tx data.

Rebase and fix ops can become stale when entities disappear.

Their existing no-op handling must remain unchanged.

E2EE tx data is decrypted before server application only on clients, not on the server.

The server chunking code should operate on the Transit tx data it already receives.

Large title offloading already reduces title payload size, but it does not protect large structural ops.

The memory test should avoid relying on huge title strings and should stress structural tx size.

`db-migrate` entries intentionally bypass validation.

They should stay on the existing small-path behavior unless a separate migration-specific requirement appears.

## Testing Details

The server happy-path test verifies real behavior by applying one large logical tx entry through `handle-tx-batch!` and reading the resulting DataScript DB and sync metadata.

The server failure-path test verifies atomicity by forcing a late-chunk failure and then checking persisted storage and live conn state.

The validation test verifies behavior by constructing a logical op whose intermediate chunks can transact but whose final DB is invalid.

The 128 MB test verifies the actual memory budget by running the large-op server path in a separate Node process with `--max-old-space-size=128`.

The tests do not assert private helper return shapes unless the helper is the only practical unit boundary for chunk planning.

## Implementation Details

- Keep upload request shape unchanged for the primary fix.
- Detect large tx entries on the server after Transit decode and sanitization.
- Split large normalized tx data into ordered chunks without reordering and without splitting same-tempid groups.
- Dry-run chunks in a temp conn with storage writes disabled.
- Validate the final temp DB before touching persisted storage.
- Commit live chunks inside one SQL transaction.
- Reset and reopen the live conn if live commit fails.
- Preserve existing `tx-id`, `outliner-op`, stale rebase, and stale fix semantics.
- Use the 128 MB memory test as the gate for whether chunked tx-log protocol work is required.
- Update protocol docs only when response reasons or pull tx fields change.

## Question

Should the first implementation require one tx-log row per original logical op, or is it acceptable to store internal tx-log chunks if pull clients apply all chunks for the same logical op atomically.

What exact production large op should become the fixture for the 128 MB test.

Should the memory gate use Node heap limit only, or should we also add a Wrangler or Miniflare based smoke test that is closer to Cloudflare Worker memory accounting.
Wrangler smoke test

---
