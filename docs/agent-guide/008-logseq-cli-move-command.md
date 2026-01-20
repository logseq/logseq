# Logseq CLI Move Command Implementation Plan

Goal: Add a move subcommand to logseq-cli that moves a non-page block and its children under a target block or page with positional control.
Architecture: Extend the existing CLI command table with a new move command that resolves source and target entities via db-worker-node and invokes :thread-api/apply-outliner-ops using :move-blocks.
Architecture: Use existing outliner move semantics for ordering while validating CLI inputs and translating --pos into outliner options.
Tech Stack: ClojureScript, babashka.cli, db-worker-node :thread-api/apply-outliner-ops, Logseq outliner ops.
Related: Builds on docs/agent-guide/007-logseq-cli-thread-api-and-command-split.md.

## Problem statement

Users need a CLI way to move a block and its subtree to a new parent or sibling position in a graph without opening the UI.
The current CLI supports add and remove but lacks a move operation even though db-worker-node and outliner already support :move-blocks.
The move command must align with existing CLI patterns, validate non-page sources, and support positioning under a block or page target.

## Testing Plan

I will add unit tests for command parsing and validation of move options, including invalid combinations and default --pos behavior.
I will add unit tests for human output formatting of move success messages.
I will add an integration test that creates blocks, moves a block to a target page and block, and verifies the resulting tree via show.
NOTE: I will write all tests before I add any implementation behavior.

## Command behavior and options

The move command will be a new inspect and edit verb alongside add and remove.
The command will accept exactly one source selector and exactly one target selector.
The command will move a single block per invocation.
The command will allow a page target via --page-name and a block target via a block selector.
The move position will default to first-child unless --pos is provided.
Source selectors will be --id or --uuid, and target selectors will be --target-id or --target-uuid.

| Flag | Meaning | Required | Notes |
| --- | --- | --- | --- |
| --id | Source block db/id | Yes | Mutually exclusive with --uuid. |
| --uuid | Source block UUID | Yes | Mutually exclusive with --id. |
| --target-id | Target block db/id | Yes | Mutually exclusive with --target-uuid and --page-name. |
| --target-uuid | Target block UUID | Yes | Mutually exclusive with --target-id and --page-name. |
| --page-name | Target page name | Yes | Only valid when target is a page. |
| --pos | Position relative to target | No | Allowed values: first-child, last-child, sibling. |

## Implementation Plan

1. Read @prompts/review.md and capture any relevant review checklist items for CLI commands and db-worker-node usage.
2. Add a new command namespace at src/main/logseq/cli/command/move.cljs with a command entry, spec, and action builder.
3. Add option validation in src/main/logseq/cli/command/move.cljs for allowed --pos values and mutually exclusive selectors.
4. Add source resolution logic in src/main/logseq/cli/command/move.cljs that fetches the source block by id or uuid and rejects page entities.
5. Add target resolution logic in src/main/logseq/cli/command/move.cljs that fetches the target block or page and returns a target db/id.
6. Map --pos to outliner options for :move-blocks and document the mapping in comments for future maintenance.
7. Implement execute-move in src/main/logseq/cli/command/move.cljs that calls :thread-api/apply-outliner-ops with :move-blocks.
8. Wire the new command into src/main/logseq/cli/commands.cljs for parsing, validation, action building, and execution.
9. Update src/main/logseq/cli/command/core.cljs to include move in the Graph Inspect and Edit group in top-level summaries.
10. Update src/main/logseq/cli/main.cljs to include move in the usage command list string.
11. Add human output formatting for move in src/main/logseq/cli/format.cljs and include the relevant context keys.
12. Update src/test/logseq/cli/commands_test.cljs with parse and help coverage for move and validation error cases.
13. Update src/test/logseq/cli/format_test.cljs with a move success formatting test.
14. Update src/test/logseq/cli/integration_test.cljs with a move workflow that asserts the moved block appears under the new target.
15. Update docs/cli/logseq-cli.md to document the new move command, its flags, and examples.
16. Run bb dev:lint-and-test and fix any failures.

## Edge cases to cover

Moving a page block should fail with a clear error message and code.
Providing --pos sibling should return a validation error when the target is a page.
Moving a block to itself or into its descendants should be rejected by outliner and surfaced as an error.
Supplying both id and uuid selectors should return a validation error.
Supplying no target selector should return a validation error.

## Notes on position mapping

first-child will use :sibling? false and no :bottom? so that the moved block becomes the first child of the target.
last-child will use :bottom? true so outliner places the block after the last child of the target.
sibling will use :sibling? true so outliner places the block immediately after the target block.

## Testing Details

I will add command parsing tests that assert move is present in help output and that invalid flag combinations are rejected.
I will add a format test that ensures the human output for move references the source block and target.
I will add an integration test that creates a page, adds blocks, moves a block under a target, and verifies the show tree includes it in the expected position.

## Implementation Details

- Add a new command entry in src/main/logseq/cli/command/move.cljs with a spec that includes source and target selectors plus --pos.
- Resolve source and target entities via :thread-api/pull and reject page sources by checking page attributes.
- Translate --pos into outliner options for :move-blocks and pass them through :thread-api/apply-outliner-ops.
- Extend command parsing and execution switches in src/main/logseq/cli/commands.cljs to include :move-block.
- Extend human formatting in src/main/logseq/cli/format.cljs with a concise move success line.
- Update docs/cli/logseq-cli.md to list the new move command in the inspect and edit section and help output.
- Follow @skills/test-driven-development for all tests and implementation work.

## Question


---
