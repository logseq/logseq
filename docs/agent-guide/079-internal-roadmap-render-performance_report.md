# Internal Roadmap Query Performance Report

Date: 2026-06-03

Target page:

`http://localhost:3001/#/page/6751bf32-073e-41dc-9655-fd052f414ff0?graph-id=00000000-0e37-4921-9045-15bd17b430a5`

Goal: after redirecting from home, the page body and linked references should be usable within 1 second. Optional metadata such as histories, reactions, comments, conflict warnings, unlinked references, and asset downloads should not compete with that first-second path. Repeated calls should be avoided.

## Measurement

Captured with the Codex Chrome extension against `localhost:3001`.
The browser waited 14 seconds after opening the page so linked references and delayed block adornment queries had time to run.

Final DOM state in the captured run:

| Signal | Value |
|---|---:|
| Page title | `Internal roadmap` |
| Page blocks | 161 |
| Linked references mounted | yes |
| Linked reference blocks | 10 |
| Unlinked references mounted | no |
| Reaction groups mounted | 0 |
| Comment buttons mounted | 0 |
| Sync conflict buttons mounted | 0 |

## Worker Calls

| Worker method | Count | Max elapsed | Total elapsed | Notes |
|---|---:|---:|---:|---|
| `:thread-api/q` | 50 | 2209 ms | 10098 ms | Dominated by histories, reactions, comments, and view definition query. |
| `:thread-api/get-block-refs-counts` | 11 | 2218 ms | 3657 ms | Batched, but still emitted in repeated waves. |
| `:thread-api/db-sync-get-block-conflicts-batch` | 7 | 2209 ms | 2852 ms | Batches still repeated; first slow result was likely queued behind expensive q calls. |
| `:thread-api/get-view-data` | 2 | 1229 ms | 2446 ms | Linked reference view data. Do not optimize before the repeated-call report work is reviewed. |
| `:thread-api/search-build-blocks-indice-in-worker` | 1 | 1225 ms | 1225 ms | Background search index work competes with page work. |
| `:thread-api/get-bidirectional-properties` | 3 | 287 ms | 520 ms | Should stay worker-backed and fetch immediately, but repeated calls should be deduped. |
| `:thread-api/block-refs-check` | 1 | 290 ms | 290 ms | Unlinked references check; correctly single in this run. |
| `:thread-api/get-blocks` | 6 | 210 ms | 362 ms | Some repeated block loading remains. |
| `:thread-api/db-sync-request-asset-download` | 1 | 6 ms | 6 ms | Delayed and cheap in this run. |

## Query Groups

| Query hash | Feature | Count | Max elapsed | Total elapsed | Query shape |
|---|---|---:|---:|---:|---|
| `-2130459057` | Task/property history | 11 | 2209 ms | 3323 ms | Finds history rows by `:logseq.property.history/block` for a batch of block ids. |
| `-1242118523` | Reactions | 18 | 2203 ms | 3476 ms | Finds reactions by batched `:logseq.property.reaction/target`. |
| `2005122060` | Comment-thread presence | 18 | 2195 ms | 3276 ms | Finds blocks that have comment areas among a batched block UUID input. |
| `-424478834` | View definition lookup | 1 | 2145 ms | 2145 ms | Pulls linked-reference view definitions by `:logseq.property/view-for` and feature type. |
| `-601871213` | Flashcard due query | 2 | 4 ms | 6 ms | Cheap and not part of this performance problem. |

The slow elapsed values on small queries are mostly queue wait, not query CPU. The repeated waves fill the worker queue, so later cheap operations inherit large elapsed times.

## Findings

1. The largest repeated-call problem is optional block adornment metadata.
   Histories, reactions, comments, refs counts, and sync conflicts all run after the body starts rendering, but they still fire in multiple render/scroll waves. This creates queue pressure after the page appears and can still delay linked references or later visible work.

2. Some repeated calls can come from linked-reference rows, not only page-body blocks.
   Linked references render through `views/view -> list-view -> lazy-item -> block-container`. That means referenced result rows reuse the normal block renderer, including adornment effects. Current guards do not exclude `:list-view?`, so linked-reference blocks can trigger refs counts, reactions, task histories, comment presence, and sync conflict checks.

