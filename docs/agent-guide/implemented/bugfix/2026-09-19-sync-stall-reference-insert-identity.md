# Sync Stall Reference Insert Identity

## Problem

Saving a newly parsed page reference and inserting a sibling in one transaction records the referenced page UUID as the inserted block UUID. Rebase then reparents the page under an ordinary block and repeatedly fails validation. Local worker reproduction fails twice with `Page can't have block as parent`; the remote edit remains unapplied. The supplied operation store contains the same mismatch. Recycling is coincident rather than required.

## Decision

Use original transaction parent writes to identify created insert nodes, and apply the same identity reconstruction when rebasing durable pending insert history. Keep final graph validation and preserve pending edits until acknowledgment.


Match created insert identities only to entities with parent writes in the same transaction. Do not infer insertion from current page state: the referenced page can subsequently move to Library or be deleted. Recanonicalize pending insert operations from their durable transaction evidence before replay so existing stalled queues can recover. Preserve page identity, block identity, edits, and pending transaction IDs. Verify generated local operations, repeated remote apply, and persisted pending history.

## Alternatives considered

### Skip validation or discard the failing transaction

Rejected because either approach hides corruption or loses unsynced changes.

## Acceptance criteria

- Locally generated save-reference plus sibling-insert operations reproduce the stall before the fix.
- The same operations and persisted affected history apply remote edits after the fix without reparenting or blanking the referenced page.
- Existing insert, template, replacement, history, and sync checks continue to pass.

## Consequences

A reference page cannot consume the identity slot of an inserted sibling, even if later moved into Library. Existing affected pending rows are repaired through normal rebase without clearing the backlog. Template test fixtures now include the structural datoms that real insertions produce. Complete recovery of the reporter's own graph still requires running the updated client against its full graph database.


- Insert identity inference also serves template and undo operations; preserve their existing identity rules.

## Questions

None. The user authorized investigation, local reproduction, and repair; no product decision is outstanding.

## Investigation and reproduction

The first matching supplied log entry is at `2026-09-17T07:28:27.019Z`. It fails the final rebase commit with `Page can't have block as parent`. The operation SQLite contains 618 pending rows and a local sync cursor of 521; the hello log reports a limited batch of 50, not the full backlog.

A representative pending row combines `save-block` and `insert-blocks`. The durable datoms correctly create two different entities: reference page P and empty sibling B. Its canonical insert payload incorrectly points to P and has `[:block/uuid nil]` as parent. Replaying it overwrites P's title and gives it B's intended parent. Validation rolls back the entire remote apply, and retries repeat the same failure. The TickTick recycle operation is in the backlog but is not required to trigger the problem.

The local `:db-worker-node` REPL reproduction constructs independent local and remote Datascript connections from the same initial graph and uses the real outliner, SQLite pending store, and sync apply functions:

1. Create a parent with two children and a separate page to recycle.
2. On client A, parse a new page reference and apply save plus sibling insert in one `:insert-blocks` transaction, as Enter does in the editor.
3. Optionally recycle the other page or subsequently move the reference page into Library.
4. On client B, edit the other child and apply its transaction to A.
5. Repeat remote apply and inspect the pending history, referenced page, sibling identity, and remote title.

Before the fix, two successive applications throw `Page can't have block as parent`; the remote title remains unchanged. After the fix both applications succeed and retain distinct page and sibling identities. The generated scenario is independent of the supplied private graph contents.

## Regression coverage

- `frontend.worker.db-sync-test/rebase-save-new-page-reference-and-insert-sibling-test`: eight combinations of generated versus affected persisted history, recycling, and later movement of the reference page into Library; 120 assertions.
- `frontend.worker.db-sync-test/rebase-insert-page-in-library-with-reference-test`: inserts a real page under Library with and without a new page reference, then rebases a concurrent edit; 13 assertions cover identity, title, parent, and references.
- Template history fixture includes its parent datoms so it represents an actual inserted tree rather than only isolated UUID assignments.

The persistence experiment writes the constructed graph snapshot and affected pending operations to local files, closes SQLite, stops the worker process, starts a new worker, and reloads the files. Applying the remote edit, delivering the rebased transactions to the peer, and acknowledging them preserves both clients' page/sibling/recycle state and reduces the pending count from 2 to 0.

## Verification scope

The reproduction and recovery run through the Node worker sync apply path. They do not exercise production WebSockets, deploy a release, or modify the user's graph. The supplied SQLite is the operation store, not the full graph database, so the user's complete graph has not been replayed end to end.

