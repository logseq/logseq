# 054-db-sync-test-isolation

## Summary

`bb dev:lint-and-test` would currently fail in CLJS runtime tests, while lint and test compilation would still pass. The observed failures would point to test isolation problems inside `frontend.worker.db-sync-test`, not to a stable regression in db-sync production logic.

## Background

The failing command would be:

- `bb dev:lint-and-test`

Its execution flow would be:

1. lint tasks
2. CLJS test compilation
3. CLJS runtime test execution

Observed behavior from the captured run:

- lint would pass
- test compilation would pass
- runtime tests would fail with 3 failures

The failing tests would include:

- `frontend.worker.db-sync-test/ensure-upload-graph-identity-defaults-e2ee-enabled-test`
- `frontend.worker.db-sync-test/download-graph-by-id-fails-on-incomplete-snapshot-frame-test`

A follow-up run of the full namespace would fail on a different test:

- `frontend.worker.db-sync-test/pull-ok-out-of-order-stale-response-is-ignored-test`

This changing failure surface would strongly suggest flaky shared state rather than a deterministic implementation bug.

## Evidence

### 1. Failing tests would pass in isolation

Running these tests individually would pass:

- `frontend.worker.db-sync-test/ensure-upload-graph-identity-defaults-e2ee-enabled-test`
- `frontend.worker.db-sync-test/download-graph-by-id-fails-on-incomplete-snapshot-frame-test`

This would indicate that the underlying code paths can behave correctly when the test environment is clean.

### 2. Full-namespace execution would produce a different failure

Running the whole namespace would fail in `pull-ok-out-of-order-stale-response-is-ignored-test` instead of the two failures seen in the full suite.

This would indicate order dependence or leaked global state between tests in the same namespace.

### 3. Failure payloads would match leaked state

`ensure-upload-graph-identity-defaults-e2ee-enabled-test` would unexpectedly receive an existing graph identity with:

- `:graph-id "c52bf9d4-3a95-4f17-9c8c-7f86eef5f75d"`
- `:graph-e2ee? false`

That graph id would match a value used by another test in the same file. This would suggest that the later test is reusing state left behind by an earlier test instead of executing its own intended bootstrap path.

`download-graph-by-id-fails-on-incomplete-snapshot-frame-test` would expect `incomplete-snapshot-frame` but would sometimes receive an unrelated assertion failure:

- `Assert failed: test-db-sync-repo (some? conn)`

This would suggest that another asynchronous code path is still interacting with shared worker state while the test is running.

## Root Cause

The most likely root cause would be incomplete per-test cleanup of shared global state in:

- `frontend.worker.state`
- `frontend.worker.sync`

The highest-risk shared atoms would include:

- `worker-state/*datascript-conns`
- `worker-state/*client-ops-conns`
- `worker-state/*db-sync-client`
- `worker-state/*db-sync-config`
- `db-sync/*repo->latest-remote-tx`
- `db-sync/*start-inflight-target`

The test file would also rely heavily on:

- `async done`
- nested `promesa` chains
- cleanup inside `p/finally`

That structure would make it possible for a test to signal completion before all outer cleanup has fully restored shared state, especially when asynchronous callbacks or listeners are still active.

## Proposed Changes

### 1. Add a per-test fixture for global state reset

A `:each` fixture in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_sync_test.cljs` would reset the shared worker and db-sync atoms before and after every test.

The fixture would reset at least:

- `worker-state/*datascript-conns`
- `worker-state/*client-ops-conns`
- `worker-state/*db-sync-client`
- `worker-state/*db-sync-config`
- `db-sync/*repo->latest-remote-tx`
- `db-sync/*start-inflight-target`

### 2. Review high-risk async tests

If fixture-based isolation is not sufficient, the next step would be to tighten async structure in the tests most likely to leak state.

Priority candidates would include:

- upload identity tests
- snapshot download tests
- pull/ok ordering tests

The goal would be to ensure that:

- cleanup happens after the actual promise chain settles
- `done` is called only after cleanup boundaries are satisfied
- any listener or temporary override is fully restored before the next test starts

## Why Production Code Is Less Likely To Be At Fault

The current evidence would not strongly support a production db-sync bug because:

1. the affected tests would pass when run alone
2. the failing test would change depending on suite shape
3. the observed incorrect values would match data seeded by neighboring tests
4. the expected production code path for incomplete snapshot handling already appears to raise the correct error in isolated execution

Because of that, modifying production sync logic first would risk masking a test harness problem instead of fixing the actual instability.

## Verification Plan

After applying the test isolation changes, verification would include:

1. `bb dev:test -v frontend.worker.db-sync-test`
2. `bb dev:lint-and-test`

Success criteria would be:

- individual failing tests still pass
- the full `frontend.worker.db-sync-test` namespace passes reliably
- the full `bb dev:lint-and-test` command no longer fails on these db-sync tests

## Risks And Follow-ups

If failures remain after the fixture reset, the next investigation would focus on:

- leaked `d/listen!` listeners
- background tasks still running across tests
- `js/fetch` restoration timing
- promise chains whose cleanup is attached at the wrong level
- other shared atoms not yet covered by the fixture

## Files

Would modify:

- `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/db_sync_test.cljs`

Would not modify initially:

- `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync/client_op.cljs`
