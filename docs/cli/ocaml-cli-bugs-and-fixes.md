# OCaml CLI Bugs and Fixes

Last updated: 2026-07-01

This document tracks bugs found while using the OCaml Logseq CLI and the CLI sync stress workflow. The scope is split deliberately:

- OCaml CLI product bugs: code under `cli/lib` and tests under `cli/test`.
- CLI stress harness bugs: `scripts/cli-concurrent-edit-stress.mjs` and its tests.
- Sync/db-worker bugs exposed by CLI stress: root causes outside the OCaml CLI, but reproducible through CLI-driven concurrent editing.

For detailed sync stress logs and per-run evidence, see `docs/sync/failed-cases.md`.

## OCaml CLI Product Bugs

### Tag-name resolution failed for block tag updates

- Status: fixed.
- Symptom: `upsert block --update-tags '["cli-stress-tag-a"]'` failed before the outliner mutation with a Datascript parser error: `Cannot parse :find`.
- Reproduced by: `cli-test-5` during expanded CLI sync stress.
- Root cause: string tag-name resolution used a duplicated Datascript class query path. Numeric tag ids worked, but tag names failed.
- Fix: `cli/lib/upsert.ml`, `cli/lib/add.ml`, and `cli/lib/update.ml` now use the existing tag-list endpoint (`thread-api/cli-list-tags`) instead of the broken query path.
- Regression coverage: `cli/test/test_cases.ml` covers `upsert block --update-tags '["Tag A"]'`.

### Release CLI failed to reuse a starting db-worker-node

- Status: fixed.
- Symptom: concurrent CLI commands failed with `server-start-failed`, `failed to publish health`, or transient `fetch failed` while db-worker-node was already starting.
- Reproduced by: `cli-sync-stress-1000-20260701-1` and an earlier 5000-op stress attempt.
- Root cause: `cli/lib/server_runtime.ml` discovered existing workers only from successful `/healthz` responses. It treated HTTP 503 `starting` health payloads as absent, then did a one-shot final health lookup after spawning. Under concurrent CLI startup this could spawn duplicate workers or fail while the existing worker was almost ready.
- Fix: `cli/lib/server_runtime.ml` accepts both ready and starting health payloads for discovery, waits for readiness, respects the db-worker lock, and retries final health discovery before failing.
- Regression coverage: CLI parity tests cover reusing a starting db-worker-node and retrying final health discovery.

## CLI Stress Harness Bugs

These were not OCaml CLI product defects, but they affected our ability to reproduce real concurrent-edit bugs reliably.

### Local sync server was only checked, not started

- Status: fixed.
- Symptom: `--sync` failed immediately with `Local db-sync server is not healthy at http://127.0.0.1:18080/health`.
- Root cause: the harness required a local db-sync server but only performed a health check.
- Fix: the harness starts `cli-e2e/scripts/db_sync_server.py` automatically for local `--sync` runs unless `--no-start-sync-server` is passed.
- Regression coverage: JavaScript harness tests cover local sync server start arguments.

### Sync start ran before local upload/init

- Status: fixed.
- Symptom: `sync start` failed with `auth-refresh-failed`, `Run logseq login first`, and a local HTTP 404.
- Root cause: the graph was not initialized and uploaded to the local sync server before `sync start`.
- Fix: the harness checks `sync status`, prepares graph E2EE metadata when needed, runs `sync ensure-keys`, uploads the graph, then starts sync.
- Regression coverage: JavaScript harness tests cover local sync upload and ensure-key arguments.

### Stale block ids failed normal concurrent operations

- Status: fixed as harness classification.
- Symptom: concurrent move/update/delete operations failed with `source-not-found`, `target-not-found`, `block-not-found`, `page-not-found`, `recycled-page`, or `upsert-id-not-found`.
- Root cause: workers choose ids from a shared live-id pool; another worker can delete or recycle the same target before the selected operation runs.
- Fix: those outcomes are classified as expected race conflicts. The harness drops stale ids and refreshes the pool.
- Regression coverage: JavaScript harness tests cover stale id extraction and expected race classification.

### Volatile property/tag delete races stopped long runs

- Status: fixed as harness classification.
- Symptom: `property-delete-recreate` could fail with `property-not-found` or `ambiguous-property-name`; `tag-delete-recreate` could fail with `tag-not-found`.
- Root cause: the harness intentionally uses shared volatile property/tag names across workers. Under concurrent delete/recreate, name selectors can legitimately find zero or multiple entities.
- Fix: those delete-phase outcomes are classified as expected race conflicts.
- Regression coverage: JavaScript harness tests cover volatile property and tag race classifiers.

### Raw page operations reused shared mutable page targets

- Status: fixed in harness.
- Symptom: `thread-api/apply-outliner-ops` returned HTTP 200 with `resultTransit false` for raw `delete-page`, or nil for permanent recycle delete after a lost soft delete.
- Root cause: raw page delete/restore/recycle operations selected shared mutable pages, so other workers could delete or restore the same page while the operation was being verified. Some generated page titles were also only sequence-based and could collide across workers.
- Fix: raw create/delete/restore/recycle paths now use operation-owned unique page titles that include worker id, sequence, run id, and a UUID.
- Regression coverage: JavaScript harness tests cover `uniqueOperationPageTitle`.

