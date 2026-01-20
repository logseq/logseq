# CLI Add Pos And Show Tree Alignment Implementation Plan

Goal: Add --pos support to logseq-cli add block, rename move --page-name to --target-page-name, and fix show tree alignment when db/id widths differ.

Architecture: Extend the logseq-cli command layer to parse and validate add block target options and --pos, map it to outliner insert options sent over db-worker-node, and update tree rendering to use a fixed-width id column computed from the tree.

Tech Stack: ClojureScript, babashka.cli, promesa, db-worker-node thread-api.

Related: Builds on docs/agent-guide/008-logseq-cli-move-command.md.

## Problem statement

The logseq-cli add block command always inserts at the bottom, and it cannot express first-child or sibling insertion positions, and it relies on --page/--parent targets instead of explicit target ids.

The move command uses --page-name for page targets, which is inconsistent with the target naming used by other move flags.

The show command renders a text tree with id prefixes, but the glyph column shifts when db/id digit widths differ, making the tree hard to read.

We need to add a --pos option to add block that mirrors existing move semantics and fix show tree alignment for variable id widths.

## Testing Plan

I will add a unit test that parses add block with --target-id/--target-uuid/--target-page-name and --pos and validates invalid pos values, ensuring it is rejected with a clear error.

I will add a unit test that parses move with --target-page-name and rejects --page-name as an unknown option.

I will add a unit test for show tree rendering that uses mixed-width db/id values and verifies glyph alignment is consistent.

I will add an integration test that inserts two blocks with different --pos values using the new target flags and verifies the resulting order via show output or a query in db-worker-node.

NOTE: I will write *all* tests before I add any implementation behavior.

## Implementation Plan

1. Read the existing add block command spec and execution path in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs.

2. Read the existing move --pos implementation in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/move.cljs to mirror the allowed values and option mapping, and to scope the rename from --page-name to --target-page-name.

3. Write a failing unit test that parses add block with --target-id/--target-uuid/--target-page-name and --pos in /Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs.

4. Write a failing unit test for show tree alignment with mixed-width ids in /Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs.

5. Run the CLI unit tests to confirm both tests fail for the correct reasons.

6. Replace add block target options in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs with --target-id, --target-uuid, --target-page-name, and add :pos to the spec so help text includes the option.

7. Add an invalid-options? helper in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs to validate allowed positions and to reject sibling positioning when the target is a page or when no target is supplied.

8. Wire add-block invalid option checks into command validation in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs.

9. Update build-add-block-action in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs to normalize :pos, resolve --target-* options into a single target selector, and include it in the action payload while keeping the default behavior as last-child.

10. Update execute-add-block in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs to resolve the target selector and translate :pos into insert-blocks options, using the same mapping as move and keeping compatibility with db-worker-node.

11. Rename move --page-name to --target-page-name in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/move.cljs and update parsing in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs.

12. Update any move-related tests in /Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs to use --target-page-name and to assert --page-name is rejected.

13. Update tree->text in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs to compute a fixed id column width from all nodes in the tree and pad id cells consistently for all rows and multiline continuations.

14. Update the show tree unit test expectations in /Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs to reflect the new alignment behavior.

15. Write a failing integration test in /Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs that uses db-worker-node to insert blocks with different --pos values and checks the resulting order.

16. Run the specific unit tests and the new integration test to verify they pass.

17. Run the full CLI test suite with bb dev:lint-and-test to ensure no regressions.

## Edge cases

Add --pos sibling with --target-page-name should be rejected because a page target has no sibling context.

Add --pos values should be case-insensitive and trimmed, matching move semantics.

Show tree rendering should keep alignment for nodes that have no db/id or use a placeholder.

Multiline block titles should continue to render under the glyph column even with mixed-width ids.

## Testing Details

Unit tests cover add --pos parsing and show tree alignment with mixed-width ids and multiline titles to validate visible behavior rather than internal helpers.

Integration tests cover db-worker-node insert ordering by creating a page and inserting blocks with first-child and last-child positions using the new target flags, then asserting order via show output or a query.

Move command tests cover renaming --page-name to --target-page-name and ensure the legacy flag is rejected.

## Implementation Details

- Replace add block target flags with --target-id, --target-uuid, --target-page-name and add :pos to the spec in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs.
- Mirror move position values and mapping to {:sibling? false} and {:sibling? false :bottom? true} and {:sibling? true}.
- Keep default add behavior as last-child when --pos is omitted for backward compatibility.
- Reject --pos sibling when the target is a page or when no target is provided.
- Normalize and validate :pos and target selector in add command parsing to avoid leaking invalid values to db-worker-node.
- Rename move --page-name to --target-page-name in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/move.cljs and update parsing and help output accordingly.
- Compute max id width in tree->text by traversing root and descendants before rendering lines.
- Build id padding from the max width and use it for both first rows and multiline continuation rows.
- Update tests in /Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs to assert alignment with mixed-width ids.
- Ensure db-worker-node invocations remain unchanged aside from the extra insert options map.

## Question

Should --pos default to last-child to match current add behavior, or should it default to first-child for consistency with move.

Answer: Default to last-child to preserve current add behavior.

Should the old --page and --parent flags be removed immediately or supported as deprecated aliases for one release.

Answer: Remove immediately.

---
