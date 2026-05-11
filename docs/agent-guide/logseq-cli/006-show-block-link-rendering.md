# Show Block Link Rendering Implementation Plan

Goal: Make `logseq show` render a block with `:block/link` as the linked target block tree, and mark the linked target row with `→`.

Architecture: Keep `show` orchestration in the CLI command layer and reuse the existing `db-worker-node` transport APIs.
Architecture: Extend the current show pull selectors so the CLI can see shallow `:block/link` targets, then add a link-resolution phase that grafts the linked target tree into the show tree before UUID-ref replacement, property rendering, linked-reference rendering, and structured-output sanitization.
Architecture: Preserve existing output for trees that do not contain linked blocks, while rendering a dim human-output `→` marker immediately before the displayed title on rows that come from `:block/link`.

Tech Stack: ClojureScript, Datascript pull selectors, Logseq CLI `show`, `db-worker-node` thread APIs, Promesa, CLI unit tests, CLI formatter tests, and CLI e2e manifests.

Related: Builds on `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/logseq-cli/001-logseq-cli.md` and `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/logseq-cli/003-cli-block-ref-rendering.md`.

## Problem statement

The current `show` command renders the stored source block entity even when that entity is a linked block.

When block A has `:block/link` pointing to block B, `logseq show --id <block-a-id>` currently displays block A.

The expected behavior is to display the same tree the user would get from `logseq show --id <block-b-id>`.

The only visual difference is that the visible title for block B should be prefixed with the rightwards arrow character `→`.

The marker is U+2192 and should be rendered after the db/id and tree-position prefix, immediately before the displayed title in human output.

This behavior should also apply when the linked source block appears as a child inside a page tree or inside the linked references section.

This behavior should not require a new public CLI option.

This behavior should not require a new `db-worker-node` thread API unless implementation discovers that current `:thread-api/pull` and `:thread-api/q` calls cannot fetch the needed target tree.

## Testing Plan

Implementation should follow @Test-Driven Development.

I will add a failing execution test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/show_test.cljs` proving `show --id <block-a-id>` displays block B when block A has `:block/link` to block B.

That test will assert that the human output contains block B's title and child title, does not contain block A's source title, and renders `→` immediately before block B's title after ANSI styling is stripped.

I will add a failing execution test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/show_test.cljs` proving `show --page Home` replaces a linked child block A with the linked target block B in the page tree.

That test will assert that the target row keeps the tree position of the source row, that the target row has `→`, and that target children obey the remaining `--level` depth.

I will add a failing execution test proving linked references for a root linked source are fetched for block B rather than block A.

That test will invoke `show --id <block-a-id>` with linked references enabled and assert that `:thread-api/get-block-refs` receives block B's `:db/id`.

I will add a failing execution test proving a linked block inside the linked references section renders as the linked target block with `→`.

That test will verify the `Linked References` section does not show the source block title when the reference block is a link wrapper.

I will add a failing structured-output test proving `--output json show --id <block-a-id>` returns block B as `[:data :root]` and does not leak the human `→` marker.

That test will also assert that internal link-resolution metadata is stripped by the same structured-output sanitization path that currently removes `:block/uuid`.

I will add a failing `tree->text` formatting test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` proving linked-display markers preserve db/id alignment when a tree contains at least one linked-display node.

That test will use stripped human output and expect a linked root shape such as `42 → Target` followed by a non-linked child row without an arrow.

I will add a failing cycle test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/show_test.cljs` proving a `:block/link` cycle fails with an actionable `:block-link-cycle` error instead of recursing indefinitely.

I will add a failing missing-target test proving a broken `:block/link` fails with `:block-link-target-not-found` instead of silently rendering the source block.

I will add a CLI e2e regression in `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn` that imports a small EDN graph with block A linked to block B through `:block/link`, runs `logseq show --id <block-a-id> --output human`, and asserts stdout contains `→`, block B, and block B's child while not containing block A's source title.

I will add a second e2e assertion or adjacent case that runs `logseq show --id <block-a-id> --output json` and asserts `[:data :root :block/title]` is block B's title.

