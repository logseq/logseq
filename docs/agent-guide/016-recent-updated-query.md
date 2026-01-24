# Recent Updated Query Implementation Plan

Goal: Add a built-in CLI query named recent-updated that filters entities updated within a configurable recent-days window.

Architecture: The logseq CLI will expose a new built-in query spec in the query command module and pass inputs to db-worker-node via thread-api/q with no db-worker-node changes.
The query will rely on :block/updated-at and a now-ms input to compute a rolling cutoff in milliseconds.

Tech Stack: ClojureScript, Datascript queries, logseq CLI, db-worker-node thread-api.

Related: Builds on 015-logseq-cli-db-worker-node-housekeeping.md.

## Problem statement

Users need a built-in CLI query to list recently updated content without crafting ad hoc datalog each time.
The new recent-updated query should accept a recent-days parameter and integrate with existing logseq CLI query listing and execution paths.
The implementation must align with db-worker-node query execution and hide internal inputs from query list output.

## Testing Plan

I will add an integration test that creates a temporary graph, adds blocks, and runs the recent-updated query with a small recent-days window, asserting only recently updated entities are returned.
I will add a second integration test case in the same test to cover recent-days values of nil and non-positive numbers, confirming the CLI returns a clear invalid input error.
I will add a CLI query list assertion that recent-updated appears with the correct input spec and defaults, excluding the internal now-ms input from list output.
I will add a CLI show -id test to ensure duplicate trees are filtered when ids include parent/child relationships.
NOTE: I will write *all* tests before I add any implementation behavior.

## Implementation Plan

1. Write the failing integration test for recent-updated in `src/test/logseq/cli/integration_test.cljs` that uses `run-cli` to create a graph, insert blocks, and query by name, asserting the result is a vector of db/id values.
2. Write the failing assertion that `query list` returns a recent-updated entry with an inputs vector that only shows recent-days.
3. Run the single integration test to confirm failures are due to missing built-in query behavior.
4. Add a new built-in query spec entry in `src/main/logseq/cli/command/query.cljs` with name "recent-updated" and inputs [{:name "?recent-days" :default 0} {:name "?now-ms" :default :now-ms}].
5. Define the query to find entities that have :block/updated-at and apply an or-join to bypass filtering when recent-days is nil or <= 0.
6. Ensure the query result shape matches other built-ins and returns a vector of entity ids.
7. Run the integration test again and confirm it now passes.
8. Refactor the built-in query spec and test setup for clarity if necessary while keeping behavior unchanged.
9. Run the CLI integration test suite or the focused test case to ensure no regressions.
10. Update the show -id output path to drop contained trees when multiple ids overlap.

## Edge Cases and Considerations

- recent-days must be greater than 0, and nil or non-positive values should be rejected with a clear CLI error.
- Blocks without :block/updated-at should be excluded consistently and not cause query errors.
- The query should return both pages and blocks.
- The query should exclude built-in entities by default.

## Testing Details

The tests will exercise the CLI path end to end by invoking db-worker-node and asserting the query results contain only the expected entities based on updated-at timestamps.
The tests will validate both the query list metadata and the data returned from the query invocation.

## Implementation Details

- Add a new entry to built-in-query-specs in `src/main/logseq/cli/command/query.cljs`.
- Use :block/updated-at and a computed cutoff (now-ms minus recent-days in milliseconds) inside the datalog query, and enforce recent-days > 0 in CLI input validation.
- Keep the inputs list consistent with existing built-in queries and rely on hide-internal-inputs to remove ?now-ms from list output.
- Reuse the same optional input handling logic as task-search for recent-days defaults.
- Ensure the query name is normalized and discoverable via `logseq query list`.
- Return a vector of db/id values with no ordering guarantees, matching task-search behavior.
- Keep db-worker-node unchanged since it already supports arbitrary datascript queries via thread-api/q.

## Question

recent-updated must return both pages and blocks, and exclude built-in entities by default.
recent-days must be greater than 0, and nil or non-positive values should be treated as invalid input.
Results must be returned as an unordered vector of db/id values, and users should use logseq show to view content and apply sorting.

## Show -id duplicate filtering note

When `logseq show -id` is given multiple ids, the output can include duplicate trees if some ids are children of others.
Filter out smaller (contained) trees from the result, so only the largest parent tree is kept.

Example:

```text
logseq show -id [7830,7831,7832,7833]
7830 Jan 23rd, 2026 #Journal
7831 ├── asdfasdfasdf
7832 │   └── yyyy
7833 └── [[xxxx]] yyy
================================================================
7831 asdfasdfasdf
7832 └── yyyy
================================================================
7832 yyyy
================================================================
7833 [[xxxx]] yyy
```

---
