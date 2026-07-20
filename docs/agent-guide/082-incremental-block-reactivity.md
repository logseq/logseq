# Incremental Block Reactivity Implementation Plan

Goal: Replace renderer transaction markers, resident trees, page windows, and component-owned graph copies with exact `:block/tx-id` subscriptions and one compact incremental delta.

Architecture: The worker database is the only graph authority.
The worker publishes complete changed block replacements, direct-child membership patches, tombstones, and explicit resource invalidations through one delta that is reused by the direct response and broadcast.
The renderer exposes only `use-block`, `use-children`, and `use-resource`, while pages virtualize one complete top-level UUID list and journals virtualize only the outer journal list.

Tech Stack: ClojureScript, React, `useSyncExternalStore`, DataScript in the database worker, transit, HSX, Virtuoso, `cljs.test`, and `clj-e2e`.

Related: Supersedes the renderer reactivity and tree-window portions of `docs/agent-guide/080-outliner-performance.md` and builds on the worker ownership described in `docs/agent-guide/081-worker-outliner-editor-review_report.md`.

## Problem statement

Baseline `a81e5cf659d65191169e404bca7fba79fcbb9e74` has more than one representation of renderer freshness.

Blocks have `:block/tx-id`, while the renderer also maintains `:db/latest-transacted-entity-uuids` with separate entity, children, and tree revision maps.

The UI consequently compares revisions, refetches entities, owns local block copies, reconciles resident trees, and coordinates query refresh effects.

Page rendering loads descendant indexes and render windows even though only direct top-level rows need virtualization.

Journal rendering retains every journal shell and then creates nested page or block virtualizers, which is the opposite of the required ownership boundary.

The worker constructs overlapping direct-response and broadcast refresh payloads, while feature queries use a generic reactive registry with broad invalidation.

Remote commits, undo, redo, and local transactions also need one local revision rule without transporting local `:block/tx-id` values through sync.

This plan removes the overlapping paths instead of adapting them.

## Testing Plan

Every implementation batch follows `@Test-Driven Development (TDD)` and records an expected RED before production code changes.

Pure worker tests will prove revision ownership, structural parent stamping, compact delta construction, tombstones, and resource watch-key derivation.

Subscription-store tests will prove exact-key notification, same-revision deduplication, loader and delta cursor separation, stale-result rejection, graph-generation reset, one in-flight request, and bounded batching.

Component behavior tests will prove that UUID rows subscribe and render without local fetch effects, normal pages own one root virtualizer, nested children never virtualize, and journals own one outer journal virtualizer.

Deletion tests will reject `:db/latest-transacted-entity-uuids`, resident tree state, page windows, renderer query registries, and old compatibility payloads after their callers are migrated.

Application E2E tests will cover local, cross-window, RTC, undo, redo, property, structural, page, journal, view, linked-reference, and query updates.

Performance tests will cover 10,000 exact subscribers, 10,000 direct page children, 1,000-sibling structural edits, bounded 25-key loads, and delta size independent of sibling count.

NOTE: I will write *all* tests before I add any implementation behavior.

## Fixed decisions

- The implementation baseline is exactly `a81e5cf659d65191169e404bca7fba79fcbb9e74`.
- No compatibility layer, feature flag, fallback reader, dual write, or deprecated payload shape will be added.
- `:block/tx-id` is the only block and direct-membership revision observed by renderer data code.
- Any canonical block or page change that enters the formal worker transaction pipeline stamps that entity.
- A structural membership change also stamps only the surviving direct parent, where a top-level parent is the page.
- A nested change does not stamp the page or unrelated ancestors.
- `:skip-validate-db?` bypasses the formal pipeline and never constructs or publishes a renderer delta.
- Worker post-commit handlers unrelated to renderer publication still receive the raw skipped transaction report.
- Sync transport excludes `:block/tx-id`, and each receiving worker assigns its own local revision through the formal pipeline.
- The sync protocol's remote transaction cursor and checksum remain protocol state, not renderer reactivity state.
- No page window, descendant index, irreversible prefix, normalized renderer graph, or synthetic resource entity will be introduced.
- UI components subscribe to declarative keys and render returned values without loading, invalidation, retry, revision, or deduplication logic.
- A normal page virtualizes exactly one complete direct top-level UUID vector.
- A journal route virtualizes exactly one outer journal UUID vector, and each mounted journal renders its page and descendants without another virtualizer.

