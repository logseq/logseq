# ADR 0017: Two-Way Markdown Mirror and DB Sync

Date: 2026-05-06
Status: Proposed

## Context
ADR 0016 introduced Electron Markdown Mirror as a derived Markdown projection
from DB graph pages to files under `mirror/markdown/`.

Some users need only a local mirror for external tools, indexing, backup, or
AI/editor inspection. Others also want edits made in those Markdown files to
update the Logseq DB. These are different needs and must not share one implicit
activation path.

Two-way Markdown sync is useful, but it is riskier than one-way mirroring:

- It converts external file saves into local DB transactions.
- Those transactions can interact with Logseq Sync rebase and conflict handling.
- File watching, stable-file reads, parsing, diffing, and import work can slow
  large graphs.
- Multi-user collaborated graphs add concurrent edits from other people, making
  local file-origin writes unsafe as an uncoordinated write path.

## Decision
1. Keep Markdown Mirror enabled by `:feature/markdown-mirror?`.
2. Add a separate two-way setting, `:feature/markdown-mirror-two-way?`.
3. Two-way mode is disabled by default.
4. Enabling Markdown Mirror alone regenerates mirror files but does not start
   the file import watcher.
5. Enabling two-way mode starts the dedicated Markdown Mirror watcher/importer
   and regenerates the mirror so sidecar state is current.
6. Enabling two-way mode must show a warning that imported file edits can
   conflict with Logseq Sync and can slow large graphs.
7. Two-way mode must not be enabled for multi-user collaborated graphs.
8. Disabling Markdown Mirror also disables two-way mode and stops the file
   import watcher.
9. Keep `mirror/markdown/**` ignored by generic graph parsing and generic file
   watchers. Only the dedicated two-way watcher may import mirror files.

## Import Contract
1. Keep the DB as the authoritative sync data model.
2. Treat Markdown files as a local editing surface, not as a second sync
   protocol.
3. A local file edit becomes a normal local DB transaction:
   - parse the changed mirror file
   - diff it against the current DB page snapshot
   - ignore property edits from the mirror
   - ignore destructive file events such as delete and move-away
   - allow new page or journal creation from new mirror files
   - transact canonical outliner ops with tx-meta marking the source as
     Markdown Mirror
   - let existing db-sync persist and upload the tx
4. Remote sync edits remain DB-first:
   - pull/apply remote txs through existing db-sync code
   - allow mirror rendering to rewrite affected local mirror files
   - suppress the watcher event caused by Logseq's own mirror write
5. Do not upload mirror files as assets or sync them as file blobs.
6. Do not add server protocol fields, new server storage, or a file-sync channel.

## Safety Rules
1. The importer must fail fast on ambiguous sidecar matching, unsafe paths,
   invalid page ids, parser errors, or unsupported file shapes.
2. Mirror-origin property changes are ignored. The importer must not create,
   update, remove, or coerce page properties, block properties, class
   properties, or property pages from Markdown edits.
3. Destructive filesystem actions are ignored. Deleting, moving away, or
   renaming a mirror file must not delete, move, or rename a DB page.
4. Block deletion is a content edit, not a filesystem delete. A stable changed
   file may delete blocks that are absent from the parsed page only after page
   identity validation and successful full-file parsing.
5. File-origin txs must still be persisted by db-sync. Do not mark them
   `:rtc-tx?`, `:sync-download-graph?`, or `:persist-op? false`.
6. Mirror-origin imports must preserve semantic intent with create/save/insert/
   delete ops instead of page-wide raw `:transact`.

## Consequences

### Positive
- Users who only need a mirror avoid watcher/importer cost.
- Users who explicitly opt in can edit supported Markdown and sync those edits
  through the existing DB sync path.
- The warning makes the Sync and performance tradeoffs visible before enabling.
- Multi-user collaborated graphs avoid uncoordinated local file-origin writes.

### Tradeoffs
- Two-way mode needs separate UI, config, worker activation, and tests.
- Sync conflict behavior depends on the quality of generated canonical
  outliner ops.
- Some Markdown edits will fail until the supported round-trip subset expands.
- External property edits, page renames, and file deletes remain ignored.

## Verification
Focused tests should cover:

```bash
bb dev:test -v frontend.worker.db-core-test/markdown-mirror-enable-does-not-start-two-way-file-import-watcher-test
bb dev:test -v frontend.worker.db-core-test/markdown-mirror-two-way-enable-starts-file-import-watcher-test
bb dev:test -v frontend.worker.db-core-test/markdown-mirror-two-way-enable-rejects-collaborated-graph-test
bb dev:test -v frontend.worker.markdown-mirror-test/two-way-file-edit-transacts-local-db-test
bb dev:test -v frontend.worker.markdown-mirror-test/two-way-file-delete-is-ignored-test
```

Additional checks:
- `mirror/markdown/**` remains ignored by generic graph parsing.
- Enabling Markdown Mirror regenerates files but does not start a file import
  watcher.
- Enabling two-way mode starts the watcher only after explicit opt-in.
- Remote sync txs rewrite mirror files but do not enqueue new local pending txs.
