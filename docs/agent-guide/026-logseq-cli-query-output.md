# Logseq CLI Query Output Piping Implementation Plan

Goal: Remove the space-to-comma transformation in CLI query human output while keeping query results usable in shell pipelines like xargs and direct stdin piping with logseq show.

Architecture: Adjust human formatting for query results to preserve EDN output for general results and emit line-oriented output only for scalar id collections.
Architecture: Extend logseq show -id to read ids from stdin when no id argument is provided and update integration tests to validate both xargs and direct stdin pipelines.

Tech Stack: ClojureScript, Logseq CLI, db-worker-node, Node-based integration tests.

Related: Relates to docs/agent-guide/025-logseq-cli-builtin-status-priority-queries.md.

## Testing Plan

I will add an integration test that ensures a human-output query can be piped into xargs and then into logseq show for multiple ids.
I will add an integration test that ensures a human-output query can be piped directly into logseq show -id via stdin when no id value is passed.
I will update the existing integration test that currently pipes human query output directly into logseq show so it asserts the new line-oriented behavior and stdin ingestion.
I will add a focused unit test for format-query-results that covers scalar collections, non-scalar collections, and nil results.
I will add a unit test for show id parsing that covers missing id arg with stdin provided and missing id arg without stdin.

NOTE: I will write all tests before I add any implementation behavior.

## Problem statement

The CLI currently replaces spaces with commas in format-query-results, which is a lossy transformation that makes output less readable.
Removing that transformation will reintroduce spaces in EDN vectors and lists, which breaks shell pipelines that rely on whitespace splitting.
We need to remove the space-to-comma logic while still ensuring the pipeline commands in the request work reliably.
The show command needs to accept ids from stdin when -id is present but no explicit id argument is provided.

## Plan

1. Read the existing formatting logic in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs and document current behavior in a quick note.
2. Read the show command option parsing in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs and /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/id.cljs to understand current id validation.
3. Locate the current integration test that verifies human query output piping in /Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs and map the required changes.
4. Define the new output rule for format-query-results as a comment in the plan: if the result is a sequential collection of scalar ids, output one id per line, otherwise output the EDN string unchanged.
5. Define the new show -id stdin rule as a comment in the plan: when -id is present but no id value is provided, read stdin, trim it, and treat it as the id or id vector string for parsing.
6. Write the failing unit tests for format-query-results in a new test namespace under /Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs that covers nil, scalar-id sequences, and nested maps.
7. Write failing unit tests for show id parsing in /Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/show_test.cljs that cover stdin provided, stdin blank, and explicit id values.
8. Run the unit tests to confirm the failure before implementation using bb dev:test with the new namespaces.
9. Write a failing integration test that uses the exact pipeline command from the request by invoking a shell command from the test harness in /Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/integration_test.cljs for xargs usage.
10. Write a failing integration test that uses the exact pipeline command from the request for direct stdin piping into logseq show -id with no argument.
11. Run the integration tests to confirm the failure before implementation using bb dev:test with the specific test names.
12. Implement the new format-query-results behavior in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs using a helper predicate for scalar ids and line-join logic.
13. Remove the string/replace space-to-comma logic from format-query-results in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs.
14. Implement stdin ingestion for show -id in /Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/show.cljs, using a helper to read from stdin only when -id is present and no id argument is provided.
15. Update the existing human-output pipeline integration test to align with the new output behavior and assert both xargs and direct stdin usage.
16. Re-run the unit tests and the integration tests to validate the new behavior.
17. Update deps/cli/README.md examples if they reference comma-transformed output, and add a short note describing the new xargs-friendly and stdin-friendly behavior for id lists.

## Testing Details

The unit tests will exercise behavior by calling format-query-results with representative results and asserting the exact emitted string for id lists and non-id data.
The integration tests will execute logseq query with a task-search or custom datalog query, pipe the output through xargs into logseq show, and pipe directly into logseq show -id via stdin with no id argument.
The show stdin behavior test will assert that missing -id input without stdin returns a clear error and that stdin is parsed the same as an id argument.

## Implementation Details

- Add a helper predicate for scalar ids that accepts integers and rejects maps, vectors, and strings.
- Detect sequential results that are entirely scalar ids and return a newline-joined string of ids.
- Preserve the existing safe-read-string validation to avoid changing behavior for invalid EDN strings.
- Keep non-scalar results as their original EDN string output.
- Maintain nil handling so that "nil" still prints as "nil".
- Ensure the output is stable for xargs by avoiding embedded spaces in the line-oriented mode.
- Add stdin reading to show -id when the option is present but its value is missing.
- Parse stdin through the same id parsing function used for explicit -id values.
- Keep existing errors when -id is missing and stdin is empty or whitespace.
- Update integration tests to use the exact pipeline command from the requirement.
- Use @test-driven-development for all implementation steps.

## Question

The line-oriented output applies only to vectors of numeric ids.
Logseq show -id reads stdin only when -id is present with no value.

---
