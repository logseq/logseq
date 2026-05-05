# ADR 0017: Two-Way Markdown Mirror and DB Sync

Date: 2026-05-05
Status: Proposed

## Context
ADR 0016 introduced Electron Markdown Mirror as a derived, one-way projection
from DB graph pages to files under `markdown-mirror/`.

The current implementation writes Markdown from
`frontend.worker.markdown-mirror`, schedules work from
`frontend.worker.db-listener`, ignores `markdown-mirror/**` in generic graph
path handling, and uploads local DB changes through the existing db-sync
pending-tx path.

We now want two-way editing:

1. DB edits update mirror Markdown files.
2. External edits to mirror Markdown files update the DB.
3. In sync graphs, file-origin DB updates sync through the existing db-sync
   protocol and remote DB updates rewrite the local mirror.

The design must stay fast, stable, and deterministic. It should fail with
diagnostics on ambiguous or unsafe cases instead of guessing.

## Current Code Findings
1. `frontend.worker.markdown-mirror` currently owns:
   - path planning under `markdown-mirror/pages` and
     `markdown-mirror/journals`
   - filename normalization
   - page rendering through `logseq.cli.common.file/block->content`
   - incremental tx-report page detection
   - debounced per-repo write jobs
2. `deps/common/src/logseq/common/graph.cljs` ignores
   `markdown-mirror/**`, so the normal graph file parser and generic watchers
   do not currently feed mirror files back into the graph.
3. `frontend.worker.db-listener` calls the mirror listener for DB tx reports
   and db-sync listener for local tx reports.
4. `frontend.worker.sync.apply-txs/handle-local-tx!` persists non-remote local
   txs into `client_ops`, then uploads them as `tx/batch`.
5. Remote sync txs are applied with `:rtc-tx? true`, which prevents echoing them
   back into the local pending upload queue.
6. The sync protocol already carries per-entry `:outliner-op`; no protocol
   change is required if file-origin edits are represented as normal local txs.
7. The current mirror path allocation does not persist the ADR 0016
   `.index.edn` identity map yet. It derives duplicate paths from current page
   title and UUID ordering.
8. The current mirror Markdown body intentionally contains no mirror metadata,
   which is not enough for robust two-way block identity after arbitrary
   external edits.

## Decision
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
4. A remote sync edit remains DB-first:
   - pull/apply remote txs through existing db-sync code
   - allow the mirror listener to render affected pages after the DB changes
   - suppress the filesystem watcher event caused by that mirror write
5. Do not add server protocol fields, new server storage, or a file-sync
   channel for this ADR.
6. Add a dedicated Markdown Mirror watcher/importer. Do not remove
   `markdown-mirror/**` from generic graph ignored paths.
7. Persist a per-graph mirror index under `markdown-mirror/.index.edn` before
   enabling two-way mode. The index is required state, not an optimization.
8. Two-way mode must include stable page and block identity metadata. The
   preferred format is hidden HTML comments attached to mirror blocks and page
   headers, backed by the sidecar index:
   - page marker: `<!-- logseq:page <page-uuid> -->`
   - block marker: `<!-- logseq:block <block-uuid> -->`
9. One-way mirror mode may remain metadata-free. Two-way mode writes the
   identity markers because bug-free import requires stable identity.
10. The importer must fail fast on ambiguous identity, duplicate block ids,
    unsafe paths, invalid page ids, parser errors, or unsupported file shapes.
    It must not silently choose a winner.
11. Mirror-origin property changes are ignored. The importer must not create,
    update, remove, or coerce page properties, block properties, class
    properties, or property pages from Markdown edits.
12. Destructive filesystem actions are ignored. Deleting, moving away, or
    renaming a mirror file must not delete, move, or rename a DB page.
13. Block deletion is a content edit, not a filesystem delete. A stable changed
    file may delete marked blocks that are absent from the parsed page, but only
    after the page identity is validated and the whole file parses successfully.
14. File-origin txs use dedicated tx-meta such as:
    - `:outliner-op :markdown-mirror/import-page`
    - `:markdown-mirror/source :file`
    - `:markdown-mirror/path <relative-path>`
