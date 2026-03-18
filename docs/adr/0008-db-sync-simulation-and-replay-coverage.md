# ADR 0008: Strengthen DB-Sync Simulation and Replay Coverage

Date: 2026-03-17
Status: Accepted

## Context
Recent DB-sync bugs have repeatedly escaped existing unit and simulation tests.
The failures were only exposed by real user sessions and browser logs, usually
after long offline editing, undo/redo, delete/recreate, recycle, and
sequential reconnect flows.

The current test suite has good focused coverage for many individual sync
helpers, but it still misses several classes of real-world behavior:
- editor-style multi-step writes such as `insert empty block -> save title`
- long-lived pending local tx queues
- undo/redo stacks that survive many sync rounds
- sequential reconnect flows where one client uploads first and another
  reconnects later
- replay of real bad `local-txs` and `remote-txs` captured from logs

That gap makes DB-sync regressions too dependent on manual reproduction and
post-hoc log analysis.

## Decision
1. Treat DB-sync simulation as a first-class regression surface, not just a
   long-running smoke test.
2. Keep adding deterministic repro tests for every real sync bug that reaches
   logs or manual QA.
3. Expand offline multi-client sims to cover:
   - both reconnect orders
   - repeated offline/online cycles
   - long undo/redo stacks
   - heavier weighting for `delete-blocks`, `move-blocks`,
     `cut-paste-block-with-child`, `undo`, and `redo`
4. Add invariant checks during simulation, not only after final convergence:
   - no malformed pending tx items
   - no malformed reversed tx items
   - no invalid lookup-only reverse txs
   - no DB structural issues such as missing parent/page or page mismatch
5. Introduce replay-oriented tests that can execute compact fixtures extracted
   from real logs:
   - persisted `local-txs`
   - remote tx batches
   - reconnect order
6. Prefer editor-faithful simulation helpers over simplified synthetic ops for
   block creation and editing.
7. Keep a small corpus of fixed seeds and exact repro flows in the repository,
   so future regressions are rerun automatically in CI and local test runs.

## Consequences
- Positive:
  - Real sync bugs can be captured once and kept as permanent regressions.
  - Multi-client offline behavior gets closer to real user workflows.
  - Broken pending/reverse tx shapes fail earlier and closer to the source.
  - Investigation time drops because logs can be turned into executable tests.
- Negative:
  - Long-running DB-sync tests become more expensive.
  - Some simulations may still approximate, rather than exactly match, UI
    timing and browser worker behavior.
  - The test suite will need ongoing curation so fixed seeds and replay
    fixtures stay useful instead of becoming noisy.

## Verification
- Exact repro simulation coverage:
  - `bb dev:test -v frontend.worker.db-sync-sim-test/two-clients-offline-delete-vs-children-undo-redo-repro-test`
- Aggressive offline random coverage:
  - `bb dev:test -v frontend.worker.db-sync-sim-test/two-clients-both-offline-random-undo-redo-sequential-reconnect-sim-test`
- Reverse/pending tx shape coverage:
  - `bb dev:test -v frontend.worker.db-sync-test/reverse-local-txs-skips-invalid-reverse-step-test`
  - `bb dev:test -v frontend.worker.db-sync-test/reverse-local-txs-skips-missing-lookup-entity-step-test`
  - `bb dev:test -v frontend.worker.db-sync-test/replace-string-block-tempids-rewrites-retract-entity-string-uuid-test`
- Undo/redo validity coverage:
  - `bb dev:test -v frontend.undo-redo-test/undo-validation-rejects-invalid-recycle-restore-tx-test`
