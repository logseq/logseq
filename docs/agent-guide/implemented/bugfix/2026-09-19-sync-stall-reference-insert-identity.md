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

## Extended reproduction and fixes

Compound operations exposed additional failures in the live Node worker:

- Two insertions could consume the same created UUID, losing one block and its later edit during rebase.
- Empty-target replacement could consume the UUID belonging to a subsequent insertion.
- Saving an initially blank target before inserting caused transaction-wide blank-title inference to overwrite the saved target.
- Applying a template with implicit insertion options followed by a separate insertion could truncate the template payload.

New insert and template history now captures the actual inserted blocks and effective options at the execution boundary. Batch metadata is finalized after all operations execute. New reference-page definitions are preserved in the captured payload, including when the page transaction ends with a UUID-only stub. Existing numeric reference IDs remain unchanged. Durable affected history is still reconstructed from its original transaction evidence, with created identities allocated once across insertion and template operations.

The compound template and save-before-insert cases failed six assertions before this change; afterward they passed all 37 assertions. Running them together with Library/reference creation passed 54 assertions. A template followed by permanent deletion of its target also preserves the surviving template and converges on the server.

The page deletion test now verifies the stored title datom and preserved internal reference after recycling, and checks that no raw-title datom is stored. This avoids depending on worker-only derived entity lookups, which are absent in the nbb test runtime.

## Systematic upload verification

The operation matrix forces each of the 24 core operation generators plus undo and redo to execute both directly and after a remote change: 52 scenarios and 208 assertions. Each checks raw normalized transaction application, Transit delivery through the actual server handler, checksum agreement, and queue acknowledgment. The raw transaction check prevents the server's stale-rebase handling from hiding a missing-entity exception.

Focused cases additionally cover template insertion and undo/redo, Library page creation with new references, recycling restore/permanent deletion, folding, EDN import, reference creation plus Enter, compound insertion, and target deletion. The declared collapse-expand-block-property operation has no dispatch implementation or production call site and emits no transaction; collapse-expand-blocks covers implemented folding behavior.

The request-boundary test exercises an insertion whose interleaved temporary-ID dependencies must remain atomic, and permanent deletion spanning multiple requests. It checks stable retry payloads before acknowledgment, duplicate delivery after a lost response, persisted upload progress, empty pending queues, and equal checksums.

## Results

- `pnpm cljs:test`: worker and test targets compile with zero warnings.
- `LOGSEQ_STABLE_IDENTS=1 node static/tests.js -n frontend.worker.db-sync-test`: 230 tests / 2,216 assertions, zero failures/errors.
- Operation matrix and online/offline, concurrent undo/redo, and three-client simulations: 4 tests / 268 assertions, zero failures/errors.
- Outliner operation, construction, recycling, and page namespaces in the Node worker: 55 tests / 202 assertions, zero failures/errors.
- Full standalone Outliner `pnpm test`: 124 tests / 562 assertions, zero failures/errors.
- Existing DB batch transaction regressions: 3 tests / 4 assertions, zero failures/errors.
- Root `bb lint:dev`; DB and Outliner clj-kondo, unused-code, namespace, and size checks; Outliner public-variable check; DB Datalog rules: passed.
- Fresh persistence run writes with PID 17949 and reloads with PID 21712: remote edit applied, referenced page/sibling/recycle state preserved on both sides, equal checksums, pending count 2 before recovery and 0 after acknowledgment.

## Template text-property follow-up

The dedicated template text-property test creates values through both the normal property setter and the explicit property-value-block operation. It covers plain and multiline reference text, empty-target replacement and nonempty insertion, direct upload, repeated rebase, undo/redo, and editing before or after rebase. The matrix checks both client and server state. The copy must retain its own value UUID while the original template value remains unchanged.

This reproduced 12 failing identity assertions in the live Node worker: replay pointed the copied property back to the source value block. The insert transaction already remapped DataScript Entity references through the source-ID-to-new-UUID map, but captured history did not. History now uses the same mapping before serialization. All 64 combinations pass 1,088 assertions, including actual server application, pending queue acknowledgment, and checksum comparison.

A dedicated text-property persistence run writes the template application and subsequent value edit with worker PID 21712, then reloads the graph and operation SQLite with PID 42360. Rebase and server application preserve copied-value ownership, reference, edited text, and template source text: all 14 state assertions pass, pending operations drain from 2 to 0, and checksums agree.

## Verification scope

The reproduction and recovery use the Node worker because the affected code owns graph transactions and durable sync operations. The persistence experiment stops the writer process, starts a new worker, reloads the graph snapshot and operation SQLite, applies a remote edit, sends the resulting transactions through the server handler, and acknowledges the queue.

The initial local nbb runner failure was caused by a stale extracted dependency cache that lacked validate-import-txs. Regenerating that disposable cache allowed the full standalone Outliner test runner to execute against current sources.

No production data was changed or release deployed. Production WebSockets and the reporter's full graph were not replayed: the supplied SQLite contains pending operations, not the complete graph database. The tests establish coverage for the enumerated operation families and reproduced compound failures; they do not prove the absence of errors in every possible arbitrary future operation sequence.
