# Outliner Performance Contract

## Goal

Outliner operations must preserve data, cursor, selection, and visible tree state while keeping editor interaction responsive on both short pages and 10,000-block pages.

Correctness is the first gate. A faster operation that loses text, moves the cursor, or shows state different from the DB is a regression.

## One Transaction Path

Every local outliner operation follows the same path:

1. Capture the operation and editor state once.
2. Send the minimal outliner ops and current page-window position to the DB worker.
3. Await the worker transaction.
4. Return the operation result and the minimal persisted UI refresh payload.
5. Publish UI state once.
6. Restore editor, cursor, or selection after React commits the refreshed rows.
7. Resolve the operation promise only after that UI/editor step completes.

Insert, delete, indent, outdent, move, batch operations, and collapse/expand must not introduce separate optimistic or preview paths.

## Prohibited Shortcuts

- Do not render an optimistic block before the DB transaction completes.
- Do not maintain a separate indent, outdent, move, or collapse preview state.
- Do not poll the DOM or retry editor focus with timers or animation frames.
- Do not use React transitions to hide outliner transaction latency.
- Do not let logging or performance metadata control application behavior.
- Do not publish the same local transaction from both the worker listener and the worker response.
- Do not reload or transfer a full page tree for a page-window operation.
- Do not allocate a persistent map or vector for every page block when only a bounded window is returned.
- Do not add a cache without a measured workload that requires it.
- Do not clear queued input until the new editor has received it.
- Do not merge a persisted worker row into stale rendered data; removed attributes must disappear.
- Do not consume an editor callback from a later, unrelated render or worker response.
- Do not run graph-wide maintenance such as GC or `VACUUM` while opening a graph.

## Operation Matrix

| Operation | Worker input | Persisted refresh | UI and editor invariants | Main performance risks |
|---|---|---|---|---|
| Enter / insert | Current block save, inserted block, target, sibling choice, known order boundary, page id, window offset | Current window with full data only for affected rows | No title flicker; typed text preserved; exactly one editor; cursor enters the new block | Markdown parsing, sibling scans, listener work, rerendering unaffected rows |
| Delete / Backspace | Deleted ids, optional child moves, optional previous-block save, page id, window offset | Current window around the deletion | Cursor moves once to the correct persisted block; repeated delete never loses focus | Multiple transactions, stale edit callbacks, repeated block loads |
| Indent / Outdent | Selected top-level ids, direction, parent boundary, page id, window offset | Current window with new levels and order | DB parent/order and visible nesting agree in the first refreshed UI | Ancestor scans, sibling scans, preview state, selection timers |
| Move up / down | Selected ids, direction, page id, window offset | Current window with new order | Selection and editor remain on moved block ids | Reloading the page tree, sorting all page blocks |
| Move to target | Selected ids, target id, sibling option, target page/window | Source and target windows when different | No nil target; atomic DB move; correct focus after navigation | Resolving targets in UI, duplicate refreshes, cross-page payload size |
| Batch delete / move / indent | Top-level selected ids only | One transaction and one UI publish | Atomic visible result; selection contains only surviving ids | Per-block worker calls, repeated tree traversal, non-atomic transactions |
| Collapse / Expand | Block ids and persisted collapsed value | Affected rows and visible window layout | DB value and UI visibility change together without page navigation | Content-only refresh that does not update virtual layout |
| Page open / restore | Page id and requested window anchor | Root plus bounded flat window | First window renders immediately; references and tasks use persisted data | Full-tree serialization, recursive entity realization, duplicate loads |
| Scroll jump | Target range or anchor and bounded limit | One bounded window | One jump reaches top or bottom on 10,000 blocks; mixed row heights remain stable | Incremental stepping, stale responses, assuming fixed image/iframe height |

## Required Measurements

Each outliner transaction log must use one operation id and report:

- operation names and count;
- input payload count and serialized bytes;
- DB apply time;
- checksum, persistence, listener, and sync-to-main-thread time;
- page-window query time, row count, and serialized bytes;
- worker roundtrip time;
- UI state publish time;
- React commit and next-paint time;
- final focused block id and cursor position for editor operations.

