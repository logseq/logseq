# Logseq CLI Datascript Query Implementation Plan

Goal: Add a logseq-cli query subcommand that runs a Datascript query via db-worker-node and returns a list of block IDs.
Architecture: The CLI will parse a query form from arguments, call db-worker-node using the existing /v1/invoke transport with :thread-api/q, and normalize results into a stable list of block IDs.
Architecture: No new db-worker-node HTTP endpoints are required because :thread-api/q already exists in the worker thread API.
Tech Stack: ClojureScript, babashka.cli, Datascript, db-worker-node HTTP transport.
Related: Relates to docs/agent-guide/012-logseq-cli-graph-storage.md.

## Problem statement

The current logseq-cli does not expose a query subcommand for running Datascript queries against a graph.
Users need a CLI command that executes a Datascript query and returns only the matching block IDs for scripting and downstream tooling.
The solution should follow the existing logseq-cli and db-worker-node invocation patterns so it works with the current daemon and transport.

## Testing Plan

I will add an integration test that creates a graph, inserts blocks, runs the new query subcommand, and asserts that the returned IDs match the expected block IDs.
I will add a unit test that validates query argument parsing, including invalid EDN, missing query text, and optional inputs parsing.
I will add a unit test that verifies result normalization from the raw query result to a vector of block IDs.
I will follow @test-driven-development and write the failing tests before implementing behavior.

NOTE: I will write *all* tests before I add any implementation behavior.

## Plan

Create a new command module at src/main/logseq/cli/command/query.cljs that defines the query command spec and action builder.
Use --query for the Datascript query form and --inputs for the optional EDN inputs vector, and parse them with cljs.reader/read-string or logseq.common.util/safe-read-string with error handling.
Return a structured action map that includes :type :query, :repo, :query, and :inputs to keep execution isolated from parsing.
Register the new command in src/main/logseq/cli/commands.cljs and include it in the command table so help output includes query.
Update src/main/logseq/cli/main.cljs usage text to include query in the command list.
Implement execution in src/main/logseq/cli/command/query.cljs using logseq.cli.transport/invoke with :thread-api/q and args [repo [query & inputs]].
Normalize the raw Datascript result into a vector of block IDs by accepting numbers or entities with :db/id, and raise an error when no IDs can be derived.
Ensure output is stable by sorting numeric IDs ascending and removing duplicates before returning.
Add formatting in src/main/logseq/cli/format.cljs for :query to render a single-column table of IDs in human output and a vector in json or edn output.
Add command-level validation in src/main/logseq/cli/commands.cljs to return a missing-query error when no query is supplied.
Update src/test/logseq/cli/commands_test.cljs to expect query in help output and to validate parse errors for missing query or invalid input.
Add a CLI integration test in src/test/logseq/cli/integration_test.cljs that uses run-cli to execute query and verifies IDs in JSON output.
Confirm that no db-worker-node changes are required by verifying that :thread-api/q continues to accept the same argument shape in src/main/frontend/worker/db_core.cljs.

## Edge cases

A query string that cannot be read as EDN should return a clear invalid-options error and a non-zero exit code.
A query that returns no results should return an empty ID list with a successful status.
A query that returns non-entity values should error if no block IDs can be extracted from the result set.
Queries with :in parameters should work when --inputs supplies the matching values in order.

## Testing Details

The integration test will create a graph, add known blocks, run a query that finds those blocks, and verify that the output vector contains their db/id values and only those values.
The unit tests will assert that parsing rejects invalid EDN for --inputs, that a missing query produces a :missing-query error, that result normalization handles tuples and entity maps into a flat vector of IDs, and that it errors when no IDs can be extracted.

## Implementation Details

- Add a new command module at src/main/logseq/cli/command/query.cljs.
- Add command entries in src/main/logseq/cli/commands.cljs.
- Add output formatting in src/main/logseq/cli/format.cljs.
- Update usage text in src/main/logseq/cli/main.cljs.
- Use transport/invoke with :thread-api/q and [repo [query & inputs]].
- Normalize results into unique, sorted numeric IDs.
- Keep all argument parsing and validation inside query command module using --query and --inputs.
- Keep db-worker-node changes to zero unless a new worker API is required.

## Question

Use --query and --inputs options for the query subcommand.
Output should be sorted and de-duplicated for scripting stability.
Command should error when no block IDs can be extracted.

---