3. Current batching reduces per-block calls but does not eliminate repeated batches.
   Reactions and comments are batched, yet each feature still produced 18 query invocations in the fully loaded sample. Refs counts produced 11 worker batches. Conflict checks produced 7 worker batches. That means the batch trigger is too close to individual mount waves, and the result layer does not dedupe enough across remounts.

4. Conflict checks should not poll every visible block on page load.
   The fully loaded page had 0 visible conflict buttons, yet conflict checks still ran. The better model is event-driven state from `:sync-conflicts-updated`, plus a targeted fetch only when a block is known or suspected to have conflicts.

5. Bidirectional properties should stay worker-backed and immediate.
   The page made 3 calls with max 287 ms. Do not use the UI DB cache as the source of truth. The improvement should be in-flight/result dedupe keyed by repo and target id, not delayed rendering or renderer DB reads.

6. View definition lookup was a late remaining linked-reference bottleneck.
   It is a single call, but the linked-reference tab cannot render without it. The old path used generic `:thread-api/q` plus `pull [*]` for `:logseq.property/view-for`. It now uses a direct worker API that scans the indexed `:logseq.property/view-for` datoms, filters by `:logseq.property.view/feature-type`, pulls only the matching view blocks, and then transacts those maps into the frontend DB.

## Query-First Implementation Status

Implemented before view optimization:

- Worker timings are logged for every `state/<invoke-db-worker` call, and async Datascript queries log query hash, input count, transaction mode, elapsed time, and optional query key.
- Worker invocation logs include truncated `args=...`, and async Datascript query logs include truncated `inputs=...`, so repeated calls can be compared by argument identity.
- Reactions now use one batched direct worker API with per-target in-flight/result dedupe, replacing the generic `query-hash=1271619664` Datascript query.
- Reaction argument logs showed many different target-id waves rather than identical repeated calls. Page-level adornment prefetch now runs before per-block adornment readiness and populates the per-id reaction cache in one direct worker call for the page body target set.
- Comment-thread presence now batches block UUIDs, caches negative and positive results, reuses in-flight requests, clears in-flight state on worker failure, and uses a direct worker API instead of the generic `query-hash=2005122060` Datascript query. The worker API uses raw indexed datoms for UUID, comment target, tag, parent, and deleted checks, and logs worker-side CPU time as `get-comment-thread-block-uuids`.
- Comment-thread argument logs showed the same mount-wave fragmentation pattern. Page-level adornment prefetch now skips already-cached/in-flight UUIDs, does one direct worker call for the remaining page-body UUID set, and fills the per-UUID presence cache before per-block adornments read it.
- Task spent-time/history now skips non-task blocks before querying, batches task ids, caches per task, and uses a direct worker API instead of the generic `query-hash=-2130459057` Datascript query. The worker API logs worker-side CPU time as `get-task-status-histories`.
- Task history argument logs also showed different task-id waves rather than identical repeats. Page-level task prefetch now calls the direct worker API once for all uncached page-body task ids and fills the per-task cache.
- Block refs counts now use a frontend batch queue, frontend in-flight/result dedupe, and a worker-side `get-block-refs-counts` implementation that scans shared aliases once for the requested ids. The worker API logs worker-side CPU time as `get-block-refs-counts`.
- Block loading now has frontend in-flight/result dedupe before calling `:thread-api/get-blocks`, and the worker API logs worker-side CPU time as `get-blocks`.
- Sync conflict reads now have a worker batch API backed by one SQLite `IN (...)` query, and normal block render no longer polls conflicts just to decide whether to show an empty warning button.
- Bidirectional properties stay worker-backed and immediate, with repo+target-id in-flight/result dedupe and no UI DB cache.
- Bidirectional property lookup now avoids the broad `?e ?a ?v` query by scanning candidate property attrs from supported `:avet` datoms, then checking each candidate attr for the target id while preserving the user/plugin ref-property and class-property filters.
- Background search indexing and remote asset download requests are delayed/deduped so they do not compete with the initial page-body and linked-reference worker window.
- Search block queries now have a short frontend in-flight/result cache keyed by repo, query text, and options, and the cache is cleared when the search index is rebuilt, updated, or truncated. This removes identical repeated `:thread-api/search-blocks` calls such as duplicate `"internal"` searches.
- Linked-reference list rows no longer run the full page-body adornment query set by default.
- Artificial adornment/unlinked-reference timers were removed; reactions, comments, task histories, and refs counts now rely on batching/dedupe rather than delayed execution.
- Linked-reference view definition lookup now uses direct `:thread-api/get-views` instead of generic `:thread-api/q` query hash `-424478834`. It keeps the same frontend transaction behavior, but avoids the generic query planner path and should log worker-side CPU time as `get-views`.
- Repeated linked-reference view definition calls are coalesced while in flight. Later renders first check the already-hydrated frontend DB reverse `:logseq.property/_view-for` relation before invoking the worker, avoiding a second identical `:thread-api/get-views` call for the same page and feature type.
- `get-views` worker CPU was observed at ~1.7 ms while `state/<invoke-db-worker` elapsed time was ~4094 ms, proving the remaining delay was worker queue wait. Page-body block adornments now stay disabled until the linked-reference refs count and view definition reads have completed, so reactions/comments/histories/refs-count adornment queries do not flood the worker ahead of linked references.
- Linked-reference `get-view-data` with the default list view grouped by page now uses a narrow fast path. It skips the generic filter/group/sort pipeline when there are no filters or search input, and directly builds the same page-grouped nested list shape from linked-reference blocks.
- Block refs count/counts now use a raw datom path for aliases, hidden checks, page checks, view checks, tags, and ident checks. This avoids the previous per-candidate `d/entity` materialization and shares hidden-parent cache across a whole `get-block-refs-counts` batch.
- Linked-reference `get-view-data` now skips eager `ref-pages-count` computation on initial render. That count is only needed by the reference filter popup, so the filter button fetches it lazily through `:thread-api/get-linked-reference-page-count`. `:thread-api/get-view-data` now also logs worker CPU time as `get-view-data`.