Logs diagnose performance. They must not select a code path.

## Acceptance Gates

### Correctness

- Rapid `Enter -> type -> Enter` sequences preserve every character and block boundary.
- Awaiting an outliner operation means its persisted UI rows and response-owned editor callback have committed on the next frame.
- Repeated delete preserves the expected cursor and never consumes another operation's edit callback.
- Indent, outdent, move, batch operations, and collapse/expand match persisted DB state without navigating away and back.
- Cross-page moves refresh the affected embedded page separately from the current page window.
- Task pages and lambda references open without recursive entity realization or stack overflow.
- Existing E2E behavior remains unchanged; fixes must not rewrite E2E expectations.

### Responsiveness

- A short-page editor operation must not block the main thread for more than one 16.7ms frame.
- UI state publish plus React commit must remain below 16.7ms in the development app used for manual verification.
- Worker payload size must be bounded by the page-window limit, not total page size.
- A page-window query must traverse page layout at most once when its visible count is already known.
- Comment-thread presence must scan existing comment links instead of joining every requested row through a query.
- A 10,000-block page must jump directly to bottom and top without walking intermediate windows.
- The scroll contract must hold with text, images, iframes, collapsed subtrees, and deeply nested blocks.

## Current Baseline

The 2026-07-14 hot short-page rapid-Enter trace preserved all text. Measurements were taken from one clean `pnpm app-watch` process after removing stale watcher and test-fixture processes:

- DB worker apply: 19.9–21.7ms;
- checksum, persistence, and listener callbacks: 6.5–7.7ms of apply time;
- page-window query: 3.4–4.6ms for 7–12 rows;
- UI refresh preparation: 0–0.2ms;
- UI state publish: 0.2–0.4ms;
- worker roundtrip: 27.4–33.4ms;
- operation start to next frame: 54.6–60.8ms.

A temporary worker profile further split the final transaction into 0.6–0.9ms for Datascript `with`, 2.4–2.9ms for the transaction pipeline, 1.3–1.5ms for validation, 2.6–5.2ms for storage, and 6.9–7.8ms for callbacks. The temporary profiling code was removed after the measurement.

The former 40–61ms UI-publish result came from a stale development bundle. The current single UI publish is below one millisecond; remaining Enter latency belongs to the synchronous worker transaction, page-window response, and the next animation frame. Adding preview, optimistic, polling, caching, or prefetch branches would not reduce those measured costs.

The 10,000-block deep-page window test initially measured 105.7ms at the top and 90.7ms at the bottom. The main cost was allocating Clojure maps and vectors for every block before returning 60 rows, followed by a second traversal when the visible count was not supplied. A local compact layout index, count reuse for pages without collapsed blocks, and direct scanning of existing comment links reduced diagnostic top and bottom queries to about 69–70ms. The regression test requires both edges to remain below 80ms without caching or changing the response contract.

Opening `large-test-graph-2` previously took 21.6 seconds because monthly graph GC and `VACUUM` ran before the DB worker reported ready. The worker log showed 15.6 seconds between the GC start and ready events. Graph opening no longer runs this explicit maintenance operation. A cold open after the change took 1.9 seconds end to end, with 76ms spent waiting for the worker to publish. Explicit `gc-graph` behavior remains available for maintenance.

## Verification Sequence

1. Run focused unit tests for the changed transaction, worker, and editor contracts.
2. Run `pnpm app-watch` and reproduce with a fresh short page.
3. Capture operation logs and verify final DB/UI text, focused block, and cursor.
4. Exercise insert, repeated delete, indent, outdent, move, batch operations, and collapse/expand.
5. Exercise the 10,000-block mixed-height and deep-nesting page.
6. Verify task and lambda-reference pages.
7. Run lint, unit tests, and all `clj-e2e` tests without modifying E2E tests.
8. Record the final verified workflows with Loom.
