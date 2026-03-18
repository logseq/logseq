# ADR 0009: Hybrid Delete Semantics for Schema Entities

Date: 2026-03-18
Status: Accepted

## Context
`delete-blocks` and page deletion now recycle entities instead of hard deleting
them.

That works well for ordinary content because users can restore deleted blocks
and pages from Recycle, and active UI/search can treat recycled content as
hidden state.

It does not work as well for DB-schema entities.
Tag pages, property pages, and closed-value blocks continue to exist after
deletion and can leak into active semantics such as:
- class/property enumeration
- closed-value lookup and scoped choices
- bidirectional/property-derived views
- sync repair logic when schema roots disappear but dependents still reference
  them

At the same time, sync still needs to remain robust when `:db/retractEntity`
appears again for this subset of entities and for their descendants.

## Decision
1. Adopt hybrid delete semantics:
   - recycle ordinary blocks and ordinary content pages
   - hard retract tag/class pages, property pages, and closed-value blocks
2. When deleting a schema root page, retract the schema page tree rather than
   moving it to Recycle.
3. When deleting a closed-value block, retract the choice entity directly.
4. Keep raw entity access unchanged; deleted schema entities should disappear by
   DB state, not by UI-only filtering.
5. Keep recycle-aware behavior for content entities:
   - deleted-state page route for recycled content
   - deleted styling for recycled references/embeds
   - search/index filtering for recycled content and descendants
6. Make sync robust for missing content locations:
   - if a content node loses `:block/parent` or `:block/page` during sync
     application, move it to Recycle rather than leaving it structurally
     invalid
7. Preserve valid `:db/retractEntity` handling in sync sanitize/rebase/apply for
   schema deletions.

## Consequences
- Positive:
  - Schema entities return to true disappearance semantics, which matches how
    most schema helpers already reason about deletion.
  - Content keeps recycle/restore UX.
  - Sync has a deterministic repair rule for orphaned content blocks.
- Negative:
  - Delete semantics are now mixed by entity kind, so the rule must remain
    centralized in the outliner/domain layer.
  - Some old recycled schema entities may still need active-use filtering until
    users delete them under the new semantics.
  - Sync logic is slightly more complex because it must accept both recycle and
    hard-retract flows.

## Verification
- Model/helper coverage:
  - `bb dev:test -v frontend.db.db-based-model-test/get-all-classes-filters-recycled-test`
  - `bb dev:test -v frontend.db.db-based-model-test/get-all-properties-filters-recycled-test`
- Sync repair coverage:
  - `bb dev:test -v frontend.worker.db-sync-test/missing-parent-after-remote-retract-moves-child-to-recycle-test`
- Additional targeted coverage to keep or extend:
  - page/property/closed-value delete semantics
  - bidirectional helper behavior with deleted or recycled entities
  - search index invalidation for recycled content
