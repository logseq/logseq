# Render Delta Simplification Implementation Plan

Goal: Fix the confirmed renderer synchronization bugs and simplify the hot transaction path without changing supported behavior or introducing a performance regression.

Architecture: The worker remains the canonical database owner and publishes one compact render delta after each committed transaction.
The implementation keeps that architecture, removes exceptional code paths that discard canonical information, batches temporary block cleanup, and removes disabled profiling work from every RFX state write.

Tech Stack: ClojureScript, DataScript, Promesa, RFX, Shadow CLJS, Babashka, Node.js CLJS tests, and repository E2E suites.

Related: Builds on `docs/agent-guide/082-incremental-block-reactivity.md` and the review findings for `origin/master...refactor/remove-ui-db`.

## Problem statement

The branch adds 24,405 non-test source lines and removes 21,164 non-test source lines relative to `origin/master`, for a net source increase of 3,241 lines before excluding comments and blanks.

The branch adds 23,528 test lines and removes 2,783 test lines, for a net test increase of 20,745 lines.

The large test increase is partly justified by the renderer ownership migration, but duplicated shape assertions and compatibility-specific cases make the suite harder to maintain.

The review confirmed three correctness bugs.

`frontend.worker.query-dsl/execute-query` discarded `:current-page-title` and `:today-day`, so dynamic query variables were evaluated with process-local defaults instead of the render resource context.

`frontend.worker.db-listener/build-render-delta` replaced import transaction datoms with an empty vector, so imported parent and order changes could not produce children patches.

Deferred post-commit handlers ran outside the error boundary and before the renderer broadcast, so a synchronous exception could commit the database transaction while preventing the UI refresh.

Rejected promises returned by deferred handlers were also ignored.

The review also found two avoidable hot-path costs.

Every inserted child scheduled its own two-second cleanup timer.

Every RFX state write collected detailed profiling data even though the only reporting form was disabled.

The plan intentionally does not redesign the RFX store, the generic render resource model, or children revision semantics.

Those changes would alter broad contracts and require a separate architecture plan.

## Testing Plan

The bug-fix tests use a real DataScript database and invoke the public query or transaction listener path.

The query test creates referenced blocks and verifies that `current page` and `today` resolve from explicit resource context.

The import test builds a real structural transaction and verifies that its render delta contains the child insertion.

The post-commit tests transact through the installed database listener and verify that both synchronous exceptions and rejected promises are reported without suppressing the render broadcast.

I will add a renderer subscription test that applies one delta containing many inserted children and verifies that temporary cleanup is scheduled once for the delta rather than once per block.

The timer test will also execute the scheduled callback and verify that unmounted seeded blocks are collected while mounted or revision-replaced blocks survive.

Existing RFX behavior tests will verify that removing disabled profiling preserves snapshots, fast-state store bypass, path listener notification, and dispatch behavior.

I will run targeted Node CLJS tests first, then the complete lint and unit suite, then both repository E2E suites.

NOTE: I will write *all* tests before I add any implementation behavior.

## Behavioral boundary

```text
DataScript transaction
        |
        v
worker pipeline -----> canonical replacements
        |                       |
        +---- structural datoms-+
                    |
                    v
             one render delta
                    |
                    v
           renderer subscriptions
             |              |
             v              v
       precise notify   batched seed GC
```

The worker database remains authoritative.

The renderer continues to receive complete block replacements, revisioned tombstones, children patches, and affected resource keys.

Post-commit persistence still runs before renderer publication.

Unrelated deferred handlers still run after the worker pipeline and receive the processed transaction report.

Handler failures remain non-fatal after the database commit and are reported through `:capture-error`.

## Test retention and deletion criteria

| Test category | Decision | Reason |
|---|---|---|
| Dynamic query context behavior | Keep | It protects user-visible resource context and deterministic date evaluation. |
| Imported structural children patch | Keep | It protects the exact regression caused by discarded datoms. |
| Synchronous deferred handler failure | Keep | It protects broadcast ordering and error containment. |
| Rejected deferred handler promise | Keep | It protects asynchronous error reporting, which the synchronous case cannot cover. |
| Generic replacement wins over same-transaction tombstone | Keep one case | The invariant is independent of import or remote metadata after the exceptional import branch is removed. |
| Separate import and remote replacement copies | Remove or consolidate | They exercise the same canonical replacement invariant with duplicated setup and assertions. |
| Internal map-shape-only assertions | Do not add | They couple tests to helper composition without protecting behavior. |
| Seed cleanup scheduling cardinality | Keep | It is a direct performance guard against one timer per inserted block. |
| Disabled profiler internals | Do not test | The profiler is removed, and existing RFX behavior tests cover the retained contract. |

## Task 1: Preserve the query resource context

Files:

- Modify `src/test/frontend/db/query_dsl_test.cljs`.
- Modify `src/main/frontend/worker/query_dsl.cljs`.

