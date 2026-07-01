# Sync Stress Failed Cases

## Recording rule for CLI sync stress failures

- Date added: 2026-07-01
- Scope: `scripts/cli-concurrent-edit-stress.mjs`, local `db-sync` server runs, and multi-client CLI sync stress graphs.
- Rule: every hard failure or suspicious no-op from the stress harness must get an entry in this file before the issue is considered handled.
- Required fields for each entry: graph, command or log path, symptom, root cause, fix, regression test or stress verification, and current status.
- Do not mark a case fixed from a retry alone. A fixed case needs a concrete root cause and a post-fix run or targeted test that covers the same path.

## CLI tag-name resolution failed during expanded stress

- Date: 2026-07-01
- Graph: `cli-test-5`
- Command: `node scripts/cli-concurrent-edit-stress.mjs --graph cli-test-5 --concurrency 3 --sync --offline --offline-ms 800 --timeout-ms 20000 --max-ops 80 --extra-pages 2 --journal-pages 2 --journal-start 2026-07-01`
- Symptom: `upsert block --update-tags '["cli-stress-tag-a"]'` failed with `Cannot parse :find, expected: (find-rel | find-coll | find-tuple | find-scalar)`.
- Root cause: OCaml CLI tag-name resolution used a duplicated Datascript class query path for tag names. Numeric tag ids worked, but string tag names failed before the outliner mutation was applied.
- Regression test: `cli/test/test_cases.ml` now covers `upsert block --update-tags '["Tag A"]'` resolving through `thread-api/cli-list-tags`.
- Fix: tag-name resolution in `cli/lib/upsert.ml`, `cli/lib/add.ml`, and `cli/lib/update.ml` now uses the existing tag list endpoint instead of the broken query path.
- Sync status after the failed stress smoke: local and remote tx both reached `71`, pending queues were zero, and checksums matched (`b18d36f60f52de7e`).

## CLI sync stress failed cases from multi-client expansion

### Fresh 5000-op stress verification after sync fixes

- Date: 2026-07-01
- Graphs:
  - `cli-sync-stress-assert-20260701-1`
  - `cli-sync-stress-5000-20260701-13`
- Commands:
  - Assertion run: `DB_SYNC_CHECKSUM_ASSERT=true LOGSEQ_BIN=/Users/tiensonqin/Codes/projects/logseq/static/logseq-cli.js node scripts/cli-concurrent-edit-stress.mjs --graph cli-sync-stress-assert-20260701-1 --config tmp/cli-sync-stress-assert-20260701-1/cli.edn --root-dir tmp/cli-sync-stress-assert-20260701-1/root --log-file tmp/cli-sync-stress-assert-20260701-1/events.jsonl --clients 3 --concurrency 8 --max-ops 5000 --sync --offline --no-e2ee --timeout-ms 20000 --settle-attempts 60 --settle-ms 1000`
  - Normal run: `LOGSEQ_BIN=/Users/tiensonqin/Codes/projects/logseq/static/logseq-cli.js node scripts/cli-concurrent-edit-stress.mjs --graph cli-sync-stress-5000-20260701-13 --config tmp/cli-sync-stress-multi-5000-20260701-13/cli.edn --root-dir tmp/cli-sync-stress-multi-5000-20260701-13/root --log-file tmp/cli-sync-stress-multi-5000-20260701-13/events.jsonl --clients 3 --concurrency 8 --max-ops 5000 --sync --offline --no-e2ee --timeout-ms 20000 --settle-attempts 60 --settle-ms 1000`
- Result:
  - `cli-sync-stress-assert-20260701-1` completed `5001` started ops, all clients settled at tx `6074`, final recomputed/local/remote checksum was `75663df27432e5c6`, and final `graph validate` passed on all three clients.
  - `cli-sync-stress-5000-20260701-13` completed `5001` started ops, final recomputed/local/remote checksum was `f3b46db99d7293d1` on all three clients, and final `graph validate` passed on all three clients.
  - The db-sync server log for the normal run had no `:before-checksum-error`, `server checksum doesn't match`, `prev-checksum-not-match`, `last-error`, or exception entries.
- Status: two fresh 5000-op runs passed after rebuilding `static/db-worker-node.js`.

### Fresh 10000-op stress verification after sync fixes

- Date: 2026-07-01
- Graph: `cli-sync-stress-10000-20260701-1`
- Command: `LOGSEQ_BIN=/Users/tiensonqin/Codes/projects/logseq/static/logseq-cli.js node scripts/cli-concurrent-edit-stress.mjs --graph cli-sync-stress-10000-20260701-1 --config tmp/cli-sync-stress-multi-10000-20260701-1/cli.edn --root-dir tmp/cli-sync-stress-multi-10000-20260701-1/root --log-file tmp/cli-sync-stress-multi-10000-20260701-1/events.jsonl --clients 3 --concurrency 8 --max-ops 10000 --sync --offline --no-e2ee --timeout-ms 20000 --settle-attempts 90 --settle-ms 1000`
- Result:
  - Completed `10001` started ops with 3 clients, offline windows, offline today-journal races, HTTP outliner ops, undo/redo, recycle/delete, and multi-client offline rebase operations.
  - Final `thread-api/recompute-checksum-diagnostics` returned recomputed/local/remote checksum `6a1402088d63be44` for all three clients.
  - Final `graph validate` passed on all three clients.
  - Post-run `sync status` on all three clients reported `last-error nil`, `ws-state "open"`, `local-tx 12134`, `remote-tx 12134`, all pending queues `0`, and local/remote checksum `6a1402088d63be44`.
  - The db-sync server log had no `:before-checksum-error`, `server checksum doesn't match`, `prev-checksum-not-match`, `last-error`, or exception entries.
