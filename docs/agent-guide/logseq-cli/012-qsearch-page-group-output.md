# Qsearch Page Group Output Implementation Plan

Goal: Change `logseq qsearch` human output from a list-style table into page-grouped, show-like search output while keeping the existing QMD and db-worker-node data flow.

Architecture: Keep QMD execution in the CLI process and continue using the existing `qmd query --json` integration from `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/qmd.cljs`.
Architecture: Keep db-worker-node access on existing `:thread-api/pull` and `:thread-api/q` style calls, and do not add a new thread API unless implementation proves a concrete existing API cannot fetch required data.
Architecture: Extract or reuse the pure human tree renderer behind `logseq show` so qsearch can render grouped hits in the same visual family without copying renderer behavior into a separate ad hoc formatter.

Tech Stack: ClojureScript, Logseq CLI, QMD JSON output, db-worker-node transport, Datascript pull selectors, Promesa, `string-width`, CLI formatter tests, command tests, and `cli-e2e` non-sync cases.

Related: Builds on `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/logseq-cli/011-qmd-search.md`, `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/logseq-cli/003-cli-block-ref-rendering.md`, and the current `show` renderer in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs`.

## Problem statement

The current `logseq qsearch` implementation returns matched Logseq blocks in a generic list table.

That table is useful for compact inspection, but it loses the page-first shape that users expect from QMD query output and from Logseq content review.

The current human output columns are defined by `qsearch-columns` in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs`.

The formatter then calls `format-list-dynamic`, which produces a table with `RANK`, `ID`, `TITLE`, `PAGE-ID`, `PAGE-TITLE`, `SCORE`, `FILE`, and a final `Count: N` line.

The requested output should stop using the list formatter for human qsearch output.

The requested output should group extracted block ids by page.

Each page group should render the matched blocks with a tree-like layout similar to `logseq show`.

The implementation should preserve the existing QMD search path and should avoid new db-worker-node APIs unless there is no viable way to fetch the necessary data through existing `pull` or `q` calls.

## Current implementation snapshot

The QMD command implementation lives in:

```text
/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/qmd.cljs
```

`execute-qsearch` currently performs this flow:

```text
ensure db-worker-node server
  -> run qmd query <query> --json -c <collection>
  -> parse noisy QMD JSON stdout
  -> extract block ids from Markdown Mirror comments
  -> deduplicate ids in QMD result order
  -> pull each block through :thread-api/pull
  -> normalize flat items
  -> return {:items ..., :missing-ids ..., :qmd ...}
```

The current selector is:

```clojure
[:db/id :block/title :block/uuid
 {:block/page [:db/id :block/title :block/name :block/uuid]}]
```

The current formatter lives in:

```text
/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs
```

The current human `:qsearch` formatter uses:

```text
format-qsearch
  -> format-list-dynamic
  -> qsearch-columns
```

The existing show renderer lives in:

```text
/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs
```

`tree->text` already renders a root node plus child rows with ids, tree glyphs, multi-line text handling, block reference label replacement, tags, status text, and property lines when the required data is present.

Most of the `show` namespace is data fetching and show-specific behavior.

Only the pure rendering layer should be reused by qsearch.

## Desired behavior

`logseq qsearch <query> [--graph <graph>]` should render human output grouped by page instead of a table.

The first page group should be the page that contains the first extracted hit in QMD rank order.

Subsequent page groups should follow the first-hit order from QMD results.

Within each page group, matched blocks should follow the extracted id order from QMD results after deduplication.

Each group should show the page as the root row and the matched blocks as direct child rows.

The group should not fetch or render unrelated siblings, descendants, linked references, or page content blocks that did not match the QMD result.

Matched block rows should use the same visible block rendering details as `show`, including tags, status, visible user properties, and displayable built-in properties.

After the final human text is rendered, qsearch should highlight query terms case-insensitively when colors are enabled.

An example human output shape should be:

```text
1 Home
3 ├── alpha target
4 └── beta target

10 Projects
11 └── release target

Missing ids: 5
```

Blank lines between page-root trees provide the page boundary. Do not add a separate `page-title (N matches)` heading line.

The page root row should use the page entity id when available.

The page label should use `:block/title`, then `:block/name`, then `:block/uuid`, then `:db/id`.

The matched block rows should use `:block/title` with the same visible block reference replacement behavior that the current qsearch normalization path already depends on through shared CLI helpers.

QMD score and file path are useful metadata but should not dominate the primary human output.

If the implementation keeps score and file metadata in human output, render it as a compact dim metadata line per page group or per hit rather than as table columns.

If the implementation cannot make metadata readable without noise, keep score and file metadata in structured output only.

## Output contract

The primary behavioral change is human `qsearch` output.

JSON and EDN output should remain machine-friendly.

Prefer preserving the existing structured `data.items`, `data.missing-ids`, and `data.qmd` shape unless a grouped structured payload is explicitly needed.

