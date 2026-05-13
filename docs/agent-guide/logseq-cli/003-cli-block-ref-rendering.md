# CLI Block Ref Rendering Implementation Plan

Goal: Make `list`, `search`, and `show` render user-visible `:block/title` text through one shared block-ref replacement path, including `show` property values whose effective text is stored as default string content.

Architecture: Keep the current command-specific query semantics for `list`, `search`, and `show`, but route every user-visible block-title-like string through one shared CLI helper that replaces `[[block-uuid]]` with stable labels fetched through the same lookup strategy that `show` already uses.
Architecture: Extract the existing `show` UUID replacement logic into a CLI-shared namespace, then reuse it for list and search result normalization and for show-specific tree and property rendering so there is one visible block-ref rendering behavior across commands.

Tech Stack: ClojureScript, Datascript, `db-worker-node`, Transit transport, CLI formatter code, CLI unit tests, and CLI e2e specs.

Related: Builds on `docs/agent-guide/logseq-cli/001-logseq-cli.md`.

## Problem statement

The CLI currently renders user-visible block title text through multiple independent paths.

`search block` returns raw `:block/title` values from `src/main/logseq/cli/command/search.cljs` and sends them straight to `src/main/logseq/cli/format.cljs`.

The `list` family returns raw `:block/title` values from worker helpers in `src/main/logseq/cli/common/db_worker.cljs` and also sends them to `src/main/logseq/cli/format.cljs`.

The `show` command has its own richer rendering flow in `src/main/logseq/cli/command/show.cljs`, where it extracts UUID refs from visible text, fetches entities for those UUIDs, and rewrites visible strings before printing.

Because these paths are separate, visible output can diverge.

The reported bug is one instance of that divergence, where `logseq search block -c foo` can show `foo [[UUID]]` instead of `foo [[bar]]`.

The same architectural inconsistency also risks divergence in `list` command title columns and in `show` output when block-title-like strings appear in property values.

A particularly important case is `show` rendering for a block property whose value is effectively default string content, because `property-value->string` currently returns string values directly and does not run them through the same block-ref replacement path used by `block-label` and tree node resolution.

The implementation should unify visible block-ref rendering behavior across `list`, `search`, and `show` without changing each command family's existing query, filtering, sorting, or transport semantics beyond the additional UUID label lookups needed for rendering.

## Testing Plan

Implementation should follow @Test-Driven Development.

I will add failing unit tests in `src/test/logseq/cli/command/search_test.cljs` that stub raw search results containing `[[block-uuid]]` in `:block/title`, then stub follow-up UUID lookups, and assert that `execute-search-block` returns `foo [[bar]]` instead of the raw UUID form.

I will add failing unit tests for the list command family in a suitable existing or new list-command test namespace under `src/test/logseq/cli/command/`, and those tests will verify that command execution normalizes user-visible `:block/title` values before they reach the formatter.

I will add a focused unit test for the shared UUID replacement helper namespace so direct text replacement, multiple refs in one string, and recursive replacement behavior are locked down independently of any one command.

I will add or update `show` command tests so the extracted helper remains behavior-compatible with current `show` output for node titles.

I will add a specific `show` regression test for property rendering where a property value is a plain string containing `[[block-uuid]]`, and I will assert that the rendered property line shows the resolved label rather than the raw UUID.

I will add a second `show` regression for a property map whose visible text comes from `:block/title` or string `:logseq.property/value`, because both of those cases can represent user-visible default string content and both should use the same replacement path.

I will add formatter regressions in `src/test/logseq/cli/format_test.cljs` that prove normalized list and search titles still satisfy the existing table output contract.

I will add CLI e2e coverage in `cli-e2e/spec/non_sync_cases.edn` for at least one `search block` scenario and one `list` scenario that both expose a visible `[[page-ref]]` title and verify stdout contains the label form and not the UUID form.

If there is already an appropriate CLI e2e place for `show`, I will add a case that verifies a property line with string content containing a block ref also renders the label form.

