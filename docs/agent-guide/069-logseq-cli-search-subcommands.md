# Logseq CLI Search Verb Subcommands Implementation Plan

Goal: Add `search` verb subcommands to `logseq-cli` with explicit entity scopes:
- `search block` searches `:block/title`
- `search page` searches `:block/name`
- `search property` searches `:block/title` but only for Property entities
- `search tag` searches `:block/title` but only for Tag entities

Architecture: Follow the current `logseq-cli -> db-worker-node thread-api -> db_core -> logseq.cli.common.db-worker` split already used by `list` commands.
Architecture: Keep search logic in db-worker-side helper functions and keep CLI command namespaces focused on parsing, action building, transport invocation, and output formatting.

Tech Stack: ClojureScript, `babashka.cli`, `promesa`, Datascript datoms, existing `db-worker-node` HTTP `/v1/invoke` transport.

Related:
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/list.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/common/db_worker.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs`
- `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md`

## Problem statement

The current main CLI command system (`src/main/logseq/cli/command/*` + `src/main/logseq/cli/commands.cljs`) has no active `search` command entries, so users cannot run first-class search commands in the current verb-subcommand architecture.

At the same time, search behavior is still documented in older single-command form in `docs/cli/logseq-cli.md`, which is now out of sync with the current implementation structure.

We need a new canonical `search` command group aligned with the current CLI design and db-worker-node execution model.

## Current implementation baseline

`logseq-cli` command parsing and dispatch are centralized in:
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs`

Entity list commands already use this pattern:
1. parse/build action in command namespace (`list.cljs`)
2. invoke thread-api via transport (`:thread-api/cli-list-*`)
3. execute in db worker (`db_core.cljs`)
4. query helper in `logseq.cli.common.db-worker`

db-worker-node HTTP invoke routing is generic (`/v1/invoke`) and does not require per-method route wiring for new read-only thread-api methods, as long as method names are registered via `def-thread-api` in `db_core.cljs`.

## Target behavior

### Command UX

```text
logseq search block <query> --graph <name>
logseq search page <query> --graph <name>
logseq search property <query> --graph <name>
logseq search tag <query> --graph <name>
```

`<query>` is required positional text for all `search` subcommands.

### Query semantics

| Subcommand | Match field | Extra constraint |
| --- | --- | --- |
| `search block` | `:block/title` | none |
| `search page` | `:block/name` | entity is a page (`:block/name` datoms) |
| `search property` | `:block/title` | entity is tagged with `:logseq.class/Property` |
| `search tag` | `:block/title` | entity is tagged with `:logseq.class/Tag` |

### Result shape

Use list-style result contract for consistency:
- action result: `{:status :ok :data {:items [...]}}`
- JSON/EDN keeps machine-readable item maps
- human output uses table formatting and `Count: N`

## Scope

In scope:
- Add `search` command group with four subcommands.
- Add parsing/validation/build-action/execute paths.
- Add db-worker read-only query helpers and thread-api methods.
- Add human/json/edn output support for new command types.
- Update command docs and CLI e2e coverage specs.

Out of scope:
- Re-introducing legacy `search --type ...` monolithic command shape.
- Full-text or vector search integration.
- Additional filters (tag filter, case-sensitive toggle, sort options) in this first pass.

## Testing Plan

I will follow `@test-driven-development` and add failing tests first.

1. Add parse/help tests in `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` for:
   - `search` group help
   - `search block/page/property/tag` parse success
   - missing query validation
2. Add command build/execute unit tests in new namespace:
   - `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/search_test.cljs`
3. Add db-worker helper tests in:
   - `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/common/db_worker_test.cljs`
   covering each new search function against fixture data.
4. Add output-format tests in:
   - `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs`
   for human/json/edn search outputs.
5. Add command table/completion expectations in:
   - `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/completion_generator_test.cljs`
6. Add/extend non-sync e2e cases:
   - `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn`
   - `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_inventory.edn`

## Implementation plan

1. Create `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/search.cljs` with four `entries`:
   - `search block`
   - `search page`
   - `search property`
   - `search tag`

2. In `search.cljs`, add shared build helpers to:
   - validate required positional query text
   - produce action map `{:type :search-<kind> :repo ... :query ...}`

3. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`:
   - require `logseq.cli.command.search`
   - add `search-command/entries` to command table
   - add missing-query-text validation branch for search commands
   - wire build-action case for `:search-block/:search-page/:search-property/:search-tag`
   - wire execute case to call `search-command/execute-*`

4. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs` top-level summary groups to include `search` under Graph Inspect and Edit.

5. Implement execute functions in `search.cljs` to use `transport/invoke` with new thread-api methods:
   - `:thread-api/cli-search-blocks`
   - `:thread-api/cli-search-pages`
   - `:thread-api/cli-search-properties`
   - `:thread-api/cli-search-tags`

6. Extend `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` with corresponding `def-thread-api` entries that delegate to `logseq.cli.common.db-worker`.

7. Extend `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/common/db_worker.cljs` with pure read helpers:
   - `search-blocks`
   - `search-pages`
   - `search-properties`
   - `search-tags`

8. For property/tag searches, implement class filtering by reusing existing class-tag patterns used by list helpers:
   - property: datoms on `:block/tags` with value `:logseq.class/Property`
   - tag: datoms on `:block/tags` with value `:logseq.class/Tag`

9. For block/page searches, implement substring matching over:
   - block: `:block/title`
   - page: `:block/name`
   using case-insensitive normalized matching.

10. Reuse list-style item shapes (id/title/timestamps/ident when available) so formatters can stay consistent.

11. Update `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` with command cases for:
   - `:search-block`
   - `:search-page`
   - `:search-property`
   - `:search-tag`
   mapping to existing list-table formatting helpers where possible.

12. Update user docs in `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md`:
   - replace old monolithic search syntax with new verb subcommands
   - document exact field semantics for each search subcommand.

13. Update CLI e2e inventory/spec files to include the new search command group and at least one positive case per subcommand.

14. Run focused tests and then full local suite:
   - `bb dev:test -v logseq.cli.commands-test`
   - `bb dev:test -v logseq.cli.command.search-test`
   - `bb dev:test -v logseq.cli.common.db-worker-test`
   - `bb dev:test -v logseq.cli.format-test`
   - `bb dev:test -v logseq.cli.completion-generator-test`
   - `bb -f cli-e2e/bb.edn test --skip-build`
   - `bb dev:lint-and-test`

## File-by-file change map

| File | Change |
| --- | --- |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/search.cljs` | New search command namespace: entries, build, execute. |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs` | Register search commands and dispatch/build/validation integration. |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/core.cljs` | Include `search` in top-level help group summary. |
| `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` | Add `def-thread-api` search methods. |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/common/db_worker.cljs` | Add search helper implementations per entity type. |
| `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs` | Add human output mapping for search command types. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs` | Add parser/help/validation tests for search group. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/command/search_test.cljs` | New unit tests for search action build + execute. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/common/db_worker_test.cljs` | Add db-level search behavior tests. |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` | Add search output tests (human/json/edn). |
| `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/completion_generator_test.cljs` | Ensure completion includes search subcommands. |
| `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn` | Add non-sync e2e coverage for search subcommands. |
| `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_inventory.edn` | Add search command/options inventory entries. |
| `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md` | Update search documentation to new verb-subcommand UX. |

## Edge cases

- Empty or whitespace-only query should return a clear invalid-options error with hint.
- Page search must use `:block/name` matching even when title differs.
- Property/tag search must not return non-property/non-tag pages with similar titles.
- Search should gracefully return empty list (`Count: 0`) when no matches.
- Human output should remain stable for multiline titles (table alignment already handled by formatter utilities).

## Rollout notes

This change is additive for command surface area and aligns implementation with current CLI architecture.

No db-worker-node HTTP contract changes are required, only additional thread-api methods.

Docs currently mention a legacy search syntax; this plan explicitly updates docs to avoid user confusion.

## Open questions

None for this scope.
