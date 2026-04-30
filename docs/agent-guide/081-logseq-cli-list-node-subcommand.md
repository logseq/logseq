# Logseq CLI `list node` Subcommand Implementation Plan

Goal: add a new `list node` subcommand to the existing `logseq-cli` surface so users can list ordinary nodes (both blocks and pages) filtered by tags and/or properties.

Architecture: keep the current `logseq-cli -> command parse/build -> transport/invoke -> db-worker-node thread-api` flow and implement filter query logic in db-worker helpers.

Architecture: reuse existing identifier resolution patterns from current CLI commands (especially tag/property resolution in `add.cljs`) instead of introducing a second resolver system.

Tech Stack: ClojureScript, `babashka.cli`, Datascript query/datoms, `promesa`, current formatter/command framework.

Related:
- `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/078-logseq-cli-task-subcommands.md`
- `/Users/rcmerci/gh-repos/logseq/docs/agent-guide/062-cli-list-default-sort-updated-at.md`
- `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md`

## Problem statement

Current CLI has `list page`, `list tag`, `list property`, and `list task`, but no generic `list node` path for querying ordinary content nodes by tag/property constraints.

Users need a first-class command that can return both pages and blocks, with script-friendly filter options:

- `--tags <tag1>,<tag2>,<tag3>`
- `--properties <prop1>,<prop2>,<prop3>`

Each filter item must support `id` / `uuid` / `ident` / `block-name`, and command execution must require at least one filter (`--tags` or `--properties`) to avoid returning unbounded node sets.

## Current baseline from implementation

### 1) List command framework is centralized and reusable

`/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/list.cljs` already provides:

- `list-common-spec` (`--expand`, `--fields`, `--limit`, `--offset`, `--sort`, `--order`)
- shared helpers (`apply-sort`, `apply-offset-limit`, `apply-fields`)
- per-subcommand field maps and execute functions

This is the natural place to add `list-node-spec`, `list-node-field-map`, and `execute-list-node`.

### 2) db-worker list read logic already lives in one namespace

`/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/common/db_worker.cljs` holds `list-pages`, `list-tags`, `list-properties`, and `list-tasks`.

`/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` exposes them via `:thread-api/cli-list-*` endpoints.

A new `list-nodes` helper and `:thread-api/cli-list-nodes` should follow this same pattern.

### 3) Existing resolver utilities already cover most selector forms

`/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs` already contains reusable resolution logic:

- tags: `resolve-tag-entity` / `resolve-tags` (supports id/uuid/ident/name through typed inputs)
- properties: `resolve-property-identifiers` with `:allow-non-built-in? true` (supports id/ident/name)

Gap to close for this plan:

- property selector by `uuid` is not currently supported in property resolver path and should be added for parity with the requested contract.

### 4) Command wiring and formatting are explicit and easy to extend

- Command dispatch/build/validation currently enumerates list commands in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`.
- Human output table formatting for list commands is in `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs`.
- Command parser and behavior tests already exist in:
  - `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`
  - `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/common/db_worker_test.cljs`
  - `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs`

## Command contract

## CLI syntax

```text
logseq list node --graph <name> [--tags <csv>] [--properties <csv>] [common list options]
```

## Required filters

At least one of the following must be present:

- `--tags`
- `--properties`

If both are missing, return `:invalid-options` with a clear message:

```text
list node requires at least one of --tags or --properties
```

## Filter options

### `--tags`

`--tags <tag1>,<tag2>,<tag3>`

Each tag token supports:

- `id` (numeric)
- `uuid`
- `ident` (keyword form)
- `block-name` (tag page name)

### `--properties`

`--properties <prop1>,<prop2>,<prop3>`

Each property token supports:

- `id` (numeric)
- `uuid`
- `ident` (keyword form)
- `block-name` (property page name)

## Filter semantics

- CSV tokens are trimmed; blank tokens are ignored.
- After normalization, empty filter lists are invalid.
- `--tags a,b` means node must contain **all** resolved tag selectors.
- `--properties x,y` means node must contain **all** resolved property selectors.
- If both are provided, result must satisfy both groups (logical AND).

## Node scope

`list node` returns ordinary content nodes of two kinds:

- pages
- blocks

Planned implementation should exclude schema-definition entities (for example, tag/property definition pages) so output focuses on content nodes.

## Optional options (aligned with existing list commands)

`list node` should support the same common list options already used by existing list subcommands:

- `--expand`
- `--fields <csv>`
- `--limit <n>`
- `--offset <n>`
- `--sort <field>` (default `updated-at`)
- `--order asc|desc`

## Proposed sortable/field keys for `list node`

MVP field map:

- `id` -> `:db/id`
- `ident` -> `:db/ident`
- `title` -> `:block/title`
- `uuid` -> `:block/uuid`
- `type` -> `:node/type` (`"page"` or `"block"`)
- `page-id` -> `:block/page-id` (for blocks)
- `page-title` -> `:block/page-title` (for blocks)
- `created-at` -> `:block/created-at`
- `updated-at` -> `:block/updated-at`

## Design details

### A) CLI parsing and validation (`list.cljs` + `commands.cljs`)

1. Add `list-node-field-map` and `list-node-spec` in `list.cljs`.
2. Add new command entry:
   - `[["list" "node"] :list-node ...]`
3. Add CSV parser helper for selector options (`--tags` and `--properties`).
4. Extend `invalid-options?` handling so `list node` enforces required filter presence without changing behavior of existing list subcommands.
5. Wire `:list-node` through `commands.cljs` parse/build/execute branches.

### B) Selector resolution strategy

Resolve filters in CLI layer before invoking db-worker:

- Tags:
  - normalize token to typed selector (id/uuid/ident/name)
  - resolve via existing tag resolver flow in `add.cljs`
  - pass resolved tag ids to db-worker

- Properties:
  - extend resolver support to include uuid-based property lookup
  - resolve to canonical property idents
  - pass resolved property idents to db-worker

This keeps db-worker focused on DB filtering, while CLI owns user-facing selector parsing/errors.

### C) db-worker query strategy (`db_worker.cljs`)

Add `list-nodes` function with options shape like:

```clojure
{:tag-ids [...]
 :property-idents [...]
 :expand true|false}