If grouped structured data is added, add it under a new key such as `data.groups` and keep `data.items` for existing consumers.

Do not hide missing ids in human output.

Do not treat stale QMD hits as successful invisible matches.

Do not add a fallback query path that silently searches Logseq DB content when QMD output has no extractable ids.

## Data model

Normalize qsearch hits into page groups after entity lookup.

Each group should contain:

| Field | Source | Purpose |
| --- | --- | --- |
| `:page` | `:block/page` from pulled block entities | Root node for the rendered group. |
| `:items` | Pulled matched block entities | Direct child rows for the rendered group. |
| `:qmd/files` | Distinct QMD files for hits in the group | Optional metadata. |

The flat item shape can continue to include:

| Field | Purpose |
| --- | --- |
| `:db/id` | Stable block id for display and pipelines. |
| `:block/title` | Visible matched block text. |
| `:block/uuid` | Reference normalization and structured output. |
| `:block/page-id` | Existing structured page id field. |
| `:block/page-title` | Existing structured page title field. |
| `:qmd/rank` | Existing QMD result rank. |
| `:qmd/score` | Existing QMD score. |
| `:qmd/file` | Existing QMD file. |

When a pulled block has no page entity, put it in an explicit `Unpaged` or `Unknown Page` group and keep the block visible.

When multiple QMD snippets reference the same block id, keep the first occurrence and ignore later duplicates.

When one QMD snippet references multiple block ids from the same page, render all of them in extracted id order.

When one QMD snippet references multiple block ids from different pages, split them into their page groups while preserving global first-hit page order.

## Rendering architecture

Create a small pure renderer namespace if direct reuse of `show/tree->text` would create a command namespace dependency cycle.

Recommended file:

```text
/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/tree_text.cljs
```

Move the pure tree rendering helpers from `show.cljs` into this namespace.

Keep data fetching, linked references, breadcrumbs, user property fetching, and show-specific option handling in `show.cljs`.

Expose a function with a narrow signature such as:

```clojure
(tree->text {:root root
             :uuid->label uuid->label
             :property-titles property-titles
             :property-value-labels property-value-labels})
```

Update `show.cljs` to call the extracted renderer and preserve existing output byte-for-byte where practical.

Update `format.cljs` to render `:qsearch` human output with a qsearch-specific grouping function that calls the extracted renderer for each page group.

The qsearch formatter should not perform transport calls.

All data needed for qsearch human output must be available in the command result returned by `execute-qsearch`.

## Implementation plan

1. Read `@test-driven-development` and use RED-GREEN-REFACTOR for all code changes.

2. Add failing formatter coverage for page-grouped qsearch human output in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs`.

3. Assert that human qsearch output contains page root rows and show-like matched block rows.

4. Assert that human qsearch output does not contain table headers such as `RANK`, `PAGE-TITLE`, or `SCORE`.

5. Assert that human qsearch output does not contain the generic final `Count: N` line from list formatting.

6. Assert that missing ids still render as `Missing ids: ...`.

7. Add a failing formatter test for two pages where page group order follows first QMD hit order.

8. Add a failing formatter test for repeated hits where duplicate block ids render only once.

9. Add or update structured output tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs`.

10. Preserve `data.items` in JSON and EDN output unless the implementation intentionally adds `data.groups`.

11. Add failing command tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/qmd_test.cljs` if grouping data is built in `execute-qsearch`.

12. Verify command tests prove behavior, not just map shape.

13. Run the focused failing tests and confirm they fail because qsearch still uses list output.

14. Extract pure tree rendering helpers from `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs` into `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/tree_text.cljs`.

15. Keep function names and helper behavior close to the existing `show.cljs` implementation to minimize review risk.

16. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs` to require the new renderer namespace.

17. Replace local calls to the moved pure renderer helpers with calls through the new namespace.

18. Run focused show command and formatter tests to verify show output still passes.

19. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/qmd.cljs` only if the formatter needs richer grouped data than the current flat item payload can provide.

20. Prefer extending the existing `qsearch-pull-selector` over adding a new thread API.

21. Include only fields needed by the renderer and output contract.

22. Do not fetch full page block trees for qsearch.

23. Do not fetch linked references for qsearch.

24. Do not fetch user properties for qsearch unless the final renderer contract explicitly includes property lines.

25. Implement qsearch page grouping as a pure helper in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` or a small formatter-adjacent namespace.

26. Build a synthetic root page node for each page group.

27. Attach matched blocks as direct `:block/children` of that root node.

28. Sort page groups by first matched `:qmd/rank`.

29. Sort group items by first matched order inside that page.

30. Render each group with the extracted tree renderer.

31. Do not add a separate page heading above each rendered tree.

32. Append the existing missing ids footer after all groups.

33. Update `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` to describe qsearch human output as page-grouped rather than list-table output.

34. Update the qsearch CLI e2e case in `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn` so it checks for page-grouped human output in addition to the existing JSON case.