- Non-fatal anomalies:
  - `http-delete-restore-page` still returned HTTP 200 with `resultTransit false` four times. This is tracked in the open page-delete no-op case below.
  - One `tag-delete-recreate` delete phase returned `tag-not-found`. The run still converged and validated. Root cause: the stress harness uses a shared volatile tag name, so another worker can delete the tag before the current worker's delete phase runs. Fix: classify `tag-not-found` during `tag-delete-recreate` delete as an expected race, matching the existing volatile property delete classification. Regression test: `scripts/cli-concurrent-edit-stress.test.mjs` covers this classifier path.
- Status: passed. This did not reproduce reverse-local-tx, apply-remote-tx, or checksum divergence failures.

### Final 1000-op smoke verification after classifier update

- Date: 2026-07-01
- Graph: `cli-sync-stress-1000-20260701-final`
- Command: `LOGSEQ_BIN=/Users/tiensonqin/Codes/projects/logseq/static/logseq-cli.js node scripts/cli-concurrent-edit-stress.mjs --graph cli-sync-stress-1000-20260701-final --config tmp/cli-sync-stress-multi-1000-20260701-final/cli.edn --root-dir tmp/cli-sync-stress-multi-1000-20260701-final/root --log-file tmp/cli-sync-stress-multi-1000-20260701-final/events.jsonl --clients 3 --concurrency 8 --max-ops 1000 --sync --offline --no-e2ee --timeout-ms 20000 --settle-attempts 60 --settle-ms 1000`
- Result:
  - Completed `1001` started ops with 3 clients and offline simulation.
  - Final recomputed/local/remote checksum was `628f67429199e958` on all three clients.
  - Final `graph validate` passed on all three clients.
  - Post-run `sync status` on client 1 reported `last-error nil`, `ws-state "open"`, `local-tx 1087`, `remote-tx 1087`, all pending queues `0`, and local/remote checksum `628f67429199e958`.
- Status: passed after the volatile tag delete race classifier update.

### Targeted test verification after final stress updates

- Date: 2026-07-01
- Commands and results:
  - `rtk node --test scripts/cli-concurrent-edit-stress.test.mjs scripts/cli-sync-stress-workflow.test.mjs`: 29 tests, 0 failures.
  - `rtk bb dev:test -v frontend.worker.db-sync-test/temp-conn-batch-preserves-cardinality-one-schema-test -v frontend.worker.db-sync-test/rebase-local-insert-then-save-keeps-cardinality-one-values-test -v frontend.worker.db-sync-test/apply-remote-txs-skips-stale-move-before-later-delete-test -v frontend.worker.db-sync-test/apply-remote-txs-skips-stale-move-to-target-before-later-target-delete-test -v frontend.worker.db-sync-test/apply-remote-txs-with-local-changes-rejects-invalid-final-rebase-test -v frontend.worker.db-sync-test/receive-queue-failure-updates-last-sync-error-test -v frontend.worker.db-sync-test/sync-counts-refreshes-idle-stale-local-checksum-test`: 7 tests, 21 assertions, 0 failures.
  - `rtk bb dev:test -v frontend.worker.db-sync-test/apply-remote-txs-repairs-missing-block-lookup-ref-test -v frontend.worker.db-sync-test/apply-remote-txs-repairs-missing-block-retract-lookup-ref-test -v frontend.worker.db-sync-test/apply-remote-txs-with-local-changes-repairs-missing-block-lookup-ref-test -v frontend.worker.db-sync-test/apply-remote-txs-with-local-changes-repairs-missing-block-datoms-test`: 4 tests, 16 assertions, 0 failures.
  - `rtk pnpm --dir deps/db test-v logseq.db-test/batch-transact-with-temp-conn-preserves-cardinality-one-schema-test logseq.db-test/batch-transact-with-temp-conn-preserves-retracts-test`: completed the deps/db suite, 114 tests, 418 assertions, 0 failures.
  - `rtk bb dev:test -v frontend.worker.pipeline-test/recycle-ops-return-apply-result-test`: 1 test, 4 assertions, 0 failures.
  - `rtk pnpm --dir cli test`: full CLI parity suite passed.
- Status: passed.

### Local sync server was not started for `--sync`

- Date: 2026-06-30
- Graph: `pi-memory`
- Command: `node scripts/cli-concurrent-edit-stress.mjs --graph pi-memory --concurrency 8 --sync --timeout-ms 20000`
- Symptom: fatal preflight error: `Local db-sync server is not healthy at http://127.0.0.1:18080/health`.
- Root cause: the stress harness required a local `db-sync` server for `--sync` but only checked health; it did not start the local server itself.
- Fix: the harness now starts `cli-e2e/scripts/db_sync_server.py` automatically for local `--sync` runs unless `--no-start-sync-server` is passed, and it rejects non-local `--sync-base` values.
- Regression test: `scripts/cli-concurrent-edit-stress.test.mjs` covers local sync server start args.
- Status: fixed in the stress harness.

### Sync start tried to refresh auth against the wrong local endpoint

- Date: 2026-06-30
- Graph: `pi-memory`
- Command: `node scripts/cli-concurrent-edit-stress.mjs --graph pi-memory --concurrency 8 --sync --timeout-ms 20000`
- Symptom: `sync start` failed with `auth-refresh-failed`, `Run logseq login first`, and a local HTTP 404 response.
- Root cause: the graph was not initialized/uploaded to the local sync server before `sync start`, so the CLI entered the normal auth-refresh path instead of the local stress upload path.
- Fix: `ensureLocalServers` now checks `sync status`; when the graph is uninitialized it sets local graph E2EE metadata when requested, runs `sync ensure-keys` when needed, uploads the graph to the local sync server, and only then starts sync.
- Regression test: `scripts/cli-concurrent-edit-stress.test.mjs` covers local sync upload/ensure-key argument construction.
- Status: fixed in the stress harness.

### Concurrent edit used stale block ids after another worker deleted the target

- Date: 2026-06-30
- Graph: `pi-memory`
- Example failure:
  - `upsert block --graph pi-memory --id 1911 --target-id 1902 --pos last-child`
  - Error: `source-not-found`, `source block uuid not found`
  - Another example: `target-not-found`, `target block uuid not found`
