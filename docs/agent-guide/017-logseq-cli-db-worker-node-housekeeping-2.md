# Logseq CLI Housekeeping 2 Implementation Plan

Goal: Simplify CLI options for show, move, and remove while keeping db-worker-node behavior unchanged.

Architecture: The changes are limited to CLI option parsing, action building, and output formatting in the CLI layer.
The db-worker-node API calls remain the same, but we will verify expected input shapes for delete and move operations.
We will centralize shared id parsing so show and remove stay consistent.

Tech Stack: ClojureScript, babashka.cli, promesa, Logseq CLI, db-worker-node thread-api.

Related: Builds on docs/agent-guide/015-logseq-cli-db-worker-node-housekeeping.md and relates to docs/agent-guide/014-logseq-cli-show-multi-id.md.

## Testing Plan

I will follow @test-driven-development by writing failing tests for each new CLI behavior before changing implementation.
I will add unit tests in /Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs for parsing and validation of the new remove options and renamed flags.
I will add unit tests for show option parsing to accept --page and reject --page-name and --format, while preserving global --output handling.
I will add unit tests for move option parsing to accept --target-page and reject --target-page-name.
I will add unit tests for remove parsing to accept --id, --uuid, and --page, and to reject multiple selectors or missing target.
I will add unit tests for remove parsing to accept multi-id vectors and to reject invalid or empty vectors.
I will run the CLI test namespace and confirm the new tests fail before any implementation changes.
I will rerun the CLI tests after each behavioral change to confirm they pass.

Command to run tests is shown below.

```bash
bb dev:test -v 'logseq.cli.commands-test'
```

Expected test output is described below.

The output should include zero failures and zero errors for logseq.cli.commands-test.

NOTE: I will write *all* tests before I add any implementation behavior.

## Problem statement

The CLI currently exposes overlapping option names and per-command format flags that conflict with the global output option.
The remove command is split into remove block and remove page, which makes scripting awkward and inconsistent with show and move selectors.
The move and show commands use page-name flags that should be renamed for clarity and consistency across commands.
We need a small, coordinated change that updates CLI parsing, action building, and documentation without changing db-worker-node APIs.

## Plan

1. Review current CLI option specs and validation in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs, /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/remove.cljs, and /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/move.cljs to confirm existing behavior and data shapes.
2. Review db-worker-node call sites for delete and move operations by searching for :delete-blocks and :delete-page usages to confirm expected argument shapes in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/remove.cljs and related call sites.
3. Add failing parsing and validation tests for the unified remove command and renamed flags in /Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs.
4. Add failing tests that assert legacy flags and subcommands are rejected in /Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs.
5. Run the CLI test namespace and record the failing cases using the test command in the testing plan.
6. Extract the show id parsing logic into a shared helper in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/id.cljs or a similar shared namespace, and update /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs to use it.
7. Update /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/remove.cljs to define a single remove spec with --id, --uuid, and --page, and to build actions based on which selector is present.
8. Update remove execution to support single and multiple id deletion while preserving page deletion behavior, and ensure returned data matches existing format expectations.
9. Update /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs to rename --page-name to --page and remove the --format option and related validation.
10. Update show execution to use the resolved output format from config instead of a command-specific flag, while preserving human-readable output for the default format.
11. Update /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/move.cljs to rename --target-page-name to --target-page and adjust validation and target resolution accordingly.
12. Update /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs to reflect the new remove command, show selector, and move target flag in validation, action building, and help routing.
13. Update /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs if the new remove action type changes the command name used for human formatting.
14. Update CLI usage text in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/main.cljs to remove the remove block and remove page references.
15. Update CLI documentation and examples in /Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md to use --page, --target-page, and the unified remove command without --format.
16. Rerun the CLI test namespace and confirm all tests pass.
17. Run bb dev:lint-and-test if time permits and confirm there are no regressions in other CLI tests.
18. Review the changes against @prompts/review.md and ensure the updated flags are reflected everywhere in docs and tests.

## Edge cases

Removing blocks with a vector of ids that contains non-integers should produce a clear invalid options error.
Removing blocks with an empty id vector should produce a clear invalid options error.
Removing with both --id and --uuid should fail validation with a single-selector error.
Removing with both --page and a block selector should fail validation with a single-selector error.
Showing with --page should still reject invalid level values and missing targets.
Showing with --output json or edn should return structured data rather than human text for both single and multi-id cases.
Moving with --target-page should still reject --pos sibling.
Legacy flags like --page-name, --target-page-name, and show --format should be rejected by the parser with invalid-options errors.

## Testing Details

I will focus tests on CLI behavior by asserting parse-args results, invalid option errors, and build-action normalization for ids and selectors.
I will avoid mock-only tests and instead assert actual validation behavior and action shapes that drive CLI execution.

## Implementation Details

- Consolidate remove command parsing around a single spec and selector validation.
- Share id parsing between show and remove to keep behavior identical.
- Keep db-worker-node API calls unchanged and only adjust CLI argument shapes.
- Use config output-format in show execution to decide between human text and structured data.
- Remove show-specific format validation and option from the CLI help output.
- Rename show and move page flags and update all associated validation logic.
- Update CLI documentation and examples to match the new flags and remove subcommands.
- Update CLI help routing so logseq remove behaves like a command, not a group.

## Decisions

- Remove `--page-name` and `--target-page-name` entirely (no aliases or warnings).
- For remove with multiple ids, continue with best-effort deletion (do not fail on the first missing id).
- For remove ids, allow only the show-style vector and single value formats (no repeated `--id` flags).

---
