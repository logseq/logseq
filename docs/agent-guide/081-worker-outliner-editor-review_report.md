# PR #12892 Core Worker, Outliner, and Editor Review

Date: 2026-07-16

PR: [#12892 — refactor: move UI DB access to worker](https://github.com/logseq/logseq/pull/12892)

Review range: `998207ffd5339386607328d3c71fd190dbf58cb7..fbaecc73f0`

## Executive summary

The worker-owned DB direction is sound, but the current PR is not ready to merge in its present form. The review originally confirmed two blocking issues and several important correctness, failure-mode, and contract problems in the outliner/editor hot path. Both blocking findings have since been fixed and verified; the important transaction-completion and failure-mode findings remain.

The highest-risk pattern is that the PR does not yet have one complete transaction-completion contract. A local operation is committed in the worker, the originating tab refreshes from the direct worker response, and the worker also broadcasts a lighter transaction summary. The direct response and broadcast each implement only part of the previous pipeline responsibilities. This split is the source of several stale-UI, missing-hook, and ambiguous-failure behaviors.

The review also found UI-derived ordering data being sent back into the worker as a second structural authority, an unbounded `get-blocks` batching path, and multiple compatibility/dead-code layers that should be removed rather than extended.

The initial review changed only this document. The remediation log below records later source and unit-test changes one finding at a time.

## Scope

The PR contains 493 changed files (`+34,694/-27,882`). This report focuses on 132 core files in these areas:

- `deps/db`
- `deps/outliner`
- `src/main/frontend/worker`
- `src/main/frontend/db`
- `src/main/frontend/state*`
- `src/main/frontend/handler/editor*`
- `src/main/frontend/modules/outliner/pipeline.cljs`
- block/page/page-window rendering
- related unit and Clojure E2E coverage

The Base UI migration, CSS-only changes, and unrelated CLI changes were outside this focused review.

## Confirmed findings

### 1. A multi-block paste can create duplicate pages with the same name

- **Severity:** Blocking
- **Status:** Fixed and verified in the commit containing this report update
- **Category:** Data contract
- **Location:** `deps/outliner/src/logseq/outliner/core.cljs:197`, `deps/outliner/src/logseq/outliner/core.cljs:616`
- **Issue:** Each block resolves its page references independently against the same pre-transaction DB. Two pasted blocks referencing the same previously nonexistent page can therefore each create a different page UUID with the same `:block/name`.
- **Evidence:** `build-insert-blocks-tx` calls `resolve-page-refs` once per block and concatenates all returned `page-txs`. `:block/name` is indexed but not unique. An in-memory `:paste` + `:paste-text` reproduction inserted two blocks referencing `fresh-page-3`; the resulting DB contained two page entities with distinct UUIDs, and the two blocks referenced different UUIDs.
- **Impact:** The graph can persist duplicate page entities for one logical page name. Page lookup becomes ambiguous and the pasted blocks no longer reference the same page.
- **Fix:** `build-insert-blocks-tx` now advances an in-memory DataScript value only when a block produces new page transactions. Later blocks in the same insert resolve against those pending pages and reuse the canonical UUID. Inserts without new page references do not perform the extra `d/with`. No cache, fallback, editor special case, or alternate page-reference rule was added.
- **Regression test:** `frontend.modules.outliner.core-test/paste-text-reuses-new-page-references-across-blocks` exercises the real `:paste` + `:paste-text` transaction options. Before the fix it failed with two same-name page entities and two distinct referenced UUIDs. After the fix it passes with one page entity and one shared UUID.
- **Verification:** The focused test passed with 2 assertions. The complete `frontend.modules.outliner.core-test` namespace passed with 31 tests and 229 assertions. `clojure -M:clj-kondo` reported 0 errors and 0 warnings for both changed CLJS files, and `git diff --check` passed. The repository wrapper `bb lint:kondo-git-changes` could not start because `clj-kondo` was absent from `PATH`; the equivalent repo aliases were run directly instead.

---

### 2. Render mounts can produce one unbounded descendant-loading worker request

- **Severity:** Blocking
- **Status:** Fixed and verified across two focused commits
- **Category:** Performance
- **Location:** `src/main/frontend/components/block.cljs:4834`, `src/main/frontend/db/async.cljs:232`, `src/main/frontend/worker/db_core.cljs:2288`
- **Issue:** Every non-flat `block-container` can call `<get-block-with-children`, all calls scheduled in the same turn are merged into one unbounded batch, and the worker serially expands every requested root with `children? true`.
- **Evidence:** The supplied `test lambda` log contains one 23,001-byte `:thread-api/get-blocks` payload with 469 unique IDs. The first request declares `children? true`; the remaining 468 requests reuse the same Transit key/value aliases, so all 469 request descendants. `flush-get-blocks-batch!` has no batch-size or visible-region bound, and `get-blocks-response` maps every request synchronously.
- **Impact:** Task/query/reference pages can monopolize the DB worker, repeat overlapping subtree traversal, overflow recursive entity access, and remain blank before first paint.
- **Fix:** The existing single batched worker path now partitions each graph queue into payloads of at most 50 requests. In the worker, `get-block-children` stops its iterative descendant scan at the existing 100-row large-subtree threshold; because large subtrees return only direct children, continuing to traverse the rest of the subtree was discarded work. Deferred results and the returned block/children shape are unchanged. There is no retry, fallback, renderer DB path, recursive replacement, or change to collapse/expand semantics.
- **Regression tests:** `frontend.db.async-test/block-batching-bounds-worker-request-size-test` issues 151 public `<get-block` calls in one scheduling turn. Before the fix the worker received one payload of 151 requests; after the fix every payload contains at most 50. `frontend.worker.db-core-test/get-block-children-stops-scanning-large-subtrees` builds a 1k-deep chain and counts `:block/parent` index scans. Before the fix it performed 1,002 scans and then returned one direct child; after the fix it performs at most 101 scans and returns the same `large-page?` flag and direct child.
- **Verification:** The async focused test and full namespace passed with 7 tests and 32 assertions. The subtree focused test passed with 3 assertions. The complete `frontend.worker.db-core-test` namespace passed with 159 tests and 425 assertions. The 10k-deep page-window test remains green. CLJS lint reported 0 errors; `db_core.cljs:3071` still emits the pre-existing unresolved `sqlite-export/validate-import-txs` warning outside this change.
- **Remaining scope:** Mounts can still generate multiple bounded chunks. Any further reduction to visible/expanded rows should be driven by a new runtime profile and must preserve the current list/reference expansion behavior; it is no longer required to prevent the captured unbounded payload and full-subtree discard.
- **Suggestion:** Keep one worker-owned data path, but make result views request bounded render-complete visible rows. Load descendants only for an expanded block. Do not restore a renderer DB cache or add retry/fallback logic.

Current runtime note: a read-only Chrome navigation to the current `test lambda` Task page rendered `Children (5)` within three seconds and did not reproduce the stall. That does not invalidate the captured 469-request failure, but it means the current Task page is not unconditionally broken.

---

### 3. The originating client skips the entire transaction pipeline

- **Severity:** Important
- **Status:** Fixed and verified in the commit containing this report update
- **Category:** Correctness
- **Location:** `src/main/frontend/handler/events.cljs:487`, `src/main/frontend/db/transact.cljs:194`
- **Issue:** `apply-outliner-ops` marks every local operation with `:ui/handled-by-response? true`. The matching client then skips all of `pipeline/invoke-hooks`, although the direct response path only publishes block/page-window state and runs the editor callback.
- **Evidence:** A runtime event probe recorded zero `pipeline/invoke-hooks` calls for a handled response from the current client and one call for another client. The skipped pipeline still owns reactive-query refresh, deleted-sidebar cleanup, page rename/delete events, editor start-position reset, editing-title synchronization, and plugin DB transaction hooks. The direct response does not implement those responsibilities.
- **Impact:** Local edits can leave linked references/custom queries, sidebar items, page lifecycle state, and plugin observers stale even though the block row itself refreshed.
- **Fix:** `:db/sync-changes` now always enters `pipeline/invoke-hooks`. The pipeline recognizes a handled response from the originating client and skips only the two steps owned by the direct response: publishing `:db/latest-transacted-entity-uuids` and taking the queued editor callback. Reactive-query refresh, deleted-sidebar/page routing, editing-state reset, plugin hooks, and page lifecycle events continue through the one pipeline.
- **Regression tests:** The event wiring contract rejects a local-client `when-not` guard. The pipeline behavior test verifies that a handled local response does not republish renderer state or take the editor callback, while it still resets editor start state and calls `react/refresh!`.
- **Verification:** `frontend.modules.outliner.pipeline-test` passed 2 tests and 6 assertions; `frontend.db.transact-test` passed 12 tests and 45 assertions; `frontend.remove-ui-db-test` passed 165 tests and 340 assertions. CLJS lint passed for the event, pipeline, and test files with 0 errors and 0 warnings.

---

### 4. The lightweight worker broadcast no longer satisfies the main-thread pipeline contract

- **Severity:** Important
- **Category:** Data contract
- **Location:** `src/main/frontend/worker/db_listener.cljs:90`, `src/main/frontend/modules/outliner/pipeline.cljs:29`
- **Issue:** The worker broadcast intentionally omits `:tx-data`, but the receiving pipeline still consumes `:tx-data` for deleted sidebar entity IDs, editing-title synchronization, and plugin hook payloads.
- **Evidence:** `main-thread-sync-result` builds `:data` from `tx-meta`, summary IDs, and `(dissoc result :tx-report)`; it never includes `(:tx-data tx-report')`. The receiver still passes `tx-data` to `deleted-block-db-ids`, `update-editing-block-title-if-changed!`, and `:plugin/hook-db-tx`. The new `changed-entity-ids`, `task-route-candidate-ids`, and `comment-route-candidate-ids` are not consumed by this pipeline.
- **Impact:** Remote and other-tab transactions can leave sidebar/editor state stale and publish empty transaction payloads to plugins.
- **Suggestion:** Define one explicit broadcast contract and migrate every consumer to it, or keep the required transaction data. Do not publish summary fields that have no receiver while silently dropping fields that are still required.

---

### 5. A persistence-listener failure happens after commit but before UI reconciliation

- **Severity:** Important
- **Category:** Failure mode
- **Location:** `src/main/frontend/worker/db_listener.cljs:151`
- **Issue:** Checksum update and DB-sync persistence run inside the DataScript listener before main-thread sync and broadcast. If either throws, the DataScript connection is already committed, but the worker request rejects and the UI refresh is not broadcast.
- **Evidence:** A runtime DataScript probe installed a throwing listener, called `d/transact!`, caught `"listener boom"`, and then queried the connection. The new datom was present despite the thrown transaction call. The Logseq listener ordering places persistence at lines 168–179 and broadcast at lines 181–191 with no failure boundary.
- **Impact:** The editor can report failure and remain visually stale even though the DB mutation succeeded. A retry can duplicate or conflict with the already-committed structural operation.
- **Suggestion:** Establish an explicit post-commit failure contract: always reconcile/broadcast the committed DB state, then report persistence failure separately. Do not describe the whole operation as rolled back when it was not.

---

### 6. A missing graph connection is returned as a successful `nil` operation

- **Severity:** Important
- **Category:** Failure mode
- **Location:** `src/main/frontend/worker/db_core.cljs:2888`, `src/main/frontend/db/transact.cljs:223`
- **Issue:** `:thread-api/apply-outliner-ops` is wrapped in `when-let`; an unknown or closed graph therefore resolves to `nil` instead of rejecting. The main thread destructures `nil`, publishes its inferred affected IDs, and can run an editor callback as though the operation committed.
- **Evidence:** A runtime call to `:thread-api/apply-outliner-ops` for `__review_missing_graph__` resolved successfully with `nil`.
- **Impact:** Graph-close/switch races can focus or display an unpersisted block and hide the real missing-connection error.
- **Suggestion:** Fail fast when the requested graph has no worker connection, and validate the response before any UI publication or editor callback.

---

### 7. Operation completion is incorrectly coupled to next-frame editor callbacks

- **Severity:** Important
- **Category:** Failure mode
- **Location:** `src/main/frontend/db/transact.cljs:40`, `src/main/frontend/db/transact.cljs:232`
- **Issue:** After the worker has committed and state has been published, every operation waits for `requestAnimationFrame` (or `setTimeout(0)`) to run the editor callback. A callback exception then rejects the outliner operation promise even though the DB change already committed. Conversely, a worker rejection before this point does not centrally remove the queued callback.
- **Evidence:** A runtime probe of `on-next-frame!` with a throwing callback rejected with `"editor callback boom"`. The call occurs after `refresh-worker-op-blocks!`. Several call sites register callbacks without a shared `finally` cleanup path.
- **Impact:** Enter/delete/indent/move gain an unconditional extra-frame boundary, callers can receive failure for an already-committed edit, and rejected worker calls can retain stale cursor/focus callbacks.
- **Suggestion:** Resolve DB operation completion after the single state publication. Treat focus/cursor work as a separately contained UI step with centralized callback cleanup. Keep paint telemetry independent from correctness sequencing.

---

### 8. Page-window rows have an implicit mixed shape that can publish blank blocks

- **Severity:** Important
- **Category:** Data contract
- **Location:** `src/main/frontend/worker/db_core.cljs:2199`, `src/main/frontend/components/page_window.cljs:7`
- **Issue:** `:rows` mixes render-complete rows and layout-only rows. The consumer guesses the shape from the presence of `:block/title`. If a structural refresh introduces a new layout-only row not present in the current window, there is no render data to merge into it.
- **Evidence:** A runtime pure-function probe called `merge-layout` with current row A and a new layout-only row B. The published result contained B with UUID/order only and no `:block/title`.
- **Impact:** Delete/move/indent around a long-page window edge can display a blank block until another full hydration request completes.
- **Suggestion:** Use one explicit page-window row contract. Either always return render-complete visible rows or tag layout rows and require hydration before publishing them to the renderer.

---

### 9. Quick Add reads a Promise as though it were a block map

- **Severity:** Important
- **Category:** Data contract
- **Location:** `src/main/frontend/handler/editor.cljs:4294`
- **Issue:** `quick-add-ensure-new-block-exists!` calls `(:db/id (db-async/<get-block ...))` inside a `p/let` binding instead of awaiting the returned block first.
- **Evidence:** A runtime probe of `(:db/id (p/resolved {:db/id 42}))` returned `nil`, which is exactly the current expression shape.
- **Impact:** In multi-user graphs, Quick Add does not filter blocks by the current user and can reuse or suppress the wrong user's Quick Add block.
- **Suggestion:** Await the user block in one binding and derive `user-db-id` from the resolved map in the next binding.

---

### 10. Insert order has both a renderer authority and a worker-DB authority

- **Severity:** Important
- **Category:** Repository convention
- **Location:** `src/main/frontend/components/block.cljs:5331`, `src/main/frontend/handler/editor.cljs:353`, `deps/outliner/src/logseq/outliner/core.cljs:571`
- **Issue:** The renderer computes `:end-order-state` from its current visible window. Outliner core trusts `[:known ...]` and skips the worker DB's `get-right-sibling`/`get-down` lookup. Other callers continue to use the DB path.
- **Evidence:** `order-states` always supplies a known order for ordinary lists and supplies one for loaded virtual neighbors. `get-block-orders` uses that value before querying the transaction snapshot.
- **Impact:** A stale renderer window can calculate an insertion order against old neighbors, while non-renderer callers use the authoritative DB. This violates the intended single worker-owned mutation path.
- **Suggestion:** Remove UI-derived order authority. Resolve the insertion boundary from the worker transaction DB. If virtual-window context is genuinely required, make it an explicit validated precondition rather than a silent override.

## Confirmed maintainability and hack findings

### 11. The frontend duplicates outliner tree construction

- **Severity:** Minor
- **Category:** Repository convention
- **Location:** `src/main/frontend/modules/outliner/tree.cljs:38`
- **Issue:** `blocks->vec-tree-data` duplicates grouping, order sorting, recursion, level assignment, and root handling from `deps/outliner/src/logseq/outliner/tree.cljs`. The copies already differ in transient attribute handling. The frontend API also retains an unused `_repo` compatibility arity.
- **Impact:** Worker/plain-data and DB-backed tree semantics can drift.
- **Suggestion:** Extract one pure root-plus-blocks helper in `logseq.outliner.tree` and remove the unused compatibility arity.

---

### 12. Page-tree response plumbing is dead code

- **Severity:** Minor
- **Category:** Repository convention
- **Location:** `src/main/frontend/db/transact.cljs:60`
- **Issue:** `outliner-ops-need-page-tree?` always returns `false`, but the transaction path still computes flags, destructures `page-tree`, passes it through refresh functions, and retains an impossible branch.
- **Impact:** The core transaction path advertises two refresh modes although only page-window refresh is active.
- **Suggestion:** Remove the predicate and all page-tree response plumbing until a real operation requires it.

---

### 13. The new state modules are mostly compatibility scaffolding

- **Severity:** Minor
- **Category:** Repository convention
- **Location:** `src/main/frontend/state/init.cljs:1`, `src/main/frontend/state/core.cljs:1`
- **Issue:** `state.core` re-exports `frontend.state`, `state.init` explicitly describes a compatibility phase, and several domain namespaces contain only an `ns` form. Production code does not consume the new domain modules; only the alias-oriented state test references them.
- **Impact:** The PR adds namespaces and an advertised architecture without reducing ownership or dependencies. It also preserves the reverse dependency direction that the state-module plan intended to remove.
- **Suggestion:** Either remove the unused scaffolding from this PR or complete one small domain extraction end-to-end before adding the façade namespaces.

---

### 14. Worker fetch errors use raw console logging and discard their cause

- **Severity:** Minor
- **Category:** Repository convention
- **Location:** `src/main/frontend/db/async.cljs:288`
- **Issue:** `<get-block` and `<get-block-with-children` log with `js/console.error` and throw a fresh `ex-info` without the original cause or `ex-data`.
- **Impact:** The now-central worker fetch path loses structured diagnostic context and violates the repository logging convention.
- **Suggestion:** Preserve the original cause and use structured `glogi`, or remove duplicate logging and let the original worker error propagate.

## Important test coverage gaps

### Batching and worker response contracts

- `src/test/frontend/db/async_test.cljs` mocks `<fetch-blocks-from-worker-batched`; it does not execute the queue, graph grouping, response-count validation, or rejection fan-out.
- `src/test/frontend/worker/db_core_test.cljs` covers basic insert/expand responses but not delete, multi-block move, indent, or outdent response windows and affected pages.
- Add targeted behavior tests for per-graph batching, a deliberate response-count mismatch, bounded request size, and the structural-operation response contract.

### Pipeline split and graph-switch races

- There is no event test for the `:ui/handled-by-response?`/client-id split.
- There is no deferred-worker test that switches graph/page before the response resolves.
- Add focused tests proving that local response handling does not duplicate renderer publication while all non-render hooks still run exactly once, and that stale responses cannot change the new graph/page editor state.

### Editor and long-page behavior

- Rapid Enter tests stop before queued prefixes are fully persisted and do not assert final cursor/focus.
- The long-page E2E covers 100-block scrolling/copy, not 1k+ bottom Enter, repeated Enter/Backspace, top/bottom jumps, or mixed image/iframe heights.
- Collapse coverage is source-string and worker-response oriented; it does not assert immediate hide/show in the mounted UI.
- Add one narrow editor sequence test and one narrow long-page E2E workflow rather than expanding every outliner E2E.

### Linked references

- The DB view test uses a table view, while the default linked-reference UI uses list + group-by-page.
- Add a list-view contract test that asserts the nested page/parent group shape and one UI behavior test for immediate local refresh.

## Questions requiring focused follow-up

These are credible risks but were not retained as confirmed findings because the exact executable scenario was not completed during this read-only review.

1. **Stale response after graph/page switch:** `apply-outliner-ops` captures the current repo only when creating the request and does not check it before publishing global UI/editor state. Validate with a deferred worker response and cloned graphs that share UUIDs.
2. **Polymorphic `:ui/page-id`:** callers pass numeric DB IDs, UUID strings, and route names, while the same value is also added to UUID-oriented invalidation sets. Define whether this is a worker lookup reference or renderer identity; it should not be both.
3. **Missing `:parent-original`:** `resolve-indent-outdent-opts` silently turns an unresolved supplied UUID into `nil`, selecting ordinary outdent semantics. Validate whether the intended contract is fail-fast.

## Migration validation

No migration change is required for the reviewed core changes:

- no persisted schema attribute changed
- no built-in property or class changed
- schema version remains `65.33`
- no `schema-version->updates` or `:migrate-updates` entry is required
- no deleted attribute requires db-sync sanitizer coverage

## Verification summary

### Review process

Eight independent review passes were run serially at the user's request:

1. Correctness
2. Data contract
3. Regression
4. Failure mode
5. Migration validation
6. Performance
7. Test coverage
8. Repository convention

The reports were deduplicated and each retained finding was checked again against the current source and diff.

### Runtime and targeted evidence

- Chrome web runtime on `http://localhost:3001/#/`, current `test lambda` graph, read-only navigation only.
- Current Task page rendered `Children (5)` within three seconds; no current stall was claimed.
- Parsed the supplied 23,001-byte worker log: 469 unique block requests, all reusing `children? true`.
- `:app` runtime pure/in-memory probes confirmed:
  - two `:paste` + `:paste-text` blocks created two same-name page entities with distinct UUIDs
  - `merge-layout` published a new layout-only row without `:block/title`
  - keyword lookup on a resolved Promise returned `nil`
  - a throwing DataScript listener left the datom committed
  - missing-graph `apply-outliner-ops` resolved `nil`
  - a throwing next-frame editor callback rejected the completion promise
  - handled same-client sync invoked pipeline hooks zero times; another client invoked them once
- Targeted tests run by the performance pass:
  - `bb dev:test -v frontend.worker.db-core-test/get-page-blocks-window-handles-10k-deep-page` — 1 test, 5 assertions, passed
  - `bb dev:test -v frontend.db.async-test/block-loaders-return-worker-data-without-renderer-db-test` — 1 test, 10 assertions, passed
- Finding 1 remediation:
  - RED: `frontend.modules.outliner.core-test/paste-text-reuses-new-page-references-across-blocks` — 1 test, 2 assertions, both failed because two pages and two UUIDs were produced
  - GREEN: the same focused test — 1 test, 2 assertions, passed
  - regression: `frontend.modules.outliner.core-test` — 31 tests, 229 assertions, passed
  - lint: changed production and test files — 0 errors, 0 warnings
- Finding 2 payload-bound remediation:
  - RED: `frontend.db.async-test/block-batching-bounds-worker-request-size-test` — one worker payload contained all 151 queued requests
  - GREEN: the same focused test — all 151 requests resolved and each payload contained at most 50 requests
  - regression: `frontend.db.async-test` — 7 tests, 32 assertions, passed
  - related worker coverage — 4 tests, 21 assertions, passed
  - lint: changed production and test files — 0 errors, 0 warnings
- Finding 2 descendant-bound remediation:
  - RED: `frontend.worker.db-core-test/get-block-children-stops-scanning-large-subtrees` — a 1k-deep chain caused 1,002 parent-index scans before returning one direct child
  - GREEN: the same focused test — at most 101 parent-index scans with the same returned shape
  - regression: `frontend.worker.db-core-test` — 159 tests, 425 assertions, passed
  - lint: 0 errors; one pre-existing unresolved-var warning remains at `db_core.cljs:3071` outside the changed code
- Finding 3 transaction-pipeline remediation:
  - RED: the event wiring test found the local-client pipeline guard; the behavior test found duplicate renderer publication and premature editor-callback consumption
  - GREEN: all local broadcasts enter the pipeline, which skips only direct-response-owned work
  - regression: pipeline 2 tests/6 assertions, transact 12/45, remove-UI-DB 165/340, all passed
  - lint: changed event, pipeline, and test files — 0 errors, 0 warnings
- Static checks:
  - `git diff --check` passed
  - no migration/schema object changed across the review range
  - no polling loop was found in `handler/editor.cljs`

### Not verified

- No Desktop/Electron runtime was used; the reviewed hot paths are renderer/browser-worker paths, and the user had previously scoped this performance work to `pnpm app-watch` rather than Electron.
- No user graph was mutated.
- No broad lint, unit, or E2E suite was run for this review.
- The graph-switch race, polymorphic `:ui/page-id`, and invalid `:parent-original` scenarios remain focused follow-up questions rather than confirmed findings.
