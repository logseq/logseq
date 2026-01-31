# Logseq CLI Built-in Status/Priority Queries Plan

Goal: Add built-in `query` names `list-status` and `list-priority` that return the available Status/Priority options from a graph.
Architecture: Keep the existing logseq-cli → db-worker-node transport and thread-api usage; implement `list-status`/`list-priority` via `:thread-api/q` rather than adding a dedicated thread-api.
Tech Stack: ClojureScript, logseq-cli, db-worker-node, Datascript, logseq.db.frontend.property.
Related: `src/main/logseq/cli/command/query.cljs`, `src/main/frontend/worker/db_core.cljs`, `deps/db/src/logseq/db/frontend/property.cljs`.

## Problem Statement

Logseq CLI’s `query` built-ins are limited to Datascript queries. Users cannot easily discover valid Status or Priority options for a graph (e.g., TODO/DOING/DONE, Urgent/High/Low) without knowing the property internals or running custom queries. We need simple built-ins that list the closed values configured for Status and Priority.

## Non-Goals

- Changing property schemas or defaults.
- Replacing the existing Datascript query flow.
- Adding new UI commands outside `query` or changing CLI output formats.

## Current Behavior (Key Points)

- Built-in queries are defined in `built-in-query-specs` in `src/main/logseq/cli/command/query.cljs` and executed via `:thread-api/q`.
- Status and Priority options are stored as closed values on `:logseq.property/status` and `:logseq.property/priority` (see `logseq.db.frontend.property/get-closed-property-values`).
- There is no CLI helper to list those closed values.

## Proposed Changes

1) **Use `:thread-api/q` for closed values**
   - Implement `list-status`/`list-priority` by issuing a Datascript query via `:thread-api/q`.
   - Return a vector of maps with `:db/ident` and `:db/id`.
   - Use `:find` with an ellipsis form to return a vector, e.g. `:find [(pull ?e [:db/ident :db/id]) ...]` (instead of `:find (pull ?e [:db/ident :db/id])`).

2) **Add built-in query names `list-status` and `list-priority`**
   - Add entries to `built-in-query-specs` that specify a non-Datascript execution path (e.g., `:method`/`:handler` metadata).
   - Wire `build-action` to create a dedicated action type when these names are used.
   - Update `execute-query` to call the new thread API and return results as `{:result ["TODO" ...]}` so existing output formatting works unchanged.

3) **Expose built-ins in `query list`**
   - Ensure `query list` includes the new entries (with `doc` and `inputs: []`).
   - Keep existing “custom overrides built-in” semantics.

## Implementation Plan

1) **db-worker-node API**
   - No new thread-api should be added; use `:thread-api/q` only.

2) **CLI built-in wiring**
   - Extend `built-in-query-specs` in `src/main/logseq/cli/command/query.cljs`:
     - `list-status` → `:property-ident :logseq.property/status`
     - `list-priority` → `:property-ident :logseq.property/priority`
     - Include `:doc` and `:inputs []`.
   - Update `normalize-query-entry` / `find-query` handling to preserve the extra metadata.
   - Update `build-action`:
     - When the built-in includes a `:property-ident` (or `:method`), create an action like
       `{:type :query-closed-values :repo ... :property-ident ...}`.
   - Update `execute-query`:
   - Branch on the new action type to call `transport/invoke` with `:thread-api/q` and return `{:result values}` (vector of maps with `:db/ident` and `:db/id`).

3) **Output and docs**
   - No change to formatters; `format-query-results` already prints vectors.
   - Update CLI docs if needed (e.g., `docs/cli/logseq-cli.md`) to mention the two built-ins.

## Testing Plan

- **Unit tests** (`src/test/logseq/cli/command/query_test.cljs`):
  - `list-queries` includes `list-status` and `list-priority` with empty inputs.
  - `build-action` for `--name list-status` returns `:query-closed-values` action with property ident.
  - Custom query overrides built-in name still works.

- **db-worker-node tests**: no new thread-api, so no additional db-worker-node test needed.

- **Integration** (`src/test/logseq/cli/integration_test.cljs`):
  - Start a graph, run `logseq query --name list-status` / `list-priority`, assert status `ok` and a non-empty vector.
  - If stable defaults are known, assert a known value is present; otherwise, seed closed values in the test graph.

## Edge Cases

- Property has no closed values → return an empty vector (not an error).
- Closed values may be stored in either `:block/title` or `:logseq.property/value`; if `:db/ident` is absent, the map should still include the key with a nil value.
- Ensure ordering follows `:block/order` from `get-closed-property-values`.

## Files to Touch

- `src/main/frontend/worker/db_core.cljs` (no new thread-api)
- `src/main/logseq/cli/command/query.cljs` (built-in specs, build-action branching, execute-query)
- `src/test/logseq/cli/command/query_test.cljs` (unit coverage)
- `src/test/frontend/worker/db_worker_node_test.cljs` or a db-core test (not required for new thread-api)
- `src/test/logseq/cli/integration_test.cljs` (CLI end-to-end)
- `docs/cli/logseq-cli.md` (optional docs update)

## Open Questions

- Use `:thread-api/q` to return structured values: `{:db/ident .., :db/id ..}`.
- Expose `list-status`/`list-priority` via `query --name` only (no dedicated subcommands).

---
