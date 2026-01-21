# Logseq CLI Search Optimization Implementation Plan

Goal: Simplify the search command arguments and ensure search covers blocks, pages, tags, and properties by default.

Architecture: The CLI parses args with babashka.cli, builds a search action, and queries db-worker-node through thread-api endpoints for pages, blocks, tags, and properties.
Architecture: The change stays in the CLI layer and relies on existing thread-api methods in db-worker-node for data access.

Tech Stack: ClojureScript, babashka.cli, Datascript queries, db-worker-node thread-api.

Related: Relates to docs/agent-guide/007-logseq-cli-thread-api-and-command-split.md.

## Problem statement

The current search command requires the --text option or positional args and joins all positional args into the search string.

The current search documentation and tests are still written around the --text flag and do not describe default type behavior.

We need to remove the --text option, use the first positional string as the search text, and ensure searches cover block titles, page names, tag names, and property names with --type defaulting to all.

We also need to remove the --include-content option and any :block/content usage from CLI search because :block/content is no longer present in db-graph.

We also need to remove the --limit option because it currently only trims output and does not reduce query work.

## Testing Plan

I will add unit tests for CLI parsing that assert the search text is taken from the first positional argument and that --type defaults to all when omitted.

I will add integration tests for the CLI search command that use the positional search text and verify results include at least one matching item from each type when the graph contains data.

I will add a formatting test that validates the missing search text hint no longer references --text.

NOTE: I will write *all* tests before I add any implementation behavior.

## Scope

This plan updates CLI search option parsing and action building for search types.

This plan removes --include-content from CLI search options and eliminates :block/content usage from CLI search code and tests.

This plan updates user-facing docs that describe the search command usage.

## Non-goals

This plan does not change db-worker-node thread-api method signatures or introduce new server endpoints.

This plan does not alter vector search or inference-worker behavior.

## Expected CLI behavior

| Scenario | Input | Behavior |
| --- | --- | --- |
| Basic search | logseq-cli search "hello" | Uses "hello" as search text and searches pages, blocks, tags, and properties. |
| Type filter | logseq-cli search "hello" --type page | Searches only pages. |
| Missing text | logseq-cli search | Returns missing-search-text with a hint that positional text is required. |
| Block titles | logseq-cli search "todo" | Matches block titles only, not :block/content. |

## Implementation Plan

1. Read @test-driven-development and follow TDD for every behavior change in this plan.
2. Update CLI parsing tests in `src/test/logseq/cli/commands_test.cljs` to use positional search text and verify default types are all when --type is omitted.
3. Run `bb dev:test -v logseq.cli.commands-test` and confirm the new tests fail for the expected reasons.
4. Update integration tests in `src/test/logseq/cli/integration_test.cljs` to call search without --text and to assert results still return ok with data.
5. Run `bb dev:test -v logseq.cli.integration-test` and confirm the new tests fail for the expected reasons.
6. Update formatting expectations in `src/test/logseq/cli/format_test.cljs` if missing-search-text hints change.
7. Run `bb dev:test -v logseq.cli.format-test` and confirm the new tests fail for the expected reasons.
8. Remove the :text, :include-content, and :limit options from search spec in `src/main/logseq/cli/command/search.cljs` and update help text accordingly.
9. Update `src/main/logseq/cli/commands.cljs` to require positional search text and to stop referencing :text in missing-search-text logic.
10. Update `src/main/logseq/cli/command/search.cljs` build-action to use the first positional argument as text and ignore any additional positional args for search text.
11. Remove :block/content references from `src/main/logseq/cli/command/search.cljs` so block searches use block title fields only.
12. Update `src/main/logseq/cli/format.cljs` to remove the hint that references --text.
13. Update docs in `docs/cli/logseq-cli.md`, `docs/agent-guide/004-logseq-cli-verb-subcommands.md`, and `docs/agent-guide/002-logseq-cli-subcommands.md` to remove --text, --include-content, and --limit and document the new positional argument behavior and default --type behavior.
14. Update CLI tests in `src/test/logseq/cli/commands_test.cljs`, `src/test/logseq/cli/integration_test.cljs`, and `src/test/logseq/cli/format_test.cljs` to remove --include-content, --limit, and any :block/content expectations.
15. Run `bb dev:lint-and-test` and confirm all linters and unit tests pass.

## Edge cases and validation

Multiple positional arguments should not be concatenated into a single search string unless explicitly required by design.

Search text containing spaces should still work when the shell passes it as a single quoted argument.

When --type is provided, only the requested type set should be searched and defaults should not override the filter.

Search with --tag should continue to filter block searches and should not filter page, tag, or property results unless explicitly required.

The CLI must not attempt to query :block/content because the attribute is absent in db-graph.

## Testing Details

The CLI command tests will assert that a positional search term maps to the action :text and that missing text errors are raised when no positional arguments exist.

The integration tests will execute the CLI against a sample graph, verify the command exits with ok, and confirm search results are a vector for each type requested.

The formatting tests will assert the error hint no longer suggests the deprecated --text option.

The CLI tests will assert that no --include-content or --limit option exists and that searches do not rely on :block/content.

## Implementation Details

- Remove :text, :include-content, and :limit from the search option spec and adjust help text generation to avoid advertising those options.
- Update missing-search-text validation to rely only on positional args.
- Use only the first positional argument as the search text to match the new spec.
- Confirm default search types flow through normalize-search-types when --type is absent.
- Remove :block/content usage from query-blocks and any related logic.
- Update docs and examples to show quoted positional search text.
- Ensure error hints reference positional text rather than options.

## Question

No open questions.

---
