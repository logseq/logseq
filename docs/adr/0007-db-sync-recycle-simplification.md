# ADR 0007: Simplify Client DB-Sync for Recycle Semantics

Date: 2026-03-17
Status: Accepted

## Context
Client DB sync still contains logic shaped around hard delete.
That logic tracks deleted UUIDs, computes deleted subtrees, and runs a second
cleanup pass in temp connections to remove nodes after remote apply and local
rebase.

The recycle refactor changed deletion semantics.
Deleted pages and blocks now remain in the graph with stable UUIDs and are
hidden by placement and metadata instead of disappearing.

That means the deleted-context and delete-nodes cleanup flow is no longer the
right model for client sync.
It adds complexity, creates stale test assumptions around `db/retractEntity`,
and makes the rebase path harder to reason about.

## Decision
1. Client DB sync will stop treating deletion as entity disappearance.
2. The rebase/apply pipeline will operate on ordinary tx streams plus current DB
   state.
3. `sanitize-tx-data` will no longer accept or derive deleted subtree state.
4. The extra temp-conn cleanup pass that deletes locally or remotely deleted
   nodes will be removed.
5. Sync sanitization will keep only the behaviors that still matter:
   - broken temp-id cleanup
   - missing/ref-invalid datom cleanup
   - remote/local conflict dropping
   - page consistency fixes
   - duplicate order fixes
6. Recycled targets are treated as invalid active refs by current DB state,
   rather than through a separate deleted-context channel.

## Consequences
- Positive:
  - The client sync implementation becomes shorter and easier to reason about.
  - Delete and restore semantics stay consistent across local UI, undo/redo,
    sync, and rebase.
  - Tests can assert recycle behavior directly instead of hard-delete
    side-effects.
- Negative:
  - Old tests and assumptions built on `db/retractEntity` delete behavior must
    be updated.
  - Minimal stripped-down test DBs need recycle-aware helpers so they do not
    count recycled nodes as active graph nodes.

## Verification
- DB sync unit coverage:
  - `bb dev:test -v frontend.worker.db-sync-test`
- DB sync simulation coverage:
  - `bb dev:test -v frontend.worker.db-sync-sim-test`
- Undo/redo compatibility coverage:
  - `bb dev:test -v frontend.undo-redo-test`
- Recycle-aware long outliner helper coverage:
  - `bb dev:test -e long -v frontend.modules.outliner.core-test/test-batch-transact`