35. Keep the fake `qmd` executable approach from the existing e2e case so the test does not require real embeddings, network access, or local QMD models.

36. Run the focused tests again and confirm they pass.

37. Run broader CLI tests and non-sync e2e tests.

38. Add focused coverage for case-insensitive query-term highlighting after final human rendering.

39. Review the finished diff with `@logseq-review-workflow`.

40. Apply the common, Clojure/CLJS, promesa, babashka CLI, shadow-cljs Node, logseq-cli, and search-indexing review rules.

41. Fix every blocking or important review finding before considering the implementation complete.

## Testing Plan

I will add formatter tests that call `logseq.cli.format/format-result` with a `:qsearch` payload containing multiple pages, multiple hits per page, duplicate hits, multiline block text, and missing ids.

Those tests will verify the human output behavior by checking page group boundaries, show-like tree glyphs, block ids, visible titles, deduplication, missing id footer, and absence of the old list table columns.

I will add command tests around `execute-qsearch` only if implementation builds grouped data before formatting.

Those command tests will stub `qmd` JSON output and `transport/invoke`, then verify that pulled blocks from different pages retain QMD order and can be rendered into page groups.

I will preserve or update structured output tests so JSON and EDN output continue to expose machine-readable qsearch results.

I will add a CLI e2e case that creates two pages with qsearch target blocks, runs fake QMD, and verifies human stdout contains two page groups with show-like rows.

I will keep the existing JSON qsearch e2e case so machine output coverage remains intact.

NOTE: I will write *all* tests before I add any implementation behavior.

## Edge cases

QMD output may include warnings before or after the JSON array.

QMD output may return no JSON array.

QMD output may return snippets without Markdown Mirror block id comments.

One QMD result may contain multiple block id comments.

The same block id may appear in multiple QMD results.

An extracted block id may no longer exist in the graph.

A pulled block may have no `:block/page` data.

A page title may be missing but `:block/name` may exist.

A block title may contain multiple lines.

A block title may contain serialized UUID block references.

A page may contain CJK text or wide glyphs.

The result set may contain many hits from the same page.

The result set may contain many pages with one hit each.

The QMD rank may not be the same as page sort order.

The user may request JSON or EDN output and should not receive human tree text in structured mode.

## Verification commands

Run focused formatter tests:

```bash
bb dev:test -v logseq.cli.format-test/test-human-output-qsearch
```

Run focused command tests if `qmd.cljs` behavior changes:

```bash
bb dev:test -v logseq.cli.command.qmd-test
```

Run command parser tests if command metadata or examples change:

```bash
bb dev:test -v logseq.cli.commands-test/test-qmd-and-qsearch-parse
```

Run the full repo lint and unit test command before final review:

```bash
bb dev:lint-and-test
```

Build the CLI e2e target if needed:

```bash
bb -f cli-e2e/bb.edn build
```

Run CLI non-sync e2e tests:

```bash
bb -f cli-e2e/bb.edn test --skip-build
```

Run `@logseq-review-workflow` after implementation and before final handoff.

## Acceptance criteria

Human `logseq qsearch` output no longer uses `format-list-dynamic`.

Human `logseq qsearch` output groups matched blocks by page.

Each page group renders matched blocks with show-like id and tree layout.

Page group order follows first QMD hit order.

Block order inside a group follows first extracted QMD hit order.

Duplicate extracted block ids render once.

Missing ids remain visible in human output.

Structured JSON and EDN output remain machine-readable and covered by tests.

No new thread API is added unless the implementation notes a concrete blocker with existing `pull` or `q` APIs.

The existing `show` command output remains covered after renderer extraction.

The implementation is reviewed with `@logseq-review-workflow`.

## Testing Details

The formatter tests validate visible behavior by comparing the qsearch human output shape that users see instead of checking only intermediate data structures.

The command tests validate behavior at the QMD-to-Logseq boundary by proving extracted ids are pulled, deduplicated, and retain ordering across pages.

The e2e test validates the actual CLI path with a fake QMD binary, a real graph, db-worker-node, and command stdout.

## Implementation Details

- Keep qsearch search execution in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/qmd.cljs`.
- Keep qsearch human formatting in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` or a formatter helper namespace.
- Extract pure tree rendering from `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs` only if direct reuse would otherwise duplicate renderer logic.
- Keep db-worker-node calls on existing `:thread-api/pull` and `:thread-api/q`.
- Keep qsearch from rendering full page trees, linked references, breadcrumbs, or unrelated page content.
- Preserve `data.items` for structured output when possible.
- Use page titles from `:block/title` first and `:block/name` second.
- Preserve missing id reporting after grouped output.
- Update CLI docs after the output contract changes.
- Run `@logseq-review-workflow` after implementation.

## Question

Should qsearch human output show QMD score and file metadata at all, or should those remain structured-output-only fields.

Should qsearch render matched blocks as direct children of the page root even when the matched blocks are deeply nested, or should it show ancestor context by adding parent rows.

---