- Root cause: the stress harness intentionally lets workers delete, recycle, move, and update from a shared live-id pool. Under concurrency, an id can be selected and then deleted by another worker before the mutation runs. That is a valid race for the harness, not by itself a sync corruption signal.
- Fix: CLI `source-not-found`, `target-not-found`, `block-not-found`, `page-not-found`, `recycled-page`, and `upsert-id-not-found` are classified as `race-conflict`; stale ids are dropped from the live pool and the pool is refreshed from the graph.
- Regression test: `scripts/cli-concurrent-edit-stress.test.mjs` covers stale id extraction and expected race classification.
- Status: fixed as a harness classification issue. A final checksum mismatch or graph validation failure after these race conflicts would still be treated as a real sync failure.

### Sync runtime kept last-error after duplicate `:block/uuid`

- Date: 2026-06-30
- Graph: `pi-memory`
- Command: `node scripts/cli-concurrent-edit-stress.mjs --graph pi-memory --concurrency 8 --sync --timeout-ms 20000`
- Symptom: `sync start` reached an open websocket but failed because `sync status` had `last-error`:
  `Cannot add #datascript/Datom [... :block/uuid #uuid "06ef6144-c02c-469c-8296-7fc8e2220782" ...] because of unique constraint`.
- Root cause: remote tx application with local changes used the live Datascript connection while reversing local txs, applying remote txs, and replaying local txs. An exception during that pipeline could leave the live connection in an intermediate state even though `batch-transact!` resets the conn on a single failed batch.
- Fix: `apply-remote-tx-with-local-changes!` now uses `batch-transact-with-temp-conn!`, so reverse/apply/replay happens against a temporary connection and only the final successful result is committed to the live connection.
- Regression tests:
  - `frontend.worker.db-sync-test/apply-remote-txs-with-local-changes-rejects-invalid-final-rebase-test`
  - `frontend.worker.db-sync-test/rebase-local-insert-then-save-keeps-cardinality-one-values-test`
- Status: fixed in sync remote tx application.

### Receive queue failures were invisible to `sync status`

- Date: 2026-07-01
- Graph: reproduced by worker test, originally found while investigating CLI stress failures.
- Symptom: a receive-loop exception could stop remote application while `sync status` did not expose the failure through `last-error`, making a yellow/stuck sync indicator hard to diagnose.
- Root cause: `enqueue-receive-message!` logged the exception but did not update the client sync error state.
- Fix: the receive queue catch path now calls `sync-util/set-last-sync-error!` before logging.
- Regression test: `frontend.worker.db-sync-test/receive-queue-failure-updates-last-sync-error-test`.
- Status: fixed in sync worker error reporting.

### Release CLI failed to reuse a starting db-worker-node server

- Date: 2026-07-01
- Graphs:
  - `cli-sync-stress-1000-20260701-1`
  - earlier `5000` stress attempt before the release CLI fix
- Symptom: stress run failed with `server-start-failed`, `failed to publish health`, or transient `fetch failed` when many CLI commands started while db-worker-node was still starting or temporarily busy.
- Root cause: the release CLI discovered servers only through successful `/healthz` responses, treated HTTP 503 `starting` health payloads as absent, and did a one-shot final health lookup after spawning. Under concurrent CLI startup this could spawn duplicate workers or fail while the existing worker was almost ready.
- Fix: `cli/lib/server_runtime.ml` now accepts 200 and 503 health payloads for discovery, waits up to 30 seconds for published/ready servers, respects a live db-worker lock before spawning another worker, and retries final health discovery until ready.
- Regression tests:
  - `CLI parity server start reuses starting db-worker-node`
  - `CLI parity ensure server retries final health discovery`
- Post-fix stress verification: `cli-sync-stress-1000-20260701-2` completed with 3 clients, `1001` started ops, all final checksums equal to `94e75da4b4bf1f78`, and all three final `graph validate` checks passing.
- Status: fixed in release CLI server lifecycle handling.

### Recycle restore/permanent-delete returned no observable apply result

- Date: 2026-07-01
- Graph: reproduced by outliner pipeline test while expanding HTTP `apply-outliner-ops` stress coverage.
- Symptom: `thread-api/apply-outliner-ops` could return HTTP 200 with a nil/false result for recycle restore or permanent delete, so the stress harness could not distinguish a successful operation from a silent no-op.
- Root cause: `logseq.outliner.op/apply-op!` did not set `*result` for `:restore-recycled` and `:recycle-delete-permanently`.
- Fix: both op branches now return their mutation result through `*result`.
- Regression test: `frontend.worker.pipeline-test/recycle-ops-return-apply-result-test`.
- Status: fixed in outliner op result reporting.

### Remote move before later remote delete failed after local reversal removed the moved block

- Date: 2026-07-01
- Graph: `cli-sync-stress-5000-20260701-1`
- Command: `LOGSEQ_BIN=static/logseq-cli.js node scripts/cli-concurrent-edit-stress.mjs --graph cli-sync-stress-5000-20260701-1 --clients 3 --concurrency 8 --max-ops 5000 --sync --offline --no-e2ee --timeout-ms 20000 --settle-attempts 60 --settle-ms 1000`
- Log evidence:
  - `tmp/cli-sync-stress-multi-5000-20260701-1/events.jsonl`, line `6052`
  - `tmp/cli-sync-stress-multi-5000-20260701-1/clients/client-2/root/graphs/cli-sync-stress-5000-20260701-1/db-worker-node-20260701.log`
- Symptom: client 2 got stuck with `last-error`:
  `Nothing found for entity id [:block/uuid #uuid "912166d7-e42f-400b-bb8d-b1b120d44a66"]`.
