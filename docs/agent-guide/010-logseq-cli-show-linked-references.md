# Logseq CLI Show Linked References Implementation Plan

Goal: Add task status prefixes to show output and include linked references for the shown block or page.

Architecture: The CLI show command will fetch marker data with the tree and will build a display label that prefixes the marker before the block content.
Architecture: The CLI show command will also call db-worker-node thread-api/get-block-refs to fetch linked references and append them to text output while returning structured data in JSON and EDN output.
Architecture: Data flow will remain CLI -> db-worker-node -> db-core with no new worker endpoints, reusing existing thread-api functions.

Tech Stack: ClojureScript, promesa, logseq-cli transport, db-worker-node thread-api, Datascript.

Related: Builds on docs/agent-guide/009-cli-add-pos-show-tree-align.md.

## Testing Plan

I will follow @test-driven-development and write failing tests before any production changes.
I will add a unit test in /Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs that asserts tree->text prefixes :block/marker before the block title for TODO and CANCELED blocks.
I will add a unit test in /Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs that asserts tree->text keeps multiline alignment when the marker prefix is present.
I will add an integration test in /Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs that creates a page and a referencing block, runs show with --format json, and asserts that linked references are present and include the referencing block uuid and page title.
I will run the new unit tests with bb dev:test -v logseq.cli.commands-test and the new integration test namespace with bb dev:test -v logseq.cli.integration-test to confirm failures, then again to confirm passing.
I will run bb dev:lint-and-test after implementation to ensure no regressions.
NOTE: I will write *all* tests before I add any implementation behavior.

## Problem statement

The current show command prints only the block title or page name without the task marker, which hides task status context in CLI usage.
The show command also does not include linked references for the shown block or page, forcing users to query references separately.
We need to enhance the show output to include task status prefixes and linked references while keeping existing formats and db-worker-node integration stable.

## Implementation Plan

1. Read /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs to identify the tree-block selector, label construction, and output formatting paths.
2. Read /Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs to confirm the behavior and return shape of :thread-api/get-block-refs.
3. Read the existing show tree tests in /Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs to align new expectations with current formatting rules.
4. Add a failing unit test in /Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs that builds a tree with :block/marker values and asserts the marker prefix appears before the block title in tree->text output.
5. Add a failing unit test in /Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs that covers multiline block titles with markers and asserts continuation lines still align under the glyph column.
6. Add a failing integration test in /Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs that creates a page, adds a block referencing that page, runs show for the page in JSON, and asserts the response contains linked references with block uuid and page title.
7. Run the two new unit tests and the integration test to confirm failures for the expected reasons.
8. Update the tree-block selector in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs to pull :block/marker alongside :block/title and :block/name.
9. Add a small helper in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs that builds the display label by prefixing :block/marker followed by a space when a marker is present, while falling back to :block/name or :block/uuid when :block/title is missing.
10. Update tree->text in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs to use the new label helper for both root and child nodes so that marker prefixes appear in all output lines.
11. Add a linked references fetch step in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs that calls transport/invoke with :thread-api/get-block-refs using the root db/id.
12. Normalize linked references by pulling a minimal selector for each ref block, including :db/id, :block/uuid, :block/title, :block/marker, and {:block/page [:db/id :block/name :block/title :block/uuid]}, so CLI output is predictable and lightweight.
13. Extend the show tree data structure to include :linked-references with a list of normalized blocks and a :count, and ensure this structure is returned for JSON and EDN output paths.
14. For text output, append a Linked References section after the tree that lists each referencing block with its page title and marker-prefixed label, and show a count line when references exist.
15. Update the unit test expectations in /Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs to match the marker-prefixed text output.
16. Update the new integration test assertions to match the final JSON structure for linked references.
17. Run the targeted tests again, then bb dev:lint-and-test, to verify all changes pass.

## Edge cases

Blocks without :block/marker should render exactly as before with no extra spacing.
Blocks with :block/title nil should still render using :block/name or :block/uuid with the marker prefix applied only when a title exists.
Linked references can be empty, in which case the Linked References section should be omitted from text output and :linked-references should contain a zero count in JSON and EDN.
Linked reference blocks that are missing a page or title should still render using their uuid fallback.
Show by block id and show by page name should both resolve linked references using the root db/id.

## Testing Details

The unit tests exercise tree->text output formatting to ensure marker prefixes appear on the first line and multiline alignment is preserved, which validates CLI-visible behavior.
The integration test uses db-worker-node to create actual referencing blocks and verifies that show output includes linked references in the JSON response without inspecting internal worker details.

## Implementation Details

- Pull :block/marker in the tree selector so task status is available for label rendering.
- Build a label helper that prefixes markers without changing existing fallback logic for titles and names.
- Append a Linked References section in text output with a header, count, and marker-prefixed block labels.
- Use :thread-api/get-block-refs for reference discovery and re-pull a minimal selector for stable CLI output.
- Return linked references in JSON and EDN outputs as {:linked-references {:count n :blocks [...]}}.
- Keep all changes inside the CLI show command and avoid new db-worker-node endpoints.

## Question

Should the marker prefix use the stored uppercase value (for example CANCELED) or should it be title-cased to match the example with Canceled.
Answer: Use the stored uppercase marker value (for example CANCELED).
Should linked references be grouped by page in text output, or listed as a flat list with page labels.
Answer: Group linked references by page in text output.

---
