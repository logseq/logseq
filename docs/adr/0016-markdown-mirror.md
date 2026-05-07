# ADR 0016: Electron Markdown Mirror

Date: 2026-05-05
Status: Accepted

## Context
Logseq DB graphs do not expose one editable Markdown file per page in the graph
directory. Some desktop workflows still need a Markdown representation that can
be read by external tools, backed up, indexed, or inspected outside Logseq.

The mirror must not become another graph source of truth. Editing should remain
fast, and saving a block must not wait for Markdown rendering or filesystem
writes on the renderer main thread.

The first supported runtime is the Electron desktop app. Browser and mobile
builds do not have the same graph-directory filesystem guarantees.

## Decision
1. Add an Electron-only Settings toggle for Markdown Mirror.
2. Persist the toggle in Electron user settings as
   `:feature/markdown-mirror?`.
3. When the setting is enabled for the Electron app, Logseq writes derived
   Markdown files under the current graph directory:
   - journals:
     `mirror/markdown/journals/<journal-file-name>.md`
   - other pages:
     `mirror/markdown/pages/<page-file-name>.md`
4. For a graph at `~/logseq/graphs/graph-xxx`, mirror files are written under:
   - `~/logseq/graphs/graph-xxx/mirror/markdown/journals/`
   - `~/logseq/graphs/graph-xxx/mirror/markdown/pages/`
5. Markdown Mirror is derived output. The DB remains the source of truth.
6. Files under `mirror/markdown/**` must be ignored by graph import, file
   watchers, and graph parsing so the mirror never feeds back into the graph.
7. The feature is not available in browser or mobile builds, even if a stale
   setting value exists.
8. Settings exposes an explicit "Regenerate full mirror" action that asks the
   DB worker to rewrite the complete mirror for the current graph.
9. Built-in pages and property pages, including user-created properties, are not
   exported to the mirror. User Tag/Class pages are normal user content and are
   exported.

## Runtime Ownership
1. The renderer owns only:
   - the Settings row
   - reading and updating `:feature/markdown-mirror?`
   - pushing the enabled state to the DB worker when it changes
2. The DB worker owns:
   - detecting affected page ids from successful local transactions
   - rendering page Markdown from the worker DB snapshot
   - scheduling and coalescing mirror jobs
   - running explicit full-mirror regeneration jobs
   - invoking platform filesystem writes
3. The Electron main process must not render Markdown. It may provide filesystem
   primitives if needed, but content generation stays with the worker.
4. Editor save paths enqueue mirror work and return immediately. They must not
   wait for rendering, directory creation, stat, write, rename, or delete.

## Reusable Core and CLI Path
1. Markdown Mirror path planning, filename normalization, page rendering, write
   deduplication, atomic writes, rename cleanup, and delete cleanup live in a
   worker/core namespace that does not depend on Electron UI state.
2. The Electron app only owns feature activation through Settings.
3. The CLI should be able to reuse the same core by passing an explicit graph,
   DB snapshot, and node filesystem platform context.
4. Future CLI support should not introduce a second Markdown serializer or a
   different filename normalization policy.
5. Future CLI support should reuse the same mirror-path allocation index so the
   Electron app and CLI do not produce different file names for the same graph.

## Output Layout and Naming
1. Journal pages are written below `mirror/markdown/journals/`.
2. Non-journal pages are written below `mirror/markdown/pages/`.
3. Journal file names use the existing Logseq journal file-name rules for the
   graph configuration.
4. Non-journal page file names use the normalized page title:
   `<page-file-name>.md`.
5. Page file names must stay friendly to external Markdown tools such as Emacs,
   VS Code, and Obsidian. Do not include page uuid in normal mirror file names.
6. Page title is not page identity. The page uuid is still the internal mirror
   identity, but it is stored in the mirror index rather than exposed in the
   file name.
7. Duplicate non-journal page titles are handled by stable title suffix
   allocation:
   - first allocated page: `pages/Foo.md`
   - second allocated page: `pages/Foo (2).md`
   - third allocated page: `pages/Foo (3).md`
8. Once a page uuid is assigned a mirror path, keep that path stable until the
   page is renamed or deleted. Do not renumber existing duplicate-title mirror
   paths when another duplicate is created or removed.
9. The implementation keeps a per-graph mirror index under
   `mirror/markdown/.index.edn`.
10. The mirror index stores at least:
   - page uuid -> relative mirror path
   - relative mirror path -> page uuid
   - page uuid -> last known normalized title stem