- Runtime evidence: client 2 had `ws-state "open"`, `local-tx 1776`, `remote-tx 2425`, `pending-local 327`, `pending-server 649`, and checksum mismatch; clients 1 and 3 had settled at `local-tx 2425`, `remote-tx 2425`, checksum `c3635870ab8ca030`. Client 2 `graph validate` still passed, so this was sync apply/rebase failure, not local DB validation corruption.
- Root cause: while applying remote txs with local changes, repair preflight checked missing remote lookup refs against the live DB before reversing local pending txs. The block UUID existed at that point, so no repair was fetched. The isolated rebase then reversed local pending txs and removed the same block. The next remote tx `t=1779` tried to move that now-missing block, and a later remote tx `t=1788` deleted the same block. Datascript threw before the later delete could make the stale move irrelevant. The same class can happen when the moved block still exists but the move target is removed by local reversal and later deleted by the remote batch.
- Fix: remote tx application now drops stale operation datoms when a block ref used by that operation is already missing in the current apply DB and the current or later remote tx batch contains `:db/retractEntity` for that same `:block/uuid`. This keeps delete-wins ordering without masking missing blocks that are not actually deleted by the remote batch.
- Regression tests:
  - `frontend.worker.db-sync-test/apply-remote-txs-skips-stale-move-before-later-delete-test`
  - `frontend.worker.db-sync-test/apply-remote-txs-skips-stale-move-to-target-before-later-target-delete-test`
  - Adjacent repair/rebase tests still pass:
    `apply-remote-txs-repairs-missing-block-lookup-ref-test`,
    `apply-remote-txs-repairs-missing-block-retract-lookup-ref-test`,
    `apply-remote-txs-with-local-changes-repairs-missing-block-lookup-ref-test`,
    `apply-remote-txs-with-local-changes-repairs-missing-block-datoms-test`,
    `apply-remote-txs-with-local-changes-rejects-invalid-final-rebase-test`,
    `apply-remote-txs-local-delete-parent-remote-move-then-delete-parent-test`,
    `apply-remote-txs-overlap-out-of-order-parent-delete-then-move-repairs-test`.
- Post-fix stress verification: `cli-sync-stress-5000-20260701-13` and `cli-sync-stress-10000-20260701-1` both completed with 3 clients, offline windows, matching final checksums, and final `graph validate` passing on all clients.
- Status: fixed and verified in fresh 5000-op and 10000-op stress runs.

### Open: all clients settled locally but final remote checksum differed

- Date: 2026-07-01
- Graph: `cli-sync-stress-5000-20260701-8`
- Command: `LOGSEQ_BIN=/Users/tiensonqin/Codes/projects/logseq/static/logseq-cli.js node scripts/cli-concurrent-edit-stress.mjs --graph cli-sync-stress-5000-20260701-8 --config tmp/cli-sync-stress-multi-5000-20260701-8/cli.edn --root-dir tmp/cli-sync-stress-multi-5000-20260701-8/root --log-file tmp/cli-sync-stress-multi-5000-20260701-8/events.jsonl --clients 3 --concurrency 8 --max-ops 5000 --sync --offline --no-e2ee --timeout-ms 20000 --settle-attempts 60 --settle-ms 1000`
- Symptom: after 5000 requested ops, final sync settle failed on client 1 with `local-tx 6130`, `remote-tx 6130`, all pending queues at `0`, `last-error nil`, `ws-state "open"`, local checksum `d497a453c0029f4d`, and remote checksum `755f4eb4fee7ed74`.
- Current evidence:
  - All three clients reported the same sync status values and the same local checksum, but all disagreed with the remote checksum.
  - Final `graph validate` passed on all clients, but datom counts differed: client 1 had `8762` datoms, client 2 had `8779`, and client 3 had `8770`.
  - The event log includes one transient `fetch failed` followed by server port refreshes, and an earlier `http-delete-restore-page` HTTP 200 no-op with `resultTransit false`.
- Follow-up diagnostics:
  - Client-side `thread-api/recompute-checksum-diagnostics` recomputed `d497a453c0029f4d` on all three clients, matching each client's local checksum and disagreeing with the remote checksum reported by `sync status`.
  - Direct server checksum diagnostics for graph id `e54e9868-e4c9-47b1-8f40-d3974e0cefc9` recomputed `d497a453c0029f4d`, matching the clients. The server SQLite `sync_meta.checksum` row still stored the stale value `755f4eb4fee7ed74`.
  - The server tx log had rows from `t=1` through `t=6130`, and `sync_meta.t` was also `6130`, so the mismatch was isolated to stored checksum metadata rather than missing tx rows.
  - `find-checksum-drift` could not replay this server DB from an empty DB because the tx log depends on the initial uploaded graph snapshot and built-in entities. That tool needs a snapshot-aware replay path before it can locate checksum drift for upload-created graphs.
- Additional verification:
  - Added an opt-in server assertion path guarded by `DB_SYNC_CHECKSUM_ASSERT=true` that recomputes the server checksum after each appended tx and throws with `prev-tx`, `prev-checksum`, recomputed checksum, tx meta, DB-before, and tx data when stored incremental metadata drifts.
  - Diagnostic run `cli-sync-stress-assert-20260701-1` completed `5001` started ops with 3 clients, offline mode, final tx `6074`, final checksum `75663df27432e5c6` on all clients, and final `graph validate` passing on all clients.
  - The diagnostic server log had no `:before-checksum-error`, `server checksum doesn't match`, or `prev-checksum-not-match` entries.
- Root cause: still pending for the original stale `sync_meta.checksum` write. The direct server recompute shows the graph content itself matched clients in this run, but the stored checksum metadata had drifted. The assertion run did not reproduce the drift, so this case must stay open.
- Fix: pending. The assertion path is diagnostic only and must not be counted as the root-cause fix.
- Regression test or stress verification: pending. Do not mark fixed from a retry alone; first identify why `sync_meta.checksum` could stay stale while `sync_meta.t` and server graph contents reached the final tx.
- Status: open.

### Idle sync status exposed stale cached local checksum

