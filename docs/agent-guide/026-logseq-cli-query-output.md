# Logseq CLI Query Output Piping Implementation Plan

Goal: Remove the space-to-comma transformation in CLI query human output while preserving EDN output and ensuring `logseq show --id` accepts ids both via argument and stdin pipelines.

Architecture: Keep human formatting for query results as EDN output (no line-oriented transformation) and update tests to validate pipeline usage with intact EDN.
Architecture: Extend logseq show --id to read ids from stdin when present, whether or not an id argument is provided, and update integration tests to validate both xargs and direct stdin pipelines.

Tech Stack: ClojureScript, Logseq CLI, db-worker-node, Node-based integration tests.

Related: Relates to docs/agent-guide/025-logseq-cli-builtin-status-priority-queries.md.

## Testing Plan

I will add an integration test that ensures a human-output query can be piped into xargs and then into logseq show --id for multiple ids, with the query output preserved as EDN.
I will add an integration test that ensures a human-output query can be piped directly into logseq show --id via stdin, with or without an explicit id argument.
I will update the existing integration test that currently pipes human query output directly into logseq show so it asserts EDN preservation and stdin ingestion.
I will add a focused unit test for format-query-results that covers EDN output for scalar collections, non-scalar collections, and nil results.
I will add a unit test for show id parsing that covers stdin provided, stdin blank, and explicit id values.

NOTE: I will write all tests before I add any implementation behavior.

## Problem statement

The CLI currently replaces spaces with commas in format-query-results, which is a lossy transformation that makes output less readable.
We need to remove the space-to-comma logic while preserving EDN output (including spaces) for query results.
Pipelines should remain usable by allowing logseq show --id to accept ids from stdin and from explicit arguments interchangeably.

## Plan

1. Read the existing formatting logic in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs and document current behavior in a quick note.
2. Read the show command option parsing in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs and /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/id.cljs to understand current id validation.
3. Locate the current integration test that verifies human query output piping in /Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs and map the required changes.
4. Define the new output rule for format-query-results as a comment in the plan: always return EDN output unchanged (including spaces), and remove space-to-comma logic.
5. Define the new show --id stdin rule as a comment in the plan: when stdin is non-empty, parse it as the id or id vector string and use it regardless of whether an id argument is provided.
6. Write the failing unit tests for format-query-results in a new test namespace under /Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs that covers nil, scalar-id sequences, and nested maps, all preserved as EDN strings.
7. Write failing unit tests for show id parsing in /Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/show_test.cljs that cover stdin provided (overriding or complementing args), stdin blank, and explicit id values.
8. Run the unit tests to confirm the failure before implementation using bb dev:test with the new namespaces.
9. Write a failing integration test that uses the exact pipeline command from the request by invoking a shell command from the test harness in /Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs for xargs usage.
10. Write a failing integration test that uses the exact pipeline command from the request for direct stdin piping into logseq show --id with or without an argument.
11. Run the integration tests to confirm the failure before implementation using bb dev:test with the specific test names.
12. Implement the new format-query-results behavior in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs by removing the space-to-comma logic and preserving EDN output.
13. Implement stdin ingestion for show --id in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs, using a helper to read from stdin when non-empty regardless of whether an id argument is provided.
14. Update the existing human-output pipeline integration test to align with the EDN-preserving output and assert both xargs and direct stdin usage.
16. Re-run the unit tests and the integration tests to validate the new behavior.
17. Update deps/cli/README.md examples if they reference comma-transformed output, and add a short note describing the new xargs-friendly and stdin-friendly behavior for id lists.

## Testing Details

The unit tests will exercise behavior by calling format-query-results with representative results and asserting the exact emitted EDN string for id lists and non-id data.
The integration tests will execute logseq query with a task-search or custom datalog query, pipe the EDN output through xargs into logseq show --id, and pipe directly into logseq show --id via stdin.
The show stdin behavior test will assert that missing --id input without stdin returns a clear error and that stdin is parsed the same as an explicit id argument.

## Implementation Details

- Preserve the existing safe-read-string validation to avoid changing behavior for invalid EDN strings.
- Keep non-scalar results as their original EDN string output.
- Maintain nil handling so that "nil" still prints as "nil".
- Remove the space-to-comma transformation while keeping EDN output intact, including spaces.
- Add stdin reading to show --id when stdin is non-empty, even if an id argument is provided.
- Parse stdin through the same id parsing function used for explicit --id values.
- Keep existing errors when --id is missing and stdin is empty or whitespace.
- Update integration tests to use the exact pipeline command from the requirement.
- Use @test-driven-development for all implementation steps.

## Question

Query results remain in EDN form (e.g., `[1 2 3]`) with no line-oriented transformation.
Logseq show --id accepts ids via explicit argument and via stdin pipelines (stdin takes precedence when provided).

---
