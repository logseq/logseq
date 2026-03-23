# ADR 0010: Canonical Op-Driven Client Rebase With Legacy Tx Surgery Isolation

Date: 2026-03-19
Status: Accepted

## Context
Client sync rebase currently relies on custom tx-data surgery to keep pending
local changes alive after remote txs are applied.

That approach has several problems:
- the logic is hard to reason about because it edits datoms instead of replaying
  user intent
- it does not preserve intent well when a local change originated from a higher
  level outliner action
- the helper set keeps growing with special cases for missing refs, structural
  conflicts, and deleted entities
- the outliner-op surface is too large to replay directly without first
  reducing it

At the same time, not every outliner op needs to remain a first-class replay
operation.
Many ops can be safely represented by `:transact` when their tx-data is already
self-contained and does not depend on rerunning outliner logic.

We also have existing persisted pending rows that only store tx-data and reverse
tx-data.
Those rows still need a compatibility path, but that path should not define the
new rebase architecture.

## Decision
1. New pending local tx rows will persist semantic `:outliner-ops` in addition
   to their existing tx-data payload.
2. Client rebase will become op-driven for all new pending rows:
   - reverse local txs
   - apply remote txs
   - transform or drop stored local ops against the post-remote temp db
   - replay the surviving ops to regenerate rebased tx-data
3. Reduce the replay-visible outliner-op surface to a small canonical set:
   - `:insert-blocks`
   - `:save-block`
   - `:move-blocks`
   - `:delete-blocks`
   - `:transact`
4. Normalize higher-level ops into that canonical set before persistence.
   Examples:
   - `:indent-outdent-blocks` becomes `:move-blocks`
   - `:move-blocks-up-down` becomes `:move-blocks`
   - `:rename-page` becomes `:save-block`
5. Introduce an explicit safe-`:transact` classifier:
   - if replaying tx-data directly is sufficient and does not require rerunning
     outliner logic, persist the op as canonical `:transact`
   - otherwise keep it as one of the canonical outliner replay ops
   - expected canonical `:transact` cases include direct tx replay actions such
     as undo, redo, import replay, reaction toggles, and property-value updates
6. Treat undo/redo as canonical `:transact` actions.
   - persist the exact tx-data that the successful undo or redo applied
   - keep the action atomic as one pending tx row
   - do not reconstruct the original higher-level outliner ops that were
     undone or redone
7. Treat `:batch-import-edn` as canonical `:transact` after successful local
   execution.
   - persist the exact tx-data that the import applied
   - do not rerun import expansion during rebase
8. Keep the following op kinds as replay-visible semantic ops because they must
   be reevaluated against current DB state:
   - `:save-block`
   - `:insert-blocks`
   - `:move-blocks`
   - `:delete-blocks`
   - `:create-page`
   - `:delete-page`
   - `:upsert-property`
9. Stop using raw tx-data surgery in the normal rebase path for new rows.
10. Move the current tx-data surgery helpers into a dedicated legacy namespace.
   That legacy namespace is only for compatibility handling of old persisted
   pending rows that do not have stored `:outliner-ops`.
11. Add explicit owned-block filtering in the new op-driven rebase path.
   Initially cover:
   - reaction blocks owned by `:logseq.property.reaction/target`
   - property history blocks owned by `:logseq.property.history/block`
   - property history blocks whose effective owner disappears through deleted
     `:logseq.property.history/ref-value`
12. If a local op creates or updates one of those owned blocks and the owning
   block was deleted remotely, drop that op.
13. Treat each pending tx row as one user action and keep it atomic during
    rebase.
14. If any op in a pending tx becomes invalid during rebase, drop the whole
    pending tx rather than keeping a partial replay of that user action.
15. Keep this refactor client-only for now.
    The sync wire format and server tx log remain unchanged.

## Consequences
- Positive:
  - Rebase reasons about user intent instead of datom accidents.
  - The number of op kinds that rebase must understand becomes much smaller.
  - Safe direct tx replay remains available through canonical `:transact`
    without forcing every operation through outliner code.
  - Undo/redo stays aligned with its real intent: replay the exact applied tx,
    not rerun a reconstructed higher-level command.
  - Import replay stays aligned with its real intent: preserve the exact local
    import result rather than recomputing import expansion later.
  - Legacy compatibility is isolated instead of contaminating the new design.
  - Owned-block cleanup becomes an explicit semantic rule rather than another
    tx-data patch.
  - Rebase behavior stays aligned with the mental model that one pending tx is
    one user action that either survives or is discarded as a whole.
- Negative:
  - We must maintain a canonicalization layer from original outliner ops to the
    reduced replay set.
  - Some existing ops need careful classification to decide whether they are
    safe `:transact` or must stay true outliner replays.
  - For a transition period, the codebase will contain both the new rebase path
    and the isolated legacy compatibility path.
  - If one invalid op is grouped together with otherwise valid work in the same
    pending tx, the whole user action will be lost during rebase.

## Follow-up Constraints
- New pending tx producers must persist canonical `:outliner-ops`.
- New pending tx producers must preserve user-action boundaries because rebase
  will treat each persisted tx row atomically.
- Canonicalization should happen when persisting local pending txs, not lazily
  during rebase.
- Undo/redo producers should persist canonical `:transact` actions using the
  exact tx-data they applied.
- Import producers should persist canonical `:transact` actions using the exact
  tx-data they applied.
- The main sync apply namespace should not call legacy tx-surgery helpers for
  new pending rows.
- The legacy namespace should be clearly named and easy to delete once old
  pending-row compatibility is no longer needed.

## Verification
- Add or update frontend worker db-sync coverage for:
  - persistence of canonical `:outliner-ops`
  - canonical reduction of `:indent-outdent-blocks` and
    `:move-blocks-up-down` into `:move-blocks`
  - safe `:transact` replay versus true outliner replay classification
  - undo/redo persistence as atomic canonical `:transact` actions
  - `:batch-import-edn` persistence as atomic canonical `:transact`
  - `:rename-page` canonicalization to `:save-block`
  - op-driven rebase preserving pending tx boundaries
  - dropping owned reaction/history ops when their owner was deleted remotely
  - dropping the whole pending tx when any op in that user action becomes
    invalid
  - routing legacy pending rows without stored ops through the legacy namespace
- Expected targeted command:
  - `bb dev:test -v frontend.worker.db-sync-test`