- Date: 2026-07-01
- Graph: `cli-sync-stress-5000-20260701-11`
- Command: `LOGSEQ_BIN=/Users/tiensonqin/Codes/projects/logseq/static/logseq-cli.js node scripts/cli-concurrent-edit-stress.mjs --graph cli-sync-stress-5000-20260701-11 --config tmp/cli-sync-stress-multi-5000-20260701-11/cli.edn --root-dir tmp/cli-sync-stress-multi-5000-20260701-11/root --log-file tmp/cli-sync-stress-multi-5000-20260701-11/events.jsonl --clients 3 --concurrency 8 --max-ops 5000 --sync --offline --no-e2ee --timeout-ms 20000 --settle-attempts 60 --settle-ms 1000`
- Symptom: the run completed `5001` started ops, but final settle failed on client 2. `sync status` reported `last-error nil`, `ws-state "open"`, `local-tx 6035`, `remote-tx 6035`, all pending queues at `0`, local checksum `759e50784194968c`, and remote checksum `a661d1ec5864f400`.
- Evidence:
  - Client 1 and client 3 already matched the remote checksum `a661d1ec5864f400`.
  - Client 2 `graph validate` passed with no invalid entities.
  - Calling `thread-api/recompute-checksum-diagnostics` on client 2 immediately returned recomputed/local/remote checksum `a661d1ec5864f400`, and the following `sync status` also reported the matching checksum.
- Root cause: sync status and RTC presence read the cached local checksum from client-ops metadata directly. Under this stress run, that cache was stale even though the Datascript graph itself recomputed to the remote checksum and there were no pending local/server queues. Because no later tx arrived, the stale cache stayed visible and final settle treated the graph as divergent.
- Fix: `frontend.worker.sync.presence/sync-counts` now detects the idle mismatch state (`pending-local`, `pending-asset`, and `pending-server` are zero; `local-tx == remote-tx`; cached local checksum differs from remote checksum), recomputes the checksum from the live Datascript DB, updates the cached local checksum, and returns the recomputed value. A real DB divergence still remains visible because the recomputed checksum will continue to differ from the remote checksum.
- Regression test: `frontend.worker.db-sync-test/sync-counts-refreshes-idle-stale-local-checksum-test`.
- Post-fix stress verification: `cli-sync-stress-5000-20260701-13`, `cli-sync-stress-10000-20260701-1`, and `cli-sync-stress-1000-20260701-final` all ended with `local-tx == remote-tx`, all pending queues at `0`, and matching local/remote/recomputed checksums.
- Status: fixed and verified in fresh stress runs.

### Open: sync start timed out with RTC closed and pending local changes

- Date: 2026-07-01
- Graph: `cli-sync-stress-5000-20260701-12`
- Command: `LOGSEQ_BIN=/Users/tiensonqin/Codes/projects/logseq/static/logseq-cli.js node scripts/cli-concurrent-edit-stress.mjs --graph cli-sync-stress-5000-20260701-12 --config tmp/cli-sync-stress-multi-5000-20260701-12/cli.edn --root-dir tmp/cli-sync-stress-multi-5000-20260701-12/root --log-file tmp/cli-sync-stress-multi-5000-20260701-12/events.jsonl --clients 3 --concurrency 8 --max-ops 5000 --sync --offline --no-e2ee --timeout-ms 20000 --settle-attempts 60 --settle-ms 1000`
- Symptom: during `offline-today-journal-race`, several `sync start` calls timed out before the websocket reached `open`. The status had `last-error nil`, `ws-state "closed"`, `pending-local` greater than `0`, `pending-server 0`, `local-tx == remote-tx`, and differing local/remote checksums.
- Evidence:
  - One failure reported `local-tx 3319`, `remote-tx 3319`, `pending-local 89`, `local-checksum "1a69e8c09ac59ca6"`, and `remote-checksum "f6b91e5ab46a8394"`.
  - A manual status check while the run was still active reported `ws-state "closed"`, `local-tx 3287`, `remote-tx 3287`, `pending-local 208`, `pending-server 0`, `local-checksum "2c50d29e2e5a8fde"`, and `remote-checksum "f0bc605965fec2f1"`.
  - This matches the user-reported stuck-yellow shape: local changes are pending, the RTC state is closed, and a restart or refresh is needed before syncing resumes.
- Root cause: pending. The next diagnostic step is to determine whether `sync start` is racing an explicit stop/offline transition, reusing a closed client without scheduling reconnect, or leaving inflight state uncleared.
- Fix: pending.
- Regression test or stress verification: pending.
- Status: open.

### Post-fix 5000-op run ended with zero-pending checksum mismatch on one client