The standalone Outliner nbb runner cannot load `sqlite-export/validate-import-txs` in the installed dependency bundle. Relevant Outliner tests were also evaluated in the Node worker with `LOGSEQ_STABLE_IDENTS=1`. Its `page-test/delete-page` raw-title assertion fails identically when the original unmodified operation-construction source is loaded; this is outside the insert-identity change.

## Results

- Before change: locally generated save/reference/Enter plus remote edit repeatedly throws `Page can't have block as parent` and leaves the remote edit unapplied.
- Final targeted Node worker tests: 2 tests, 133 assertions, zero failures/errors, including the later Library move and affected persisted history.
- Compiled sync namespace: `bb dev:run-test-namespaces -n frontend.worker.db-sync-test -e long -e fix-me` — 220 tests, 973 assertions, zero failures/errors.
- Outliner worker evaluation: 54 tests, 199 passing assertions and one failing raw-title assertion. Running that test against the unmodified construction source reproduces the same failure (7 passing assertions, one failure).
- `clojure -M:clj-kondo --lint` for the changed source/test files, from both the root and Outliner package: zero warnings/errors.
- Root and Outliner `bb lint:large-vars`, `git diff --check`, and `spec-dev-tool check --all`: passed.
- Final persistence run writes with worker PID 4024 and reloads with PID 5998: remote edit applied, referenced page/sibling/recycle state preserved on both peers, pending count 2 before recovery and 0 after acknowledgment.

No production data was changed and no release was deployed.

## Extended outliner verification

The broader client-to-server audit is ongoing. A compound transaction containing two insert operations reproduced a separate identity collision: after a remote edit, the first block acquired the second insertion's title and the second block disappeared with its later edit. Both UUID-preserving and UUID-reminting insertions reproduced it. Canonicalization now allocates created identities across the insertion operations and preserves matching source identities. The regression applies serialized prepared uploads to an independent server connection and compares checksums as well as the intended block titles.

The nested-insertion-then-permanent-deletion probe currently passes, including server application. A small request-size probe also applied a four-entity permanent deletion across two upload requests successfully; the suspected missing-entity failure has not been reproduced by that probe.

The page deletion assertion was obsolete: `:block/raw-title` is a derived lookup of the original stored title, so recycling a page preserves its child's raw title and internal reference. The corrected test verifies the exact preserved title and absence of a stored `:block/raw-title` datom. Before correction the worker reported one failure; afterward the deletion test passed all nine assertions and the full page namespace passed 16 tests / 71 assertions.

Four targeted sync regressions passed 154 assertions in the Node worker after the compound-insertion change. After recompiling with `pnpm cljs:test`, the sync namespace passed 222 tests / 994 assertions. Changed-file lint, large-function checks, document validation, and diff checks passed. This evidence does not yet establish complete coverage of every outliner operation, upload chunk boundary, or persisted recovery combination.

### Operation matrix and empty-target replacement

The systematic upload matrix forces each of the 24 core operation generators plus undo and redo to execute, with and without a preceding remote change. It validates raw normalized transactions and independently applies their Transit serialization through the actual server handler, compares checksums, and requires the pending queue to drain. All 52 scenarios passed 208 assertions. Additional scenarios cover recycling restore, permanent deletion, folding, EDN page import, template insertion with undo/redo, reference creation plus Enter, and Library page insertion. Four focused tests covering those additions and the original reference scenarios passed 201 assertions after server application was added.

An empty-target replacement followed by a separate insertion in the same transaction reproduced a further collision: replacement incorrectly consumed the new entity's UUID. The Node worker failed the assertion that the second edited block survives rebase. Replacement now uses the existing target identity, supported by the original blank-title retraction, and only new nodes consume created identities. The expanded compound insertion test passes 24 assertions for UUID-preserving/reminting and replacement/non-replacement cases.

After this correction, the operation matrix plus the online random simulation passed 212 assertions. The four existing offline/concurrent undo-redo/cut-paste/three-client simulations passed 66 assertions before the empty-target correction. Outliner operation, construction, recycling, and page namespaces passed 54 tests / 201 assertions in the Node worker. The runtime loading of the simulator itself requires the compiled test environment because it imports frontend browser globals; its matrix was executed using `static/tests.js`, while the targeted worker reproductions use the live isolated Node worker.

The compiled sync namespace subsequently passed 224 tests / 1,074 assertions. A final helper extraction for the line-count lint was checked with the same 24-assertion worker replacement test. Remaining verification includes durable request-chunk regressions and a fresh restart/recovery run against the latest implementation.
