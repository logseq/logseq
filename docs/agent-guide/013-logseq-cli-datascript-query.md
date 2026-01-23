# Logseq CLI Datascript Query Implementation Plan

Goal: Add a logseq-cli query subcommand that runs a Datascript query via db-worker-node and returns the raw datascript-query result shape.
Architecture: The CLI will parse a query form from arguments, call db-worker-node using the existing /v1/invoke transport with :thread-api/q, and return whatever datascript-query returns without normalization.
Architecture: No new db-worker-node HTTP endpoints are required because :thread-api/q already exists in the worker thread API.
Tech Stack: ClojureScript, babashka.cli, Datascript, db-worker-node HTTP transport.
Related: Relates to docs/agent-guide/012-logseq-cli-graph-storage.md.

## Problem statement

The current logseq-cli does not expose a query subcommand for running Datascript queries against a graph.
Users need a CLI command that executes a Datascript query and returns the same result shape as datascript-query for scripting and downstream tooling.
The solution should follow the existing logseq-cli and db-worker-node invocation patterns so it works with the current daemon and transport.

## Testing Plan

I will add an integration test that creates a graph, inserts blocks, runs the new query subcommand, and asserts that the returned IDs match the expected block IDs.
I will add a unit test that validates query argument parsing, including invalid EDN, missing query text, and optional inputs parsing.
I will add a unit test that verifies the query command returns the same shape as datascript-query without transformation.
I will follow @test-driven-development and write the failing tests before implementing behavior.

NOTE: I will write *all* tests before I add any implementation behavior.

## Plan

Create a new command module at src/main/logseq/cli/command/query.cljs that defines the query command spec and action builder.
Use --query for the Datascript query form and --inputs for the optional EDN inputs vector, and parse them with cljs.reader/read-string or logseq.common.util/safe-read-string with error handling.
Return a structured action map that includes :type :query, :repo, :query, and :inputs to keep execution isolated from parsing.
Register the new command in src/main/logseq/cli/commands.cljs and include it in the command table so help output includes query.
Update src/main/logseq/cli/main.cljs usage text to include query in the command list.
Implement execution in src/main/logseq/cli/command/query.cljs using logseq.cli.transport/invoke with :thread-api/q and args [repo [query & inputs]].
Return the raw Datascript result as-is, matching datascript-query output across human, json, and edn formats.
Add formatting in src/main/logseq/cli/format.cljs for :query to render the raw result in human output and pass-through for json or edn output.
Add command-level validation in src/main/logseq/cli/commands.cljs to return a missing-query error when no query is supplied.
Update src/test/logseq/cli/commands_test.cljs to expect query in help output and to validate parse errors for missing query or invalid input.
Add a CLI integration test in src/test/logseq/cli/integration_test.cljs that uses run-cli to execute query and verifies IDs in JSON output.
Confirm that no db-worker-node changes are required by verifying that :thread-api/q continues to accept the same argument shape in src/main/frontend/worker/db_core.cljs.

## Edge cases

A query string that cannot be read as EDN should return a clear invalid-options error and a non-zero exit code.
A query that returns no results should return an empty result with a successful status.
Queries with :in parameters should work when --inputs supplies the matching values in order.

## Testing Details

The integration test will create a graph, add known blocks, run a query that finds those blocks, and verify that the output matches the datascript-query result shape.
The unit tests will assert that parsing rejects invalid EDN for --inputs, that a missing query produces a :missing-query error, and that query execution returns raw results unchanged.

## Implementation Details