11. The mirror index is implementation metadata for path stability. It is not
   graph content and must be ignored by graph import and watchers along with the
   rest of `mirror/markdown/**`.
12. All mirror file names pass through a single cross-platform filename
   normalizer before joining paths.
13. Duplicate journal-day entities indicate invalid graph state for the mirror.
   The implementation must fail those journal mirror jobs and surface a
   diagnostic instead of choosing a winner.
14. If two entities still map to the same mirror path, the implementation must
   fail the mirror job for that path and surface a diagnostic instead of
   overwriting an unrelated page.
15. Page rename moves the mirror by writing the new path, updating the mirror
   index, and deleting the old path after the new file has been written.
16. Page deletion deletes the corresponding mirror file and removes the page uuid
   from the mirror index.
17. The write guard must reject any computed path outside the graph's
   `mirror/markdown/` directory.
18. Built-in pages and property pages are excluded from path allocation and
   mirror writes. User Tag/Class pages are not excluded by this rule. If a
   previously mirrored page becomes excluded, the old mirror file is removed.

## Duplicate Page Title Allocation
1. For non-journal pages, compute the normalized title stem first.
2. If the page uuid already exists in the mirror index and the normalized title
   stem did not change, reuse the indexed path.
3. If the page uuid is new for that title, allocate the first unused path in this
   sequence:
   - `pages/<stem>.md`
   - `pages/<stem> (2).md`
   - `pages/<stem> (3).md`
4. A path is considered unavailable when the mirror index maps it to a different
   live page uuid.
5. Deleted page paths become available for future allocation only after the
   deleted page uuid is removed from the index.
6. Rename is treated as a new allocation for the new title stem. Existing pages
   with the old title keep their already allocated paths.
7. If the mirror index is missing or unreadable, rebuild it from the current DB
   in deterministic page order before writing. Deterministic order should use a
   stable key such as page title plus page uuid.
8. The rebuilt index is allowed to choose paths for pages that had no previous
   allocation. It must not overwrite a live existing path that is already mapped
   to another page uuid.

## Rename and Delete
1. Page rename moves the mirror by writing the new path and deleting the old
   path after the new file has been written.
2. Page deletion deletes the corresponding mirror file.
3. The implementation keeps a small per-graph mirror index keyed by page uuid so
   rename and delete handling does not require scanning the mirror directory on
   every transaction.

## Filename Normalization
1. Mirror file names must be portable across macOS, Windows, and Linux.
2. Use one shared normalizer for journal and page mirror file names.
3. The normalizer must:
   - reject or replace path separators (`/`, `\`)
   - reject or replace Windows-invalid characters (`<`, `>`, `:`, `"`, `|`,
     `?`, `*`) and ASCII control characters
   - reject or rewrite reserved Windows device names such as `CON`, `PRN`,
     `AUX`, `NUL`, `COM1` through `COM9`, and `LPT1` through `LPT9`
   - trim trailing spaces and dots because Windows does not preserve them
   - reject empty names after normalization
   - bound each file-name component to a safe byte length before appending
     `.md`
4. Normalize Unicode to one canonical form before sanitizing so the same page
   title produces the same mirror path across filesystems with different Unicode
   normalization behavior.
5. The normalizer must be deterministic and must not depend on the current
   operating system. A graph mirrored on macOS should choose the same logical
   file name as the same graph mirrored on Windows.
6. If normalization changes the display title segment, the mirror index and
   duplicate-title suffix allocation still preserve identity for non-journal
   pages.
7. If a journal title normalizes to an unsafe or colliding file name, fail the
   journal mirror job and surface diagnostics instead of inventing a fallback
   name.
8. Path construction must join only validated path components. It must never
   concatenate unchecked page titles into filesystem paths.

## Scheduling and Performance
1. Mirror rendering is incremental. A transaction schedules only pages affected
   by that transaction.
2. Jobs are coalesced by page uuid. If a page is edited repeatedly before its
   job runs, only the latest worker DB state is rendered.
3. Scheduling uses a short debounce window per graph to reduce write churn while
   preserving near-real-time output.
4. Mirror writes are serialized per graph to avoid path races during rename and
   delete.
5. Before writing, compare the generated Markdown with the current file content
   or with the last written content hash. Skip the write when content is
   unchanged.
6. Write files atomically:
   - ensure the target directory exists
   - write to a temporary file in the same directory
   - rename the temporary file over the target
7. Heavy work is forbidden on the renderer main thread:
   - no full-graph export
   - no Markdown rendering
   - no filesystem reads or writes
   - no synchronous IPC waiting for mirror completion