Steps:

1. Create blocks that reference a named current page and a fixed journal title.

2. Execute the DSL query with explicit `:current-page-title` and `:today-day` values.

3. Run `bb dev:test -v frontend.db.query-dsl-test/page-ref-and-boolean-queries` and confirm both assertions fail before implementation.

4. Pass the complete option map from `execute-query` to `parse-query`.

5. Anchor `today`, `yesterday`, and `tomorrow` to `:today-day` when the caller supplies it.

6. Keep the current clock behavior only when `:today-day` is absent.

7. Re-run the targeted test and confirm it passes.

Edge cases:

- `:current-page-title` may be absent and must retain the existing current-day fallback.
- A fixed `:today-day` must not shift by local timezone conversion.
- `:cards?` and `:block-attrs` must continue to reach their existing consumers.

Status: Completed with RED and GREEN evidence.

## Task 2: Preserve structural datoms for imports

Files:

- Modify `src/test/frontend/worker/db_listener_test.cljs`.
- Modify `src/main/frontend/worker/db_listener.cljs`.

Steps:

1. Create a real parent entity and transact a child with `:block/parent` and `:block/order`.

2. Mark the transaction as imported data.

3. Build the render delta and assert that the parent patch upserts the child.

4. Run the targeted test and confirm the children patch is absent before implementation.

5. Remove the import-only transaction-report rewrite.

6. Pass the processed transaction report directly to `render-delta/build`.

7. Remove the now-unused import namespace dependency.

8. Re-run the targeted test and confirm the child patch is present.

Edge cases:

- Canonical replacements must still win over tombstones for the same UUID.
- Import transactions without structural datoms must continue to produce an empty children map.
- Remote transactions must retain the same generic replacement behavior.

Status: Completed with RED and GREEN evidence.

## Task 3: Contain all post-commit handler failures

Files:

- Modify `src/test/frontend/worker/db_listener_test.cljs`.
- Modify `src/main/frontend/worker/db_listener.cljs`.

Steps:

1. Make the markdown mirror handler throw synchronously through the installed database listener.

2. Assert that the transaction remains committed, the error is reported, and the renderer broadcast still happens.

3. Make the same handler return a rejected promise.

4. Assert that the broadcast happens and the asynchronous rejection is reported.

5. Run both tests and confirm the synchronous exception escapes and the promise rejection is not captured before implementation.

6. Return the handler result from the timing wrapper.

7. Route every deferred handler through the existing post-commit error boundary.

8. Attach an error reporter to promise results without awaiting them or delaying the broadcast.

9. Re-run both tests and confirm they pass.

Edge cases:

- A successful synchronous handler may return any ordinary value.
- A successful asynchronous handler must not make the database listener asynchronous.
- Error reporting failures must remain contained by the existing reporting fallback.

Status: Completed with RED and GREEN evidence.

## Task 4: Batch seeded block cleanup

Files:

- Modify `src/test/frontend/db/subs_test.cljs`.
- Modify `src/main/frontend/db/subs.cljs`.

Steps:

1. Add one test delta with at least 1,000 inserted child blocks.

2. Capture cleanup scheduling and assert that applying the delta schedules exactly one cleanup callback.

3. Run the targeted test and confirm the current implementation schedules one callback per seeded block.

4. Change the cleanup scheduler to accept the complete seeded UUID set for one applied delta.

5. Schedule one callback that checks every seeded block against its mounted state and basis revision.

6. Remove all eligible blocks in one store update.

7. Execute the captured callback in the test.

8. Assert that an unmounted unchanged seed is collected.

9. Assert that a mounted seed survives.

10. Assert that a block replaced at a later revision survives.

11. Re-run the targeted test and confirm all behavior and cardinality assertions pass.

Edge cases:

- An empty seeded set must schedule no timer.
- A stale callback must not delete a newer replacement.
- A mounted block must survive even if it was originally seeded.
- The batch operation must perform one store swap rather than one swap per block.

Expected performance result:

- A delta with 1,000 inserted children changes from 1,000 timers to one timer.
- The callback changes from up to 1,000 independent atom swaps to one atom swap.

## Task 5: Remove disabled RFX profiling work

Files:

- Modify `src/main/frontend/rfx.cljs`.
- Verify `src/test/frontend/rfx_test.cljs`.

Steps:

1. Run `frontend.rfx-test` before the change to establish the behavior baseline.

2. Remove `!state-write-profile`, `now-ms`, `state-path-key`, and `profile-state-write!`.

3. Remove timing-only arguments from `sync-wrapper-state-paths!`.

4. Remove timing reads and counters from `replace-state-paths!`.

5. Keep listener selection, equality checks, notification order, and returned state unchanged.

6. Run `frontend.rfx-test` after the change and confirm all tests pass.

7. Compare the hot path and confirm it no longer calls `performance.now`, builds profiling maps, formats path keys, or updates the profiling volatile.

