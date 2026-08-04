# Render Resource and DB Subscription Simplification Implementation Plan

Goal: simplify `frontend.worker.handler.render-resource` and `frontend.db.subs` against `master` while preserving the three completed correctness fixes, keeping renderer performance stable, and reducing each target file to at most half of its current line count.

Architecture: a thin render-resource dispatcher, small resource-family handlers, one normalized subscription store, and one graph-scoped properties/classes metadata cache.

Tech Stack: ClojureScript, Datascript, Promesa, `cljs.cache` from `org.clojars.mmb90/cljs-cache`, Shadow-CLJS, and the existing worker thread APIs.

Related: `src/main/frontend/worker/handler/render_resource.cljs`, `src/main/frontend/db/subs.cljs`, `src/main/frontend/worker/render_affected_keys.cljs`, `src/main/frontend/worker/db_core.cljs`, `src/main/frontend/worker/handler/property.cljs`, and `src/main/frontend/worker/query_dsl.cljs`.

## Problem statement

Compared with `origin/master`, both target namespaces are branch-local additions, so there is no smaller master implementation to reuse directly.

The current `render_resource.cljs` is 1,377 lines and combines validation, resource dispatch, database traversal, output normalization, watch-key derivation, view semantics, query execution, batching, and thread API exposure.

The current `db/subs.cljs` is 1,137 lines and combines three payload stores, several independent load queues, request generations, listener routing, resource debounce, block-tree patching, tombstones, seeded-slot garbage collection, and public subscription APIs.

The current design duplicates lifecycle decisions across resource rendering and subscriptions, which makes correctness changes expensive and encourages broad `[:graph]` invalidation.

The three completed fixes establish the behavior that the simplification must retain.

- Display-properties resources watch `[:class-tree]` so class inheritance and class property-definition changes refresh mounted resources.
- Simple DSL queries derive attribute-level keys, while full-text and unsupported dynamic rules retain an explicit graph-level fallback.
- Semantic page blocks paginate root candidates before expanding only selected trees, and semantic search keeps matches lazy while retaining only a bounded page plus cursor candidate.

The cache must improve the hot path without making stale metadata visible after a graph switch or a property/class transaction.

## Testing Plan

NOTE: I will write *all* tests before I add any implementation behavior.

1. Capture the baseline line counts with `wc -l` and record the current public behavior of every exported function in the two target namespaces.

2. Add characterization tests for every resource family currently handled by `render_resource.cljs`, including missing entities, malformed keys, empty results, query normalization, view grouping, and exact watch-key sets.

3. Add subscription characterization tests for loading, ready, missing, error, tombstone, graph reset, stale generation, duplicate request, listener notification, block replacement, child patching, resource invalidation, and query reload debounce.

4. Add metadata-cache tests before implementation for first-load construction, repeated lookup hits, graph-scoped isolation, graph switch eviction, class inheritance changes, class property-definition changes, property-definition changes, and one rebuild per transaction batch.

5. Add tests proving that a simple DSL query does not reload on an unrelated attribute transaction and that a dynamic or full-text query preserves its fallback invalidation behavior.

6. Add performance-oriented tests that count database traversals and assert that display-properties and query watch-key derivation do not rescan all blocks on every render.

7. Run the focused tests in RED mode and record the expected failures before changing production code.

8. Run the focused tests after each migration batch, then run `bb dev:lint-and-test` and the relevant db-sync test suite before removing compatibility shims.

## Master comparison and success criteria

1. Treat `master` as the behavioral reference for surrounding worker, subscription, and startup conventions, because the two target files are not present there.

2. Use `git diff --stat origin/master...HEAD`, `git log --follow`, and call-site searches to distinguish behavior required by this branch from duplicated implementation machinery.

3. Measure the final target with `wc -l src/main/frontend/worker/handler/render_resource.cljs src/main/frontend/db/subs.cljs`.

4. Set the hard size target to no more than 688 lines for `render_resource.cljs` and no more than 568 lines for `db/subs.cljs`, with the exact threshold recalculated from the baseline if formatting changes alter the initial count.

5. Do not meet the line target by deleting validation, normalizers, test coverage, or required behavior; move cohesive behavior into small files when it is still needed.

6. Keep all existing public function names and thread API contracts stable until call sites and tests have migrated, then remove only demonstrably dead compatibility code.

## Implementation tasks

### 1. Freeze contracts and define ownership

1. Create a behavior matrix in tests for each `render-resource` key family: page identity and previews, journals, recycle, favorites, reactions, comments, display properties, positioned and bidirectional properties, routes, views, and queries.

2. Mark each helper in `render_resource.cljs` as one of four owners: contract validation, database read, output normalization, or watch-key derivation.

3. Move no behavior until the matrix is green and the call-site list is complete.

4. Use one shared resource envelope contract containing basis revision, resource key, watch keys, and value.

### 2. Introduce graph-scoped metadata caching

1. Add `src/main/frontend/worker/db/metadata_cache.cljs` for properties/classes metadata only.