### Retried stress run reused contaminated graph roots

- Status: documented as invalid test evidence.
- Symptom: a retry failed with stale invalid sync state from an earlier run.
- Root cause: the same graph/root/log path was reused after a failed run.
- Fix: fresh verification uses unique graph names and root directories; existing roots are not treated as fresh evidence.

## Sync/Db-Worker Bugs Exposed by CLI Stress

These were found through the OCaml CLI stress workflow but fixed outside the OCaml CLI layer.

### Duplicate `:block/uuid` after failed remote rebase

- Status: fixed.
- Symptom: `sync start` reached an open websocket but stopped on a stored `last-error`: duplicate `:block/uuid` unique constraint.
- Root cause: remote tx application with local changes used the live Datascript connection while reversing local txs, applying remote txs, and replaying locals. An exception could leave the live conn in an intermediate state.
- Fix: remote rebase uses `batch-transact-with-temp-conn!`; live state is committed only after the temp result succeeds.
- Regression coverage: worker db-sync tests cover invalid final rebase rejection and cardinality-one preservation.

### Temp rebase conn lost Datascript schema

- Status: fixed.
- Symptom: reverse/rebase could accumulate multiple `:block/parent` or `:block/order` values.
- Root cause: the temporary connection was created without the source DB schema, so cardinality-one replacement behavior was not preserved.
- Fix: temp conns are created with `(:schema db)` before swapping in the source DB.
- Regression coverage: Melange DB and frontend worker tests cover cardinality-one preservation.

### Receive queue failures were invisible to `sync status`

- Status: fixed.
- Symptom: a receive-loop exception could stop remote application while `sync status` did not expose the error through `last-error`.
- Root cause: the receive queue catch path logged but did not update sync error state.
- Fix: receive queue failures now call `set-last-sync-error!`.
- Regression coverage: `receive-queue-failure-updates-last-sync-error-test`.

### Recycle restore/permanent-delete returned no observable apply result

- Status: fixed.
- Symptom: `apply-outliner-ops` could return HTTP 200 with nil/false result for recycle restore or permanent delete.
- Root cause: `logseq.outliner.op/apply-op!` did not set `*result` for `:restore-recycled` and `:recycle-delete-permanently`.
- Fix: both branches return their mutation result through `*result`.
- Regression coverage: `recycle-ops-return-apply-result-test`.

### Stale remote move before later remote delete failed after local reversal

- Status: fixed and stress verified.
- Symptom: remote apply failed with `Nothing found for entity id [:block/uuid ...]` while a later remote tx deleted that same block.
- Root cause: local reversal removed the moved block before the remote batch applied a stale move that was superseded by a later delete.
- Fix: remote apply skips stale operation datoms when the referenced block is already missing and the same remote batch deletes that block.
- Regression coverage: worker tests cover stale move-before-delete for both moved block and target block.

### Missing block after local reversal needed server repair

- Status: fixed and stress verified.
- Symptom: after offline journal races, remote apply failed on a missing block UUID that still existed on the server and had no later remote delete.
- Root cause: repair preflight checked against live DB before reversing local txs. The block became missing only after local reversal, so repair data was not fetched.
- Fix: remote apply performs an isolated dry-run of local reversal and fetches server repair data for refs that become missing only after reversal.
- Regression coverage: worker tests cover block repair after local reversal and adjacent repair/rebase cases.

### Rejected local tx stayed applied locally

- Status: fixed and stress verified.
- Symptom: all queues were empty and `last-error` was nil, but one client had a real checksum divergence and was missing blocks accepted by the server and other clients.
- Root cause: when the server rejected a local tx as non-recoverable, the client marked it failed and non-pending but did not roll back the optimistic local mutation.
- Fix: `tx/reject` handling now rolls back the rejected tx in a temp conn, then rebases later non-rejected pending txs.
- Regression coverage: focused `tx/reject` worker tests and fresh 5000-op stress.

### Idle sync status exposed stale or nil local checksum

- Status: fixed by targeted test and fresh stress verification.
- Symptom: `local-tx == remote-tx`, pending queues were zero, graph validation passed, but `sync status` showed a stale local checksum or `nil`.
- Root cause: sync status read the cached local checksum from client-ops metadata. When no later tx arrived, a stale or missing cache remained visible even though recomputing from the Datascript DB matched remote.
- Fix: idle `sync-counts` recomputes and updates the local checksum when pending queues are zero, tx positions match, and the cached checksum is nil or differs from remote.
- Regression coverage: `sync-counts-refreshes-idle-stale-local-checksum-test` covers stale string and nil values.

### Reversing queued parent insert orphaned existing children

- Status: fixed by targeted test and fresh 5000-op stress verification.
- Symptom: after reconnect, sync rebase reversed an earlier `insert-blocks` tx by retracting a parent while children still referenced it, causing `DB write failed with invalid data` and missing required `:block/parent`.
- Root cause: raw reverse tx-data for `:insert-blocks` could be narrower than the current local subtree. It retracted the parent but not current descendants that were not present in the reverse tx slice.
- Fix: `reverse-history-action!` expands `:insert-blocks` reverse retracts to include current descendants before retracting the parent.
- Regression coverage: `apply-remote-txs-reverses-parent-insert-with-existing-child-without-orphaning-test`.