Edge cases:

- Fast state must continue to bypass the general RFX store.
- Global state listeners must continue to run before path listeners.
- Path listeners must continue to run only when their selected value changes.
- Dispatch must continue to preserve fast-state values.

Expected performance result:

- Each RFX state write removes multiple clock calls and one nested profiling-state update.
- No runtime logging or diagnostics are lost because the only report form was disabled.

## Task 6: Flatten the database listener transaction path

Files:

- Modify `src/main/frontend/worker/db_listener.cljs`.
- Verify `src/test/frontend/worker/db_listener_test.cljs`.

Steps:

1. Record the existing order as checksum, local persistence, render-delta construction, deferred handlers, broadcast, and performance log.

2. Extract the non-empty committed transaction body into one private function with explicit inputs.

3. Extract deferred handler iteration into one private function if it reduces nesting without hiding ordering.

4. Keep `d/listen!` responsible only for filtering empty transaction reports and calling the transaction processor.

5. Preserve the current checksum batch condition.

6. Preserve persistence before render-delta construction.

7. Preserve deferred handler execution before broadcast while ensuring failures cannot block broadcast.

8. Run the complete database listener test namespace.

9. Inspect the diff and revert any extraction that increases indirection or argument count without reducing nesting.

Edge cases:

- Explicit `handler-keys` must continue to select the same methods.
- `:db-sync` must remain excluded from deferred handlers.
- `:sync-db-to-main-thread` remains a synthetic selector rather than a multimethod.
- Empty transaction reports must remain ignored.

## Task 7: Consolidate only proven duplicate tests

Files:

- Modify `src/test/frontend/worker/db_listener_test.cljs`.
- Optionally move the dynamic query context test within `src/test/frontend/db/query_dsl_test.cljs` for narrower targeting.

Steps:

1. Compare the import and remote replacement tests after the import-specific production branch is gone.

2. Replace them with one metadata-independent canonical replacement invariant test if their setup, action, and assertions are identical.

3. Keep the imported structural patch regression as a separate test because it exercises different behavior.

4. Keep synchronous and asynchronous post-commit failures as separate scenarios unless a shared helper reduces lines without obscuring their distinct scheduling behavior.

5. Avoid deleting tests based only on line count.

6. Run the affected namespaces after every consolidation.

7. Compare assertion counts and confirm every retained production branch has behavioral coverage.

Acceptance criteria:

- Deleted tests are demonstrably duplicate behavior.
- No user-facing behavior, failure mode, or performance invariant loses coverage.
- The resulting tests have less setup duplication and clearer failure names.

## Task 8: Review the completed simplification

Files:

- Review every file changed by this plan.

Steps:

1. Run `git diff --check`.

2. Run the repository formatter or lint checks that cover the touched ClojureScript files.

3. Inspect the final diff for compatibility branches, silent fallbacks, default masking, and unnecessary abstractions.

4. Confirm that code and comments are in English.

5. Confirm that constant formatter construction is not repeated in a hot loop.

6. Confirm that no mutable connection is passed to a function that only needs an immutable database value.

7. Record final source and test line changes relative to both the starting branch and `origin/master`.

## Task 9: Run full verification

Commands:

```bash
bb dev:lint-and-test
bb -f clj-e2e/bb.edn test
bb -f cli-e2e/bb.edn build
bb -f cli-e2e/bb.edn test --skip-build
git diff --check
git status --short
```

Expected results:

- Lint and unit tests exit with status zero.
- The Clojure E2E suite exits with status zero.
- The CLI E2E build and suite exit with status zero.
- `git diff --check` reports no whitespace errors.
- `git status --short` lists only files intentionally changed by this plan.

If a suite fails for an environment dependency, preserve the complete command output, distinguish an infrastructure failure from a product failure, and do not claim full CI success.

## Testing Details

The added tests exercise query results, committed transaction publication, renderer children membership, asynchronous error reporting, and cleanup scheduling behavior through real public or transaction boundaries.

The tests avoid asserting private intermediate map shapes except where the render delta itself is the published contract.

The cleanup cardinality assertion is a performance invariant because it bounds scheduled work as inserted block count grows.

## Implementation Details

- Keep one complete transaction report from the worker pipeline through render-delta construction.
- Pass the complete DSL option map to dynamic template resolution.
- Anchor relative date variables to the explicit resource day.
- Use one error boundary for every post-commit handler.
- Observe promise rejection without awaiting deferred work.
- Schedule one seeded-block cleanup callback per delta.
- Remove seeded blocks with one store update.
- Delete disabled RFX profiling instead of adding a runtime flag.
- Extract listener control flow only where it visibly reduces nesting.
- Delete only behaviorally duplicate tests.

## Question

No blocking product decision is required for this scoped plan.

A broader consolidation of the RFX store, renderer resource types, or children revision model should be handled in a separate plan because it changes architecture rather than simplifying the current implementation locally.

---