2. Use the existing `cljs.cache` API, which is the ClojureScript cache implementation already available in this repository and follows the core.cache model; do not add a second cache dependency.

3. Store a bounded LRU cache keyed by repository and graph generation, never by a mutable Datascript entity or an unbounded block UUID set.

4. Define the cached value as immutable metadata: property definitions, class definitions, class inheritance closure, class-to-property membership, and the normalized property lookup indexes needed by display-properties and DSL dependency derivation.

5. Keep block-specific display values, closed-value choices, current block values, and rendered rows out of this cache.

6. Build the cache exactly once after `db_core.cljs` has opened the Datascript connection, completed initial data/migration work, and registered the database listener, before the graph is exposed to renderer requests.

7. Make startup cache construction explicit in the existing create-or-open-db path in `src/main/frontend/worker/db_core.cljs`; a cache miss during a render is allowed to synchronously read only the requested metadata and then populate the same graph entry.

8. Attach a metadata generation to each cache entry and reject reads whose generation does not match the current repository connection.

9. Rebuild or update the entry once per transaction batch when any of these attributes change: `:block/tags`, `:block/uuid`, `:db/ident`, `:logseq.property.class/extends`, `:logseq.property.class/properties`, property type/cardinality/default/public fields, or property choice membership.

10. Reuse the existing `[:class-tree]`, `[:class-membership]`, and `[:attr ...]` invalidation vocabulary rather than introducing a second invalidation protocol.

11. Clear the graph entry on close, graph switch, failed startup, and generation change; never let a previous graph’s metadata satisfy a new graph request.

12. Add cache hit/miss and rebuild counters behind test-only hooks so performance tests can assert startup construction and transaction batching without relying on timing.

### 3. Split render-resource by resource family

1. Keep `src/main/frontend/worker/handler/render_resource.cljs` as a dispatcher with the public envelope, key validation, basis revision, and thread API entry points.

2. Add a shared `src/main/frontend/worker/handler/render_resource/common.cljs` for UUID/entity validation, serialized context validation, value normalization primitives, and watch-key helpers.

3. Move page, journal, favorites, recycle, route, reaction, comment, and block resource readers into focused family namespaces under `src/main/frontend/worker/handler/render_resource/`.

4. Move display-properties, positioned-properties, and bidirectional-properties readers into a property resource namespace that consumes the startup metadata cache and delegates block-value lookup to `handler/property.cljs`.

5. Move view configuration, view scope, grouping, sorting, and row normalization into a view resource namespace with one explicit view watch-key function.

6. Move DSL and Datalog query parsing, execution, result normalization, and watch-key derivation into a query resource namespace; keep `query_dsl/query-watch-dependencies` as the single dependency derivation entry point.

7. Replace the current large `case` body with a data-oriented resource registry mapping resource kind to validation, render, and watch-key functions.

8. Ensure every registry entry returns the same value shape and does not know about subscription state, batching, or renderer listeners.

9. Preserve graph fallback only for unsupported dynamic semantics, quoted full-text search, malformed or blank query dependency derivation, and other cases where an exact dependency cannot be proven.

10. Remove duplicated per-resource normalization and validation after the migrated tests prove the shared helpers cover all callers.

### 4. Replace db.subs lifecycle branches with one slot store

1. Keep `src/main/frontend/db/subs.cljs` responsible for subscription state only, not database query construction or resource-specific patch algorithms.

2. Normalize blocks, children, and renderer resources into one slot map keyed by slot kind and serialized key, with graph ID, generation, status, revision, value, and error fields.

3. Use one request table and one microtask load scheduler with per-slot loaders; retain separate batch limits only as configuration values where the worker API requires them.

4. Use one listener registry keyed by the same serialized slot key and one notification function that ignores stale generation updates.

5. Make `subscribe!`, `unsubscribe!`, `ensure-loaded!`, `apply-response!`, `apply-error!`, and `reset-graph!` the only state transitions.

6. Keep stale-request protection as a small generation and request-token check; remove duplicate `current-generation?`, `current-request?`, and per-resource variants after tests cover their combined behavior.

7. Move block-tree-specific child replacement and tombstone normalization into `src/main/frontend/db/subs_blocks.cljs` or an equivalent focused module, leaving `db/subs.cljs` with slot orchestration.

8. Move renderer-resource debounce into the shared scheduler and key it by watch-key intersection, not by a second resource reload atom.

9. Preserve the existing public subscriptions and helper names through a thin compatibility layer during migration, then remove the layer once all call sites use the slot API.

10. Do not cache live rendered resources in `cljs.cache`; live values belong to the slot store and must follow graph generations and transaction revisions.

### 5. Wire invalidation and cache updates together

1. Keep `src/main/frontend/worker/render_affected_keys.cljs` as the single source of renderer watch-key derivation.

2. Extend class-tree detection to class property-definition datoms, as already covered by the regression test, and make the metadata cache consume the same transaction report.

3. Replace unconditional DSL graph reloads only where dependency extraction returns a proven attribute set; retain the current safe fallback for opaque rules.