### Pending tx snapshot drift during remote apply

- Status: fixed by targeted tests and fresh 5000-op stress verification.
- Symptom: a recovered severe `:db-sync/apply-remote-txs-failed` occurred when remote apply used pending txs from one snapshot and a temp DB copied after a later local delete.
- Root cause: remote apply captured pending txs first, then copied the live DB. A new pending local tx could land between those steps, so the temp DB no longer matched the local tx list being reversed.
- Fix: remote apply retries from fresh pending txs and current DB when either the failure itself is the internal `:pending-tx-snapshot-changed` control signal, or when an ordinary apply error happens while the pending tx snapshot still differs. This keeps missing-entity drift retryable without leaking the internal control signal into `last-error`.
- Regression coverage: `apply-remote-txs-rechecks-local-txs-when-local-delete-races-temp-snapshot-test`, `apply-remote-txs-delays-retry-when-local-txs-keep-changing-test`, and `apply-remote-txs-retries-snapshot-drift-even-if-pending-list-stabilizes-test`.

### Pending tx snapshot changed before temp remote apply commit

- Status: fixed by targeted tests and fresh 5000-op stress verification.
- Symptom: remote apply could successfully commit an older temp DB view over a new local page delete; the next permanent recycle delete returned nil because the page was no longer recycled.
- Root cause: remote apply protected only the exception path from stale pending snapshots. It did not recheck the pending tx id list just before committing the temp result to the live conn.
- Fix: `batch-transact-with-temp-conn!` accepts a `:before-commit` hook, and remote apply uses it to abort and retry if pending local tx ids changed.
- Regression coverage: worker test for temp-commit race, Melange DB test for aborting live commit, and JavaScript harness tests for unique page targets.

### Concurrent validated transacts could lose writes

- Status: fixed by targeted test and fresh 5000-op stress verification.
- Symptom: a 5000-op run ended with one client missing property-history entities and task properties while the corresponding client-op had been persisted and ACKed.
- Root cause: validated `transact-sync` read `db`, ran `d/with`, validated, then committed with `reset! conn db-after`. If two validated transacts started from the same DB, the later reset could overwrite the earlier committed live DB state while the earlier tx was still stored as a client op.
- Fix: validated `transact-sync` now commits with `compare-and-set!`. If the live conn changed before commit, it recomputes and revalidates from the current DB. If validation failed against a stale DB, it retries instead of throwing the stale validation result.
- Regression coverage: `validated-transact-retries-when-live-conn-changes-before-commit-test`.

## Open or Diagnostic Cases

### Stored server checksum metadata drift

- Status: open.
- Symptom: clients and direct server recompute matched, but server `sync_meta.checksum` stored a stale value.
- Root cause: pending.
- Current diagnostic: an opt-in `DB_SYNC_CHECKSUM_ASSERT=true` path recomputes server checksum after each appended tx and throws if incremental metadata drifts. It has not reproduced the original drift yet.

### RTC closed with pending local changes after offline/resume

- Status: open.
- Symptom: `rtc-state` or `ws-state` becomes closed while local changes remain pending, and sync may not restart until manual start or app refresh.
- Root cause: pending. Candidate areas are explicit offline/stop races, stale closed-client reuse, and uncleared inflight state.
- Evidence: stress runs reproduced transient closed websocket states with pending local changes, but some later recovered without manual restart.

### Missing `local-tx` must not initialize to zero

- Status: existing fix documented.
- Symptom: old local graph/client-ops state can have missing `sync_meta.local-tx`.
- Root cause: treating missing `local-tx` as `0` forces the client to read too many server txs.
- Expected behavior: sync start skips with `:client-op-not-ready` until client-op metadata has a real integer `local-tx`.
- Regression coverage: restart tests cover skip behavior for missing `local-tx`.

## Current Verification Snapshot

- JavaScript stress harness tests: `rtk node --test scripts/cli-concurrent-edit-stress.test.mjs scripts/cli-sync-stress-workflow.test.mjs` passed with 30 tests.
- Focused worker db-sync regression tests for parent insert reverse, pending snapshot retry, idle checksum refresh, stale remote move/delete, validated transact CAS, and retryable snapshot drift `last-error` pollution passed.
- `rtk pnpm db-worker-node:release:bundle` rebuilt `static/db-worker-node.js`.
- Fresh 5000-op CLI sync stress on graph `cli-sync-stress-5000-20260701-snapshot-last-error-1` completed `5001` started ops with 3 clients, offline simulation, auto-created journal races, HTTP outliner ops, undo/redo, insert/delete/move-heavy traffic, matching final checksum `5790fdbc975a6b36` on all clients, and final `graph validate` passing on all clients.
- The latest 5000-op event log had no `sync-start-runtime-error`, `pending-tx-snapshot-changed`, `apply-remote-txs-failed`, fatal event, error-level event, or checksum mismatch marker.