- Date: 2026-07-01
- Graph: `cli-sync-stress-5000-20260701-14`
- Command: `LOGSEQ_BIN=/Users/tiensonqin/Codes/projects/logseq/static/logseq-cli.js node scripts/cli-concurrent-edit-stress.mjs --graph cli-sync-stress-5000-20260701-14 --config tmp/cli-sync-stress-multi-5000-20260701-14/cli.edn --root-dir tmp/cli-sync-stress-multi-5000-20260701-14/root --log-file tmp/cli-sync-stress-multi-5000-20260701-14/events.jsonl --clients 3 --concurrency 8 --max-ops 5000 --sync --offline --no-e2ee --timeout-ms 20000 --settle-attempts 60 --settle-ms 1000`
- Symptom: the run reached `5001` started ops with no non-race errors during operation execution, then final settle failed on client 2. The final status had `last-error nil`, `ws-state "open"`, `local-tx 6138`, `remote-tx 6138`, all pending queues at `0`, local checksum `5a14c02ae03a8ea4`, and remote checksum `caa4a33469ac5576`.
- Evidence:
  - Final settle retried `sync status` 60 times for client 2 before failing.
  - The failure happened after rebuilding `static/db-worker-node.js` with the remote repair-after-local-reversal fix, so it is not the stale-code run from `cli-sync-stress-5000-20260701-12`.
  - No `last-error`, `apply remote tx fail`, or missing entity error appeared before final settle.
  - `thread-api/recompute-checksum-diagnostics` showed a real local divergence, not a stale checksum cache: client 1 and client 3 recomputed to `caa4a33469ac5576` with `801` checksum-visible blocks, while client 2 recomputed to `5a14c02ae03a8ea4` with `797` checksum-visible blocks.
  - Final `graph validate` still passed on client 2 (`1040` entities, `808` blocks, `9609` datoms), so the divergent DB shape is internally valid.
  - Comparing checksum block sets showed client 2 was missing exactly four blocks that client 1, client 3, and the server kept:
    - `d959db93-2cb2-4054-980c-106f5b67e708`: `http insert stress-1782899803902 worker=4 seq=380 op=http-insert-blocks`
    - `35b5799f-f2e9-49b8-be1b-7324cf676c18`: `http undo redo stress-1782899803902 worker=8 seq=328 op=http-insert-undo-redo`
    - `f13cc3da-b879-4e41-93c6-01a23ee0a5ee`: `child stress-1782899803902 worker=4 seq=442 op=create-child parent=3812`
    - `6a44e88b-c7dd-4e91-aa4d-0097fd768289`: `http batch stress-1782899803902 worker=6 seq=496 op=http-batch-set-property`
  - Server tx evidence for graph id `f1ba1b2c-995c-45a0-8fbf-d1ce1a23b786`:
    - `t=3219` created `d959db93-2cb2-4054-980c-106f5b67e708` under parent `fd0cd77a-4daf-4c45-981e-8153a6694fdf`.
    - `t=3434` inserted `35b5799f-f2e9-49b8-be1b-7324cf676c18`, `t=3435` deleted it, and `t=3436` reinserted the same UUID.
    - `t=3843` moved the parent chain from the journal page to page `6a44e51d-bf4e-4b30-96d2-4580dd316905`.
    - `t=3937` added `f13cc3da-b879-4e41-93c6-01a23ee0a5ee` under `35b5799f-f2e9-49b8-be1b-7324cf676c18`.
    - `t=4619` added `6a44e88b-c7dd-4e91-aa4d-0097fd768289`.
    - Later txs recycled and restored page `6a44e51d-bf4e-4b30-96d2-4580dd316905`, but no later server tx deleted these four blocks.
  - Client 2 `client_ops` had one failed local tx:
    - tx id `1e43b525-dd7e-4bd8-9eca-67bce986db48`, `outliner_op=delete-blocks`, `pending=0`, `failed=1`.
    - The normalized tx deleted `35b5799f-f2e9-49b8-be1b-7324cf676c18` and `d959db93-2cb2-4054-980c-106f5b67e708`.
    - Its reverse tx contained the exact four missing blocks, including `f13cc3da-b879-4e41-93c6-01a23ee0a5ee` and `6a44e88b-c7dd-4e91-aa4d-0097fd768289`.
  - Client 2 log line `1796` showed the server rejected that tx with `tx/reject`, `reason "db transact failed"`, `t 4753`, and the same failed tx id.
- Root cause: when the server rejected a local tx as non-recoverable, the client marked the tx `failed=1` and `pending=0` but did not roll back the local Datascript mutation that had already been applied optimistically. The failed delete therefore remained in client 2's local graph while the server and other clients never accepted it. Because the tx was no longer pending, final sync status reached `local-tx == remote-tx`, all pending queues at `0`, and no `last-error`, but the local checksum stayed permanently different.
- Fix: `tx/reject` handling now rolls back rejected pending txs before marking them failed. The rollback reverses the rejected tx and any later pending local txs in a temporary connection, commits only a successful result to the live DB, and rebases later non-rejected pending txs so unrelated local edits remain queued.
- Regression test: `frontend.worker.db-sync-test/tx-reject-db-transact-failed-rolls-back-rejected-local-delete-test`.
- Adjacent verification: the focused `tx/reject` suite passed, including `tx-reject-db-transact-failed-surfaces-rejected-tx-test`, `tx-reject-db-transact-failed-marks-inflight-op-failed-test`, `tx-reject-db-transact-failed-rolls-back-rejected-local-delete-test`, `tx-reject-db-transact-failed-selectively-updates-inflight-ops-test`, `tx-reject-missing-blocks-keeps-failed-tx-pending-and-retries-with-repair-test`, and `tx-reject-stale-keeps-inflight-op-pending-test`.
- Post-fix stress verification: after rebuilding `static/db-worker-node.js`, `cli-sync-stress-5000-20260701-13` completed `5001` started ops with final checksum `f3b46db99d7293d1` on all three clients, `cli-sync-stress-10000-20260701-1` completed `10001` started ops with final checksum `6a1402088d63be44` on all three clients, and `cli-sync-stress-1000-20260701-final` completed `1001` started ops with final checksum `628f67429199e958`.
- Status: fixed and verified in fresh 5000-op, 10000-op, and 1000-op stress runs.

### Remote apply failed on a missing block UUID after offline journal races

- Date: 2026-07-01
- Graph: `cli-sync-stress-5000-20260701-12`
- Command: `LOGSEQ_BIN=/Users/tiensonqin/Codes/projects/logseq/static/logseq-cli.js node scripts/cli-concurrent-edit-stress.mjs --graph cli-sync-stress-5000-20260701-12 --config tmp/cli-sync-stress-multi-5000-20260701-12/cli.edn --root-dir tmp/cli-sync-stress-multi-5000-20260701-12/root --log-file tmp/cli-sync-stress-multi-5000-20260701-12/events.jsonl --clients 3 --concurrency 8 --max-ops 5000 --sync --offline --no-e2ee --timeout-ms 20000 --settle-attempts 60 --settle-ms 1000`
- Symptom: after several offline start/stop windows and auto-created journal races, client 2 could reopen the websocket but stayed stuck with `last-error`:
  `Nothing found for entity id [:block/uuid #uuid "cb874a9d-e87a-4427-99d8-f6cacb931381"]`.