## Target flow

```text
local operation, remote operation, undo, or redo
                       |
                       v
             formal worker transaction
                       |
                       v
       stamp changed block and direct owner tx-id
                       |
                       v
              construct one delta
                  /          \
                 v            v
          direct response   broadcast
                  \          /
                   v        v
             apply once by graph/rev
               /       |       \
              v        v        v
        exact block  children  resource
        subscriber   owner     invalidation
```

## Data contracts

### Canonical block

A canonical block is a complete replacement keyed by `:block/uuid`.

It includes `:block/tx-id`, own persisted attributes, and shallow identities for references.

It does not include nested children, renderer load flags, window metadata, resident-tree metadata, or function values.

Equal `:block/tx-id` values mean the block is unchanged, regardless of map identity or basis revision.

### Direct-child membership

A membership load returns one ordered, complete vector for one direct parent.

```clojure
{:basis-rev 120
 :parent-tx-id 117
 :items [[child-a "a0"]
         [child-b "b0"]]}
```

The UI receives only `[child-a child-b]` through `use-children`.

Nested membership is loaded by the nested parent subscription and is never included in the page virtualization data.

### Incremental delta

```clojure
{:graph-id repo
 :rev 121
 :op-id operation-id
 :blocks {block-uuid complete-block}
 :deleted {deleted-uuid {:rev 121}}
 :children {parent-uuid {:base-tx-id 117
                         :tx-id 121
                         :remove [[old-child "a0"]]
                         :upsert [[new-child "b0"]]}}
 :affected-keys #{[:journals] [:entity owner-uuid]}}
```

The direct caller and broadcast reuse this exact delta.

The renderer applies it once by `[graph-id rev]` and notifies only exact mounted keys.

Loader `:basis-rev` values protect individual slots but never advance the renderer delta cursor.

### Explicit resources

Every non-block result has one declared key and one response envelope.

```clojure
{:basis-rev 120
 :key resource-key
 :watch-keys #{watch-key}
 :value plain-value}
```

| Resource key | Returned value | Invalidation owner |
|---|---|---|
| `[:page-identity lookup]` | Page UUID or nil. | Normalized page lookup. |
| `[:journals]` | Ordered journal UUIDs. | Journal membership. |
| `[:journal-bundle journal-uuid]` | Flat canonical blocks and direct memberships. | Subsequent exact block and child deltas. |
| `[:block-reactions block-uuid user-uuid]` | Final summarized reaction rows. | Reaction target and creator entities. |
| `[:views owner-uuid feature-type]` | Ordered view-definition UUIDs. | View owner and feature membership. |
| `[:view-data view-uuid context]` | UUID-only rows, groups, partitions, and plain scalar metadata. | Explicit entity, membership, ref, class-tree, and attribute keys. |
| `[:query query-spec]` | Worker-computed UUID rows or plain scalar tuples. | `[:graph]` for opaque query specifications. |

Unknown shapes, closures, missing required values, and invalid UUIDs fail immediately.

### View result shapes

`[:view-data ...]` supports `:all-pages`, `:class-objects`, `:property-objects`,
`:linked-references`, `:unlinked-references`, and `:query-result` explicitly.
The worker converts the existing view engine's feature-specific return values at
the boundary; the UI never receives entity IDs, DataScript entities, lazy
sequences, or a generic normalized graph.

```clojure
;; Flat table, list, or gallery rows.
{:count 42
 :rows [row-uuid ...]}

;; Grouped table or gallery rows.
{:count 42
 :groups [{:value scalar-or-entity-uuid
           :rows [row-uuid ...]}]}

;; Grouped list and linked-reference page groups.
{:count 42
 :groups [{:value scalar-or-entity-uuid
           :partitions [{:root-uuid row-uuid
                         :rows [row-uuid ...]}]}]}
```