- Add a new command module at src/main/logseq/cli/command/query.cljs.
- Add command entries in src/main/logseq/cli/commands.cljs.
- Add output formatting in src/main/logseq/cli/format.cljs.
- Update usage text in src/main/logseq/cli/main.cljs.
- Use transport/invoke with :thread-api/q and [repo [query & inputs]].
- Return datascript-query results without transformation.
- Keep all argument parsing and validation inside query command module using --query and --inputs.
- Keep db-worker-node changes to zero unless a new worker API is required.
- Add `custom-queries` to cli.edn for storing pre-defined Datascript queries that the CLI can list and run by name.
- Add built-in queries that appear in the query list alongside custom queries.
- Optional inputs should support default values in cli.edn, and built-in queries should ship with reasonable defaults for their optional inputs (required inputs can omit defaults).
  - `block-search` (search-title)
    ```
    [:find [?e ...]
           :in $ ?search-title
           :where
           [?e :block/title ?title]
           [(clojure.string/lower-case ?title) ?title-lower-case]
           [(clojure.string/include? ?title-lower-case ?search-title)]]
    ```
  - `task-search` (search-status, ?search-title, ?recent-days)
    ```
    ;; Modify this query so search-title and recent-days are optional parameters.
    ;; ?now-ms is injected by the CLI so users don't need to pass it (and should be hidden in query list output).
    ;; Example: logseq query --name task-search --inputs '["doing"]'
    [:find [?e ...]
           :in $ ?search-status ?search-title ?recent-days ?now-ms
           :where
           [?e :block/title ?title]
           [?e :logseq.property/status ?s]
           [?s :db/ident ?status-ident]
           [(= ?status-ident ?search-status)]
           [(clojure.string/lower-case ?title) ?title-lower-case]
           (or-join [?search-title ?title-lower-case]
                    [(nil? ?search-title)]
                    [(clojure.string/blank? ?search-title)]
                    (and [(clojure.string/lower-case ?search-title) ?search-title-lower-case]
                         [(clojure.string/include? ?title-lower-case ?search-title-lower-case)]))
           [(get-else $ ?e :block/updated-at 0) ?updated-at]
           (or
            [(nil? ?recent-days)]
            (and [(number? ?recent-days)]
                 [(<= ?recent-days 0)])
            (and [(number? ?recent-days)]
                 [(>= ?updated-at (- ?now-ms (* ?recent-days 86400000)))]) )]
    ```

## cli.edn query shape

Represent queries as a map keyed by query name. Keep the query form as EDN data (not a string) so it can be read directly. Optional fields like `:doc` and `:inputs` are included to help with listing and UX. `:inputs` should allow optional inputs to declare default values that are used when the CLI caller omits them. Internal inputs like `?now-ms` should be hidden from `query list` output.

Suggested `:inputs` shapes:
- `["search-status" "?search-title" "?recent-days"]` (legacy string-only form)
- `[{:name "search-status"} {:name "?search-title" :default nil} {:name "?recent-days" :default nil}]` (explicit defaults)

Example:
```
{:custom-queries
 {"block-search"
  {:doc "Find blocks by title substring (case-insensitive)."
   :inputs ["search-title"]
   :query [:find [?e ...]
           :in $ ?search-title
           :where
           [?e :block/title ?title]
           [(clojure.string/lower-case ?title) ?title-lower-case]
           [(clojure.string/include? ?title-lower-case ?search-title)]]}

  "task-search"
  {:doc "Find tasks by status, optional title substring, optional recent-days."
   :inputs [{:name "search-status"}
            {:name "?search-title" :default nil}
            {:name "?recent-days" :default nil}
            ;; ?now-ms is internal; CLI fills it with current ms and query list should hide it.
            {:name "?now-ms" :default :now-ms}]
   :query [:find [?e ...]
           :in $ ?search-status ?search-title ?recent-days ?now-ms
           :where
           [?e :block/title ?title]
           [?e :logseq.property/status ?s]
           [?s :db/ident ?status-ident]
           [(= ?status-ident ?search-status)]
           [(clojure.string/lower-case ?title) ?title-lower-case]
           (or-join [?search-title ?title-lower-case]
                    [(nil? ?search-title)]
                    [(clojure.string/blank? ?search-title)]
                    (and [(clojure.string/lower-case ?search-title) ?search-title-lower-case]
                         [(clojure.string/include? ?title-lower-case ?search-title-lower-case)]))
           [(get-else $ ?e :block/updated-at 0) ?updated-at]
           (or
            [(nil? ?recent-days)]
            (and [(number? ?recent-days)]
                 [(<= ?recent-days 0)])
            (and [(number? ?recent-days)]
                 [(>= ?updated-at (- ?now-ms (* ?recent-days 86400000)))]) )]}}}
```

Notes:
- Built-in queries live in code but should be merged into the same map shape when listing or resolving by name.
- `:inputs` is optional metadata for CLI help. It does not affect execution.
## Question

Use --query and --inputs options for the query subcommand.
Output should mirror datascript-query for scripting stability.

---