4. On a metadata transaction, update the cache once, emit `[:class-tree]` and affected attribute keys once, and let the slot store coalesce duplicate resource notifications.

5. On ordinary block transactions, invalidate only entity, child, page, attribute, and route slots that intersect the resource watch keys.

6. Ensure a class membership transaction invalidates class-object resources through `[:class-membership class-uuid]` without rebuilding unrelated metadata.

7. Add a transaction-batch test containing multiple class/property datoms and assert one cache rebuild and one coalesced reload wave.

### 6. Migrate call sites and remove dead code

1. Search all `frontend.db.subs` consumers and migrate them in small groups: block subscriptions, children subscriptions, resource subscriptions, then query/view consumers.

2. Search all direct calls to private render-resource helpers and make them use family namespace APIs or the public dispatcher.

3. Remove old queue atoms, duplicate normalization functions, unused watch-key branches, and compatibility wrappers only after `rg` proves they have no remaining callers.

4. Keep comments and docstrings in English and document the cache ownership and generation invariant at the new module boundary.

5. Do not introduce default values that conceal missing graph IDs, invalid UUIDs, stale revisions, or malformed resource contracts.

### 7. Verify size, behavior, and performance

1. Run focused frontend worker tests, subscription tests, metadata-cache tests, and db-sync semantic tests.

2. Run `bb dev:lint-and-test`.

3. Run `bb dev:db-sync-test` because semantic pagination and lazy search are part of the same PR behavior surface.

4. Run `git diff --check` and inspect the final diff for accidental restoration of `docs/refactor_remove_ui_db.md`.

5. Re-run `wc -l` and fail the implementation if either target file is above its 50 percent budget.

6. Use the `:db-worker-node` REPL to verify metadata cache construction and cache generation after startup and a representative property/class transaction.

7. Use the `:app` renderer runtime when available to verify a mounted display-properties resource refreshes after class inheritance and property-definition changes; if no app runtime is available, report the gap and retain the focused regression evidence.

## Edge cases

- Opening two repositories sequentially must not reuse metadata or live slots from the first repository.

- Closing a graph while a metadata build or resource request is pending must discard the result by generation, not apply it to the next graph.

- A failed startup or migration must not publish a partially built properties/classes cache.

- A transaction that changes both class inheritance and property definitions must rebuild once and invalidate all affected display resources.

- A class membership change must update class-object scopes without rebuilding the global metadata cache when definitions are unchanged.

- A property’s closed-value choice update must refresh choice-dependent rows and must not invalidate unrelated query resources.

- Blank DSL, quoted full-text DSL, unsupported dynamic rules, malformed resource keys, missing entities, and opaque custom rules must preserve explicit fallback behavior.

- Search pagination must preserve ordering, cursor exclusivity, time filters, type filters, hidden-entity filtering, and bounded retained memory.

- Page-block pagination must preserve hidden-root filtering, hidden-descendant filtering, root ordering, cursor behavior, and child order while expanding only selected roots.

- Duplicate subscriptions and duplicate requests must share one in-flight result and one notification wave.

- A stale response with a newer revision must never replace a newer slot, even if it arrives after a graph reset.

## Testing Details

The existing regression tests are in `src/test/frontend/worker/handler/render_resource_test.cljs`, `src/test/frontend/worker/render_affected_keys_test.cljs`, and `deps/db-sync/test/logseq/db_sync/worker_handler_sync_test.cljs`.

The simplification work should add focused tests beside those namespaces and a new metadata-cache test namespace under `src/test/frontend/worker/db/`.

Run frontend focused tests with `bb dev:test -v frontend.worker.handler.render-resource-test` and `bb dev:test -v frontend.worker.render-affected-keys-test`.

Run the complete db-sync suite with `bb dev:db-sync-test`.

Run the repository gate with `bb dev:lint-and-test`.

Use `git diff --check` and the line-count command from the success criteria as mandatory pre-handoff checks.

## Implementation Details

- Keep the cache API graph-scoped, immutable at read time, bounded with the existing `cljs.cache` LRU factory, and invalidated by transaction datoms rather than render calls.

- Keep one clear source of truth for resource watch keys and one clear source of truth for subscription slot state.

- Prefer moving cohesive code into small namespaces over compressing unrelated logic into dense functions.

- Preserve fail-fast validation for serialized resource contracts and revisions.

- Treat `[:graph]` as an explicit correctness fallback, not a default dependency for every DSL query.

- Measure database traversal counts in tests so the simplification cannot regress into per-render properties/classes scans.

- Do not make the properties/classes cache responsible for rendered block values or UI lifecycle state.

- Keep the three completed correctness fixes green throughout every migration batch.

## Decision

Apply the line-count budget strictly to each entry file: `render_resource.cljs` must be at most 688 lines and `db/subs.cljs` at most 568 lines. Support namespaces may contain code that remains necessary, but they must not be used to hide duplicated lifecycle or rendering complexity; every moved function needs a clear owner and focused tests.

---