I will run `bb dev:test -v logseq.cli.command.show-test` after writing the command tests and expect the new tests to fail because the current selectors and renderer do not resolve `:block/link`.

I will run `bb dev:test -v logseq.cli.commands-test` after writing the formatter test and expect the new marker-placement assertion to fail because `tree->text` has no linked-display marker support.

I will run `bb -f cli-e2e/bb.edn test --skip-build` after adding the e2e cases and expect the new case to fail before the implementation is wired into the built CLI.

After implementation, I will rerun `bb dev:test -v logseq.cli.command.show-test` and expect all show command tests to pass.

After implementation, I will rerun `bb dev:test -v logseq.cli.commands-test` and expect all formatter-facing command tests to pass.

After implementation, I will rerun `bb -f cli-e2e/bb.edn test --skip-build` and expect the linked-block show e2e cases to pass.

NOTE: I will write *all* tests before I add any implementation behavior.

## Current implementation snapshot

The current `show` command lives in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs`.

The current CLI flow is:

```text
show action
  -> execute-show
  -> build-tree-data
  -> fetch-tree
  -> fetch-linked-references when enabled
  -> collect-uuid-refs
  -> uuid-refs/fetch-uuid-entities
  -> resolve-uuid-refs-in-tree-data
  -> render-tree-text-with-properties for human output
  -> sanitize-structured-tree for JSON and EDN output
```

The current selectors are `show-root-selector`, `tree-block-selector`, and `linked-ref-selector`.

Those selectors include block identity, title, status, page, parent, and tags.

Those selectors do not include `:block/link`.

The current `fetch-tree` function pulls the requested entity, fetches blocks for the entity's page or page entity, builds children with `build-tree`, and returns the original pulled entity as `:root`.

That means a linked wrapper block A remains the root or child node that reaches `tree->text`.

The current `tree->text` renderer starts each row with the rendered db/id column and then the block label.

It has no concept of a link marker or source-to-target substitution.

The current `tree->text-with-linked-refs` groups linked-reference blocks by page and renders each group through `tree->text`.

That means linked wrapper blocks inside linked references currently render as their own source rows too.

The current `db-worker-node` implementation in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` exposes `:thread-api/pull`, `:thread-api/q`, and `:thread-api/get-block-refs`.

The current `:thread-api/pull` delegates to Datascript `d/pull` with the selector provided by the CLI and then applies `logseq.db.common.initial-data/with-parent`.

Because the CLI controls the selector, the existing worker can return a shallow linked target when the selector includes `{:block/link [...]}`.

The commented `with-block-link` helper in `/Users/rcmerci/gh-repos/logseq/deps/db/src/logseq/db/common/initial_data.cljs` shows that link expansion has existed as an idea, but it is not part of the active `with-parent` path.

The frontend renderer already treats linked blocks as display aliases.

`/Users/rcmerci/gh-repos/logseq/src/main/frontend/components/block.cljs` checks `(:block/link item)` in `block-item` and renders the linked block unless a link loop is detected.

The CLI needs an explicit equivalent because the CLI does not use that Rum rendering path.

## Desired behavior

When `show` encounters block A with `:block/link` pointing to block B, the displayed node should be block B.

The block B row should use block B's `:db/id`, title, status, tags, properties, page, and children.

The block A title should not be rendered as the displayed content.

The block A children and user properties should not be rendered as displayed content because the behavior is equivalent to showing block B.

The human output row for block B should keep block B's db/id as the first visible column.

The row label should render `→` immediately before block B's displayed title, so a linked page target looks like `<id> → PageB`.

For child rows, the marker should appear after the existing tree glyph and immediately before the displayed title.

The marker should be a dim-styled human-output presentation marker and should not be embedded into block titles.

Structured JSON and EDN output should expose the target tree data and should not include the `→` marker.

Structured JSON and EDN output should not expose source block A metadata by default because the behavior is equivalent to showing the resolved target.

