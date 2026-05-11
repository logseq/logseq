# Markdown Mirror Block db/id Comments Implementation Plan

Goal: Add each mirrored non-code block's Datascript `:db/id` to the end of that block's first rendered Markdown line as an HTML comment such as `<!-- id: 123 -->`.

Architecture: Keep the behavior inside the existing markdown mirror renderer that already runs in the db-worker runtime.
Architecture: Reuse the current block-to-rendered-line alignment in `frontend.worker.markdown-mirror` and enrich the existing block line metadata with `:db/id`.
Architecture: Do not add a new `thread-api` unless implementation proves that the existing markdown mirror setting, flush, and regenerate APIs cannot cover this change.

Tech Stack: ClojureScript, Datascript, Promesa, existing db-worker-node HTTP invoke bridge, existing markdown mirror worker module, existing `frontend.worker.platform` storage abstraction.

Related: Builds on `docs/agent-guide/db-worker/001-db-worker-node-restart-on-version-mismatch.md`.
Related: Relates to `docs/agent-guide/db-worker/002-desktop-db-worker-request-cap-switch-graph.md`.
Related: Relates to `docs/agent-guide/db-worker/003-server-list-write-lock.md`.
Related: Relates to `docs/agent-guide/074-db-worker-node-invoke-main-thread-refactor.md`.

## Problem statement

Markdown mirror currently writes derived Markdown files under `<encoded-graph>/mirror/markdown` for DB graphs.

The generated files include a page-level `id:: <uuid>` marker at the top of each mirrored page.

The generated block lines do not expose the corresponding block entity id.

The requested markdown mirror feature is to append a comment-format block database id to every non-code block's first line.

Code blocks are excluded and must not receive generated db/id comments.

The required comment format is `<!-- id: 123 -->`.

The required placement is at the end of the first physical rendered line for each block.

For example, a block rendered as two physical lines should become:

```markdown
- block line1 <!-- id: 123 -->
  block line2 ...
```

The continuation line should not receive another id comment.

The page-level `id:: <uuid>` marker should remain unchanged because the request targets block first lines.

## Testing Plan

I will use @Test-Driven Development (TDD) before changing implementation behavior.

I will add a focused unit test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/markdown_mirror_test.cljs` that mirrors a page with two top-level blocks and asserts that each `- ...` line ends with `<!-- id: <block-db-id> -->`.

I will make that focused test fail on the current implementation because the generated block lines currently do not include db/id comments.

I will add a unit test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/markdown_mirror_test.cljs` for a multi-line block and assert that only the first rendered block line receives the id comment.

I will add a unit test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/markdown_mirror_test.cljs` for nested blocks and assert that parent and child first lines each get their own db/id comment while indentation remains unchanged.

I will add a unit test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/markdown_mirror_test.cljs` for code blocks and assert that code block fence lines do not receive db/id comments.

I will add a unit test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/markdown_mirror_test.cljs` for page and block property exports and assert that property value bullet lines are not treated as separate block first lines.

I will update existing tests in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/markdown_mirror_test.cljs` whose expected mirrored content includes block lines.

I will preserve tests that assert page-level `id:: <uuid>` markers because the page marker format is not part of this change.

I will run focused tests before implementation with a command such as `bb dev:test -v frontend.worker.markdown-mirror-test/block-db-id-comments-are-written-to-each-block-first-line-test` and confirm the new test fails for the expected missing comment.

I will run the focused markdown mirror namespace after implementation with `bb dev:test -v frontend.worker.markdown-mirror-test` if namespace-level targeting is supported by the local test runner.

I will run each newly added focused test by full test var name if namespace-level targeting is not supported.

I will run `bb dev:lint-and-test` after the focused tests pass.

NOTE: I will write *all* tests before I add any implementation behavior.

## Current implementation snapshot