15. File-origin txs may still schedule DB-to-Markdown mirror rendering. This is
    required when the import creates pages, journals, or blocks that need fresh
    identity markers. The resulting filesystem write must be watcher-suppressed
    by content hash/write id so it does not import itself.
16. File-origin txs must still be persisted by db-sync. Do not mark them
    `:rtc-tx?`, `:sync-download-graph?`, or `:persist-op? false`.
17. Sync rebase should see file-origin edits as canonical semantic ops when
    possible:
    - existing block content edit -> `:save-block`
    - inserted blocks -> `:insert-blocks`
    - deleted blocks -> `:delete-blocks`
    - new page or journal file -> `:create-page` plus `:insert-blocks`
18. Mirror-origin imports must not use page-wide raw `:transact`. They must
    preserve semantic intent with create/save/insert/delete ops.

## Architecture

### DB to Markdown
1. Reuse the existing `frontend.worker.markdown-mirror` scheduling path.
2. Replace current duplicate-title path derivation with the persisted index
   required by ADR 0016 before enabling imports.
3. When two-way mode is enabled, render identity markers with page and block
   UUIDs.
4. Write mirror files atomically and record:
   - relative path
   - page uuid
   - block uuid positions and content hashes
   - full file content hash
   - last writer id
   - last DB basis tx or equivalent local generation stamp
5. After a DB-origin write, register the write id/content hash in watcher
   suppression before touching the file.

### Markdown to DB
1. Watch only `markdown-mirror/pages/**.md` and
   `markdown-mirror/journals/**.md` through a dedicated watcher.
2. Ignore editor temporary files, hidden files, non-Markdown files, `.index.edn`,
   and paths outside the mirror directory.
3. Debounce file events by relative path.
4. Read the changed file after it becomes stable. A file is stable when size and
   mtime are unchanged across a short interval.
5. Parse the file through mldoc/graph-parser in DB graph Markdown mode.
6. Extract identity markers from raw Markdown before converting to DB
   operations. Do not depend on mldoc preserving HTML comments.
7. Build a page diff against the current DB page:
   - match existing blocks by marker UUID
   - create UUIDs for new blocks
   - place new blocks without changing existing block parent/order
   - delete existing marked blocks that are absent from a successfully parsed
     changed file
   - ignore moves, reorders, indent, and outdent changes
   - detect content edits from parsed block titles
   - ignore page and block property edits from parsed values
8. Apply the diff as one local transaction per file change. Preserve the user
   action boundary so sync rebase treats it atomically.
9. On success, update the mirror index. Do not rewrite the file directly from
   parsed Markdown. If the import created or deleted identities, enqueue normal
   DB-to-Markdown rendering with watcher suppression so the file receives the
   canonical marker state.
10. On failure, do not partially transact. Store diagnostics and leave the file
    unchanged for user inspection.

### Existing Files
1. Existing files are resolved by the mirror index and page marker together.
2. If the path is already mapped in the mirror index, the file must contain the
   same page marker. Missing or mismatched page markers fail the import.
3. Block markers must be unique within the file.
4. Existing block markers must point to blocks that belong to the resolved page.
5. Unmarked blocks are treated as new blocks, not as matches by content or
   position.
6. Marked blocks that are absent from the parsed file are delete candidates.
7. Delete candidates are reduced to top-level roots before creating
   `:delete-blocks`; descendants of another deleted candidate are not emitted as
   separate delete ops.

### New Block Placement
1. New block insertion must not move existing blocks.
2. If a new block appears under a marked parent, insert it as a child of that
   parent.
3. If a new block appears at page root, insert it as a root block on that page.
4. If a new block appears between two existing siblings in the parsed file, its
   order may be allocated between those siblings without changing either
   existing sibling's order.
5. If there is no safe order gap, append the new block at the end of that
   parent and record diagnostics that exact placement was not preserved.
6. New descendants below a new block keep their relative tree shape.
7. If a new block appears under an unmarked existing-looking block whose parent
   cannot be resolved, fail the import.

### New Files
1. A new file under `markdown-mirror/pages/<stem>.md` creates a normal page only
   when `<stem>` maps to a valid normalized page title and no live page already
   owns that mirror path.
2. A new file under `markdown-mirror/journals/YYYY_MM_DD.md` creates a journal
   page only when the filename is a valid journal day and no journal already
   exists for that day.