If internal metadata is needed to render the marker, it should be stripped before structured output.

A linked root should behave as `show blockB` for tree expansion, property lookup, UUID-ref replacement, breadcrumbs, linked references, and displayed db/id.

A linked child should be grafted into the current tree at block A's position, but the subtree under that row should come from block B and should respect the remaining `--level` depth.

A linked block in the `Linked References` section should render as the linked target and should show `→` before the linked target title.

If block B itself links to block C, the resolver should follow the chain to final target C and render C as the displayed row.

If the chain cycles, the command should fail fast with an actionable error instead of silently rendering the wrong block or recursing indefinitely.

If the linked target cannot be pulled, the command should fail fast with an actionable error.

A `show --uuid <block-a-uuid>` call should behave the same as `show --id <block-a-id>` when block A links to another entity.

A multi-id `show --id '[A B]'` call should reuse the existing duplicate suppression behavior after link resolution, so a source block and its resolved target are shown once.

A linked source block's own linked references should be ignored after resolution because linked references should be fetched for the resolved target.

## Recommended approach

Keep the link behavior in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs`.

Do not create a new CLI command or flag.

Do not add a new `db-worker-node` thread API for this feature unless existing APIs prove insufficient during implementation.

Use the current worker transport shape:

```text
:thread-api/pull
  -> fetch root and linked target entities with selectors chosen by show.cljs

:thread-api/q
  -> fetch page blocks through the existing fetch-blocks-for-page query path

:thread-api/get-block-refs
  -> fetch linked references for the resolved root target
```

Refactor the show selectors so shallow link targets are visible without creating recursive selector definitions.

A practical shape is:

```text
show-node-base-selector
  -> identity, title, status, page, tags, parent fields

show-node-with-link-selector
  -> show-node-base-selector plus {:block/link show-node-base-selector}
```

Use the selector with `:block/link` for root pulls, tree block pulls, and linked-reference pulls.

Keep the linked target selector shallow.

Do not try to fetch an entire target tree through one recursive Datascript pull selector.

Use the existing `fetch-blocks-for-page` plus `build-tree` path to build target children so depth behavior stays aligned with ordinary `show`.

Add a link-resolution phase before UUID-ref collection and before property-title collection.

The proposed data flow is:

```text
fetch-tree for requested target
  -> resolve-linked-blocks-in-tree for main tree
  -> fetch-linked-references for resolved root id when enabled
  -> resolve-linked-blocks-in-linked-references
  -> collect UUID refs from resolved visible nodes
  -> fetch UUID labels
  -> attach property titles and property value labels
  -> render human output or sanitize structured output