I will run `bb dev:test -v logseq.cli.command.search-test` after writing the search failing tests and expect the new assertions to fail before implementation.

I will run the targeted list and show test namespaces after adding their failing tests and expect the new assertions to fail before implementation.

I will run `bb dev:test -v logseq.cli.format-test` after adding the formatter regressions and expect the new visible-output assertions to fail before implementation if raw UUIDs are still printed.

I will run `bb -f cli-e2e/bb.edn test --skip-build` after the unit tests pass and expect the new CLI scenarios to pass with human-readable labels.

NOTE: I will write *all* tests before I add any implementation behavior.

## Current implementation snapshot

The current rendering topology is:

```text
list page|tag|property|task|node|asset
  -> src/main/logseq/cli/command/list.cljs
  -> transport/invoke :thread-api/cli-list-*
  -> src/main/logseq/cli/common/db_worker.cljs returns raw :block/title
  -> src/main/logseq/cli/format.cljs TITLE column prints it

search block|page|property|tag
  -> src/main/logseq/cli/command/search.cljs
  -> transport/invoke :thread-api/q
  -> Datascript pull returns raw :block/title
  -> src/main/logseq/cli/format.cljs TITLE column prints it

show
  -> src/main/logseq/cli/command/show.cljs
  -> collects visible UUID refs from node text
  -> transport/invoke :thread-api/pull for uuid labels
  -> replace-uuid-refs / resolve-uuid-refs-in-node
  -> tree and block labels render resolved text
```

The list formatter path is centralized in `src/main/logseq/cli/format.cljs` through `list-page-columns`, `list-tag-columns`, `list-property-columns`, `list-task-columns`, `list-node-columns`, and `list-asset-columns`.

Those columns use `:block/title` directly as their visible `TITLE` content.

The list command data comes from `src/main/logseq/cli/common/db_worker.cljs`, where helpers such as `minimal-list-item` and `minimal-node-item` return raw `:block/title` strings.

The search command data comes from `src/main/logseq/cli/command/search.cljs`, where `search-block-query` and the other search queries return raw `:block/title` strings and `normalize-items` preserves those strings for output.

The show command already contains the CLI-side block-ref replacement logic in `src/main/logseq/cli/command/show.cljs`.

The relevant `show` functions are `extract-uuid-refs`, `collect-uuid-refs`, `fetch-uuid-entities`, `replace-uuid-refs`, `resolve-uuid-refs-in-node`, and `resolve-uuid-refs-in-tree-data`.

The `show` command also has a separate property rendering path through `property-value->string`, `normalize-property-values`, `node-user-property-entries`, and `node-property-lines`.

That property rendering path currently treats plain strings as final text and therefore does not inherently share the same block-ref replacement behavior as `block-label`.

## Recommended approach

Create one CLI-shared block-ref rendering helper and make every visible `:block/title` rendering path use it.

Do not keep separate ad hoc text replacement logic in `show`, `list`, and `search`.

Do not switch `search` or `list` to unrelated worker APIs just to get rendering behavior.

The preferred shape is:

```text
visible title-like string
  -> collect UUID refs from text
  -> fetch uuid labels through shared pull strategy
  -> replace UUID refs through shared pure helper
  -> hand normalized value to list/search/show formatter logic
```

The comparison is:

| Option | Benefit | Risk | Recommendation |
| --- | --- | --- | --- |
| Extract `show` block-ref replacement helpers and reuse them everywhere visible block-title text is rendered. | One CLI source of truth for visible block-ref rendering. | Requires helper extraction plus per-command lookup integration. | Recommended. |
| Keep separate implementations in `show`, `list`, and `search`. | Lowest local edit count per file. | Guarantees long-term divergence and repeated bugs. | Reject. |
| Reuse lower-level DB/frontend title conversion helpers for some commands and `show` helpers for others. | Short-term convenience. | Still leaves multiple user-visible rendering semantics in the CLI. | Reject. |
| Switch list or search to different worker APIs just to get title rendering. | May reuse existing worker display paths. | Changes query semantics, ranking, or payload contracts. | Reject. |