- Evidence:
  - Event log line `10118` shows `sync start` returning `sync-start-runtime-error` with `ws-state "open"`, `local-tx 3545`, `remote-tx 3836`, `pending-local 265`, and `pending-server 291`.
  - A later manual status check showed the same missing UUID with `local-tx 3545`, `remote-tx 3868`, `pending-local 279`, and `pending-server 323`.
  - The primary client and client 3 continued past this point, so the failure is isolated to applying/rebasing remote txs on one client, not to server availability alone.
- Root cause: the failing client had local pending txs, so remote apply first reversed those local txs in an isolated rebase connection. The live DB still had enough data before reversal, so the existing pre-repair scan did not fetch the block. After local reversal, the block `cb874a9d-e87a-4427-99d8-f6cacb931381` was gone, and remote tx `t=3700` tried to move that same block with no later remote delete for it. The earlier stale move-before-delete fix correctly handled remote batches where the same missing block would be deleted later, but this case needed repair, not dropping.
- Fix: remote apply now does an additional isolated dry-run of local reversal before fetching server repair data. Any remote block refs that become missing only after local reversal are fetched from the server and applied after reversal but before remote tx application. UUIDs that the same remote batch later retracts are excluded so the previous delete-wins stale behavior is preserved.
- Regression test: `frontend.worker.db-sync-test/apply-remote-txs-repairs-block-made-missing-by-local-reversal-test`.
- Adjacent verification: the repair/rebase suite passed, including `apply-remote-txs-repairs-missing-block-lookup-ref-test`, `apply-remote-txs-repairs-missing-block-retract-lookup-ref-test`, `apply-remote-txs-with-local-changes-repairs-missing-block-lookup-ref-test`, `apply-remote-txs-with-local-changes-repairs-missing-block-datoms-test`, `apply-remote-txs-skips-stale-move-before-later-delete-test`, `apply-remote-txs-skips-stale-move-to-target-before-later-target-delete-test`, and `apply-remote-txs-with-local-changes-rejects-invalid-final-rebase-test`.
- Post-fix stress verification: `cli-sync-stress-5000-20260701-13`, `cli-sync-stress-10000-20260701-1`, and `cli-sync-stress-1000-20260701-final` all completed without `apply remote tx fail`, missing block UUID runtime errors, or final checksum divergence.
- Status: fixed and verified in fresh stress runs.

### Open: `http-delete-restore-page` can return HTTP 200 with `resultTransit false`

- Date: 2026-07-01
- Graphs:
  - `cli-sync-stress-1000-20260701-2`
  - `cli-sync-stress-5000-20260701-1`
  - `cli-sync-stress-5000-20260701-8`
  - `cli-sync-stress-assert-20260701-1`
  - `cli-sync-stress-5000-20260701-13`
  - `cli-sync-stress-10000-20260701-1`
- Log examples:
  - `tmp/cli-sync-stress-multi-1000-20260701-2/events.jsonl`, line `859`
  - `tmp/cli-sync-stress-multi-5000-20260701-1/events.jsonl`, line `991`
  - `tmp/cli-sync-stress-multi-5000-20260701-8/events.jsonl`, line `2154`
  - `tmp/cli-sync-stress-assert-20260701-1/events.jsonl`, examples around `2026-07-01T09:14:19Z`, `2026-07-01T09:14:33Z`, `2026-07-01T09:16:02Z`, and `2026-07-01T09:17:24Z`
  - `tmp/cli-sync-stress-multi-5000-20260701-13/events.jsonl`, lines `3388`, `5869`, `8289`, and `11521`
  - `tmp/cli-sync-stress-multi-10000-20260701-1/events.jsonl`, lines `3680`, `5095`, `5741`, and `6407`
- Symptom: `thread-api/apply-outliner-ops` returns HTTP 200 with `{"ok":true,"resultTransit":"[\"~#'\",false]"}` for `http-delete-restore-page` phase `delete`.
- Current evidence: the 1000-op run, assertion 5000-op run, normal 5000-op run, and normal 10000-op run completed with matching checksums and final graph validation, so this has not reproduced sync divergence. In `cli-sync-stress-5000-20260701-13` and `cli-sync-stress-10000-20260701-1`, the false result repeated for the same page UUIDs later in each run, which points toward the harness selecting an already-deleted or already-recycled page target, but this is not confirmed.
- Root cause: not confirmed yet. The likely areas are concurrent page target selection in the stress harness, an already-recycled page at apply time, or an outliner delete branch that reports false for a legitimate no-op.
- Fix: pending. Do not mark this fixed until the exact branch returning false is identified and covered by a targeted test or the harness is tightened to avoid invalid page targets.
- Status: open.

### Stress retry reused an already-invalid graph root

- Date: 2026-07-01
- Graph: `cli-sync-stress-5000-20260701-2`
- Command: `LOGSEQ_BIN=static/logseq-cli.js node scripts/cli-concurrent-edit-stress.mjs --graph cli-sync-stress-5000-20260701-2 --config tmp/cli-sync-stress-multi-5000-20260701-2/cli.edn --root-dir tmp/cli-sync-stress-multi-5000-20260701-2/root --log-file tmp/cli-sync-stress-multi-5000-20260701-2/events.jsonl --clients 3 --concurrency 8 --max-ops 5000 --sync --offline --no-e2ee --timeout-ms 20000 --settle-attempts 60 --settle-ms 1000`
- Symptom: the retry failed at `sync start` with a stale `last-error` reporting invalid reverse tx data for `move-blocks`, including multi-valued `:block/parent` and `:block/order`.
- Evidence:
  - `tmp/cli-sync-stress-multi-5000-20260701-2/events.jsonl` contains an earlier run starting at `2026-07-01T07:11:50Z`, before the retry at `2026-07-01T08:29:35Z`.
  - `graph validate` on that root reports the graph is already invalid, with 25 invalid entities.
  - The failing `sync start` reused `local-tx 65`, `pending-local 65`, and `pending-server 99` from that existing graph state instead of starting from an empty post-fix graph.
