# Logseq CLI Status Option Cleanup Implementation Plan

Goal: align task-related CLI semantics by removing `--status` from `upsert block`, adding consistent `-c` aliases for all `--content` options, and improving invalid `--status` error output to include all available values.

Architecture: keep the current `logseq-cli -> command parse/build -> transport/invoke -> db-worker-node thread-api` flow, but move `--status` invalid-value reporting to runtime validation so it can use graph data.

Architecture: add a small db-worker-node read endpoint for task status values from the current graph, and reuse it in CLI command validation/error messaging.

Tech Stack: ClojureScript, `babashka.cli`, existing command modules under `src/main/logseq/cli/command/*`, formatter/error layer in `src/main/logseq/cli/format.cljs`.

Related: builds on `docs/agent-guide/078-logseq-cli-task-subcommands.md` and current command contracts in `docs/cli/logseq-cli.md`.

## Problem statement

Current `upsert block` still accepts `--status`, even though task semantics are already represented by `upsert task`.

Current `--content` aliasing is inconsistent: search/upsert already support `-c`, but `list task --content` does not.

Current invalid enum error output for `--status` does not list accepted values, which slows down CLI troubleshooting.

Example current output:

```text
logseq list task --status xxx
Error (invalid-options): Invalid value for option :status: xxx
```

Target UX should include available values in the error output.

## Current baseline from implementation

### 1) `upsert block --status` is currently part of command spec and update path

`src/main/logseq/cli/command/upsert.cljs` currently includes `:status` inside `upsert-block-spec` and examples include `upsert block --id 123 --status done`.

`upsert block` update mode currently delegates to `src/main/logseq/cli/command/update.cljs`, where `:status` is parsed/normalized and merged into `:update-properties` as `:logseq.property/status`.

### 2) `--content` aliasing is partly consistent

Current `:content` options with `:alias :c` exist in:

- `src/main/logseq/cli/command/search.cljs`
- `src/main/logseq/cli/command/upsert.cljs` (`upsert block`, `upsert task`)

Current `list task` in `src/main/logseq/cli/command/list.cljs` defines `:content` without alias.

### 3) Invalid status message is parser-driven today, which blocks graph-derived values

`src/main/logseq/cli/command/list.cljs` and `src/main/logseq/cli/command/upsert.cljs` currently define `:status` with static `:validate #{...}` sets.

That causes invalid status values to fail at parse time, before repo/graph resolution and before any db query can run.

With parse-time rejection, CLI cannot include values from the current graph.

### 4) db-worker-node currently has no task-status-values endpoint

`src/main/logseq/cli/common/db_worker.cljs` currently supports task listing/filtering, but does not expose a dedicated API to list available task status values from graph data.

To satisfy the new requirement, we need a small read-only thread-api for status values and wire it through `src/main/frontend/worker/db_core.cljs`.

## Scope

In scope:

1. Remove `--status` from `upsert block` option surface and help/examples.
2. Ensure every CLI `--content` option has `-c` alias.
3. When `--status` is invalid (e.g. `list task --status xxx`), show accepted values queried from the current graph in the error message.

Out of scope:

- New task query/filter semantics in db-worker.
- Changing task storage/property schema.
- New command groups beyond existing `upsert task` / `list task`.

## Design decisions

### Decision A: Task status writes move fully to `upsert task`

`upsert block` will no longer expose `--status`.

Task status changes should go through `upsert task --id|--uuid|--page|--content ... --status ...`.

This removes overlap between generic block updates and task-specific semantics.

### Decision B: Keep `-c` as the standard short alias for `--content`

Add `:alias :c` to any remaining `:content` specs missing it (currently `list task`).

No new short alias should be introduced for `content`.

### Decision C: Validate `--status` against graph-derived values at runtime

For `list task` / `upsert task` status validation, use values queried from the current graph instead of static hardcoded sets in command spec.

This requires moving status value validation out of parse-time `:validate #{...}` and into command build/execute phase where graph/repo is available.

Target output shape:

```text
Error (invalid-options): Invalid value for option :status: xxx. Available values (from current graph): todo, doing, done
```

(Exact values come from the active graph query result; ordering should be deterministic, e.g. sorted by status title.)

## Proposed implementation plan