Entity-valued group labels use `{:entity-uuid uuid}` so the label component can
subscribe through `use-block`. Linked-reference metadata is limited to plain
`:ref-pages-count` values and `:matched-child-uuids`. Query-result views expose
deterministic `:property-idents` instead of raw pull expressions.

View watch keys are derived from the effective persisted view configuration,
not just the caller context:

- All views watch their view entity plus sorting, filtering, grouping, group
  sorting, and non-empty input attributes.
- All-pages views watch page membership.
- Class views watch the class tree and exact class memberships for the owner and
  its structured descendants.
- Property views watch the property membership and class tree.
- Linked-reference views watch the ref scope plus exact reference targets,
  aliases, class descendants, and explicit include or exclude targets.
- Unlinked-reference views watch its text/reference index boundary.
- Query-result views intentionally watch `[:graph]`; opaque queries do not get a
  speculative dependency analyzer.

## Recommended execution order

| Batch | Status | Exit condition |
|---|---|---|
| Worker revision stamping. | Phase 1. | All formal origins stamp changed blocks and direct owners. |
| Compact delta publication. | Phase 1. | Direct response and broadcast share one delta. |
| Exact renderer store and hooks. | Phase 2. | Exact subscriptions, batching, races, and graph reset pass. |
| Explicit worker resources. | Phase 3. | Seven resource contracts and transit tests pass. |
| Block and page UUID rendering. | Phase 4. | No local entity/tree fetch effects remain. |
| Journal outer virtualization. | Phase 4. | One outer virtualizer and no nested virtualizer remain. |
| Views, queries, references, and reactions. | Phase 5. | All feature reads use explicit resources. |
| Legacy deletion and full validation. | Phase 6. | Deletion, full test, E2E, and performance gates pass. |

## Task 1: Enforce worker revision ownership

Files:

- `src/main/frontend/worker/pipeline.cljs`.
- `src/test/frontend/worker/pipeline_test.cljs`.
- `deps/db/src/logseq/db.cljs` for boundary verification only.

Steps:

1. Add failing tests for local, remote, reverse, undo, redo, and structural transactions.
2. Prove that changed canonical blocks receive the current transaction ID.
3. Prove that surviving old and new direct parents receive the structural revision.
4. Prove that nested changes do not stamp the page or other ancestors.
5. Prove that `:skip-validate-db?` never invokes the pipeline.
6. Implement one pure owner-ID collector and one stamping path.
7. Run `rtk bb dev:test -v frontend.worker.pipeline-test` and require zero failures and zero warnings.

## Task 2: Publish one compact delta

Files:

- `src/main/frontend/worker/render_delta.cljs`.
- `src/main/frontend/worker/db_listener.cljs`.
- `src/main/frontend/worker/handler/transaction.cljs`.
- `src/test/frontend/worker/render_delta_test.cljs`.
- `src/test/frontend/worker/db_listener_test.cljs`.
- `src/test/frontend/worker/handler/transaction_test.cljs`.

Steps:

1. Add failing tests for content replacement, deletion, insert, move, indent, outdent, and direct-parent deletion.
2. Construct complete replacements only for entities whose `:block/tx-id` changed.
3. Construct structural remove and upsert operations only for changed child memberships.
4. Return tombstones instead of retaining deleted entities.
5. Build the delta once after the formal pipeline.
6. Reuse the same delta for the direct response and client broadcast.
7. Keep editor row UUIDs outside the delta as request-owned response data.
8. Keep skipped and graph-download transactions out of renderer publication.
9. Run the three focused namespaces and require zero failures and zero warnings.

## Task 3: Own exact subscriptions in one renderer store

Files:

- `src/main/frontend/db/subs.cljs`.
- `src/main/frontend/db/hooks.cljs`.
- `src/main/frontend/db/restore.cljs`.
- `src/main/frontend/db/transact.cljs`.
- `src/main/frontend/modules/outliner/pipeline.cljs`.
- `src/test/frontend/db/subs_test.cljs`.
- `src/test/frontend/db/hooks_test.cljs`.
- `src/test/frontend/db/restore_test.cljs`.
- `src/test/frontend/db/transact_test.cljs`.
- `src/test/frontend/modules/outliner/pipeline_test.cljs`.

Steps:

1. Add failing tests for exact notification, equal tx-id deduplication, complete replacement, tombstones, and atomic child patches.
2. Add failing tests for stale success, stale error, loader-basis separation, graph generation, and invalidation during an in-flight request.
3. Add failing tests proving that 100 same-tick block or child subscriptions use at most four batches of 25.
4. Implement one store with block, children, resource, graph, generation, and delta revision state.
5. Keep one in-flight request per typed key and one pending follow-up bit.
6. Reset and restart mounted subscriptions when a restored worker graph becomes active.
7. Apply direct and broadcast deltas through the same `apply-delta!` entry.
8. Make hooks unwrap store status so components receive a value, nil while unavailable, or a thrown load error.
9. Resolve editor callback rows only from ready post-delta block slots and fail if a required row is absent.
10. Run all focused renderer-store namespaces and require zero failures and zero warnings.

## Task 4: Add explicit resources and affected keys

Files:

- `src/main/frontend/worker/handler/render_resource.cljs`.
- `src/main/frontend/worker/db_core.cljs`.
- `src/main/frontend/worker/pipeline.cljs`.
- `src/main/frontend/worker/handler/block.cljs` only for reusable canonical reads.
- `src/test/frontend/worker/handler/render_resource_test.cljs`.
- `src/test/frontend/worker/pipeline_test.cljs`.
- `src/test/frontend/db/subs_test.cljs`.

Steps:

1. Add failing behavior tests for every resource key in the contract table.
2. Reject malformed keys and recursively reject function values before database work.
3. Execute page, journal, reaction, view, and query reads entirely in the worker.
4. Normalize entity rows to UUIDs while retaining feature-owned scalar and grouped values as plain data.
5. Seed journal bundle blocks and direct memberships into the same exact store atomically.
6. Derive explicit affected keys from `db-before`, `db-after`, and transaction datoms.
7. Always include `[:graph]` for mounted opaque queries without inventing dependency analysis.
8. Add tests for reaction edits and deletion, page rename, journal membership, class membership, refs, view membership, and sorted attributes.
9. Run resource, pipeline, and subscription tests and require zero failures and zero warnings.

## Task 5: Make block rendering UUID-driven

Files:

- `src/main/frontend/components/block.cljs`.
- `src/main/frontend/handler/ui.cljs`.
- `src/test/frontend/components/block/reactivity_test.cljs`.
- `src/test/frontend/components/block/virtualized_test.cljs`.

Steps:

1. Add a failing component test proving one UUID row calls only `use-block` and `use-children`.
2. Add a failing test proving a changed descendant does not rerender its ancestors.
3. Add a failing test proving nested children never mount Virtuoso.
4. Keep the existing large pure block-content renderer and pass it a canonical block plus direct child UUIDs.
5. Replace `block-container` local state and async effects with the two hooks.
6. Split the list into an explicit virtualized top-level UUID list and a plain recursive UUID list.
7. Add a small linked-block adapter that subscribes to the source UUID and then the shallow link target UUID.
8. Update scroll and selection helpers to consume UUID rows directly.
9. Delete resident-tree reads, load-status branches, child maps, revision hooks, and block refetch effects in the migrated path.
10. Run block reactivity and virtualization tests and require zero failures and zero warnings.

## Task 6: Make normal pages direct-membership views

Files:

- `src/main/frontend/components/page.cljs`.
- `src/main/frontend/worker/handler/page.cljs`.
- `src/test/frontend/components/page_test.cljs`.
- `src/test/frontend/remove_ui_db_test.cljs`.

Steps:

1. Add a failing test proving a route lookup resolves to one page UUID resource.
2. Add a failing test proving the page subscribes to its canonical block and complete direct children.
3. Add a failing test proving the root Virtuoso data is exactly the complete direct UUID vector.
4. Render a block route through the plain UUID list.
5. Move quick-add, class, property, and other filtered memberships to explicit worker resources instead of filtering entity trees in UI.
6. Delete page descendant indexes, render windows, resident trees, prefix growth, tree reconciliation, and initial render limits.
7. Preserve imperative full-tree worker APIs used by public plugin APIs until those APIs are separately redesigned.
8. Run page behavior and renderer-deletion tests and require zero failures and zero warnings.

## Task 7: Give journals one virtualization owner

Files:

- `src/main/frontend/components/journal.cljs` or the current journal owner under `src/main/frontend/components/journals.cljs`.
- `src/main/frontend/components/page.cljs`.
- `src/main/frontend/db/subs.cljs`.
- `src/test/frontend/components/journal_test.cljs`.

Steps:

1. Add a failing test proving the journal route owns one Virtuoso over ordered journal UUIDs.
2. Add a failing test proving a mounted journal page renders a plain direct list and plain recursive descendants.
3. Subscribe the route to `[:journals]`.
4. Subscribe each mounted row to `[:journal-bundle journal-uuid]` so one response seeds exact block and membership slots.
5. Apply later changes only through ordinary block and child deltas.
6. Remove per-journal intersection observers, timers, resident caches, height ownership, nested virtualizers, and mobile descendant truncation.
7. Preserve focus and scroll restoration at the outer journal virtualizer only.
8. Run journal behavior tests and require zero failures and zero warnings.

## Task 8: Migrate remaining graph-backed surfaces

Files:

- `src/main/frontend/components/views.cljs`.
- `src/main/frontend/components/block.cljs` for reactions and query results.
- `src/main/frontend/components/reference.cljs`.
- `src/main/frontend/db/query_dsl.cljs`.
- `src/main/frontend/db/query_react.cljs`.
- `src/main/frontend/db/react.cljs`.
- Focused component tests for views, queries, references, and reactions.

Steps:

1. Add a failing behavior test for each feature using only UUID or explicit resource inputs.
2. Replace view-definition queries with `[:views owner-uuid feature-type]`.
3. Replace view rows with `[:view-data view-uuid context]` and subscribe rendered blocks by UUID.
4. Replace reaction query atoms with the final `[:block-reactions block-uuid user-uuid]` summary.
5. Replace linked-reference and object memberships with explicit view-data contexts and UUID rows.
6. Execute DSL and advanced query transformations in the worker and remove UI closures from query keys.
7. Keep feature-owned table, gallery, search, or result virtualization, but never virtualize a block's descendants.
8. Remove component query registration and refresh effects after the last caller is migrated.
9. Run focused feature tests and require zero failures and zero warnings.

## Task 9: Separate non-renderer post-commit effects

Files:

- `src/main/frontend/worker/db_listener.cljs`.
- `src/main/frontend/modules/outliner/pipeline.cljs`.
- `src/main/frontend/handler/events.cljs`.
- Focused worker listener and renderer pipeline tests.

Steps:

1. Add failing tests for plugin transaction hooks, deleted sidebar entries, asset cleanup, search indexing, and markdown mirror behavior.
2. Keep these effects in a narrow auxiliary event or worker-owned handler rather than adding datoms to the renderer delta.
3. Preserve ordering where persistence completes before renderer broadcast.
4. Prove that skipped validation bypasses renderer work without suppressing unrelated handlers.
5. Run focused listener and pipeline tests and require zero failures and zero warnings.

## Task 10: Delete superseded paths

Files:

- `src/main/frontend/state.cljs`.
- `src/main/frontend/rfx.cljs`.
- `src/main/frontend/db/react.cljs`.
- `src/main/frontend/modules/outliner/tree.cljs`.
- Migrated component and worker namespaces.
- `src/test/frontend/remove_ui_db_test.cljs`.