| Concern | Current location | Current behavior | Change impact |
|---------|------------------|------------------|---------------|
| Markdown mirror module | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/markdown_mirror.cljs` | Owns mirror path derivation, page selection, rendering, queued tx handling, and file writes. | This is the primary implementation target. |
| Page render entry | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/markdown_mirror.cljs` | `render-page-content` calls `common-file/block->content` and then `add-page-id-to-rendered-content`. | Add non-code block id comments after the existing content render step. |
| Page marker | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/markdown_mirror.cljs` | `add-page-id-to-rendered-content` prepends `id:: <page-uuid>`. | Keep unchanged. |
| Block line alignment | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/markdown_mirror.cljs` | `rendered-block-line-infos` walks visible outline blocks in render order. | Extend each metadata map with `:db/id`. |
| Block decoration | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/markdown_mirror.cljs` | `decorate-block-line` adds status markers and tags to Markdown block lines. | Append the db/id comment after existing status and tag decoration for non-code blocks only. |
| Property value protection | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/markdown_mirror.cljs` | `property-value-line?` prevents property value lines from consuming block metadata. | Keep this behavior so property value list items do not get block comments. |
| Existing thread APIs | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` | `:thread-api/markdown-mirror-set-enabled`, `:thread-api/markdown-mirror-flush`, and `:thread-api/markdown-mirror-regenerate` already exist. | No new `thread-api` should be needed. |
| db-worker-node invoke bridge | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs` | `/v1/invoke` proxies existing `thread-api` calls into the worker core. | No protocol or endpoint change should be needed. |
| Desktop setting sync | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/persist_db.cljs` | Pushes `:feature/markdown-mirror?` to the worker through the existing set-enabled API. | No Desktop IPC change should be needed. |
| Browser worker setting sync | `/Users/rcmerci/gh-repos/logseq/src/main/frontend/persist_db/browser.cljs` | Pushes `:feature/markdown-mirror?` to the in-browser worker through the same set-enabled API. | Existing tests may need expected content updates only if they assert mirror output. |
| Tests | `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/markdown_mirror_test.cljs` | Contains fake platform storage tests for rendering, writes, deletes, regeneration, and tx handling. | Add behavior tests here. |

## Target behavior

Every rendered Logseq block first line in a markdown mirror file must end with exactly one generated db/id comment, except code blocks.

Code blocks must not receive a generated db/id comment because appending an HTML comment to the fence line can break Markdown fence semantics.

The comment format must be `<!-- id: <db-id> -->`.

The `<db-id>` value must come from the block entity's numeric Datascript `:db/id`.

The comment must be appended after the existing rendered block content, status marker, and tag decorations.

The comment must be appended to the first physical line emitted for that block only.

Continuation lines for multi-line block content must not receive id comments.

Nested block indentation must remain unchanged.

Property lines and property value lines must not consume block metadata and must not receive generated block db/id comments unless they are the first line of a real rendered block.

The top-level page marker must remain `id:: <page-uuid>`.

Mirrored files must remain derived files under `mirror/markdown`, which is already ignored by graph scanning.

The implementation must not add a new `thread-api` for this rendering-only change unless the existing APIs cannot trigger all required writes.

## Proposed rendered examples

A page with two top-level blocks should render like this.

```markdown
id:: 33333333-3333-4333-8333-333333333333

- hello <!-- id: 101 -->
- world <!-- id: 102 -->
```

A multi-line block should render like this.

```markdown
id:: 33333333-3333-4333-8333-333333333333

- block line1 <!-- id: 101 -->
  block line2
```

A nested outline should render like this.

```markdown
id:: 33333333-3333-4333-8333-333333333333

- parent <!-- id: 101 -->
  - child <!-- id: 102 -->
```

A block with exported properties should render the comment on the block first line only.

```markdown
id:: 33333333-3333-4333-8333-333333333333

- TODO body <!-- id: 101 -->
  * rating:: 5
  * notes::
    - property value bullet
```

## Design

### 1. Keep the change inside `frontend.worker.markdown-mirror`

Make the implementation in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/markdown_mirror.cljs`.

Do not add a db-worker-node HTTP endpoint.

Do not add Electron IPC.

Do not add a new `thread-api`.

The current thread APIs already cause markdown mirror writes through setting sync, transaction listeners, flush, and full regeneration.

### 2. Add block db/id to rendered block metadata

Update `block-line-info` in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/markdown_mirror.cljs` to include the block's `:db/id`.

Keep the existing `:status-marker` and `:tag-tokens` entries.

The metadata map should represent the real block entity that corresponds to one rendered Markdown block line.

The metadata map should include enough information to identify code blocks, such as the block display type or code block class information already available on the block entity.

The code can assume real outline blocks have `:db/id` because they come from Datascript entities in a controlled worker path.

### 3. Add a small comment formatter

Add a private helper in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/markdown_mirror.cljs` for rendering the generated comment.

The helper should return the exact string `<!-- id: <db-id> -->`.

The helper should not use the page UUID.

The helper should not use the block UUID.

The helper should not localize or translate the comment.

The helper should not add extra metadata fields unless requested later.