1. Add RED parser tests for `upsert block --status` to assert it becomes invalid (unknown option path).
2. Add RED parser tests for `list task -c <text>` to assert `-c` works as alias for `--content`.
3. Add RED command tests asserting invalid task status errors include graph-derived available values in message text.
4. Remove `:status` from `upsert-block-spec` in `src/main/logseq/cli/command/upsert.cljs`.
5. Remove/adjust `upsert block` examples and help text that mention `--status`.
6. If needed, add migration guidance in `src/main/logseq/cli/commands.cljs` for `upsert block --status` (guide user to `upsert task`).
7. Add `:alias :c` to `list-task-spec :content` in `src/main/logseq/cli/command/list.cljs`.
8. Remove parse-time static `:validate #{...}` for task `:status` options where graph-derived validation is required (`list task`, `upsert task`).
9. Add db-worker helper in `src/main/logseq/cli/common/db_worker.cljs` to list available task status values from the current graph.
10. Expose the helper via new thread-api in `src/main/frontend/worker/db_core.cljs`.
11. In CLI command layer (`list.cljs` and `upsert.cljs`), fetch status values for current repo/graph and validate `--status`; on invalid input return `:invalid-options` with available-values suffix from graph query result.
12. Keep output ordering deterministic (e.g. sorted asc by display name/ident) so error text and tests remain stable.
13. Update completion tests and command docs to reflect final option surface.
14. Update CLI user docs in `docs/cli/logseq-cli.md` for `upsert block`, `upsert task`, `list task -c`, and graph-derived status validation behavior.
15. Update CLI e2e inventory/cases where `upsert block --status` is currently listed/covered.
16. Run focused tests, then run full lint/test checks.

## Files expected to change

Primary implementation files:

- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/upsert.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/command/list.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/commands.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/logseq/cli/common/db_worker.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs`

Primary tests:

- `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/commands_test.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/completion_generator_test.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/test/logseq/cli/format_test.cljs` (only if formatted error snapshots/assertions are affected)

Docs and e2e metadata:

- `/Users/rcmerci/gh-repos/logseq/docs/cli/logseq-cli.md`
- `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_inventory.edn`
- `/Users/rcmerci/gh-repos/logseq/cli-e2e/spec/non_sync_cases.edn`

## Testing plan

I will follow `@test-driven-development` and implement tests before behavior changes.

### Unit / command tests

Add tests in `commands_test.cljs` for:

- `upsert block --id 1 --status done` returns `:invalid-options` (or unknown option mapped to invalid-options).
- `list task -c alpha` parses to `:list-task` with `:content "alpha"`.
- invalid status errors for task commands include a graph-derived available-values suffix (using mocked thread-api responses).

### Completion tests

Update `completion_generator_test.cljs` to assert `list task` offers `-c` along with `--content`.

### Docs/e2e coverage checks

Ensure inventory and cases no longer advertise `upsert block --status`.

Add/update one case that validates status updates via `upsert task` path.

### Verification commands

- `bb dev:test -v logseq.cli.commands-test`
- `bb dev:test -v logseq.cli.completion-generator-test`
- `bb dev:test -v logseq.cli.format-test` (if touched)
- `bb -f cli-e2e/bb.edn test --skip-build` (if e2e specs are changed)
- `bb dev:lint-and-test`

## Risks and mitigations

Risk: users relying on `upsert block --status` scripts will break.

Mitigation: provide explicit migration guidance in parser error messaging and update docs clearly.

Risk: status values query may return empty or unexpected shapes for some graphs.

Mitigation: normalize db-worker response contract, sort deterministically, and provide a clear fallback suffix when no status values are found.

Risk: moving status validation from parse time to runtime may change where errors are raised.

Mitigation: add focused parser/build/execute tests for `list task` and `upsert task` to lock error codes/messages and avoid regressions on other options.

## Acceptance criteria

1. `upsert block` help/spec no longer includes `--status`.
2. All CLI options named `--content` support `-c`.
3. `logseq list task --status xxx` shows invalid-value error plus a deterministic available-values list queried from the current graph.
4. Existing `upsert task --status ...` and `list task --status ...` happy paths remain green.
5. CLI docs and e2e inventory reflect the new surface.

## Question

No blocking question.

---