```

The key ordering requirement is that a linked root must be resolved before `fetch-linked-references` chooses the root id.

That preserves the expected `show blockB` semantics for linked references.

Store link marker state on the resolved target node with an internal keyword such as `:show/linked-display?`.

Store source metadata only if needed for debugging or tests, using internal keys such as `:show/link-source-id` and `:show/link-source-uuid`.

Strip all internal `:show/*` metadata from structured output.

Keep `format.cljs` unchanged.

`show` already returns human output through a pre-rendered `:message`, so the link marker belongs in `tree->text` rather than the global formatter.

## Execution steps

1. Add failing command tests for a linked root.

Update `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/show_test.cljs` so `make-show-invoke-mock` can return entities whose pulled maps include `:block/link`.

Add a test where block A has `:block/link {:db/id 20 :block/title "Target B" :block/page {:db/id 200}}` and block B has one child.

Assert human output renders `Target B`, renders the child, does not render block A's source title, and has `→` immediately before `Target B` while block B's db/id remains the first visible column.

2. Add failing command tests for linked children in page output.

Use a page root with a child block A that links to block B on another page.

Assert `show --page Home --level 3` renders the target B row in the child position and renders B's child at the next level.

Assert `show --page Home --level 2` renders the target B row but does not render B's child.

3. Add failing command tests for linked references behavior.

Add a root link case and record `:thread-api/get-block-refs` calls.

Assert the call uses block B's `:db/id` after root link resolution.

Add a linked-reference block case where the ref block returned by `:thread-api/get-block-refs` links to another target.

Assert the linked references text shows the target title with `→` immediately before it and not the wrapper title.

4. Add failing structured-output tests.

Assert JSON and EDN output for a linked root expose block B under `:root`.

Assert structured output does not include `:block/uuid` or any internal `:show/*` keys after `sanitize-structured-tree`.

Assert the human arrow is absent from structured strings.

5. Add failing `tree->text` marker-placement tests.

Update `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` or keep the test in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/show_test.cljs` if the show command test namespace now owns renderer tests.

Use a small tree with a linked-display root and one normal child.

Assert stripped output keeps the db/id as the first visible column, renders `→` immediately before the linked row title, and keeps the id column aligned for subsequent rows.

6. Add failing cycle and missing-target tests.

Add a mock where A links to B and B links back to A.

Assert `execute-show` rejects with `:block-link-cycle`.

Add a mock where A has `:block/link {:db/id 404}` but pulling target 404 returns nil or an id-only entity.

Assert `execute-show` rejects with `:block-link-target-not-found`.

7. Add e2e regressions.

Update `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn` with an EDN graph import fixture.

Use `:block/link [:block/uuid #uuid "..."]` to create the source wrapper block A.

Create target block B and at least one child under B.

Run the human `show --id` command against block A.

Assert stdout contains `→`, block B's title, and block B's child title.

Assert stdout does not contain block A's source title.

Run the JSON `show --id` command against block A.

Assert `[:data :root :block/title]` equals block B's title.

8. Refactor selectors to expose shallow link targets.

In `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs`, introduce a base selector for fields common to roots, tree nodes, linked references, and link targets.

Include `:db/id`, `:db/ident`, `:block/name`, `:block/uuid`, `:block/title`, `:logseq.property/created-from-property`, status, page, tags, and parent fields needed by existing rendering.

Build the public show selectors by adding `{:block/link base-selector}` to the appropriate selector vectors.

Keep parent selectors shallow to avoid recursive pulls and large payloads.

9. Extract target tree construction for a single entity.

Create a helper that takes a resolved target entity, the current action, and a remaining depth.

For ordinary block targets, fetch the target page's blocks through `fetch-blocks-for-page` and call `build-tree` with the target id.

For page targets, fetch page blocks using the page entity id and call `build-tree` with the page id.

Return a normal show node with `:block/children` populated exactly like `fetch-tree` would for that target.

10. Add `resolve-linked-blocks-in-node` and `resolve-linked-blocks-in-tree-data`.

Detect `:block/link` on a node.

Extract the target id from the nested link map.

Pull the full target with the same root selector if the nested link map lacks fields needed to build the tree.

Build the target tree with the remaining depth.

Mark the target root with `:show/linked-display? true` and optional source metadata.

Replace the source node with the target root.

Recurse into normal children and into target children while tracking visited link target ids.

11. Resolve the main tree before fetching linked references.

Update `build-tree-data` so it calls the link resolver immediately after `fetch-tree`.

Use the resolved root id when deciding whether to call `fetch-linked-references`.

Resolve links inside fetched linked-reference blocks before UUID-ref collection.

12. Update UUID-ref and property collection to operate on resolved trees.

Confirm `collect-uuid-refs`, `collect-user-property-keys`, and `collect-property-value-refs` see target B nodes instead of source A nodes.

Do not add special link branches to those collectors unless tests show an internal metadata leak.

13. Update `tree->text` marker rendering.

Teach the renderer to detect whether a node in the rendered tree has `:show/linked-display?`.

When no node has that marker, preserve the current output exactly.

When a node has that marker, keep the existing db/id and tree glyph prefix unchanged and add a dim-styled `→` immediately before that node's visible label.

Render no marker for non-linked rows so current id alignment remains stable.

Apply the same marker behavior to root rows, child rows, multiline continuation rows, property rows, and linked-reference grouped trees.

14. Strip internal link metadata from structured output.

Update `strip-show-internal-data` or a new helper called by `sanitize-structured-tree` so every internal `:show/*` key is removed recursively.

Keep existing recursive removal of `:block/uuid` intact.

15. Run the targeted tests in the RED phase.

Run `bb dev:test -v logseq.cli.command.show-test`.

Expected result before implementation is failing assertions for linked root, linked child, linked references, structured output, cycle handling, and missing target handling.

Run `bb dev:test -v logseq.cli.commands-test`.

Expected result before implementation is a failing marker-placement assertion.

16. Implement the minimal behavior.

Make only the changes needed for the failing tests.

Do not refactor unrelated show command behavior.

Do not change `format.cljs`.

Do not add a new worker API.

17. Run targeted tests in the GREEN phase.

Run `bb dev:test -v logseq.cli.command.show-test`.

Expected result after implementation is all tests passing.

Run `bb dev:test -v logseq.cli.commands-test`.

Expected result after implementation is all tests passing.

18. Run e2e verification.

Run `bb -f cli-e2e/bb.edn test --skip-build`.

Expected result after implementation is the linked-block show e2e cases passing together with existing non-sync cases.

19. Refactor after tests pass.

Reduce duplication in selector construction and target-tree construction.

Keep the link resolver small and testable.

Keep command parsing and output formatting unchanged.

20. Run final verification.

Run `bb dev:lint-and-test` if time permits before submitting the implementation.

Expected result is a green lint and unit test suite.

## Files to inspect and likely update

`/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs` is the main implementation file for selectors, tree fetching, link resolution, human rendering, and structured-output sanitization.

`/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/uuid_refs.cljs` should be inspected to confirm UUID-ref collection still receives resolved target strings and does not need link-specific behavior.

`/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` should be inspected to confirm no new thread API is necessary and that `:thread-api/pull` can return selector-provided `:block/link` data.

`/Users/rcmerci/gh-repos/logseq/deps/db/src/logseq/db/common/initial_data.cljs` should be inspected to understand why active worker pull enrichment does not currently expand `:block/link` automatically.

`/Users/rcmerci/gh-repos/logseq/src/main/frontend/components/block.cljs` is a useful reference for current frontend linked-block rendering semantics and loop awareness.

`/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/show_test.cljs` should hold command-level linked-block behavior tests.

`/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` may hold renderer-level marker-placement tests if those tests remain grouped with the current `tree->text` tests.

`/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn` should hold the CLI e2e regression cases.

## Acceptance criteria

`logseq show --id <block-a-id>` displays block B when block A has `:block/link` to block B.

The human output for the displayed block B row keeps block B's `:db/id` as the first visible column and renders `→` immediately before block B's title.

The displayed block B row uses block B's `:db/id`, title, status, tags, properties, and children.

The source block A title is not displayed as the linked row content.

The source block A children and user properties are not displayed as linked row content.

`logseq show --page <page>` replaces linked child wrappers with their linked target rows at the same tree positions.

Linked target children obey `--level` as part of the overall rendered tree depth.

A linked root fetches linked references for the linked target block B, not the source wrapper block A.

Linked wrapper blocks inside the `Linked References` section display their target blocks with `→` immediately before the target title.

`--output json` and `--output edn` expose the target tree rather than the source wrapper tree.

Structured output does not include the human `→` marker.

Structured output does not leak internal `:show/*` metadata.

Trees without linked blocks keep their current human output exactly.

The implementation uses existing `db-worker-node` APIs unless a concrete blocker is found.

The implementation follows link chains to the final target, such as A to B to C displaying C.

The implementation uses the resolved target for breadcrumbs, linked references, `--uuid`, and multi-id duplicate suppression.

The implementation fails fast on missing linked targets and cycles.

## Edge cases

A root block may link to another ordinary block.

A root block may link to a page entity.

A page child may link to a block on another page.

A linked-reference block may itself be a linked wrapper.

A linked target may have user properties that need property-title and property-value label resolution.

A linked target title may contain serialized `[[uuid]]` block refs that must still render through the shared UUID-ref helper.

A linked source may have its own title, children, properties, or tags, but those should not be displayed because the target is the displayed block.

A link chain may point from A to B to C, and the visible target should be C.

A link chain may cycle.

A `:block/link` target may be missing because of corrupt graph data or an incomplete import.

A multi-id show call may include both block A and its target block B, and the resolved target should be displayed once through the existing duplicate suppression rules.

A linked target may be inside another selected tree, which should continue to interact with the existing multi-id duplicate suppression rules.

A tree may contain both linked and non-linked rows, and the db/id column should remain stable because the marker is part of the visible label rather than a leading column.

A tree may contain no linked rows, which should preserve current output byte-for-byte after ANSI stripping.

## Risks and mitigations

The main risk is resolving the root link after linked references are fetched.

Mitigate that risk by resolving the main tree before reading the root id for `fetch-linked-references` and by testing the exact worker call id.

A second risk is fetching only the linked target entity and not its children.

Mitigate that risk by reusing the existing `fetch-blocks-for-page` and `build-tree` path for linked targets.

A third risk is accidentally rendering source block A properties or children together with target block B.

Mitigate that risk with tests that put unique source-only text on block A and assert it is absent.

A fourth risk is introducing a recursive selector or unbounded link expansion.

Mitigate that risk by keeping `:block/link` pulls shallow and doing recursive expansion in explicit CLI code with a visited set.

A fifth risk is changing the human output for all `show` calls.

Mitigate that risk by adding the label marker only when a node has `:show/linked-display?`.

A sixth risk is leaking internal marker metadata into JSON or EDN output.

Mitigate that risk by extending structured-output sanitization and adding structured-output regressions.

A seventh risk is doing the work in `format.cljs`, which would split show rendering behavior across two layers.

Mitigate that risk by keeping the marker in `tree->text`, where the show tree is already rendered.

## Rollback plan

Keep selector refactoring, link resolution, renderer marker support, and e2e fixtures in separate commits if possible.

If link resolution causes incorrect behavior, revert the resolver integration while keeping the failing tests as documentation of the desired behavior.

If marker rendering causes too much output churn, keep link resolution and temporarily disable the marker while the exact label-prefix behavior is fixed.

Do not add fallback behavior that silently renders source block A when target block B cannot be loaded.

Do not add compatibility aliases or a new option to opt into the old behavior.

## Testing Details

The command tests should exercise observable `show` behavior through `execute-show`, not only pure helper return values.

The linked-root and linked-child tests should verify that rendered output is equivalent to showing block B and that source-only block A content disappears.

The linked-reference test should verify the root-id choice for linked references and the final visible `Linked References` section behavior.

The structured-output tests should verify machine-readable output observes target tree semantics without inheriting human presentation markers.

The marker-placement test should verify the exact human placement after the db/id and tree glyph prefix because that is the new user-visible formatting contract.

The e2e tests should use a real imported graph with `:block/link` so the regression covers the CLI-to-db-worker-node integration boundary.

## Implementation Details

- Extend show selectors with shallow `:block/link` target pulls.
- Reuse `:thread-api/pull`, `:thread-api/q`, and `:thread-api/get-block-refs`.
- Resolve the main tree before linked-reference fetching.
- Reuse `fetch-blocks-for-page` and `build-tree` for linked target subtrees.
- Mark displayed linked targets with internal `:show/linked-display?` metadata.
- Render dim-styled `→` immediately before the visible title only for linked-display rows.
- Strip all internal `:show/*` metadata before JSON and EDN output.
- Track visited target ids to prevent link cycles.
- Fail fast on missing linked targets and link cycles.
- Keep `format.cljs` and public CLI parsing unchanged.

## Question

No open behavioral questions remain for this plan.

The marker placement is resolved as db/id first, then any tree glyph prefix, then dim `→`, then the visible target title.

Structured JSON and EDN should not include source-link metadata by default because the behavior is equivalent to `show` on the resolved final target.

---
