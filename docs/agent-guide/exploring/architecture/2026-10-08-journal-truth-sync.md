# Journal Truth Sync

Full analysis: `deps/db-worker/docs/sync-simplification.md` (branch
`devin/sync-simplification-study`). This document registers the durable
architecture decision; the analysis carries the evidence.

## Problem

The OCaml db-worker sync (`deps/db-worker/lib/sync_*.ml`) runs ~20 sites
where pull, confirm, unapply, and replay re-derive journaled-or-confirmed
data keyed on the client's transient local view (`remote_deleted_*` sets,
missing-ref drops, delete-cascade re-expansion, fixup re-derivation). The
server journal (`deps/db-sync` `tx_log`) already stores post-transact
normalized datoms — sanitize drops, cascades, fixups, and resolved eids are
all journaled. Client-side re-derivation is therefore redundant at best and
divergent at worst; the 3-client chaos harness traced ~20 real bugs to this
family.

## Proposal

Adopt "journal-truth" in three steps (details and invariant mapping in the
design doc):

- A. Pull applies journaled `tx-data` verbatim — ref resolution only; delete
  pull-side `sanitize_tx`, `rewrite_missing_uuid_refs`, stale-add drops.
- B. Confirm becomes bookkeeping + journal echo: mark confirmed ids,
  pull the contiguous own window `(old_t, new_t]`, apply verbatim; delete
  the confirm re-derivation pipeline (both branches).
- C. Display = server conn + verbatim pending overlay (`stored .tx`,
  defer-not-fail on unresolvable refs); semantic op machinery relocates to
  upload-time rebase; delete `unapply_persisted_pending_txs` (→ small
  migration sweep) and the `remote_deleted/asserted/retracted` sets.

No wire-protocol or D1 schema change; the cljs worker keeps the same
observable contract and ports the deletions afterward.

## Alternatives considered

### Tombstone deletes (deleted-at attr)

Replaces entity retraction with journaled data — attractive but a large
read-path/schema/migration surface; separate future decision. Not required
for A–C because the journal already carries deletes.

### Op-CRDT / per-entity LWW

The journal is already a totally ordered server-timestamped op log; LWW adds
machinery where no merge ambiguity exists. Rejected — A–C solve the same
convergence by deleting code.

### Status quo + targeted gate fixes

Each gate was added to patch a real symptom; fixing gates one at a time keeps
the divergence-generating structure (local re-interpretation of confirmed
state) and has already consumed ~20 chaos-harness bug cycles.

## Acceptance criteria

- Chaos harness invariants hold: pending drains, `full_attr_map` equality
  across all conns and the server image, `Db_validate` clean, client
  checksum = server image, pending does not grow on restart.
- `server_conn` is a pure function of the journal prefix (verifiable: no
  code path writes to it except verbatim journal application and migration).
- Confirm writes no locally-derived datoms; own txs reach `server_conn` only
  via the journal echo.
- Unapply reduces to a one-shot migration sweep; `remote_*` sets deleted.

## Risks

- Optimistic lane lags: display shows the stored pending resolution until
  upload-time rebase (bounded, seconds); unsalvageable ops fail at upload
  instead of being healed per-pull.
- Version-skew: verbatim pull widens dependence on identical
  upsert/lookup-ref semantics between client and server datascript
  versions.
- Checksum mismatch has no repair today; proposal F (snapshot + journal
  replay self-heal) is a recommended adjunct, not strictly part of A–C.

## Questions

- Should `tx/batch/ok` echo the journaled own-window rows, or is the extra
  pull round trip acceptable? (wire-format question for the server)
- Is defer-then-fail at upload acceptable UX for unsalvageable offline ops,
  or is an explicit "conflict pending" lane wanted?
- Tombstone deletes: pursue as a separate decision?
- `fix_tx` dup-order repair: keep display-only or journal it server-side?