3. New files must not create property pages, built-in pages, classes, or hidden
   pages.
4. New file content is imported as page blocks. Properties are ignored.
5. A new file must not contain a page marker.
6. If the new file contains block markers that point to existing blocks, fail
   the import and record diagnostics.
7. New file creation is based on stable changed-file content. It is not inferred
   from delete or move-away events.

### Sync Graphs
1. File-origin DB txs go through `handle-local-tx!` and `client_ops` exactly
   like editor-origin txs.
2. Upload uses the existing `tx/batch` protocol with `:outliner-op
   :markdown-mirror/import-page`.
3. Remote clients receive normal DB txs. Their local mirror files are rewritten
   by DB-to-Markdown rendering.
4. No mirror files are uploaded as assets or synced as file blobs.
5. The server checksum remains a DB checksum. Mirror file hashes are local
   diagnostics only and are not part of sync convergence.

## Challenges and Solutions

### 1. Feedback Loops
Challenge: DB-to-file writes can trigger the file watcher, causing the importer
to re-transact its own output.

Solution:
- Keep a per-repo suppression table keyed by relative path, write id, and
  content hash.
- Mark DB-origin writes before the atomic rename.
- Import only when the file hash does not match the last DB-origin write.
- File-origin txs that require marker materialization enqueue DB-to-Markdown
  rendering with watcher suppression instead of being imported again.

### 2. Stable Block Identity
Challenge: Markdown lines are not DB entities. Matching by content or position
breaks on reorder, duplicates, and simultaneous edits.

Solution:
- Two-way mode writes hidden block UUID markers.
- The sidecar index stores the last known marker positions and content hashes.
- Import fails on duplicate markers, unknown page markers, or markers pointing
  to blocks outside the page.
- New unmarked blocks receive new UUIDs during import.
- New files receive a new page UUID and new block UUIDs during import.
- Marker comments are implementation metadata. They must be parsed before mldoc
  so formatter or parser behavior around HTML comments does not affect identity.

### 3. Sync Conflicts
Challenge: A local file edit and remote DB edit can modify the same page before
sync converges.

Solution:
- Convert file changes into canonical semantic ops, not a whole-page raw tx.
- Let existing db-sync rebase replay or drop the local pending tx after remote
  txs are applied.
- Treat one file save as one pending user action. If any part becomes invalid,
  drop the whole file-origin tx and record diagnostics instead of applying a
  partial page.

### 4. Path and Page Rename Semantics
Challenge: A page rename can look like a file move, and a file move can imply a
page rename. Duplicate page titles make this unsafe.

Solution:
- Page identity comes from the page UUID marker or index entry, not from the
  filename.
- Mirror-origin path changes do not rename pages.
- Mirror-origin title changes do not rename pages in this ADR.
- If a new path collides with another live page mapping, ignore the event and
  record diagnostics.
- DB-origin renames update the index, write the new file, then delete the old
  file after the new write succeeds.

### 5. Deletes
Challenge: External file deletion can mean "delete this page" or an accidental
editor operation. A missing block marker can mean the user intentionally deleted
a block, but it can also mean the external editor folded, filtered, or damaged
part of the file.

Solution:
- Ignore mirror file delete events.
- Ignore move-away events that remove a mirror file path.
- Allow block deletions only from stable changed-file content after page marker
  validation and successful full-file parse.
- Delete absent marked block subtrees as canonical `:delete-blocks` ops, using
  only top-level delete roots.
- Do not create pending destructive imports from filesystem events.
- If markers are malformed, duplicated, or point outside the page, fail the
  import before deleting anything.
- DB-origin page deletes still delete mirror files automatically.

### 6. Parser and Renderer Round-Trip
Challenge: The current renderer uses `block->content`, while file import would
use mldoc/graph-parser. These paths may not round-trip every Logseq construct.

Solution:
- Define a two-way-supported Markdown subset.
- Fail diagnostics for unsupported AST nodes that would lose DB data.
- Add golden round-trip tests for properties, headings, tasks, refs, embeds,
  code blocks, multiline blocks, and journals.
- Use one shared page serializer/parser contract for Electron and CLI.
- Do not rewrite imported files directly from parsed Markdown. Marker
  materialization and cleanup happen through the normal DB-to-Markdown renderer
  with watcher suppression.

