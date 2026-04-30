# Logseq CLI List Property Cardinality Column Plan

Goal: Add a `CARDINALITY` column to `logseq list property` output, aligned with the existing `TYPE` column behavior and powered by current `logseq-cli -> db-worker-node` thread-api flow.

Architecture: Keep the transport contract unchanged (`:thread-api/cli-list-properties`) and extend the property list payload shape plus human formatter columns.

Tech Stack: ClojureScript, Datascript, Promesa, `logseq.cli.command.list`, `logseq.cli.common.db-worker`, `frontend.worker.db-core`, `logseq.cli.format`.

Related:
- `docs/agent-guide/045-logseq-cli-property-type-and-upsert-option-unification.md`
- `docs/agent-guide/064-logseq-cli-integration-test-shell-refactor.md`
- `docs/cli/logseq-cli.md`

## Problem Statement

`list property` currently includes `TYPE` in default output, but it does not show property cardinality in human tables.

In current implementation:
- CLI list execution (`src/main/logseq/cli/command/list.cljs`) already supports property-specific fields and formatting hooks.
- db-worker thread API (`src/main/frontend/worker/db_core.cljs`) already routes `:thread-api/cli-list-properties` to `logseq.cli.common.db-worker/list-properties`.
- Property list payload currently includes `:logseq.property/type` in non-expanded mode, but does not guarantee cardinality is present for all properties.
- Human formatter (`src/main/logseq/cli/format.cljs`) has no `CARDINALITY` column for `:list-property`.

Users cannot quickly inspect whether a property is `one` or `many` from the list table.

## Current Data Flow (Baseline)

```text
logseq list property
  -> src/main/logseq/cli/command/list.cljs execute-list-property
  -> transport/invoke :thread-api/cli-list-properties
  -> db-worker-node /v1/invoke forwarding
  -> src/main/frontend/worker/db_core.cljs :thread-api/cli-list-properties
  -> src/main/logseq/cli/common/db_worker.cljs list-properties
  -> back to CLI formatter src/main/logseq/cli/format.cljs
```

This flow is already correct and should be preserved. The change is additive in payload fields and table rendering.

## Target Contract

1. Human output for `list property` includes a `CARDINALITY` column by default.
2. Cardinality values render as `one` or `many` (not raw Datascript keywords).
3. If a property has no explicit `:db/cardinality`, treat it as `one` (Datascript default semantics).
4. For `--output json`, property items expose cardinality via `cardinality` (string `"one"` or `"many"`).
5. For `--output edn`, property items expose cardinality via `:db/cardinality`.
6. `--fields` and `--sort` for `list property` can reference `cardinality`.
7. Existing thread-api method names and db-worker-node invoke protocol remain unchanged.

## Design Decisions

### 1) Cardinality source of truth

Use `:db/cardinality` from property entity returned by Datascript.

Normalization rule:
- `:db.cardinality/many` => `many`
- `:db.cardinality/one` or missing value => `one`

### 2) Payload layer behavior

In `src/main/logseq/cli/common/db_worker.cljs` `list-properties`:
- Ensure non-expanded list items always include `:db/cardinality`.
- For entities missing explicit cardinality, populate `:db/cardinality :db.cardinality/one`.
- Keep existing behavior for `:logseq.property/type`, classes, description, and built-in filtering.

### 3) CLI list command behavior

In `src/main/logseq/cli/command/list.cljs`:
- Extend `list-property-field-map` with `"cardinality" -> :db/cardinality`.
- Keep existing default option behavior (`--with-type` remains unchanged).
- Reuse existing `apply-sort` / `apply-fields` pipeline so cardinality works with no new execution path.

### 4) Human formatter behavior

In `src/main/logseq/cli/format.cljs`:
- Add a cardinality normalization helper (similar style to `normalize-property-type`).
- Add `CARDINALITY` to `list-property-columns` near `TYPE`.
- Render `one` / `many`, and fallback to `-` only for truly unknown values.

### 5) Structured output key behavior

- Keep payload source key as `:db/cardinality` in command/data layer.
- In JSON formatting path, map property-list item key `db/cardinality` to `cardinality`.
- EDN output keeps `:db/cardinality` unchanged.