- Root cause: the verification command reused a graph/root/log path from an earlier failed run. The retry therefore exercised stale pre-fix graph state and stale sync error state, not the newly rebuilt sync code.
- Fix: long-run verification must use a unique graph name and root directory, and the root must be checked for absence before treating the run as fresh.
- Regression test or stress verification: not a product-code regression. The next valid evidence must come from a new graph/root, starting from no existing local graph files.
- Status: invalid test run; superseded by the next fresh 5000-op run.

### Temp rebase conn lost Datascript schema for cardinality-one replacement

- Date: 2026-07-01
- Graph: observed while investigating invalid sync-start state in `cli-sync-stress-5000-20260701-2`; the graph/root was later classified as contaminated test evidence, but the helper bug was real and independently reproduced.
- Symptom: applying local pending reverse txs during remote rebase could produce invalid entities with multiple `:block/parent` or `:block/order` values. Example last-error:
  `DB write failed with invalid data`, `tx-meta {:outliner-op "move-blocks" :reverse? true}`, with validation errors showing `:block/parent [264 222]` and `:block/order ["a6" "a0"]`.
- Root cause: `logseq.db/batch-transact-with-temp-conn!` built its temporary connection with `d/create-conn` and then swapped in the source `:db`. The temp connection could read the source DB, but its connection metadata did not preserve the source Datascript schema. Inner temp transacts therefore did not reliably emit replacement retractions for cardinality-one attrs, so the final replay into the live conn could accumulate values for attrs such as `:block/order` and `:block/parent`.
- Fix: the temp connection constructor now creates the isolated conn with `(:schema db)` before swapping in the source db state. This preserves Datascript cardinality and uniqueness behavior while keeping the temp conn isolated from storage writes.
- Regression tests:
  - `logseq.db-test/batch-transact-with-temp-conn-preserves-cardinality-one-schema-test`
  - `frontend.worker.db-sync-test/temp-conn-batch-preserves-cardinality-one-schema-test`
  - Rebase adjacency still passes:
    `frontend.worker.db-sync-test/rebase-local-insert-then-save-keeps-cardinality-one-values-test`,
    `frontend.worker.db-sync-test/apply-remote-txs-skips-stale-move-before-later-delete-test`,
    `frontend.worker.db-sync-test/apply-remote-txs-skips-stale-move-to-target-before-later-target-delete-test`,
    `frontend.worker.db-sync-test/apply-remote-txs-with-local-changes-rejects-invalid-final-rebase-test`.
- Test evidence:
  - `rtk pnpm --dir deps/db test-v logseq.db-test/batch-transact-with-temp-conn-preserves-cardinality-one-schema-test` completed the deps/db suite: 114 tests, 418 assertions, 0 failures.
  - `rtk bb dev:test -v frontend.worker.db-sync-test/temp-conn-batch-preserves-cardinality-one-schema-test ...` completed 5 worker tests, 15 assertions, 0 failures.
- Post-fix stress verification: fresh 5000-op and 10000-op stress runs completed with final graph validation passing on all clients and no cardinality-one validation errors.
- Status: fixed and verified in targeted tests plus fresh stress runs.

## Recent db-test sync-stuck issue cluster

- Date checked: 2026-07-01
- Issues:
  - `logseq/db-test#937`: existing browser graphs do not sync; console reports `Invalid local tx` with `local-tx nil`.
  - `logseq/db-test#947`: browser reports `0 pending server changes` while desktop and CLI changes are already on the server.
  - `logseq/db-test#969`: after suspend/resume, the app is online but RTC is stopped with `rtc-state :close`, `pending-local-ops 1`, and `local-tx == remote-tx`; clicking `Start Sync` resumes sync.
  - `logseq/db-test#898`: graph stays yellow and only recovers after deleting the local graph and re-downloading.
  - `logseq/db-test#890`: graph stays in `Preparing`; opening from remote graphs works but no sync indicator appears.

### Repro path: missing client-ops `local-tx`

- Target symptom: `Invalid local tx` on server `hello`, or a silent `db-sync/start-skipped` because `client-op-ready?` is false.
- State to create: graph DB and client-ops DB are both open, but `sync_meta.local-tx` is missing from the client-ops DB.
- Why this matches the issues: existing local graphs affected by old cache/migration state can have remote graph ids and pending local rows, while `local-tx` is absent. Missing `local-tx` must not be treated as `0`, because that would force the client to pull too many server txs from the beginning.
- Existing fix: `:thread-api/db-sync-start` opens DBs before starting sync, and `sync/start!` skips with `:client-op-not-ready` until client-op metadata has a real integer `local-tx`.
- Regression test: `frontend.worker.sync.restart-test/start-skips-when-client-op-local-tx-is-missing-test`.
- Expected fixed behavior: no websocket connection is opened when `local-tx` is missing, and no code initializes missing `local-tx` to `0` outside the explicit new-remote-graph/upload paths.

### Repro path: stale RTC after resume

- Target symptom: online app with `rtc-state :close`, pending local changes, and no automatic retry until manual `Start Sync`.
- State to create: current RTC client still targets the active repo/graph, but its websocket is already closed or stale after sleep/offline/resume.
- Relevant issue evidence: `logseq/db-test#969` reports `pending-local-ops 1`, `local-tx 1244`, `remote-tx 1244`, `rtc-state :close`; `logseq/db-test#780` reports stale websocket timeout after network returns.
- Regression tests:
  - `frontend.handler.db-based.rtc-flows-test/resume-restart-events-do-not-depend-on-cached-rtc-lock-test`
  - `frontend.worker.sync.restart-test/start-reconnects-closed-ws-with-stale-open-state-test`
  - `frontend.worker.sync.restart-test/stale-loop-marks-non-open-ws-closed-test`
  - `frontend.worker.sync.restart-test/ws-close-clears-inflight-before-reconnect-test`
- Expected fixed behavior: network-visible/resume triggers can restart RTC, and stale/closed websockets clear inflight state, broadcast `:closed`, and schedule reconnect instead of leaving the graph permanently stopped.