### 7. Properties
Challenge: Mirror output renders property values as strings, but DB properties
can be typed refs, numbers, datetimes, sets, and hidden/internal properties.
Editing these values from Markdown is risky because string round-tripping can
silently corrupt typed DB state.

Solution:
- Ignore all mirror-origin property edits.
- Do not create, update, remove, or coerce DB properties from mirror Markdown.
- Preserve DB-origin property rendering on the next mirror write.
- Optionally record diagnostics when a file changed only properties and produced
  no DB tx.
- Continue excluding built-in/internal property pages from mirror page export.

### 8. Page References and Duplicate Titles
Challenge: `[[Foo]]` is ambiguous when multiple pages have the same title.

Solution:
- Preserve existing wiki-link text in Markdown.
- Resolve references through DB title rules only when unambiguous.
- If a file edit creates an ambiguous new reference, keep the literal text in
  block title but report a diagnostic that the reference was not linked.
- Do not invent UUID-based visible page links in this ADR.

### 9. File Watcher Portability
Challenge: macOS, Windows, and Linux emit different event shapes, duplicate
events, rename pairs, and temporary files.

Solution:
- Normalize events into `:changed`, `:moved`, and `:deleted` candidates.
- Debounce and verify stable file content before parsing.
- Process only stable changed-file content.
- Ignore delete and move-away candidates.
- Ignore hidden/temp patterns and non-`.md` paths.
- Add platform-node tests for atomic write suppression, rename, delete, and
  editor temp-file behavior, with delete/move-away proving no DB mutation.

### 10. Performance
Challenge: Large sync graphs can have many pages and frequent remote txs.
Parsing and writing must not block editing.

Solution:
- Parse only changed files.
- Render only affected DB pages.
- Coalesce jobs per page/path.
- Serialize writes per repo and imports per page.
- Bound concurrent file reads/parses.
- Skip writes when content hash is unchanged.
- Keep full regeneration and full re-import as explicit user/CLI actions.

### 11. Atomicity and Crash Recovery
Challenge: The DB, mirror file, and `.index.edn` can get out of sync if Logseq
or the OS crashes.

Solution:
- For DB-to-file: write file atomically, then update index atomically.
- For file-to-DB: transact DB first, update index, then enqueue suppressed
  DB-to-Markdown rendering when identity markers need to be materialized or
  removed.
- On startup, validate index entries against DB pages and file hashes.
- Rebuild missing index entries from DB; fail conflicting entries with
  diagnostics.

### 12. E2EE Graphs
Challenge: Sync graph content may be encrypted on the server, but local mirror
files are plaintext.

Solution:
- Treat two-way Markdown Mirror for E2EE graphs as an explicit opt-in with a
  warning before enabling.
- Do not upload mirror files as assets.
- File-origin txs are encrypted by existing db-sync tx encryption before upload.
- The local plaintext mirror remains a local filesystem responsibility.

### 13. Large Titles and Assets
Challenge: db-sync can offload large titles and assets have separate sync
queues. Markdown files can refer to assets or contain large blocks.

Solution:
- Let existing db-sync large-title handling process file-origin tx-data during
  upload.
- Do not copy assets into `markdown-mirror/`.
- Preserve asset links as normal Markdown references.
- Asset file changes remain out of scope for this ADR.

### 14. Diagnostics
Challenge: Repeated parse/import failures can become noisy and hard to debug.

Solution:
- Store diagnostics per repo/path in worker state and expose them from Settings
  or a CLI command.
- Log structured errors with repo, path, page UUID, block UUID where available,
  reason, and parser details.
- Do not toast on every failed watcher event.

### 15. Security and Path Safety
Challenge: External paths and Markdown content are untrusted local input.

Solution:
- All file paths must be normalized and checked to remain below the repo
  `markdown-mirror/` directory.
- Reject symlinks that escape the mirror directory.
- Never concatenate raw page titles into paths.
- Treat malformed markers as import errors.

## Non-Goals
1. Syncing Markdown files as server-side blobs.
2. Making file graphs and DB graphs share one importer in this ADR.
3. Browser or mobile two-way mirror support.
4. Automatic import of arbitrary files outside `markdown-mirror/`.
5. Perfect round-trip support for every Markdown extension on day one.
6. Mirror-origin page deletion, page rename, or property editing.