## Implementation Plan (TDD Order)

1. Add failing formatter tests in `src/test/logseq/cli/format_test.cljs`:
   - `list property` table includes `CARDINALITY` header.
   - `:db.cardinality/many` renders `many`.
   - missing/`one` cardinality renders `one`.

2. Add failing db-worker payload tests in `src/test/logseq/cli/common/db_worker_test.cljs`:
   - non-expanded `list-properties` includes `:db/cardinality` key.
   - custom property created without explicit cardinality still yields `:db.cardinality/one`.

3. Add failing output-format tests in `src/test/logseq/cli/format_test.cljs`:
   - JSON output for `list property` uses `cardinality` key.
   - EDN output for `list property` keeps `:db/cardinality`.

4. Add failing command parsing/execution tests in `src/test/logseq/cli/commands_test.cljs`:
   - `list property --fields name,type,cardinality` parses successfully.
   - `list property --sort cardinality` is accepted and sorted through existing pipeline.

5. Implement payload update in `src/main/logseq/cli/common/db_worker.cljs`.

6. Implement field-map update in `src/main/logseq/cli/command/list.cljs`.

7. Implement formatter updates in `src/main/logseq/cli/format.cljs`:
   - human `CARDINALITY` column + value normalization.
   - JSON key remap `db/cardinality` -> `cardinality` for `:list-property`.

8. Update CLI docs in `docs/cli/logseq-cli.md`:
   - document `CARDINALITY` as default `list property` column.
   - document JSON key `cardinality` and EDN key `:db/cardinality`.
   - mention default semantics (`one` when omitted in schema).

9. Update shell e2e spec in `cli-e2e/spec/non_sync_cases.edn`:
   - extend `property-upsert-and-list-json` expectation to include `cardinality` field/value.

10. Run focused tests, then broader regression suite.

## Files to Touch

- `src/main/logseq/cli/common/db_worker.cljs`
  - include normalized cardinality in property list payload.

- `src/main/logseq/cli/command/list.cljs`
  - add `cardinality` field mapping for sort/fields.

- `src/main/logseq/cli/format.cljs`
  - add `CARDINALITY` column and render normalization.

- `src/test/logseq/cli/common/db_worker_test.cljs`
  - contract tests for property list payload cardinality.

- `src/test/logseq/cli/commands_test.cljs`
  - parser/sort/fields coverage for new property field.

- `src/test/logseq/cli/format_test.cljs`
  - human table assertions with cardinality column.

- `cli-e2e/spec/non_sync_cases.edn`
  - structured output expectation coverage.

- `docs/cli/logseq-cli.md`
  - user-facing command/output reference update.

## Verification Commands

| Command | Expected |
| --- | --- |
| `bb dev:test -v logseq.cli.format-test/test-human-output-list-tag-property` | Property table assertions pass with `CARDINALITY`. |
| `bb dev:test -v logseq.cli.common.db-worker-test` | Non-expanded property payload includes cardinality contract. |
| `bb dev:test -v logseq.cli.commands-test/test-list-subcommand-parse` | `cardinality` fields/sort parsing passes. |
| `bb -f cli-e2e/bb.edn test --skip-build` | Non-sync CLI e2e list/property cases pass. |
| `bb dev:lint-and-test` | Full lint/test suite remains green. |

## Risks and Mitigation

- Risk: Some properties may not explicitly store `:db/cardinality`, causing missing-column behavior.
  - Mitigation: Normalize missing to `:db.cardinality/one` in payload layer.

- Risk: Human output snapshot expectations may break due to added column width/layout.
  - Mitigation: Update formatter tests with explicit expected tables.

- Risk: Structured output consumers may rely on previous key set.
  - Mitigation: This is additive only; do not remove or rename existing fields.

## Out of Scope

- Adding a new CLI option such as `--with-cardinality`.
- Changing thread-api names or db-worker-node HTTP protocol.
- Changing `upsert property` cardinality semantics.

## Decision

- JSON output uses `cardinality`.
- EDN output uses `:db/cardinality`.

Implementation note: keep command/data layer on `:db/cardinality`, and apply JSON-only key remapping in formatting path for `:list-property`.