### 4. Append the comment in block line decoration

Update `decorate-block-line` in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/markdown_mirror.cljs`.

The function already recognizes rendered block first lines with `markdown-block-re`.

After it builds the decorated block content, append a single space and the db/id comment at the end of that line when the block is not a code block.

This keeps the status marker and tag behavior stable because those transformations already happen inside `decorate-block-content`.

For code block first lines, keep returning the decorated line without a db/id comment.

For non-block lines, keep returning the line unchanged.

Do not append comments in `add-page-id-to-rendered-content` directly because that function also tracks property lines and continuation lines.

Keep `add-page-id-to-rendered-content` responsible for consuming block metadata only when it sees `markdown-block-re` and is not inside a property value.

### 5. Preserve property value handling

Do not change `property-line-indent`, `property-value-line?`, `markdown-property-line-re`, or `property-line-re` unless a test proves the current logic consumes block metadata incorrectly after the comment change.

The current algorithm intentionally avoids consuming block metadata for property value lines.

This matters because exported default property values can render as Markdown list items that look like blocks but are not outline blocks.

### 6. Preserve db-worker-node contracts

Do not change `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs` for this feature.

Do not change `/Users/rcmerci/gh-repos/logseq/src/main/frontend/persist_db/remote.cljs` for this feature.

Do not change `/Users/rcmerci/gh-repos/logseq/src/main/frontend/persist_db.cljs` for this feature unless tests show the existing mirror setting sync fails to trigger the updated renderer.

Do not add a new `thread-api` in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs`.

The only expected `db_core.cljs` edits are test expectation updates if existing API enumeration tests depend on generated output or function order.

## Implementation tasks

### Task 1. Add failing top-level block id comment test

Edit `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/markdown_mirror_test.cljs`.

Create a test named `block-db-id-comments-are-written-to-each-block-first-line-test`.

Create a fake platform with `fake-platform`.

Create a test DB with one page and two top-level blocks.

Find the page and the block entities from the created DB.

Call `markdown-mirror/<mirror-page!` for the page.

Assert that the mirrored page content contains the existing page marker and two block lines ending with the correct `<!-- id: <db-id> -->` comments.

Run the focused test and confirm it fails because current output lacks comments.

### Task 2. Add failing multi-line block test

Edit `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/markdown_mirror_test.cljs`.

Create a test named `block-db-id-comment-is-only-written-to-first-rendered-line-test`.

Use a block title containing a newline.

Assert that the first rendered `- ...` line has the id comment.

Assert that the continuation line does not have an id comment.

Run the focused test and confirm it fails for the expected missing first-line comment.

### Task 3. Add failing nested block test

Edit `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/markdown_mirror_test.cljs`.

Create a test named `nested-block-db-id-comments-preserve-indent-test`.

Use a parent block with a child block.

Assert that both first lines get their own ids.

Assert that the child line keeps its existing indentation before `-`.

Run the focused test and confirm it fails for the expected missing comments.

### Task 4. Add code block exclusion regression test

Edit `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/markdown_mirror_test.cljs`.

Create a test named `code-blocks-do-not-receive-db-id-comments-test`.

Use a code block with `:logseq.property.node/display-type :code` and a language property.

Assert that the rendered code fence line does not include `<!-- id: ... -->`.

Assert that a normal block in the same page still receives its db/id comment.

Run the focused test and confirm it passes on the exclusion expectation only after the implementation can distinguish code blocks from normal blocks.

### Task 5. Add or update property export coverage

Edit `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/markdown_mirror_test.cljs`.

Prefer adding a focused test if existing property tests become too broad after expectation updates.

Assert that a real non-code block line with properties receives the db/id comment.

Assert that nested property value list items do not receive db/id comments and do not consume the next block's metadata.

Run the focused test and confirm it fails for the expected missing block comment before implementation.

### Task 6. Implement metadata enrichment

Edit `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/markdown_mirror.cljs`.

Update `block-line-info` to include the block `:db/id`.

Keep existing status and tag metadata untouched.

Run the focused tests and confirm they still fail until the formatter is used.

### Task 7. Implement the comment formatter and line append

Edit `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/markdown_mirror.cljs`.

Add a private helper for the exact comment format.

Update `decorate-block-line` to append the comment to matched Markdown block first lines for non-code blocks only.

Keep code block lines and non-block lines unchanged for comment purposes.

Run all focused tests and confirm the new tests pass.

### Task 8. Update existing markdown mirror expectations