Left unchanged by request:

- View-data/view rendering optimization is intentionally deferred until repeated query groups are flat.
- No tests were added.

## Improvement Plan

1. Conflict checks: remove page-load polling.
   Use `:sync-conflicts-updated` as the primary source. Keep block-level fetch only for explicit user actions or a known conflict marker. This should reduce the normal page-load conflict count from 7 batches to 0.

2. Split page-body and linked-reference adornment policy.
   Do not let linked-reference rows run the full page-body adornment set by default. Start with the metadata actually visible in linked references, and make the rest explicit or delayed. Add logging context so the next report can attribute each query to `:page-body`, `:linked-references`, or `:unlinked-references`.

3. Reactions: add worker-result dedupe with invalidation.
   Keep the batched query, but cache empty and non-empty results by `[repo target-id]`, reuse in-flight promises, and invalidate on local reaction toggle or reaction sync update. This should reduce repeated reaction batches from 18 to one batch per loaded target set.

4. Comments: move presence checks to one page/container batch.
   Collect block UUIDs from the page body after body render, issue one presence query for the current loaded set, and store negative results with TTL. New blocks entering via scroll can be appended to a pending set, not queried immediately one by one.

5. Histories/task spent time: cache and only query true task blocks.
   Keep the batched history query, but add per-block in-flight/result dedupe and skip blocks that are not task instances before enqueuing. Invalidate on status/history writes.

6. Refs counts: prebatch by visible/current page block ids.
   Avoid repeated `get-block-refs-counts` waves by collecting ids at the container level after body render, then hydrate per-block local atoms from one result map. Keep per-id TTL for later scroll/remount.

7. Bidirectional properties: immediate worker fetch with in-flight dedupe.
   Do not delay it and do not read from the UI DB cache. Add a small repo+target-id in-flight promise cache so rerenders share the same worker call. Invalidate after property writes that can affect bidirectional values.

8. Only after 1-7, revisit view data and rendering.
   The view definition lookup has been moved to `:thread-api/get-views`. If the repeated-call count is flat and linked references still misses the 1 second target, profile `:thread-api/get-view-data` and the linked-reference render path separately.

## Acceptance Criteria

- After a fully loaded Internal roadmap page, each optional metadata feature emits at most one query batch for the initial loaded block set.
- Re-rendering the same loaded page without data changes does not reissue histories, reactions, comments, conflict checks, bidirectional properties, or refs counts for the same ids.
- Normal page load with no conflicts does not call `:thread-api/db-sync-get-block-conflicts-batch`.
- Bidirectional properties are fetched immediately through the worker, with no UI DB cache source.
- Page body and linked references are ready within 1 second from home-page redirect before optimizing view queries.