```

Implementation outline:

1. Build candidate ordinary-node set (pages + blocks, excluding schema-definition entities).
2. Apply tag intersection filter using `:block/tags` refs against resolved tag ids.
3. Apply property-presence intersection filter by checking node datoms for each resolved property ident.
4. Return minimal list item by default; include richer payload when `:expand true`.
5. Include `:node/type` and block page context fields for downstream formatting/fields selection.

### D) thread-api exposure (`db_core.cljs`)

Add and wire:

- `:thread-api/cli-list-nodes` -> `cli-db-worker/list-nodes`

### E) Output formatting (`format.cljs`)

Add `list-node` formatter branch with dedicated columns (including `TYPE`) and title width behavior identical to other list commands.

### F) Completion/docs/e2e alignment

Update:

- command docs (`docs/cli/logseq-cli.md`)
- command summary/help tests
- optional completion tests if option specs affect completion surface
- CLI e2e inventory/cases for new command coverage

## Step-by-step implementation plan (TDD first)

1. Add RED parser tests for `list node` command recognition and option parsing.
2. Add RED validation tests asserting `list node` fails without `--tags` and `--properties`.
3. Add RED tests for CSV parsing/normalization behavior for both filters.
4. Add RED resolver tests for tag/property selectors covering id/uuid/ident/block-name.
5. Add RED db-worker tests for node filtering semantics (all-of tags, all-of properties, combined AND).
6. Implement resolver extensions (including property uuid support).
7. Implement `list-node-spec`, command entry, action build, and execute path.
8. Implement `cli-list-nodes` thread-api and `list-nodes` db-worker helper.
9. Add/adjust formatter for human list-node output and structured output shape.
10. Update command docs and e2e inventory/cases.
11. Run focused tests, then full lint/test.

## Files expected to change

Core implementation:

- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/list.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/add.cljs` (property uuid resolution support)
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/common/db_worker.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/format.cljs`

Tests:

- `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/common/db_worker_test.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/completion_generator_test.cljs` (if option completion changes)

Docs/e2e:

- `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md`
- `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_inventory.edn`
- `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn`

## Testing plan

I will follow `@test-driven-development` and add failing tests before implementation changes.

Focused verification commands:

- `bb dev:test -v logseq.cli.commands-test`
- `bb dev:test -v logseq.cli.common.db-worker-test`
- `bb dev:test -v logseq.cli.format-test`
- `bb dev:test -v logseq.cli.completion-generator-test` (if touched)
- `bb -f cli-e2e/bb.edn test --skip-build` (if e2e specs changed)
- `bb dev:lint-and-test`

## Risks and mitigations

Risk: property selector normalization can be ambiguous between ident and block-name.

Mitigation: define deterministic precedence (id -> uuid -> explicit keyword ident -> block-name fallback) and lock with tests.

Risk: filtering large graphs by multiple property idents can be slow.

Mitigation: use set-intersection style filtering and limit payload in non-expand mode.

Risk: “ordinary node” definition drift (schema entities leaking into output).

Mitigation: encode explicit exclusion rules in db-worker tests.

## Acceptance criteria

1. `logseq list node` exists and is documented.
2. It returns both block and page nodes (ordinary content nodes).
3. `--tags` accepts comma-separated selectors and supports id/uuid/ident/block-name.
4. `--properties` accepts comma-separated selectors and supports id/uuid/ident/block-name.
5. At least one of `--tags` or `--properties` is required; otherwise command returns `:invalid-options`.
6. Common list options (`--expand`, `--fields`, `--limit`, `--offset`, `--sort`, `--order`) are supported.
7. Unit and e2e coverage is updated and green.

## Open question

No blocking question for this phase.

---