## Execution steps

1. Write the failing shared-helper unit tests first.

Create or update a test namespace that locks the extracted helper behavior for direct `[[uuid]]` replacement, multiple refs in one string, and replacement stability when an entity label is missing.

2. Extract the pure block-ref text helpers from `src/main/logseq/cli/command/show.cljs`.

Move `uuid-ref-pattern`, `extract-uuid-refs`, `replace-uuid-refs-once`, and `replace-uuid-refs` into a CLI-shared namespace such as `src/main/logseq/cli/uuid_refs.cljs`.

Keep the extracted API small and obviously reusable for both top-level node titles and property values.

3. Extract or share the UUID entity lookup path that `show` already uses.

Reuse the `:thread-api/pull` lookup shape currently implemented in `fetch-uuid-entities` with selector `[:db/id :block/uuid :block/title :block/name]` on `[:block/uuid uuid]`.

Decide whether `fetch-uuid-entities` itself should move into the shared namespace or whether a small command-local wrapper should call a shared pure helper after performing the transport lookups.

4. Update `src/main/logseq/cli/command/show.cljs` to consume the shared helpers.

Keep `show` block label rendering behavior unchanged.

Update `resolve-uuid-refs-in-node` and `resolve-uuid-refs-in-tree-data` to call the shared replacement helper rather than a private local implementation.

5. Fix the `show` property rendering path.

Update `property-value->string` and any surrounding helper signatures so plain string values, `:block/title` values coming from maps, and string `:logseq.property/value` values are also passed through the shared block-ref replacement helper before formatting.

This is the special case that must not be missed, because a block property with default string content is user-visible text but is currently outside the main `block-label` replacement path.

6. Update `src/main/logseq/cli/command/search.cljs` to normalize visible titles through the shared helper.

Keep `search block` on `:thread-api/q`.

Collect UUID refs from the raw `:block/title` values returned by search results.

Fetch UUID labels through the same lookup strategy used by `show`.

Replace block refs in the visible `:block/title` values before `normalize-items` strips helper-only data.

Apply the same normalization rule to other search subcommands when they render `:block/title`, `:title`, or `:name` as user-visible title text and the underlying source can contain block refs.

7. Update `src/main/logseq/cli/command/list.cljs` to normalize visible titles through the shared helper.

Keep the existing `:thread-api/cli-list-*` worker calls and all current filtering, sorting, and pagination semantics.

After raw items are returned and before `apply-fields`, collect UUID refs from every user-visible `:block/title` field that can be printed by the list formatters.

Fetch UUID labels once per result set and rewrite the relevant title fields through the shared helper.

8. Ensure the formatter layer does not become a second rendering source of truth.

`src/main/logseq/cli/format.cljs` should keep treating provided `:block/title` values as already-rendered visible strings.

Do not add formatter-only UUID replacement logic for list or search, because that would diverge from JSON and EDN output and from the `show` command path.

9. Add and run targeted tests for `show` property rendering.

Verify a plain string property value containing `[[uuid]]` renders as `[[label]]`.

Verify a property map whose visible text comes from `:block/title` also renders through the same helper.

Verify string `:logseq.property/value` rendering also uses the same helper when that string contains block refs.

10. Add and run CLI e2e regressions.

Add a `search block` case that reproduces the original bug and verifies visible label output.

Add a `list` case that verifies a visible title containing a page ref is rendered with labels.

Add a `show` case if the current e2e coverage model can express property output cleanly, otherwise make the unit tests exhaustive for the property-value scenarios.

## Files to inspect and likely update

`/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs` is the current source of truth for CLI-side UUID replacement and the main file for the show property-value fix.

`/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/search.cljs` is the primary search implementation file that should normalize visible title output while preserving the current query path.

`/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/list.cljs` is the primary list implementation file that should normalize visible title output after worker data returns.

`/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/common/db_worker.cljs` should be inspected to confirm which list payload fields carry raw `:block/title` values today.