Steps:

1. Add deletion assertions before removing each obsolete owner.
2. Delete `:db/latest-transacted-entity-uuids` and all entity, children, and tree tx-id RFX hooks.
3. Delete renderer resident-tree mutation, reconciliation, and retention functions with no remaining caller.
4. Delete renderer page window, descendant index, prefix, and load-status code.
5. Delete the old reactive query atom registry after all explicit resource callers are live.
6. Delete direct-response origin markers, broad refresh calls, generic normalized envelopes, and old remote-render latest state.
7. Keep only essential sync protocol cursors and checksums outside renderer code.
8. Run `rg` deletion checks and the focused removal test.

## Task 11: Validate behavior and performance

Files:

- `src/test/frontend/` focused unit and behavior tests.
- `clj-e2e/test/logseq/e2e/` application flows.
- `docs/agent-guide/080-outliner-performance.md` workloads.

Steps:

1. Run `rtk bb dev:lint-and-test` and require zero failures and zero warnings.
2. Run `rtk bb -f clj-e2e/bb.edn test` and require the selected application flows to pass.
3. Measure a 10,000-top-level-block page and require one direct-membership request with no descendant transport.
4. Prove that 100 same-tick UUID subscriptions use no more than four worker calls of 25.
5. Prove that one exact block delta notifies only that key among 10,000 mounted subscribers.
6. Prove that structural delta bytes remain bounded when sibling count grows from 10 to 10,000.
7. Verify local, cross-window, RTC, undo, redo, property retraction, move, indent, outdent, page, journal, view, reference, and query behavior manually where automation is unavailable.
8. Run `git diff --check`.
9. Apply `@code-simplify` to the final diff and rerun affected tests after any cleanup.

## Edge cases

- A block replacement and tombstone for the same UUID in one delta is invalid.
- A child patch whose base parent tx-id does not match starts one exact parent reload and coalesces further invalidations.
- A loader response can have a later basis than the renderer delta cursor without swallowing intermediate deltas.
- A stale load error cannot replace a newer ready slot.
- A graph switch rejects old-generation completions and restarts only still-mounted keys.
- A graph removal with no replacement clears snapshots without invoking a worker for a nil graph.
- A structural move produces one remove for the old direct parent and one upsert for the new direct parent.
- Deleting a direct parent emits child removal where possible and tombstones without retaining deleted entity maps.
- Reaction deletion and emoji edits resolve their target from both `db-before` and `db-after`.
- Page renames invalidate both old and new normalized lookup keys.
- Journal bundles contain flat canonical blocks plus one direct-membership slot for every included parent and leaf.
- Opaque query invalidation is intentionally graph-wide only while the resource is mounted.
- Public plugin APIs that explicitly request a full tree are not conflated with renderer virtualization data.

## Testing Details

Tests exercise observable notification, rendering, transport, lifecycle, and request-count behavior rather than private map layouts.

Worker tests use real DataScript transactions for revision, structural, resource, and transit behavior.

Renderer tests control promises to reproduce stale completion and graph-switch ordering deterministically.

Component tests inspect mounted hooks and virtualization ownership instead of large source-code substrings.

E2E tests verify that editor focus and visible data remain correct across local and remote commits.

## Implementation Details

- Use one formal worker transaction path for all revision-stamped changes.
- Keep `:block/tx-id` local to each worker database.
- Build and serialize one compact delta per committed renderer-visible transaction.
- Keep global delta revision separate from per-load basis revision.
- Store only complete block replacements and direct-child memberships.
- Batch exact block and child loads in groups of 25.
- Represent feature results as seven explicit resource types.
- Virtualize normal page roots and outer journals only.
- Keep auxiliary plugin, search, asset, and mirror effects outside renderer delta.
- Delete old paths immediately after their last caller migrates.

## Question

No design question remains open for this implementation.

The essential sync remote cursor is retained because it is a transport protocol concern, while every renderer-level remote-latest, page-window, and compatibility mechanism is removed.

---