8. Full regeneration is an explicit Settings action. The renderer only sends a
   worker request; page selection, rendering, and filesystem writes stay in the
   DB worker.
9. Enabling the setting starts incremental mirroring for subsequent page edits.
   It does not implicitly run full regeneration.

## Markdown Content
1. Reuse the existing page-to-Markdown export pipeline used by worker export
   APIs instead of introducing a separate renderer-side serializer.
2. The mirror output should match normal Markdown export semantics for page
   content.
3. Mirror files do not include Logseq-internal mirror metadata in the Markdown
   body.
4. Mirror files include block and page property drawers, including user
   properties, with rendered property values.
5. Assets are referenced as normal exported Markdown references. This ADR does
   not copy assets into `mirror/markdown/`.
6. Page references remain in Logseq wiki-link form, for example `[[Foo]]`.
7. Ambiguous page references caused by duplicate page titles are an accepted
   limitation of Markdown Mirror. Do not rewrite page references to uuid-based
   links or relative Markdown links in this ADR.

## Failure Handling
1. Filesystem and path errors fail the mirror job for the affected page.
2. Failures are logged with graph, page uuid, target path, and error details.
3. Repeated failures should be visible from Settings or diagnostics; do not show
   a toast on every keystroke.
4. The feature must not silently fall back to browser storage, OPFS, or another
   output directory.
5. If the graph directory is not available, the worker rejects mirror jobs for
   that graph until the graph is reopened with a valid directory.

## Non-goals
1. Markdown Mirror is not bidirectional sync.
2. Editing files in `mirror/markdown/` does not update the graph.
3. The mirror is not a backup format with guaranteed import fidelity.
4. The mirror does not replace existing graph export features.
5. The mirror does not support browser or mobile runtimes in this ADR.

## Consequences

### Positive
- Desktop users get a readable Markdown projection inside the graph directory.
- Editor latency is protected because rendering and disk I/O are worker-owned
  and asynchronous.
- The output layout is predictable for tools that watch journals and pages
  separately.
- Page file names remain readable and practical in external Markdown tools.
- Ignoring `mirror/markdown/**` prevents mirror-generated files from becoming
  graph input.

### Tradeoffs
- The mirror can lag slightly behind the latest edit because writes are
  debounced and serialized.
- A per-graph mirror index is needed for reliable rename and delete cleanup.
- Duplicate page references such as `[[Foo]]` remain ambiguous in mirror output.
- The first version does not backfill every existing page automatically when the
  setting is enabled; users run full regeneration explicitly.
- External edits to mirror files are overwritten by later Logseq edits.
- Property pages are intentionally absent from the mirror, so the output is not
  a complete DB export even though page and block property drawers are included.

## Verification
Implementation should add focused coverage for:

```bash
bb dev:test -v frontend.worker.markdown-mirror-test/enabled-electron-edit-writes-page-mirror-test
bb dev:test -v frontend.worker.markdown-mirror-test/enabled-electron-edit-writes-journal-mirror-test
bb dev:test -v frontend.worker.markdown-mirror-test/disabled-setting-does-not-write-mirror-test
bb dev:test -v frontend.worker.markdown-mirror-test/repeated-edits-coalesce-to-latest-content-test
bb dev:test -v frontend.worker.markdown-mirror-test/rename-removes-old-mirror-path-test
bb dev:test -v frontend.worker.markdown-mirror-test/delete-removes-mirror-file-test
bb dev:test -v frontend.worker.markdown-mirror-test/same-title-pages-write-distinct-stable-friendly-paths-test
bb dev:test -v frontend.worker.markdown-mirror-test/page-references-remain-wiki-links-test
bb dev:test -v frontend.worker.markdown-mirror-test/page-mirror-exports-property-values-test
bb dev:test -v frontend.worker.markdown-mirror-test/page-mirror-exports-page-property-values-test
bb dev:test -v frontend.worker.markdown-mirror-test/full-regeneration-writes-existing-non-built-in-non-property-pages-test
bb dev:test -v frontend.worker.markdown-mirror-test/invalid-filename-characters-are-normalized-test
bb dev:test -v frontend.worker.markdown-mirror-test/windows-reserved-filename-fails-with-diagnostic-test
bb dev:test -v frontend.worker.markdown-mirror-test/mirror-path-collision-fails-without-overwrite-test
```

Additional checks:
- `mirror/markdown/**` is excluded from graph parsing and file watchers.
- Editor save does not await mirror completion.
- Browser and mobile builds do not expose the setting and do not schedule mirror
  jobs.
- Atomic write failures do not leave partial target files.