Edit `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/markdown_mirror_test.cljs`.

Update expected mirrored content strings that include block lines.

Use actual block entity ids from the test DB rather than hard-coded guesses when possible.

Do not update page marker expectations to use db/id because page markers should remain UUID-based.

Run the full markdown mirror test namespace or each related focused test.

### Task 9. Verify db-worker-node API stability

Inspect the diff for `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs`.

Confirm no new `def-thread-api` was added.

Inspect the diff for `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs`.

Confirm no HTTP route, invoke contract, or repo validation behavior changed.

Inspect the diff for `/Users/rcmerci/gh-repos/logseq/src/main/frontend/persist_db.cljs` and `/Users/rcmerci/gh-repos/logseq/src/main/frontend/persist_db/remote.cljs`.

Confirm no Desktop runtime or SSE behavior changed.

### Task 10. Run verification commands

Run the newly added focused tests first.

Run existing focused markdown mirror tests that were updated.

Run `bb dev:lint-and-test` before final review.

If `bb dev:lint-and-test` is too slow or blocked by unrelated local failures, record the exact command, failure, and the focused commands that passed.

### Task 11. Review the implementation with @logseq-review-workflow

After implementation is complete, invoke @logseq-review-workflow on the final diff.

Apply the repository-wide review rules from `.agents/skills/logseq-review-workflow/rules/common.md`.

Route the ClojureScript changes through the Clojure/CLJS library rules.

Route the Datascript entity and query assumptions through the Datascript library rules.

Route the markdown mirror output change through the import/export module rules.

Route any db-worker-node or `thread-api` diff through the Logseq CLI, Electron main, or db-worker related rules only if those files changed.

Fix any blocking or important findings before considering the implementation done.

## Edge cases

A block with an empty title should still receive a comment on the bullet line.

A block with status markers should render the status marker before the db/id comment.

A block with tags added by `decorate-block-content` should render tags before the db/id comment.

A heading block should keep the heading marker and append the db/id comment after the rendered heading text.

A quote block should append the db/id comment to the first quote block line only.

A code block currently renders its first line as the block line that opens the fence.

The implementation must not append the db/id comment to the code fence line.

A multi-line code block should not add comments to the fence line or code body lines.

Property value bullets should not receive generated block comments because they are derived property values, not outline blocks.

Deleted pages and excluded pages should keep their current skip or delete behavior.

Renamed pages should keep the current old-path deletion behavior.

Full regeneration should write the same comment format as transaction-triggered mirroring.

Repeated mirror writes should not accumulate duplicate comments because the mirror content is regenerated from the Datascript DB, not patched from the previous file content.

## Non-goals

Do not make markdown mirror files editable source files.

Do not parse the generated `<!-- id: ... -->` comments back into the graph.

Do not add a migration.

Do not add a new built-in property.

Do not change page `id:: <uuid>` markers.

Do not change graph ignore rules for `mirror/markdown`.

Do not add localized UI text.

Do not add backward compatibility for older mirrored file formats because mirror files are derived artifacts.

## Testing Details

The primary tests should exercise behavior through `markdown-mirror/<mirror-page!`, not by testing a private helper in isolation.

The tests should assert generated file content in the fake platform storage because users observe this feature through mirror files.

The tests should derive expected db/id values from Datascript entities created in the test setup so they verify actual block ids, not incidental string formatting.

The property test should prove behavior by observing that property value bullets do not get comments and that following real blocks still get the right ids.

The full regeneration path should be covered by updating or adding a test around `markdown-mirror/<mirror-repo!` if existing page-level tests do not cover the new output format sufficiently.

## Implementation Details

- Implement in `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/markdown_mirror.cljs`.
- Test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/worker/markdown_mirror_test.cljs`.
- Add `:db/id` and code-block detection metadata to `block-line-info`.
- Append `<!-- id: <db-id> -->` from `decorate-block-line` after existing content decoration for non-code blocks only.
- Keep code block output unchanged for db/id comments.
- Keep page-level `id:: <uuid>` output unchanged.
- Keep property value line handling unchanged unless a failing behavior test proves it must change.
- Avoid touching `db_worker_node.cljs`, `remote.cljs`, and `persist_db.cljs` unless a test proves an integration issue.
- Avoid adding new `thread-api` entries.
- Run focused markdown mirror tests before the broader lint and test command.
- Run @logseq-review-workflow after implementation and before final handoff.

## Question

No open questions.

Code blocks are explicitly excluded from db/id comments.

---