## Consequences

### Positive
- Sync graphs keep one source of truth: DB tx log plus existing db-sync.
- External Markdown edits work offline and upload when normal sync resumes.
- Remote changes converge through existing rebase/checksum machinery.
- Identity markers make imports deterministic instead of position guessing.
- Dedicated watcher/importer keeps generic graph parsing from ingesting mirror
  output accidentally.
- Ignoring property and file-delete changes reduces the risk of corrupting or
  losing DB data from external editor behavior.

### Tradeoffs
- Two-way mode needs metadata in Markdown files, unlike one-way mirror mode.
- The sidecar index becomes required operational state.
- Some Markdown edits will fail until the supported round-trip subset expands.
- External property edits, page renames, and file deletes are ignored.
- Block deletes and new page/journal creation are supported but require stricter
  identity and parser validation.
- Conflict behavior depends on quality of generated canonical outliner ops.

## Implementation Order
1. Implement and test the ADR 0016 mirror index first.
2. Add two-way identity markers behind a separate two-way setting.
3. Add dedicated mirror watcher with write suppression and stable-file reads.
4. Build parser-to-page-tree conversion for one file.
5. Build block-level diff to canonical outliner ops.
6. Wire file-origin tx-meta, watcher suppression, and post-import marker
   rendering rules.
7. Add sync-graph tests proving file-origin txs enter `client_ops` and remote
   txs rewrite mirror files without feedback loops.
8. Add diagnostics API/UI after importer failures are observable in tests.

## Verification
Focused tests should cover:

```bash
bb dev:test -v frontend.worker.markdown-mirror-test/two-way-db-write-suppresses-file-import-test
bb dev:test -v frontend.worker.markdown-mirror-test/two-way-file-edit-transacts-local-db-test
bb dev:test -v frontend.worker.markdown-mirror-test/two-way-file-edit-enters-db-sync-pending-queue-test
bb dev:test -v frontend.worker.markdown-mirror-test/two-way-remote-sync-write-updates-file-without-upload-loop-test
bb dev:test -v frontend.worker.markdown-mirror-test/two-way-inserted-block-gets-marker-through-suppressed-render-test
bb dev:test -v frontend.worker.markdown-mirror-test/two-way-importer-does-not-rewrite-parsed-file-directly-test
bb dev:test -v frontend.worker.markdown-mirror-test/two-way-duplicate-block-marker-fails-test
bb dev:test -v frontend.worker.markdown-mirror-test/two-way-ambiguous-page-path-fails-test
bb dev:test -v frontend.worker.markdown-mirror-test/two-way-property-edits-are-ignored-test
bb dev:test -v frontend.worker.markdown-mirror-test/two-way-block-move-is-ignored-test
bb dev:test -v frontend.worker.markdown-mirror-test/two-way-missing-block-marker-deletes-block-test
bb dev:test -v frontend.worker.markdown-mirror-test/two-way-new-page-file-creates-page-test
bb dev:test -v frontend.worker.markdown-mirror-test/two-way-new-journal-file-creates-journal-test
bb dev:test -v frontend.worker.markdown-mirror-test/two-way-new-file-existing-page-marker-fails-test
bb dev:test -v frontend.worker.markdown-mirror-test/two-way-file-delete-is-ignored-test
bb dev:test -v frontend.worker.markdown-mirror-test/two-way-file-move-away-is-ignored-test
bb dev:test -v frontend.worker.db-sync-test/markdown-mirror-import-page-rebases-with-remote-save-block-test
```

Additional checks:
- `markdown-mirror/**` remains ignored by generic graph parsing.
- File-origin txs are not marked `:rtc-tx?` and are uploaded by sync graphs.
- Remote sync txs rewrite mirror files but do not enqueue new local pending txs.
- Startup index validation catches missing, stale, and conflicting mappings.
- Mirror-origin property edits and file delete events produce no DB tx.
- Mirror-origin block delete and new page/journal creation txs are represented
  as canonical semantic ops.
- Mirror-origin moves, reorders, indents, and outdents produce no move tx.