`/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` should be inspected to verify that all list and search `TITLE` columns are downstream consumers of already-rendered title strings.

`/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/uuid_refs.cljs` is the recommended destination for extracted shared block-ref rendering helpers.

`/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/search_test.cljs` should hold the search command regressions.

`/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` should hold the visible table regressions for list and search.

A list-command test namespace under `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/` should hold command-level list regressions if one does not already exist.

A show-command test namespace under `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/` should hold the property-value rendering regressions if one does not already exist.

`/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn` should hold the end-to-end CLI regressions.

## Acceptance criteria

All `list`, `search`, and `show` paths that render user-visible `:block/title` text use one shared block-ref replacement implementation.

`logseq search block -c foo` shows `foo [[bar]]` rather than `foo [[UUID]]` for raw stored titles that contain serialized refs.

The `list` command family does not print raw block UUID refs in visible `TITLE` output when the source title contains block refs.

The `show` command keeps its current visible node-title behavior after helper extraction.

The `show` command also resolves block refs inside property values when the visible property text is a plain string, a map `:block/title`, or a string `:logseq.property/value`.

Existing search sorting and recycle filtering semantics remain unchanged.

Existing list filtering, sorting, pagination, and worker API usage remain unchanged.

Formatter output contracts for list and search tables remain intact.

## Risks and mitigations

The main design risk is extracting helpers incompletely and leaving `show` property rendering on a different path from `show` block-label rendering.

Mitigate that risk by writing explicit property-string and property-map regressions before extracting helpers.

A second risk is accidentally creating a formatter-only solution for list and search while `show` continues to normalize earlier.

Mitigate that risk by normalizing in command execution or shared rendering helpers before data reaches `format.cljs`.

A third risk is broadening the command payload shape or changing query semantics while trying to fix a rendering problem.

Mitigate that risk by preserving `:thread-api/q` for search and `:thread-api/cli-list-*` for list and by limiting new transport work to UUID label lookups.

A fourth risk is missing secondary visible strings that conceptually represent block titles, especially `show` property values stored as default strings.

Mitigate that risk by explicitly auditing `property-value->string`, `normalize-property-values`, and `node-property-lines` and by adding direct regressions for each relevant branch.

## Rollback plan

If the change behaves incorrectly, revert the list and search normalization integrations and the show property-value updates while preserving the new tests that document the intended unified behavior.

If helper extraction causes too much churn, keep the extraction commit separate from the command integration commits so the move can be reverted cleanly without losing the behavioral tests.

Do not add fallback branches that silently print raw UUIDs for some command families and labels for others.

## Testing Details

The most important tests are behavior tests that observe final visible command output rather than helper implementation details.

The shared-helper tests should lock the block-ref replacement rules themselves.

The command tests should prove that list and search normalize visible titles before formatting and that show property rendering uses the same replacement behavior as show block labels.

The formatter tests should only verify table layout and visible rendered text after normalization.

The e2e tests should validate the reported search bug and at least one list and one show scenario that exercise the unified rendering path.

## Implementation Details

- Extract one shared CLI helper for block-ref text replacement from `show.cljs`.
- Keep `show`, `list`, and `search` on their current data-retrieval semantics.
- Reuse `show`'s UUID entity lookup strategy for list and search normalization.
- Normalize visible title text before handing it to formatter code.
- Keep `format.cljs` as a presentation layer, not as a second rendering engine.
- Audit every visible `:block/title` rendering site in list, search, and show.
- Treat `show` property values as first-class visible title-like strings when they contain block refs.
- Cover plain strings, map `:block/title`, and string `:logseq.property/value` in tests.
- Preserve existing sorting, filtering, pagination, and recycle-filter behavior.

## Question

Should the shared helper namespace own only the pure text replacement helpers, or should it also own the transport-backed UUID label lookup helper so list, search, and show all call the exact same lookup orchestration entrypoint.

The preferred answer is to share the pure replacement helpers for sure and to share the lookup orchestration as well if that can be done without forcing awkward dependencies between command namespaces.

---
